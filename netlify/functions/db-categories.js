const { pool, query } = require("./neon-client");

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    // Parse request body
    const data = JSON.parse(event.body);

    // Validate action
    if (!data.action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Action is required" }),
      };
    }

    const action = data.action;

    switch (action) {
      case "getAll":
        try {
          // Get all categories with item counts in a single query
          const result = await query(`
            SELECT
              c.id,
              c.name,
              c.description,
              COUNT(i.id) as item_count
            FROM
              categories c
            LEFT JOIN
              inventory_items i ON c.id = i.category_id
            GROUP BY
              c.id, c.name, c.description
            ORDER BY
              c.name
          `);

          // Transform the data to include itemCount
          const categories = result.rows.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            itemCount: parseInt(category.item_count) || 0,
          }));

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(categories),
          };
        } catch (error) {
          console.error("Error fetching categories:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error fetching categories",
              error: error.message,
            }),
          };
        }

      case "getById":
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        try {
          const id = data.id;

          // Get category by ID with item count in a single query
          const result = await query(
            `
            SELECT
              c.id,
              c.name,
              c.description,
              COUNT(i.id) as item_count
            FROM
              categories c
            LEFT JOIN
              inventory_items i ON c.id = i.category_id
            WHERE
              c.id = $1
            GROUP BY
              c.id, c.name, c.description
          `,
            [id]
          );

          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ message: "Category not found" }),
            };
          }

          // Transform the data to include itemCount
          const category = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            description: result.rows[0].description,
            itemCount: parseInt(result.rows[0].item_count) || 0,
          };

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(category),
          };
        } catch (error) {
          console.error("Error fetching category:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error fetching category",
              error: error.message,
            }),
          };
        }

      case "create":
        // Validate required fields
        if (!data.name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category name is required" }),
          };
        }

        try {
          // Insert the category
          const result = await query(
            `
            INSERT INTO categories (
              name,
              description
            ) VALUES ($1, $2)
            RETURNING *
          `,
            [data.name, data.description || null]
          );

          const createdCategory = result.rows[0];

          // Add itemCount property
          createdCategory.itemCount = 0;

          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(createdCategory),
          };
        } catch (error) {
          console.error("Error creating category:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error creating category",
              error: error.message,
            }),
          };
        }

      case "update":
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        try {
          const updateId = data.id;

          // Build the update query dynamically
          let updateQuery = "UPDATE categories SET ";
          const updateValues = [];
          const updateFields = [];
          let paramIndex = 1;

          if (data.name !== undefined) {
            updateFields.push(`name = $${paramIndex}`);
            updateValues.push(data.name);
            paramIndex++;
          }

          if (data.description !== undefined) {
            updateFields.push(`description = $${paramIndex}`);
            updateValues.push(data.description);
            paramIndex++;
          }

          // If no fields to update, return error
          if (updateFields.length === 0) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ message: "No fields to update" }),
            };
          }

          updateQuery += updateFields.join(", ");
          updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
          updateValues.push(updateId);

          // Execute the update query
          const result = await query(updateQuery, updateValues);

          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ message: "Category not found" }),
            };
          }

          const updatedCategory = result.rows[0];

          // Get item count for the category
          const countResult = await query(
            `
            SELECT COUNT(*) as count
            FROM inventory_items
            WHERE category_id = $1
          `,
            [updateId]
          );

          updatedCategory.itemCount = parseInt(countResult.rows[0].count) || 0;

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(updatedCategory),
          };
        } catch (error) {
          console.error("Error updating category:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error updating category",
              error: error.message,
            }),
          };
        }

      case "delete":
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        try {
          const deleteId = data.id;

          // Check if the category has any inventory items
          const itemCountResult = await query(
            `
            SELECT COUNT(*) as count
            FROM inventory_items
            WHERE category_id = $1
          `,
            [deleteId]
          );

          const itemCount = parseInt(itemCountResult.rows[0].count) || 0;

          if (itemCount > 0) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                message: "Cannot delete category that has inventory items",
              }),
            };
          }

          // Check if the category has any requests
          const requestCountResult = await query(
            `
            SELECT COUNT(*) as count
            FROM item_requests
            WHERE category_id = $1
          `,
            [deleteId]
          );

          const requestCount = parseInt(requestCountResult.rows[0].count) || 0;

          if (requestCount > 0) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                message: "Cannot delete category that has requests",
              }),
            };
          }

          // Delete the category
          const result = await query(
            `
            DELETE FROM categories WHERE id = $1 RETURNING id
          `,
            [deleteId]
          );

          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ message: "Category not found" }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Category deleted successfully" }),
          };
        } catch (error) {
          console.error("Error deleting category:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error deleting category",
              error: error.message,
            }),
          };
        }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid action" }),
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
