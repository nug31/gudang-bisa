const { pool, getAllInventoryItems } = require("./neon-client");

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
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  try {
    console.log("Direct inventory function called");
    
    // Get all inventory items directly
    const items = await getAllInventoryItems();
    
    console.log(`Retrieved ${items ? items.length : 0} inventory items`);
    
    if (items && items.length > 0) {
      console.log("First item:", JSON.stringify(items[0]));
    } else {
      console.log("No items found");
    }
    
    // Return the items directly
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error("Error in direct-inventory function:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
    };
  }
};
