const { testConnection, getAllInventoryItems } = require("./neon-client");

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
    // Test the connection to Neon
    const connectionResult = await testConnection();

    if (connectionResult.connected) {
      // If connected, try to get inventory items
      let inventoryItems = [];
      let error = null;

      try {
        if (connectionResult.counts.inventoryItems > 0) {
          inventoryItems = await getAllInventoryItems();
        }
      } catch (err) {
        error = err.message;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "success",
          message: "Successfully connected to Neon PostgreSQL database",
          connectionInfo: connectionResult,
          inventoryItems: inventoryItems.slice(0, 5), // Only return first 5 items to keep response size reasonable
          totalItems: inventoryItems.length,
          error: error,
        }),
      };
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          status: "error",
          message: "Failed to connect to Neon PostgreSQL database",
          connectionInfo: connectionResult,
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: "error",
        message: "Server error",
        error: error.message,
        stack: error.stack,
      }),
    };
  }
};
