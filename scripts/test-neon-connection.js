const { Pool } = require('pg');
require('dotenv').config();

// Get connection string from environment variables
const connectionString = process.env.NEON_CONNECTION_STRING || 
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("Testing connection to Neon database...");
console.log("Connection string available:", !!connectionString);
console.log("Connection string length:", connectionString ? connectionString.length : 0);
console.log("Connection string first 10 chars:", connectionString ? connectionString.substring(0, 10) + "..." : "N/A");

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  // Add connection pool settings for better reliability
  max: 5, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection to become available
});

// Test the connection
async function testConnection() {
  try {
    console.log("Attempting to connect to Neon database...");
    const client = await pool.connect();
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

    // Get inventory items count
    let inventoryCount = 0;
    if (tables.includes("inventory_items")) {
      console.log("Counting inventory items...");
      const inventoryResult = await client.query("SELECT COUNT(*) FROM inventory_items");
      inventoryCount = parseInt(inventoryResult.rows[0].count, 10);
      console.log(`Found ${inventoryCount} inventory items`);

      // If there are inventory items, get a sample
      if (inventoryCount > 0) {
        const sampleResult = await client.query("SELECT * FROM inventory_items LIMIT 1");
        if (sampleResult.rows.length > 0) {
          console.log("Sample inventory item:", sampleResult.rows[0]);
        }
      }
    } else {
      console.log("inventory_items table not found");
    }

    client.release();
    console.log("Database client released");

    return {
      connected: true,
      tables,
      inventoryCount,
    };
  } catch (error) {
    console.error("Error connecting to Neon database:", error);
    return {
      connected: false,
      error: error.message,
    };
  } finally {
    // Close the pool
    await pool.end();
    console.log("Connection pool closed");
  }
}

// Run the test
testConnection()
  .then((result) => {
    console.log("Test result:", result);
    if (result.connected) {
      console.log("✅ Successfully connected to Neon database!");
    } else {
      console.log("❌ Failed to connect to Neon database!");
    }
  })
  .catch((err) => {
    console.error("Error running test:", err);
  });
