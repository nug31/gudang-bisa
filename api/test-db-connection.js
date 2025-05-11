// Vercel API route for testing database connection
import { Pool } from "pg";

// Get connection string from environment variable
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Create a connection pool with optimized settings for serverless
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
    }

    if (tables.includes("categories")) {
      const categoriesResult = await client.query(
        "SELECT COUNT(*) FROM categories"
      );
      categoriesCount = parseInt(categoriesResult.rows[0].count, 10);
    }

    if (tables.includes("users")) {
      const usersResult = await client.query("SELECT COUNT(*) FROM users");
      usersCount = parseInt(usersResult.rows[0].count, 10);
    }

    if (tables.includes("item_requests")) {
      const requestsResult = await client.query(
        "SELECT COUNT(*) FROM item_requests"
      );
      requestsCount = parseInt(requestsResult.rows[0].count, 10);

      // Get status counts
      const statusResult = await client.query(
        "SELECT status, COUNT(*) FROM item_requests GROUP BY status"
      );
      console.log("Item requests by status:", statusResult.rows);
    }

    // Get database server version
    const versionResult = await client.query("SELECT version()");
    const dbVersion = versionResult.rows[0].version;

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
      dbVersion: dbVersion,
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

// Vercel API handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Test the connection
    const connectionResult = await testConnection();

    // Check connection string info
    const connectionStringInfo = {
      available: !!connectionString,
      length: connectionString ? connectionString.length : 0,
      containsNeon: connectionString
        ? connectionString.includes("neon")
        : false,
      containsPostgresql: connectionString
        ? connectionString.includes("postgresql")
        : false,
      envVarSet: !!process.env.NEON_CONNECTION_STRING,
    };

    // Return the results
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      connectionStringInfo,
      connectionResult,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
    });
  } catch (error) {
    console.error("Error testing database connection:", error);

    return res.status(500).json({
      message: "Error testing database connection",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
