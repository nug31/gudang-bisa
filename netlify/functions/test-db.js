const { pool, testConnection, getAllInventoryItems } = require("./neon-client");

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
    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const action = queryParams.action || 'test';
    const categoryId = queryParams.categoryId || null;
    
    console.log(`Processing test-db request with action: ${action}`);
    
    // Test the connection to Neon
    console.log("Testing connection to Neon database...");
    const connectionResult = await testConnection();

    if (!connectionResult.connected) {
      console.error("Failed to connect to Neon database:", connectionResult.error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Failed to connect to Neon PostgreSQL database",
          error: connectionResult.error,
          connectionString: connectionResult.connectionString,
        }),
      };
    }
    
    console.log("Connected to Neon database successfully");
    
    // If action is 'items', fetch inventory items
    if (action === 'items') {
      try {
        console.log("Fetching inventory items...");
        const items = await getAllInventoryItems(categoryId);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: "Successfully fetched inventory items",
            connectionInfo: connectionResult,
            items,
            totalItems: items.length,
          }),
        };
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Error fetching inventory items",
            error: error.message,
            connectionInfo: connectionResult,
          }),
        };
      }
    }
    
    // If action is 'query', execute a custom query
    if (action === 'query' && queryParams.sql) {
      try {
        const sql = queryParams.sql;
        console.log("Executing custom query:", sql);
        
        const client = await pool.connect();
        try {
          const result = await client.query(sql);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: "Query executed successfully",
              rows: result.rows,
              rowCount: result.rowCount,
              connectionInfo: connectionResult,
            }),
          };
        } finally {
          client.release();
        }
      } catch (error) {
        console.error("Error executing custom query:", error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            message: "Error executing custom query",
            error: error.message,
            connectionInfo: connectionResult,
          }),
        };
      }
    }
    
    // Default action: just test connection
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Successfully connected to Neon PostgreSQL database",
        connectionInfo: connectionResult,
      }),
    };
  } catch (error) {
    console.error("Server error:", error);
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
        message: "Server error",
        error: error.message,
        errorCode: error.code,
        errorStack: error.stack,
      }),
    };
  }
};
