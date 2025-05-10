import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SERVER_URL = "http://localhost:3003";
const API_ENDPOINT = `${SERVER_URL}/db/requests`;

// Get the database connection string from environment variables
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Create a new PostgreSQL client
const client = new pg.Client({
  connectionString: connectionString,
});

async function getCategoryUuid(categoryId) {
  try {
    const result = await client.query(`
      SELECT id FROM category_uuids WHERE category_id = $1
    `, [categoryId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Category UUID not found for category ID ${categoryId}`);
    }
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error getting category UUID:', error);
    throw error;
  }
}

async function testServerApi() {
  try {
    console.log("=== TESTING SERVER API ===");
    console.log(`Server URL: ${SERVER_URL}`);
    console.log(`API Endpoint: ${API_ENDPOINT}`);
    console.log("=========================\n");

    // Connect to the database to get category UUIDs
    await client.connect();
    console.log('Connected to Neon PostgreSQL database');
    
    // Get the Office category UUID
    const officeCategoryId = 6;
    const officeCategoryUuid = await getCategoryUuid(officeCategoryId);
    console.log(`Office category UUID: ${officeCategoryUuid}`);
    
    // 1. Create a test request
    console.log("\nSTEP 1: Creating a test request");
    
    // Generate a unique ID for the request
    const requestId = uuidv4();
    
    // Create a request that matches the database schema
    const testRequest = {
      id: requestId,
      title: "Server API Test Request " + new Date().toISOString(),
      description: "This is a test request created via the server API",
      category_id: officeCategoryUuid, // Using the UUID from the category_uuids table
      priority: "medium",
      status: "pending",
      user_id: "00000000-0000-0000-0000-000000000001", // Admin user ID
      quantity: 1
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
      console.log("STEP 2: Verifying request creation by fetching all requests");
      
      // Add a small delay to ensure the database has processed the request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
          console.log("✅ STEP 2: Request was successfully created and retrieved");
          console.log("Found request:", foundRequest);
        } else {
          console.log("❌ STEP 2: Created request was not found in the list of all requests");
          console.log("Request ID:", createdRequest.id);
          console.log("Available request IDs:", allRequests.map(req => req.id));
        }
        
        console.log("\n=== TEST SUMMARY ===");
        console.log("Request ID:", createdRequest.id);
        console.log("Request created: ✅");
        console.log("Request verified in list: " + (foundRequest ? "✅" : "❌"));
        console.log("==================\n");
        
      } catch (error) {
        console.error("Error in Step 2 (Verify creation):", error);
      }
    } catch (error) {
      console.error("Error in Step 1 (Create request):", error);
    }

    console.log("Server API test completed");
  } catch (error) {
    console.error("Fatal error in test execution:", error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the test
testServerApi()
  .then(() => console.log("Test execution completed"))
  .catch(error => console.error("Unhandled error in test execution:", error));
