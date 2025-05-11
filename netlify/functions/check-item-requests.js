const { Client } = require("pg");

// Try to get the connection string from environment variables first
const envConnectionString = process.env.NEON_CONNECTION_STRING;
console.log(
  "Environment NEON_CONNECTION_STRING available:",
  !!envConnectionString
);

// Use environment variable if available, otherwise use hardcoded connection string
const connectionString =
  envConnectionString ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Create a new client
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Neon PostgreSQL
    },
  });

  try {
    console.log("Connecting to Neon database...");
    await client.connect();
    console.log("Successfully connected to Neon database");

    // Check if item_requests table exists
    console.log("Checking if item_requests table exists...");
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'item_requests'
      );
    `);

    const tableExists = tableCheckResult.rows[0].exists;
    console.log(`item_requests table exists: ${tableExists}`);

    let tableStructure = [];
    let requestsData = [];
    let statusCounts = [];
    let totalRequests = 0;

    if (tableExists) {
      // Get table structure
      console.log("Getting item_requests table structure...");
      const structureResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'item_requests'
        ORDER BY ordinal_position;
      `);
      tableStructure = structureResult.rows;
      console.log(`Retrieved ${tableStructure.length} columns from item_requests table`);

      // Count requests in the table
      const countResult = await client.query("SELECT COUNT(*) FROM item_requests");
      totalRequests = parseInt(countResult.rows[0].count);
      console.log(`Number of requests in the database: ${totalRequests}`);

      // Get status counts
      const statusResult = await client.query(
        "SELECT status, COUNT(*) FROM item_requests GROUP BY status"
      );
      statusCounts = statusResult.rows;
      console.log("Status counts:", statusCounts);

      // Get a sample of requests
      const requestsResult = await client.query(
        "SELECT id, title, status, user_id, created_at FROM item_requests ORDER BY created_at DESC LIMIT 10"
      );
      requestsData = requestsResult.rows;
      console.log(`Retrieved ${requestsData.length} sample requests`);
    }

    // Return the results
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: tableExists ? "item_requests table found" : "item_requests table not found",
        data: {
          tableExists,
          tableStructure,
          totalRequests,
          statusCounts,
          sampleRequests: requestsData,
        },
      }),
    };
  } catch (error) {
    console.error("Error checking item_requests table:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Error checking item_requests table",
        error: error.message,
        stack: error.stack,
      }),
    };
  } finally {
    // Close the connection
    try {
      await client.end();
      console.log("Database connection closed");
    } catch (closeError) {
      console.error("Error closing database connection:", closeError);
    }
  }
};
