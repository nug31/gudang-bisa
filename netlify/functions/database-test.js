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

    // Test query to check if we can execute queries
    const timeResult = await client.query("SELECT NOW() as current_time");
    const currentTime = timeResult.rows[0].current_time;
    console.log("Current database time:", currentTime);

    // Check if item_requests table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'item_requests'
      );
    `);

    const tableExists = tableCheckResult.rows[0].exists;
    console.log(`item_requests table exists: ${tableExists}`);

    let requestsData = [];
    let statusCounts = [];
    let totalRequests = 0;

    if (tableExists) {
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
        "SELECT id, title, status, created_at FROM item_requests ORDER BY created_at DESC LIMIT 10"
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
        message: "Database connection successful",
        data: {
          currentTime,
          tableExists,
          totalRequests,
          statusCounts,
          sampleRequests: requestsData,
        },
      }),
    };
  } catch (error) {
    console.error("Error connecting to database:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Database connection failed",
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
