import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

async function checkDatabaseSchema() {
  console.log("Checking database schema...");
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log("Connected to database.");
    
    // Check users table structure
    console.log("\nUsers table structure:");
    const [columns] = await connection.query("DESCRIBE users");
    columns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : ''} ${column.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
    });
    
    // Check if there are any users in the database
    console.log("\nUsers in the database:");
    const [users] = await connection.query("SELECT id, name, email, role FROM users");
    
    if (users.length === 0) {
      console.log("No users found in the database.");
    } else {
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}): ${user.role}`);
      });
    }
    
    await connection.end();
  } catch (error) {
    console.error("Error checking database schema:", error);
  }
}

checkDatabaseSchema();
