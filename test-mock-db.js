import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";

// Load environment variables
config();

// Import the database connection
import("./src/db/index.ts").then(async (module) => {
  const pool = module.default;

  console.log("Testing database connection...");
  console.log(`USE_MOCK_DB=${process.env.USE_MOCK_DB}`);

  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();
    console.log("Successfully got a connection from the pool");

    // Test a simple query
    const [result] = await connection.query("SELECT 1 + 1 AS test");
    console.log("Test query result:", result);

    // Try to get all users
    const [users] = await connection.query("SELECT * FROM users");
    console.log(`Found ${users.length} users in the database`);
    console.log("First user:", users[0]);

    // Try to get all categories
    const [categories] = await connection.query("SELECT * FROM categories");
    console.log(`Found ${categories.length} categories in the database`);

    // Try to get all item requests
    const [requests] = await connection.query("SELECT * FROM item_requests");
    console.log(`Found ${requests.length} item requests in the database`);

    // Check if mock data file exists
    try {
      const mockDataPath = path.join(
        process.cwd(),
        "src",
        "data",
        "mockData.json"
      );
      await fs.access(mockDataPath);
      console.log(`Mock data file exists at ${mockDataPath}`);
    } catch (err) {
      console.error("Mock data file does not exist or is not accessible");
    }

    // Release the connection
    connection.release();
    console.log("Connection released");
  } catch (error) {
    console.error("Error testing database connection:", error);
  }

  // Exit the process
  process.exit(0);
});
