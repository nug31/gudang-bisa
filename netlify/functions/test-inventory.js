const {
  pool,
  testConnection,
  getAllInventoryItems,
  getMockInventoryItems,
} = require("./neon-client");

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
    console.log("Testing inventory function and database connection");
    
    // Test database connection
    const connectionResult = await testConnection();
    console.log("Connection test result:", connectionResult);
    
    // Get mock inventory items for comparison
    const mockItems = getMockInventoryItems();
    console.log(`Retrieved ${mockItems.length} mock inventory items`);
    
    // Try to get real inventory items
    let realItems = [];
    let error = null;
    
    try {
      realItems = await getAllInventoryItems();
      console.log(`Retrieved ${realItems.length} real inventory items`);
    } catch (err) {
      error = {
        message: err.message,
        stack: err.stack
      };
      console.error("Error retrieving real inventory items:", err);
    }
    
    // Return test results
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        connectionTest: connectionResult,
        mockItemsCount: mockItems.length,
        mockItemsSample: mockItems.slice(0, 2),
        realItemsCount: realItems.length,
        realItemsSample: realItems.slice(0, 2),
        error,
        success: true,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error("Error in test-inventory function:", error);
    
    return {
      statusCode: 200, // Return 200 to ensure the response is displayed
      headers,
      body: JSON.stringify({
        message: "Error running inventory test",
        error: error.message,
        stack: error.stack,
        success: false,
        timestamp: new Date().toISOString()
      }),
    };
  }
};
