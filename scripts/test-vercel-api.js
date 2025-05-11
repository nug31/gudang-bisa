// Test script for Vercel API routes
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const { Pool } = pg;
dotenv.config();

// Get current file path (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get connection string from environment variable
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Create a connection pool with optimized settings
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon PostgreSQL
  },
  max: 1, // Use minimal connections for serverless
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

// Test the database connection
async function testConnection() {
  let client;
  try {
    console.log("Attempting to connect to Neon database...");
    client = await pool.connect();
    console.log("Connected to Neon database successfully!");

    // Check if tables exist
    console.log("Checking for tables in the database...");
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((row) => row.table_name);
    console.log(`Found ${tables.length} tables:`, tables);

    // Get counts for various tables
    let inventoryCount = 0;
    let categoriesCount = 0;
    let usersCount = 0;
    let requestsCount = 0;

    if (tables.includes("inventory_items")) {
      const inventoryResult = await client.query(
        "SELECT COUNT(*) FROM inventory_items"
      );
      inventoryCount = parseInt(inventoryResult.rows[0].count, 10);
      console.log(`Found ${inventoryCount} inventory items`);
    }

    if (tables.includes("categories")) {
      const categoriesResult = await client.query(
        "SELECT COUNT(*) FROM categories"
      );
      categoriesCount = parseInt(categoriesResult.rows[0].count, 10);
      console.log(`Found ${categoriesCount} categories`);
    }

    if (tables.includes("users")) {
      const usersResult = await client.query("SELECT COUNT(*) FROM users");
      usersCount = parseInt(usersResult.rows[0].count, 10);
      console.log(`Found ${usersCount} users`);
    }

    if (tables.includes("item_requests")) {
      const requestsResult = await client.query(
        "SELECT COUNT(*) FROM item_requests"
      );
      requestsCount = parseInt(requestsResult.rows[0].count, 10);
      console.log(`Found ${requestsCount} item requests`);

      // Get status counts
      const statusResult = await client.query(
        "SELECT status, COUNT(*) FROM item_requests GROUP BY status"
      );
      console.log("Item requests by status:", statusResult.rows);
    }

    return {
      connected: true,
      tables,
      counts: {
        tables: tables.length,
        inventoryItems: inventoryCount,
        categories: categoriesCount,
        users: usersCount,
        requests: requestsCount,
      },
    };
  } catch (error) {
    console.error("Error connecting to Neon database:", error);
    return {
      connected: false,
      error: error.message,
      errorCode: error.code,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Test item requests
async function testItemRequests() {
  let client;
  try {
    console.log("\nTesting item_requests table...");
    client = await pool.connect();

    // First check if the table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'item_requests'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;
    console.log(`item_requests table exists: ${tableExists}`);

    if (!tableExists) {
      return {
        success: true,
        tableExists: false,
        message: "item_requests table does not exist",
      };
    }

    // Get count of all requests
    const countResult = await client.query(
      "SELECT COUNT(*) FROM item_requests"
    );
    const totalCount = parseInt(countResult.rows[0].count);
    console.log(`Total item requests: ${totalCount}`);

    // Get count by status
    const statusCountResult = await client.query(`
      SELECT status, COUNT(*)
      FROM item_requests
      GROUP BY status
    `);
    console.log("Status counts:", statusCountResult.rows);

    // Get 5 most recent requests
    const recentRequestsResult = await client.query(`
      SELECT * FROM item_requests
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(
      `Retrieved ${recentRequestsResult.rows.length} recent requests`
    );

    return {
      success: true,
      tableExists: true,
      totalCount,
      statusCounts: statusCountResult.rows,
      recentRequests: recentRequestsResult.rows,
      message: "Successfully retrieved item_requests data",
    };
  } catch (error) {
    console.error("Error testing item_requests:", error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Run the tests
async function runTests() {
  try {
    console.log("=== Testing Vercel API Routes ===");
    console.log(
      "Connection string:",
      connectionString
        ? `Available (length: ${connectionString.length})`
        : "Not available"
    );

    // Test database connection
    console.log("\n=== Testing Database Connection ===");
    const connectionResult = await testConnection();
    console.log(
      "Connection result:",
      connectionResult.connected ? "Success" : "Failed"
    );

    // Test item requests
    console.log("\n=== Testing Item Requests ===");
    const requestsResult = await testItemRequests();
    console.log(
      "Item requests result:",
      requestsResult.success ? "Success" : "Failed"
    );

    // Clean up
    await pool.end();
    console.log("\nTests completed. Pool closed.");
  } catch (error) {
    console.error("Error running tests:", error);
  }
}

// Run the tests
runTests();
