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

async function checkUsers() {
  console.log("Checking users in Neon database...");

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

    // Check users table structure
    console.log("Checking users table structure...");
    const tableStructure = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);

    console.log("Users table structure:");
    console.table(tableStructure.rows);

    // Check users table
    console.log("Checking users table...");
    const usersResult = await client.query(`
      SELECT * FROM users;
    `);

    console.log(`Found ${usersResult.rows.length} users:`);
    console.table(usersResult.rows);

    // Check if admin@gudangmitra.com exists
    const adminExists = usersResult.rows.some(
      (user) => user.email === "admin@gudangmitra.com"
    );

    if (!adminExists) {
      console.log("Creating admin@gudangmitra.com user...");

      const createAdminResult = await client.query(`
        INSERT INTO users (id, name, email, role, department, created_at)
        VALUES (
          '3',
          'Admin User',
          'admin@gudangmitra.com',
          'admin',
          'IT',
          CURRENT_TIMESTAMP
        )
        RETURNING *;
      `);

      console.log("Created admin user:", createAdminResult.rows[0]);
    } else {
      console.log("admin@gudangmitra.com already exists");
    }
  } catch (error) {
    console.error("Error checking users:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the check
checkUsers().catch((error) => {
  console.error("Check failed:", error);
  process.exit(1);
});
