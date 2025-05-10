// Debug script to check Excel import functionality
const { Pool } = require("pg");

// Initialize Neon PostgreSQL client
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("Neon connection string available:", !!connectionString);

// Create a connection pool
let pool = null;
try {
  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    console.log("Neon database pool created successfully");
  } else {
    console.error("No connection string available");
    process.exit(1);
  }
} catch (error) {
  console.error("Error creating database pool:", error);
  process.exit(1);
}

// Function to check database connection
async function checkConnection() {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to Neon database");
    
    // Check database version
    const versionResult = await client.query("SELECT version()");
    console.log("Database version:", versionResult.rows[0].version);
    
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to database:", error);
    return false;
  }
}

// Function to count inventory items
async function countInventoryItems() {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM inventory_items");
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error("Error counting inventory items:", error);
    return -1;
  }
}

// Function to get the most recent inventory items
async function getRecentItems(limit = 10) {
  try {
    const result = await pool.query(`
      SELECT 
        i.id, 
        i.name, 
        i.description, 
        i.category_id, 
        c.name as category_name,
        i.quantity_available,
        i.created_at
      FROM inventory_items i
      JOIN categories c ON i.category_id = c.id
      ORDER BY i.created_at DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  } catch (error) {
    console.error("Error fetching recent items:", error);
    return [];
  }
}

// Main function
async function main() {
  console.log("=== Excel Import Debug Tool ===");
  
  // Check connection
  const connected = await checkConnection();
  if (!connected) {
    console.error("Failed to connect to database. Exiting.");
    process.exit(1);
  }
  
  // Count items
  const itemCount = await countInventoryItems();
  console.log(`Total inventory items in database: ${itemCount}`);
  
  // Get recent items
  const recentItems = await getRecentItems(10);
  console.log(`\nMost recent ${recentItems.length} items:`);
  
  if (recentItems.length === 0) {
    console.log("No items found in the database.");
  } else {
    recentItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.name}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Category: ${item.category_name} (${item.category_id})`);
      console.log(`   Quantity: ${item.quantity_available}`);
      console.log(`   Created: ${new Date(item.created_at).toLocaleString()}`);
    });
  }
  
  // Close the pool
  await pool.end();
  console.log("\nDebug complete.");
}

// Run the main function
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
