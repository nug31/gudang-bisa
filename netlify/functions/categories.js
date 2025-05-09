const { pool } = require("./neon-client");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  const path = event.path.replace("/.netlify/functions/categories", "");
  const segments = path.split("/").filter(Boolean);
  const id = segments[0];

  try {
    // GET /categories - Get all categories
    if (event.httpMethod === "GET" && !id) {
      const result = await pool.query(`
        SELECT * FROM categories
        ORDER BY name ASC
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows),
      };
    }

    // GET /categories/:id - Get category by ID
    if (event.httpMethod === "GET" && id) {
      const result = await pool.query(
        `
        SELECT * FROM categories
        WHERE id = $1
      `,
        [id]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Category not found" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0]),
      };
    }

    // POST /categories - Create new category
    if (event.httpMethod === "POST") {
      const { name, description } = JSON.parse(event.body);
      const newId = uuidv4();

      // Create new category
      const result = await pool.query(
        `
        INSERT INTO categories (id, name, description, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
        [newId, name, description, new Date().toISOString()]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0]),
      };
    }

    // PUT /categories/:id - Update category
    if (event.httpMethod === "PUT" && id) {
      const { name, description } = JSON.parse(event.body);

      // Update category
      const result = await pool.query(
        `
        UPDATE categories
        SET name = $1, description = $2, updated_at = $3
        WHERE id = $4
        RETURNING *
      `,
        [name, description, new Date().toISOString(), id]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Category not found" }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0]),
      };
    }

    // DELETE /categories/:id - Delete category
    if (event.httpMethod === "DELETE" && id) {
      // Delete category
      await pool.query(
        `
        DELETE FROM categories
        WHERE id = $1
      `,
        [id]
      );

      return {
        statusCode: 204,
        headers,
        body: "",
      };
    }

    // If no route matches
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", details: error.message }),
    };
  }
};
