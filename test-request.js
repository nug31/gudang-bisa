import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

// Configuration
const SERVER_URL = "http://localhost:3003"; // Updated to use port 3003
const API_ENDPOINT = `${SERVER_URL}/db/requests`;

async function testRequestFunctionality() {
  try {
    console.log("=== TESTING REQUEST FUNCTIONALITY ===");
    console.log(`Server URL: ${SERVER_URL}`);
    console.log(`API Endpoint: ${API_ENDPOINT}`);
    console.log("=====================================\n");

    // 1. Create a test request
    console.log("STEP 1: Creating a test request");

    // Generate a unique ID for the request
    const requestId = uuidv4();

    // Create a request that matches the database schema
    const testRequest = {
      id: requestId, // Use the generated UUID
      title: "Test Request " + new Date().toISOString(),
      description: "This is a test request to verify database connectivity",
      category: "11111111-1111-1111-1111-111111111111", // Using the UUID from supabase-schema.sql (Office category)
      priority: "medium",
      status: "pending",
      userId: "55555555-5555-5555-5555-555555555555", // Using the UUID from supabase-schema.sql (Admin User)
      quantity: 1,
      fulfillmentDate: null,
      // Omit any fields that might not exist in the schema
    };

    console.log("Request data:", testRequest);

    try {
      const createResponse = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          request: testRequest,
        }),
      });

      // Check for HTTP errors
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(
          `Failed to create request: ${createResponse.status} ${createResponse.statusText}\nResponse: ${errorText}`
        );
      }

      // Parse the response
      const createdRequest = await createResponse.json();
      console.log("Successfully created request:", createdRequest);
      console.log("✅ STEP 1: Request creation successful\n");

      // 2. Verify the request was created by fetching all requests
      console.log(
        "STEP 2: Verifying request creation by fetching all requests"
      );

      // Add a small delay to ensure the database has processed the request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        const getAllResponse = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
            timestamp: Date.now(), // Add timestamp to prevent caching
          }),
        });

        // Check for HTTP errors
        if (!getAllResponse.ok) {
          const errorText = await getAllResponse.text();
          throw new Error(
            `Failed to get all requests: ${getAllResponse.status} ${getAllResponse.statusText}\nResponse: ${errorText}`
          );
        }

        // Parse the response
        const allRequests = await getAllResponse.json();
        console.log(`Retrieved ${allRequests.length} requests`);

        // Check if our created request is in the list
        const foundRequest = allRequests.find(
          (req) => req.id === createdRequest.id
        );

        if (foundRequest) {
          console.log(
            "✅ STEP 2: Request was successfully created and retrieved"
          );
          console.log("Found request:", foundRequest);
        } else {
          console.log(
            "❌ STEP 2: Created request was not found in the list of all requests"
          );
          console.log("Request ID:", createdRequest.id);
          console.log(
            "Available request IDs:",
            allRequests.map((req) => req.id)
          );
        }
        console.log("");

        // 3. Test updating the request
        console.log("STEP 3: Testing request update functionality");

        const updateData = {
          ...createdRequest,
          status: "approved",
          description: "Updated description for testing",
          approvedBy: "55555555-5555-5555-5555-555555555555", // Admin user UUID from supabase-schema.sql
          approvedAt: new Date().toISOString(),
          // Make sure we're using the correct field names based on the schema
        };

        console.log("Update data:", updateData);

        try {
          const updateResponse = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "update",
              request: updateData,
            }),
          });

          // Check for HTTP errors
          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(
              `Failed to update request: ${updateResponse.status} ${updateResponse.statusText}\nResponse: ${errorText}`
            );
          }

          // Parse the response
          const updatedRequest = await updateResponse.json();
          console.log("Successfully updated request:", updatedRequest);
          console.log("✅ STEP 3: Request update successful\n");

          // 4. Verify the update by fetching the request by ID
          console.log("STEP 4: Verifying request update by fetching by ID");

          // Add a small delay to ensure the database has processed the update
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            const getByIdResponse = await fetch(API_ENDPOINT, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "getById",
                id: createdRequest.id,
              }),
            });

            // Check for HTTP errors
            if (!getByIdResponse.ok) {
              const errorText = await getByIdResponse.text();
              throw new Error(
                `Failed to get request by ID: ${getByIdResponse.status} ${getByIdResponse.statusText}\nResponse: ${errorText}`
              );
            }

            // Parse the response
            const retrievedRequest = await getByIdResponse.json();
            console.log("Retrieved updated request:", retrievedRequest);

            // Verify the update was successful
            if (
              retrievedRequest.status === "approved" &&
              retrievedRequest.description === "Updated description for testing"
            ) {
              console.log(
                "✅ STEP 4: Request was successfully updated and retrieved"
              );
            } else {
              console.log(
                "❌ STEP 4: Request update failed or was not persisted"
              );
              console.log(
                "Expected status: approved, got:",
                retrievedRequest.status
              );
              console.log(
                "Expected description: 'Updated description for testing', got:",
                retrievedRequest.description
              );
            }

            console.log("\n=== TEST SUMMARY ===");
            console.log("Request ID:", createdRequest.id);
            console.log("Request created: ✅");
            console.log(
              "Request verified in list: " + (foundRequest ? "✅" : "❌")
            );
            console.log("Request updated: ✅");
            console.log(
              "Update verified: " +
                (retrievedRequest.status === "approved" ? "✅" : "❌")
            );
            console.log("==================\n");
          } catch (error) {
            console.error("Error in Step 4 (Verify update):", error);
          }
        } catch (error) {
          console.error("Error in Step 3 (Update request):", error);
        }
      } catch (error) {
        console.error("Error in Step 2 (Verify creation):", error);
      }
    } catch (error) {
      console.error("Error in Step 1 (Create request):", error);
    }

    console.log("Request functionality test completed");
  } catch (error) {
    console.error("Fatal error in test execution:", error);
  }
}

// Run the test
testRequestFunctionality()
  .then(() => console.log("Test execution completed"))
  .catch((error) => console.error("Unhandled error in test execution:", error));
