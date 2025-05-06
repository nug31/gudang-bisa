// Netlify serverless function for database operations
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper function to execute SQL queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Main handler function
exports.handler = async function (event, context) {
  const { path, httpMethod, body } = event;
  const data = JSON.parse(body);
  const { action } = data;

  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle OPTIONS requests (CORS preflight)
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
    };
  }

  try {
    // Handle different database actions
    if (path === "/db/inventory") {
      // Inventory operations
      if (action === "getAll") {
        const result = await query(
          "SELECT * FROM inventory_items ORDER BY name"
        );
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows),
        };
      }

      if (action === "getById") {
        const { id } = data;
        const result = await query(
          "SELECT * FROM inventory_items WHERE id = $1",
          [id]
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
          body: JSON.stringify(result.rows[0]),
        };
      }

      if (action === "create") {
        // Extract item data
        const {
          name,
          description,
          categoryId,
          categoryName,
          sku,
          quantityAvailable,
          quantityReserved,
          unitPrice,
          location,
          imageUrl,
        } = data;

        // Insert new item
        const result = await query(
          `INSERT INTO inventory_items
           (name, description, category_id, category_name, sku, quantity_available,
            quantity_reserved, unit_price, location, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            name,
            description,
            categoryId,
            categoryName,
            sku,
            quantityAvailable,
            quantityReserved,
            unitPrice,
            location,
            imageUrl,
          ]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result.rows[0]),
        };
      }

      if (action === "update") {
        // Extract item data
        const {
          id,
          name,
          description,
          categoryId,
          categoryName,
          sku,
          quantityAvailable,
          quantityReserved,
          unitPrice,
          location,
          imageUrl,
        } = data;

        // Update item
        const result = await query(
          `UPDATE inventory_items
           SET name = $2, description = $3, category_id = $4, category_name = $5,
               sku = $6, quantity_available = $7, quantity_reserved = $8,
               unit_price = $9, location = $10, image_url = $11, updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [
            id,
            name,
            description,
            categoryId,
            categoryName,
            sku,
            quantityAvailable,
            quantityReserved,
            unitPrice,
            location,
            imageUrl,
          ]
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
          body: JSON.stringify(result.rows[0]),
        };
      }

      if (action === "delete") {
        const { id } = data;
        const result = await query(
          "DELETE FROM inventory_items WHERE id = $1 RETURNING id",
          [id]
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
      }
    }

    // Add more database handlers as needed

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Invalid action" }),
    };
  } catch (error) {
    console.error("Database error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error" }),
    };
  }
};
