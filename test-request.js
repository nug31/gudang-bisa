const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testRequestFunctionality() {
  try {
    console.log("Testing request functionality...");

    // 1. Create a test request
    const testRequest = {
      title: "Test Request " + new Date().toISOString(),
      description: "This is a test request to verify functionality",
      category: "1", // Assuming category ID 1 exists
      priority: "medium",
      status: "pending",
      userId: "1", // Assuming user ID 1 exists
      quantity: 1,
    };

    console.log("Creating test request:", testRequest);

    const createResponse = await fetch("http://localhost:3001/db/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "create",
        request: testRequest,
      }),
    });

    if (!createResponse.ok) {
      throw new Error(
        `Failed to create request: ${createResponse.status} ${createResponse.statusText}`
      );
    }

    const createdRequest = await createResponse.json();
    console.log("Successfully created request:", createdRequest);

    // 2. Verify the request was created by fetching all requests
    const getAllResponse = await fetch("http://localhost:3001/db/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getAll",
        timestamp: Date.now(),
      }),
    });

    if (!getAllResponse.ok) {
      throw new Error(
        `Failed to get all requests: ${getAllResponse.status} ${getAllResponse.statusText}`
      );
    }

    const allRequests = await getAllResponse.json();
    console.log(`Retrieved ${allRequests.length} requests`);

    // Check if our created request is in the list
    const foundRequest = allRequests.find(
      (req) => req.id === createdRequest.id
    );
    if (foundRequest) {
      console.log("✅ Request was successfully created and retrieved");
    } else {
      console.log(
        "❌ Created request was not found in the list of all requests"
      );
    }

    // 3. Test updating the request
    const updateData = {
      ...createdRequest,
      status: "approved",
      description: "Updated description for testing",
    };

    console.log("Updating request:", updateData);

    const updateResponse = await fetch("http://localhost:3001/db/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update",
        request: updateData,
      }),
    });

    if (!updateResponse.ok) {
      throw new Error(
        `Failed to update request: ${updateResponse.status} ${updateResponse.statusText}`
      );
    }

    const updatedRequest = await updateResponse.json();
    console.log("Successfully updated request:", updatedRequest);

    // 4. Verify the update
    const getByIdResponse = await fetch("http://localhost:3001/db/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "getById",
        id: createdRequest.id,
      }),
    });

    if (!getByIdResponse.ok) {
      throw new Error(
        `Failed to get request by ID: ${getByIdResponse.status} ${getByIdResponse.statusText}`
      );
    }

    const retrievedRequest = await getByIdResponse.json();
    console.log("Retrieved updated request:", retrievedRequest);

    if (
      retrievedRequest.status === "approved" &&
      retrievedRequest.description === "Updated description for testing"
    ) {
      console.log("✅ Request was successfully updated");
    } else {
      console.log("❌ Request update failed or was not persisted");
    }

    console.log("Request functionality test completed successfully");
  } catch (error) {
    console.error("Error testing request functionality:", error);
  }
}

testRequestFunctionality();
