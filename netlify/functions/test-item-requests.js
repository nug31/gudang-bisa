const { Pool } = require("pg");

// Initialize Neon PostgreSQL client
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    console.log("Testing Neon database connection for item requests...");
    console.log("Connection string available:", !!connectionString);
    console.log("Connection string length:", connectionString ? connectionString.length : 0);

    // Test the connection
    const client = await pool.connect();
    console.log("Connected to Neon database successfully");

    // Check if item_requests table exists
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'item_requests')"
    );
    
    const tableExists = tableCheck.rows[0].exists;
    console.log(`item_requests table exists: ${tableExists}`);

    if (!tableExists) {
      client.release();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: false,
          message: "item_requests table does not exist in the database",
          connectionStatus: "connected",
        }),
      };
    }

    // Count item requests
    const countResult = await client.query("SELECT COUNT(*) FROM item_requests");
    const requestCount = parseInt(countResult.rows[0].count);
    console.log(`Found ${requestCount} item requests in the database`);

    // Get a sample of item requests
    const requestsResult = await client.query(`
      SELECT 
        ir.id, 
        ir.title, 
        ir.description, 
        ir.status, 
        ir.priority,
        ir.user_id,
        ir.category_id,
        ir.quantity,
        ir.created_at,
        u.name as user_name,
        c.name as category_name
      FROM 
        item_requests ir
      LEFT JOIN 
        users u ON ir.user_id = u.id
      LEFT JOIN 
        categories c ON ir.category_id = c.id
      ORDER BY 
        ir.created_at DESC
      LIMIT 10
    `);

    const requests = requestsResult.rows;
    console.log(`Retrieved ${requests.length} sample item requests`);

    // Release the client
    client.release();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Successfully connected to Neon database and retrieved item requests",
        connectionStatus: "connected",
        requestCount,
        sampleRequests: requests,
      }),
    };
  } catch (error) {
    console.error("Error testing item requests:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Error testing item requests",
        error: error.message,
        errorCode: error.code,
        errorStack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  }
};
