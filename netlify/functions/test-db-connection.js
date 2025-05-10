const { testConnection, pool } = require("./neon-client");

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
    console.log("Testing database connection...");
    
    // Get connection string details (safely)
    const connectionString = process.env.NEON_CONNECTION_STRING;
    const connectionStringInfo = {
      available: !!connectionString,
      length: connectionString ? connectionString.length : 0,
      firstChars: connectionString ? connectionString.substring(0, 10) + "..." : "N/A",
      containsNeon: connectionString ? connectionString.includes("neon") : false,
      containsPostgresql: connectionString ? connectionString.includes("postgresql") : false,
      envVarSet: !!process.env.NEON_CONNECTION_STRING,
    };
    
    console.log("Connection string info:", connectionStringInfo);
    
    // Test the connection
    const connectionResult = await testConnection();
    console.log("Connection test result:", connectionResult);
    
    // Check if pool is initialized
    const poolInfo = {
      initialized: !!pool,
      poolObject: pool ? "Available" : "Not available",
    };
    
    // Try a simple query if pool is available
    let queryResult = null;
    if (pool) {
      try {
        console.log("Attempting a simple query...");
        const result = await pool.query("SELECT NOW()");
        queryResult = {
          success: true,
          timestamp: result.rows[0].now,
        };
        console.log("Query successful:", queryResult);
      } catch (queryError) {
        queryResult = {
          success: false,
          error: queryError.message,
          code: queryError.code,
        };
        console.error("Query failed:", queryError);
      }
    }
    
    // Return all the diagnostic information
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        connectionStringInfo,
        connectionResult,
        poolInfo,
        queryResult,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          netlifyDev: process.env.NETLIFY_DEV,
          netlifyContext: process.env.CONTEXT,
        },
      }, null, 2),
    };
  } catch (error) {
    console.error("Error testing database connection:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error testing database connection",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  }
};
