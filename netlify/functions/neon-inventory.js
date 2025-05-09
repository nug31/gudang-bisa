const { pool } = require("./neon-client");
const { v4: uuidv4 } = require("uuid");

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
      case "getAll": {
        // Get all inventory items with category information
        const result = await pool.query(`
          SELECT
            i.id,
            i.name,
            i.description,
            i.quantity_available as quantity,
            i.sku,
            i.location,
            c.id as category_id,
            c.name as category_name,
            i.created_at
          FROM
            inventory_items i
          LEFT JOIN
            categories c ON i.category_id = c.id
          ORDER BY
            i.name
        `);

        // Transform data to match the expected format
        const items = result.rows.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity || 0,
          sku: item.sku || "",
          location: item.location || "",
          category: {
            id: item.category_id,
            name: item.category_name || "Unknown",
          },
          createdAt: item.created_at,
        }));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(items),
        };
      }

      case "getById": {
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Item ID is required" }),
          };
        }

        const id = data.id;

        // Get item by ID with category information
        const result = await pool.query(
          `
          SELECT
            i.id,
            i.name,
            i.description,
            i.quantity_available as quantity,
            i.sku,
            i.location,
            c.id as category_id,
            c.name as category_name,
            i.created_at
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

        // Transform data to match the expected format
        const item = result.rows[0];
        const formattedItem = {
          id: item.id,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity || 0,
          sku: item.sku || "",
          location: item.location || "",
          category: {
            id: item.category_id,
            name: item.category_name || "Unknown",
          },
          createdAt: item.created_at,
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedItem),
        };
      }

      case "create": {
        // Validate required fields
        if (!data.name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Item name is required" }),
          };
        }

        const categoryId = data.category?.id || null;
        const quantity = data.quantity || 0;
        const sku = data.sku || "";
        const location = data.location || "";

        // Insert the item
        const result = await pool.query(
          "INSERT INTO inventory_items (name, description, quantity_available, sku, location, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [
            data.name,
            data.description || "",
            quantity,
            sku,
            location,
            categoryId,
          ]
        );

        // Get the category information
        let categoryName = "Unknown";
        if (categoryId) {
          const categoryResult = await pool.query(
            "SELECT name FROM categories WHERE id = $1",
            [categoryId]
          );
          if (categoryResult.rows.length > 0) {
            categoryName = categoryResult.rows[0].name;
          }
        }

        // Transform data to match the expected format
        const item = result.rows[0];
        const createdItem = {
          id: item.id,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity || 0,
          sku: item.sku || "",
          location: item.location || "",
          category: {
            id: categoryId,
            name: categoryName,
          },
          createdAt: item.created_at,
        };

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(createdItem),
        };
      }

      case "update": {
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Item ID is required" }),
          };
        }

        const id = data.id;
        const name = data.name;
        const description = data.description;
        const quantity = data.quantity;
        const sku = data.sku;
        const location = data.location;
        const categoryId = data.category?.id || null;

        if (!name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Item name is required" }),
          };
        }

        // Update the item
        const result = await pool.query(
          "UPDATE inventory_items SET name = $1, description = $2, quantity_available = $3, sku = $4, location = $5, category_id = $6 WHERE id = $7 RETURNING *",
          [
            name,
            description || "",
            quantity || 0,
            sku || "",
            location || "",
            categoryId,
            id,
          ]
        );

        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Item not found" }),
          };
        }

        // Get the category information
        let categoryName = "Unknown";
        if (categoryId) {
          const categoryResult = await pool.query(
            "SELECT name FROM categories WHERE id = $1",
            [categoryId]
          );
          if (categoryResult.rows.length > 0) {
            categoryName = categoryResult.rows[0].name;
          }
        }

        // Transform data to match the expected format
        const item = result.rows[0];
        const updatedItem = {
          id: item.id,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity || 0,
          sku: item.sku || "",
          location: item.location || "",
          category: {
            id: categoryId,
            name: categoryName,
          },
          createdAt: item.created_at,
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedItem),
        };
      }

      case "delete": {
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Item ID is required" }),
          };
        }

        const id = data.id;

        // Delete the item
        await pool.query("DELETE FROM inventory_items WHERE id = $1", [id]);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: "Item deleted successfully" }),
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
    console.error("Error handling inventory request:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
