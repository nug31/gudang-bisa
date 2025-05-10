const {
  pool,
  getAllInventoryItems,
  getMockInventoryItems,
} = require("./neon-client");

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

    // Parse query parameters if any
    let categoryId = null;
    let itemId = null;

    if (event.queryStringParameters) {
      // Check for category filter
      if (event.queryStringParameters.categoryId) {
        categoryId = event.queryStringParameters.categoryId;
        console.log(`Category filter requested: ${categoryId}`);
      }

      // Check for specific item ID
      if (event.queryStringParameters.id) {
        itemId = event.queryStringParameters.id;
        console.log(`Specific item requested: ${itemId}`);
      }
    }

    // Try to get inventory items directly
    let items = [];
    let source = "unknown";

    try {
      console.log("Attempting to get items from database...");
      items = await getAllInventoryItems(categoryId);
      console.log(
        `Retrieved ${items ? items.length : 0} inventory items from database`
      );
      source = "database";
    } catch (dbError) {
      console.error("Error getting items from database:", dbError);
      // Fall back to mock data
      items = getMockInventoryItems(categoryId);
      console.log(`Using ${items.length} mock inventory items as fallback`);
      source = "mock-data-db-error";
    }

    // Ensure we have items, even if it means using mock data
    if (!items || items.length === 0) {
      console.log("No items found, using mock data");
      items = getMockInventoryItems(categoryId);
      source = "mock-data-empty";
    }

    if (items && items.length > 0) {
      console.log("First item:", JSON.stringify(items[0]));
      console.log(`Total items: ${items.length}`);

      // Log some statistics about the items
      const categories = [...new Set(items.map((item) => item.categoryName))];
      console.log(`Categories represented: ${categories.join(", ")}`);
    }

    // If a specific item ID was requested, filter for just that item
    if (itemId) {
      console.log(`Filtering results for item with ID: ${itemId}`);
      const item = items.find((item) => item.id === itemId);

      if (item) {
        console.log(`Found item: ${item.name}`);
        // Return just the single item
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            items: [item], // Return as array with one item for consistency
            item: item, // Also include as direct property for convenience
            count: 1,
            source: source,
            timestamp: new Date().toISOString(),
            serverInfo: {
              nodeVersion: process.version,
              platform: process.platform,
              netlifyFunctionName: context.functionName,
              netlifyFunctionVersion: context.functionVersion,
            },
          }),
        };
      } else {
        console.log(`Item with ID ${itemId} not found`);
        // Return empty result
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            items: [],
            item: null,
            count: 0,
            source: source,
            message: `Item with ID ${itemId} not found`,
            timestamp: new Date().toISOString(),
          }),
        };
      }
    }

    // Return all items with additional metadata
    // The client expects either an array or {items: array}
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: items,
        count: items.length,
        source: source,
        timestamp: new Date().toISOString(),
        serverInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          netlifyFunctionName: context.functionName,
          netlifyFunctionVersion: context.functionVersion,
        },
      }),
    };
  } catch (error) {
    console.error("Error in direct-inventory function:", error);
    console.error("Error stack:", error.stack);

    // Always return mock data on error
    try {
      // Check if a specific item was requested
      if (event.queryStringParameters && event.queryStringParameters.id) {
        const itemId = event.queryStringParameters.id;
        console.log(
          `Error occurred while fetching item ${itemId}, returning mock item`
        );

        // Get all mock items and find the one with matching ID
        const mockItems = getMockInventoryItems();
        const mockItem =
          mockItems.find((item) => item.id === itemId) || mockItems[0];

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            items: [mockItem],
            item: mockItem,
            count: 1,
            source: "mock-data-error-fallback",
            error: error.message,
            timestamp: new Date().toISOString(),
          }),
        };
      } else {
        // Return all mock items
        const mockItems = getMockInventoryItems();
        console.log(`Returning ${mockItems.length} mock items due to error`);

        return {
          statusCode: 200, // Return 200 with mock data instead of error
          headers,
          body: JSON.stringify({
            items: mockItems,
            count: mockItems.length,
            source: "mock-data-error-fallback",
            error: error.message,
            timestamp: new Date().toISOString(),
            errorDetails: {
              message: error.message,
              stack: error.stack,
              name: error.name,
            },
          }),
        };
      }
    } catch (fallbackError) {
      console.error("Error in fallback error handler:", fallbackError);

      // Last resort - return minimal mock data
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          items: [
            {
              id: "fallback-1",
              name: "Emergency Fallback Item",
              description: "This item appears when all other options fail",
              categoryId: "4",
              categoryName: "Other",
              quantityAvailable: 999,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          count: 1,
          source: "emergency-fallback",
          error: "Multiple errors occurred",
          timestamp: new Date().toISOString(),
        }),
      };
    }
  }
};
