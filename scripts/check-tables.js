import { config } from "dotenv";
import pg from "pg";

// Load environment variables
config();

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error(
    "Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file."
  );
  process.exit(1);
}

async function checkTables() {
  console.log("Checking Neon database tables...");

  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Connect to the database
    await client.connect();
    console.log("Connected to Neon database.");

    // Check categories table structure
    console.log("Checking categories table structure...");
    const categoriesResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories';
    `);
    
    console.log("Categories table columns:");
    console.table(categoriesResult.rows);

    // Check users table structure
    console.log("Checking users table structure...");
    const usersResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    
    console.log("Users table columns:");
    console.table(usersResult.rows);

    // Check if item_requests table exists
    console.log("Checking if item_requests table exists...");
    const itemRequestsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'item_requests'
      );
    `);
    
    console.log("item_requests table exists:", itemRequestsResult.rows[0].exists);

    // List all tables
    console.log("Listing all tables...");
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log("Tables in database:");
    console.table(tablesResult.rows);

  } catch (error) {
    console.error("Error checking tables:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the check
checkTables().catch((error) => {
  console.error("Check failed:", error);
  process.exit(1);
});
