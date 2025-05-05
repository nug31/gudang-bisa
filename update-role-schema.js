import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

async function updateRoleSchema() {
  console.log("Updating database schema to include manager role...");
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log("Connected to database.");
    
    // Modify the role column to include 'manager'
    console.log("Modifying users table to include manager role...");
    await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'user') NOT NULL");
    
    console.log("Schema updated successfully!");
    
    // Verify the change
    console.log("\nVerifying updated users table structure:");
    const [columns] = await connection.query("DESCRIBE users");
    columns.forEach(column => {
      if (column.Field === 'role') {
        console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : ''}`);
      }
    });
    
    await connection.end();
    console.log("\nDatabase schema update completed.");
  } catch (error) {
    console.error("Error updating database schema:", error);
  }
}

updateRoleSchema();
