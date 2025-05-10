import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get the database connection string from environment variables
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log(
  "Using connection string:",
  connectionString.replace(/:[^:]*@/, ":****@")
);

// Create a new PostgreSQL client
const client = new pg.Client({
  connectionString: connectionString,
});

async function testDatabaseDirectly() {
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected to Neon PostgreSQL database");

    // Generate a unique ID for the request
    const requestId = uuidv4();

    // Create a test request with valid user and category IDs from the database
    const testRequest = {
      id: requestId,
      title: "Direct DB Test Request " + new Date().toISOString(),
      description: "This is a test request created directly in the database",
      category_id: 6, // Office category ID from the database
      priority: "medium",
      status: "pending",
      user_id: "00000000-0000-0000-0000-000000000001", // Admin user ID from the database
      quantity: 1,
      total_cost: null,
      created_at: new Date(),
      updated_at: new Date(),
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: null,
    };

    console.log("Creating test request with ID:", requestId);

    // Insert the request into the database
    const insertQuery = `
      INSERT INTO item_requests (
        id,
        title,
        description,
        category_id,
        priority,
        status,
        user_id,
        quantity,
        total_cost,
        created_at,
        updated_at,
        approved_at,
        approved_by,
        rejected_at,
        rejected_by,
        rejection_reason,
        fulfillment_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `;

    const insertValues = [
      testRequest.id,
      testRequest.title,
      testRequest.description,
      testRequest.category_id,
      testRequest.priority,
      testRequest.status,
      testRequest.user_id,
      testRequest.quantity,
      testRequest.total_cost,
      testRequest.created_at,
      testRequest.updated_at,
      testRequest.approved_at,
      testRequest.approved_by,
      testRequest.rejected_at,
      testRequest.rejected_by,
      testRequest.rejection_reason,
      testRequest.fulfillment_date,
    ];

    const insertResult = await client.query(insertQuery, insertValues);
    console.log(
      "Request inserted successfully with ID:",
      insertResult.rows[0].id
    );

    // Verify the request was inserted by fetching it
    const selectQuery = `
      SELECT * FROM item_requests WHERE id = $1
    `;

    const selectResult = await client.query(selectQuery, [requestId]);

    if (selectResult.rows.length > 0) {
      console.log("✅ Request verification successful!");
      console.log("Retrieved request:", selectResult.rows[0]);
    } else {
      console.log(
        "❌ Request verification failed! Request not found in database."
      );
    }

    console.log("\nTest completed successfully");
  } catch (error) {
    console.error("Error testing database directly:", error);
  } finally {
    // Close the database connection
    await client.end();
    console.log("Database connection closed");
  }
}

// Run the test
testDatabaseDirectly();
