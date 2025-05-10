// Simple test script for Neon database connection
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get connection string
const connectionString = process.env.NEON_CONNECTION_STRING;
const { Pool } = pg;

console.log("Testing Neon connection...");
console.log("Connection string available:", !!connectionString);

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection
async function testConnection() {
  try {
    console.log("Attempting to connect...");
    const client = await pool.connect();
    console.log("Connected successfully!");

    const result = await client.query("SELECT NOW() as current_time");
    console.log("Current time from database:", result.rows[0].current_time);

    client.release();
    await pool.end();
    console.log("Connection closed");
    return true;
  } catch (error) {
    console.error("Connection error:", error.message);
    return false;
  }
}

testConnection()
  .then((success) => {
    console.log(
      "Connection test completed with result:",
      success ? "SUCCESS" : "FAILURE"
    );
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
