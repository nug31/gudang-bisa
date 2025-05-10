// Script to test the item request fix
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

// Configuration
const API_URL =
  process.env.API_URL ||
  "http://localhost:3004/.netlify/functions/neon-requests";
const TEST_USER_ID =
  process.env.TEST_USER_ID || "00000000-0000-0000-0000-000000000001";
const TEST_ITEM_ID =
  process.env.TEST_ITEM_ID || "88888888-8888-8888-8888-888888888888";

async function testItemRequest() {
  console.log("Testing item request functionality...");
  console.log(`API URL: ${API_URL}`);

  // Create a test request
  const testRequest = {
    id: uuidv4(),
    title: "Test Request",
    description: "This is a test request",
    priority: "medium",
    status: "pending",
    userId: TEST_USER_ID,
    itemId: TEST_ITEM_ID,
    inventoryItemId: TEST_ITEM_ID,
    quantity: 1,
    categoryId: "11111111-1111-1111-1111-111111111111",
    category: "office",
  };

  console.log("Test request data:", testRequest);

  try {
    // Send the request
    console.log("Sending request to API...");
    const requestBody = {
      action: "create",
      userId: testRequest.userId,
      itemId: testRequest.itemId,
      quantity: testRequest.quantity,
      reason: testRequest.description,
      request: testRequest,
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`Response status: ${response.status}`);
    console.log("Response headers:", response.headers.raw());

    // Parse the response
    const responseText = await response.text();

    // Check if the response is HTML (common error case)
    if (
      responseText.trim().startsWith("<!DOCTYPE") ||
      responseText.trim().startsWith("<html")
    ) {
      console.error("❌ Test failed! Received HTML response instead of JSON:");
      console.log(
        "First 500 characters of response:",
        responseText.substring(0, 500)
      );
      console.log("This usually indicates a server error or redirection.");

      // Check if we're getting a 404 page or other error page
      if (responseText.includes("404") || responseText.includes("Not Found")) {
        console.error(
          "The API endpoint appears to be unavailable or incorrect (404 Not Found)."
        );
        console.error(
          "Please check that the server is running and the endpoint URL is correct."
        );
      } else if (
        responseText.includes("500") ||
        responseText.includes("Internal Server Error")
      ) {
        console.error(
          "The server encountered an internal error (500 Internal Server Error)."
        );
        console.error("Please check the server logs for more details.");
      }

      return;
    }

    console.log("Response text:", responseText);

    try {
      const responseData = JSON.parse(responseText);
      console.log("Response data:", responseData);

      if (responseData.id) {
        console.log(
          "✅ Test passed! Request created successfully with ID:",
          responseData.id
        );
      } else {
        console.log("❌ Test failed! Response does not contain an ID.");
        if (responseData.message) {
          console.log("Error message:", responseData.message);
        }
        if (responseData.error) {
          console.log("Error details:", responseData.error);
        }
      }
    } catch (parseError) {
      console.error(
        "❌ Test failed! Could not parse response as JSON:",
        parseError
      );
      console.log("Raw response:", responseText);
    }
  } catch (error) {
    console.error("❌ Test failed! Error sending request:", error);
  }
}

// Run the test
testItemRequest();
