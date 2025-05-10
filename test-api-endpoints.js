// Script to test API endpoints
// Run this in the browser console to test if the API endpoints are working

(async function() {
  console.log("=== API Endpoint Test ===");
  
  // Get the base URL
  const baseUrl = window.location.origin;
  console.log("Base URL:", baseUrl);
  
  // Test endpoints
  const endpoints = [
    "/api/inventory",
    "/db/inventory",
    "/.netlify/functions/neon-inventory"
  ];
  
  // Test results
  const results = {};
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    console.log(`Testing endpoint: ${url}`);
    
    try {
      // Make a simple GET request to test if the endpoint exists
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "getAll"
        })
      });
      
      // Check if the response is OK
      if (response.ok) {
        console.log(`✅ Endpoint ${endpoint} is working`);
        
        // Try to parse the response
        try {
          const data = await response.json();
          console.log(`Data received:`, data);
          results[endpoint] = {
            status: "success",
            statusCode: response.status,
            data: Array.isArray(data) ? `${data.length} items` : "Data received"
          };
        } catch (parseError) {
          console.error(`Error parsing response from ${endpoint}:`, parseError);
          results[endpoint] = {
            status: "error",
            statusCode: response.status,
            error: "Could not parse response"
          };
        }
      } else {
        console.error(`❌ Endpoint ${endpoint} returned status ${response.status}`);
        results[endpoint] = {
          status: "error",
          statusCode: response.status,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      console.error(`❌ Error testing endpoint ${endpoint}:`, error);
      results[endpoint] = {
        status: "error",
        error: error.message
      };
    }
  }
  
  // Print summary
  console.log("\n=== API Endpoint Test Results ===");
  for (const [endpoint, result] of Object.entries(results)) {
    console.log(`${endpoint}: ${result.status === "success" ? "✅" : "❌"} ${result.status === "success" ? result.data : result.error}`);
  }
  
  // Determine which endpoint to use
  let recommendedEndpoint = null;
  
  if (results["/.netlify/functions/neon-inventory"]?.status === "success") {
    recommendedEndpoint = "/.netlify/functions/neon-inventory";
  } else if (results["/db/inventory"]?.status === "success") {
    recommendedEndpoint = "/db/inventory";
  } else if (results["/api/inventory"]?.status === "success") {
    recommendedEndpoint = "/api/inventory";
  }
  
  console.log("\n=== Recommendation ===");
  if (recommendedEndpoint) {
    console.log(`Use this endpoint for API calls: ${recommendedEndpoint}`);
  } else {
    console.log("No working endpoints found. Check your server configuration.");
  }
  
  return results;
})();
