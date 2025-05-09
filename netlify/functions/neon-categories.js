const { pool } = require('./neon-client');
const { v4: uuidv4 } = require('uuid');

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
        // Get all categories
        const result = await pool.query(
          "SELECT * FROM categories ORDER BY name"
        );

        // Transform data to match the expected format
        const categories = result.rows.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description || "",
          createdAt: category.created_at
        }));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(categories),
        };
      }

      case "getById": {
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        const id = data.id;

        // Get category by ID
        const result = await pool.query(
          "SELECT * FROM categories WHERE id = $1",
          [id]
        );

        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Category not found" }),
          };
        }

        // Transform data to match the expected format
        const category = result.rows[0];
        const formattedCategory = {
          id: category.id,
          name: category.name,
          description: category.description || "",
          createdAt: category.created_at
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedCategory),
        };
      }

      case "create": {
        // Validate required fields
        if (!data.name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category name is required" }),
          };
        }

        // Insert the category
        const result = await pool.query(
          "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
          [data.name, data.description || ""]
        );

        // Transform data to match the expected format
        const category = result.rows[0];
        const createdCategory = {
          id: category.id,
          name: category.name,
          description: category.description || "",
          createdAt: category.created_at
        };

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(createdCategory),
        };
      }

      case "update": {
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        const id = data.id;
        const name = data.name;
        const description = data.description;

        if (!name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category name is required" }),
          };
        }

        // Update the category
        const result = await pool.query(
          "UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *",
          [name, description || "", id]
        );

        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Category not found" }),
          };
        }

        // Transform data to match the expected format
        const category = result.rows[0];
        const updatedCategory = {
          id: category.id,
          name: category.name,
          description: category.description || "",
          createdAt: category.created_at
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updatedCategory),
        };
      }

      case "delete": {
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Category ID is required" }),
          };
        }

        const id = data.id;

        // Delete the category
        await pool.query("DELETE FROM categories WHERE id = $1", [id]);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: "Category deleted successfully" }),
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
    console.error("Error handling category request:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
