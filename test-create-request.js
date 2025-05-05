import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Create a log file for debugging
const logStream = fs.createWriteStream("./test-request.log", { flags: "a" });

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;

  console.log(logMessage);
  logStream.write(logMessage + "\n");

  if (data) {
    const dataStr =
      typeof data === "object" ? JSON.stringify(data, null, 2) : data;
    console.log(dataStr);
    logStream.write(dataStr + "\n");
  }
}

async function testCreateRequest() {
  log("Testing request creation...");

  // Create a test request
  const requestData = {
    id: uuidv4(),
    title: "Test Request from Script",
    description: "This is a test request created by a script",
    category: "1f34fae5-830b-4c6c-9092-7ea7c1f11433", // Hardware category ID
    priority: "medium",
    status: "pending",
    userId: "733dce62-3971-4448-8fc7-2d5e77928b00", // Admin user ID
    quantity: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    log("Sending request data:", requestData);

    const requestBody = {
      action: "create",
      request: requestData,
    };

    log("Request body:", requestBody);

    const response = await fetch("http://localhost:3001/db/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    log(`Response status: ${response.status} ${response.statusText}`);
    log(
      "Response headers:",
      Object.fromEntries([...response.headers.entries()])
    );

    if (!response.ok) {
      const errorText = await response.text();
      log("Error response text:", errorText);
      try {
        const errorJson = JSON.parse(errorText);
        log("Error details:", errorJson);
      } catch (e) {
        log("Could not parse error response as JSON:", e.message);
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseText = await response.text();
    log("Response text:", responseText);

    if (!responseText.trim()) {
      log("Response is empty");
    } else {
      try {
        const responseData = JSON.parse(responseText);
        log("Request created successfully:", responseData);
      } catch (e) {
        log("Could not parse response as JSON:", e.message);
      }
    }
  } catch (error) {
    log("Error creating request:", error.message);
    log("Error stack:", error.stack);
  }
}

testCreateRequest();
