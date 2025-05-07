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
          // Get all inventory items with category information
          const result = await query(`
            SELECT
              i.id,
              i.name,
              i.description,
              i.category_id,
              i.sku,
              i.quantity_available,
              i.quantity_reserved,
              i.unit_price,
              i.location,
              i.image_url,
              i.created_at,
              i.updated_at,
              c.name as category_name
            FROM
              inventory_items i
            LEFT JOIN
              categories c ON i.category_id = c.id
            ORDER BY
              i.name
          `);

          // Transform the data to match the frontend model
          const transformedItems = result.rows.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            categoryId: item.category_id,
            categoryName: item.category_name || "Unknown",
            sku: item.sku,
            quantityAvailable: item.quantity_available,
            quantityReserved: item.quantity_reserved,
            unitPrice: item.unit_price,
            location: item.location,
            imageUrl: item.image_url,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(transformedItems),
          };
        } catch (error) {
          console.error("Error fetching inventory items:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error fetching inventory items",
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
            body: JSON.stringify({ message: "Item ID is required" }),
          };
        }

        try {
          const id = data.id;

          // Get item by ID with category information
          const result = await query(
            `
            SELECT
              i.id,
              i.name,
              i.description,
              i.category_id,
              i.sku,
              i.quantity_available,
              i.quantity_reserved,
              i.unit_price,
              i.location,
              i.image_url,
              i.created_at,
              i.updated_at,
              c.name as category_name
            FROM
              inventory_items i
            LEFT JOIN
              categories c ON i.category_id = c.id
            WHERE
              i.id = $1
          `,
            [id]
          );

          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ message: "Item not found" }),
            };
          }

          const item = result.rows[0];

          // Transform the data to match the frontend model
          const transformedItem = {
            id: item.id,
            name: item.name,
            description: item.description,
            categoryId: item.category_id,
            categoryName: item.category_name || "Unknown",
            sku: item.sku,
            quantityAvailable: item.quantity_available,
            quantityReserved: item.quantity_reserved,
            unitPrice: item.unit_price,
            location: item.location,
            imageUrl: item.image_url,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(transformedItem),
          };
        } catch (error) {
          console.error("Error fetching inventory item:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error fetching inventory item",
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
            body: JSON.stringify({ message: "Item name is required" }),
          };
        }

        if (!data.categoryId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        try {
          // Insert the item
          const result = await query(
            `
            INSERT INTO inventory_items (
              name,
              description,
              category_id,
              sku,
              quantity_available,
              quantity_reserved,
              unit_price,
              location,
              image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `,
            [
              data.name,
              data.description || null,
              data.categoryId,
              data.sku || null,
              data.quantityAvailable || 0,
              data.quantityReserved || 0,
              data.unitPrice || null,
              data.location || null,
              data.imageUrl || null,
            ]
          );

          const createdItem = result.rows[0];

          // Get the category name
          const categoryResult = await query(
            `
            SELECT name FROM categories WHERE id = $1
          `,
            [createdItem.category_id]
          );

          const categoryName =
            categoryResult.rows.length > 0
              ? categoryResult.rows[0].name
              : "Unknown";

          // Transform the data to match the frontend model
          const transformedCreatedItem = {
            id: createdItem.id,
            name: createdItem.name,
            description: createdItem.description,
            categoryId: createdItem.category_id,
            categoryName: categoryName,
            sku: createdItem.sku,
            quantityAvailable: createdItem.quantity_available,
            quantityReserved: createdItem.quantity_reserved,
            unitPrice: createdItem.unit_price,
            location: createdItem.location,
            imageUrl: createdItem.image_url,
            createdAt: createdItem.created_at,
            updatedAt: createdItem.updated_at,
          };

          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(transformedCreatedItem),
          };
        } catch (error) {
          console.error("Error creating inventory item:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error creating inventory item",
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
            body: JSON.stringify({ message: "Item ID is required" }),
          };
        }

        try {
          const updateId = data.id;

          // Build the update query dynamically
          let updateQuery = "UPDATE inventory_items SET ";
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

          if (data.categoryId !== undefined) {
            updateFields.push(`category_id = $${paramIndex}`);
            updateValues.push(data.categoryId);
            paramIndex++;
          }

          if (data.sku !== undefined) {
            updateFields.push(`sku = $${paramIndex}`);
            updateValues.push(data.sku);
            paramIndex++;
          }

          if (data.quantityAvailable !== undefined) {
            updateFields.push(`quantity_available = $${paramIndex}`);
            updateValues.push(data.quantityAvailable);
            paramIndex++;
          }

          if (data.quantityReserved !== undefined) {
            updateFields.push(`quantity_reserved = $${paramIndex}`);
            updateValues.push(data.quantityReserved);
            paramIndex++;
          }

          if (data.unitPrice !== undefined) {
            updateFields.push(`unit_price = $${paramIndex}`);
            updateValues.push(data.unitPrice);
            paramIndex++;
          }

          if (data.location !== undefined) {
            updateFields.push(`location = $${paramIndex}`);
            updateValues.push(data.location);
            paramIndex++;
          }

          if (data.imageUrl !== undefined) {
            updateFields.push(`image_url = $${paramIndex}`);
            updateValues.push(data.imageUrl);
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
              body: JSON.stringify({ message: "Item not found" }),
            };
          }

          const updatedItem = result.rows[0];

          // Get the category name
          const categoryResult = await query(
            `
            SELECT name FROM categories WHERE id = $1
          `,
            [updatedItem.category_id]
          );

          const categoryName =
            categoryResult.rows.length > 0
              ? categoryResult.rows[0].name
              : "Unknown";

          // Transform the data to match the frontend model
          const transformedUpdatedItem = {
            id: updatedItem.id,
            name: updatedItem.name,
            description: updatedItem.description,
            categoryId: updatedItem.category_id,
            categoryName: categoryName,
            sku: updatedItem.sku,
            quantityAvailable: updatedItem.quantity_available,
            quantityReserved: updatedItem.quantity_reserved,
            unitPrice: updatedItem.unit_price,
            location: updatedItem.location,
            imageUrl: updatedItem.image_url,
            createdAt: updatedItem.created_at,
            updatedAt: updatedItem.updated_at,
          };

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(transformedUpdatedItem),
          };
        } catch (error) {
          console.error("Error updating inventory item:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error updating inventory item",
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
            body: JSON.stringify({ message: "Item ID is required" }),
          };
        }

        try {
          const deleteId = data.id;

          // Delete the item
          const result = await query(
            `
            DELETE FROM inventory_items WHERE id = $1 RETURNING id
          `,
            [deleteId]
          );

          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ message: "Item not found" }),
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Item deleted successfully" }),
          };
        } catch (error) {
          console.error("Error deleting inventory item:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error deleting inventory item",
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
