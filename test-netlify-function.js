// Script to test the Netlify function locally
import { handler } from "./netlify/functions/neon-requests.js";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Get the Neon connection string
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error(
    "Error: NEON_CONNECTION_STRING environment variable is not set."
  );
  process.exit(1);
}

// Set the connection string in the process environment for the handler
process.env.NEON_CONNECTION_STRING = connectionString;

console.log(
  "Using Neon connection string:",
  connectionString.substring(0, 20) + "..."
);

async function testNetlifyFunction() {
  console.log("Testing Netlify function locally...");

  // Create a test request
  const testRequest = {
    id: uuidv4(),
    title: "Test Request",
    description: "This is a test request",
    priority: "medium",
    status: "pending",
    userId: "00000000-0000-0000-0000-000000000001",
    itemId: "88888888-8888-8888-8888-888888888888",
    inventoryItemId: "88888888-8888-8888-8888-888888888888",
    quantity: 1,
    categoryId: "11111111-1111-1111-1111-111111111111",
    category: "office",
  };

  // Create the event object
  const event = {
    httpMethod: "POST",
    body: JSON.stringify({
      action: "create",
      userId: testRequest.userId,
      itemId: testRequest.itemId,
      quantity: testRequest.quantity,
      reason: testRequest.description,
      request: testRequest,
    }),
  };

  // Create the context object
  const context = {};

  try {
    console.log("Calling Netlify function handler...");
    console.log("Event:", JSON.stringify(event, null, 2));

    // Call the handler
    const response = await handler(event, context);

    console.log("Response:", JSON.stringify(response, null, 2));

    if (response.statusCode === 201) {
      console.log("✅ Test passed! Function returned status 201 (Created)");

      try {
        const responseData = JSON.parse(response.body);
        console.log("Response data:", responseData);

        if (responseData.id) {
          console.log(
            "✅ Request created successfully with ID:",
            responseData.id
          );
        } else {
          console.log("❌ Response does not contain an ID.");
        }
      } catch (parseError) {
        console.error("❌ Could not parse response body as JSON:", parseError);
      }
    } else {
      console.log(
        `❌ Test failed! Function returned status ${response.statusCode}`
      );
      console.log("Response body:", response.body);
    }
  } catch (error) {
    console.error("❌ Test failed! Error calling handler:", error);
  }
}

// Run the test
testNetlifyFunction();
