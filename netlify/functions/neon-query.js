const { pool } = require('./neon-client');

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
    const { query, params } = data;

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Query is required" }),
      };
    }

    // Execute the query
    const result = await pool.query(query, params || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        rows: result.rows,
        rowCount: result.rowCount,
      }),
    };
  } catch (error) {
    console.error("Error executing query:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
