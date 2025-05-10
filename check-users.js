import pg from "pg";
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

async function checkUsers() {
  try {
    // Connect to the database
    await client.connect();
    console.log("Connected to Neon PostgreSQL database");

    // Get all users
    const usersResult = await client.query(`
      SELECT id, name, email, role, department FROM users
    `);

    console.log("\n=== Users ===");
    console.log(`Found ${usersResult.rows.length} users:`);

    if (usersResult.rows.length === 0) {
      console.log("No users found!");
    } else {
      usersResult.rows.forEach((user) => {
        console.log(
          `- ${user.id}: ${user.name} (${user.email}) - Role: ${user.role}`
        );
      });
    }

    // Get all categories with column information
    const categoriesResult = await client.query(`
      SELECT * FROM categories
    `);

    console.log("\n=== Categories ===");
    console.log(`Found ${categoriesResult.rows.length} categories:`);

    if (categoriesResult.rows.length === 0) {
      console.log("No categories found!");
    } else {
      // Show column names from the first row
      if (categoriesResult.rows.length > 0) {
        console.log("Column names:", Object.keys(categoriesResult.rows[0]));
      }

      categoriesResult.rows.forEach((category) => {
        console.log(
          `- ${category.id}: ${category.name} (Type: ${typeof category.id})`
        );
      });
    }

    // Get table schema information
    const tableSchemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);

    console.log("\n=== Categories Table Schema ===");
    tableSchemaResult.rows.forEach((column) => {
      console.log(
        `- ${column.column_name}: ${column.data_type} (${
          column.is_nullable === "YES" ? "NULL" : "NOT NULL"
        })`
      );
    });

    // Get item_requests table schema
    const requestsSchemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'item_requests'
      ORDER BY ordinal_position
    `);

    console.log("\n=== Item Requests Table Schema ===");
    requestsSchemaResult.rows.forEach((column) => {
      console.log(
        `- ${column.column_name}: ${column.data_type} (${
          column.is_nullable === "YES" ? "NULL" : "NOT NULL"
        })`
      );
    });

    // Get all requests with user information
    console.log("\n=== Requests with User Information ===");
    const requestsResult = await client.query(`
      SELECT r.id, r.title, r.status, r.user_id, u.name as user_name, u.email as user_email
      FROM item_requests r
      LEFT JOIN users u ON r.user_id = u.id
    `);

    console.log(`Found ${requestsResult.rows.length} requests:`);

    if (requestsResult.rows.length === 0) {
      console.log("No requests found!");
    } else {
      requestsResult.rows.forEach((req) => {
        console.log(
          `- ${req.id}: ${req.title} (${req.status}) - User: ${req.user_name} (${req.user_email})`
        );
      });
    }

    console.log("\nCheck completed successfully");
  } catch (error) {
    console.error("Error checking database:", error);
  } finally {
    // Close the database connection
    await client.end();
    console.log("Database connection closed");
  }
}

// Run the check
checkUsers();
