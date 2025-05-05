import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

async function addPasswordColumn() {
  console.log("Checking if password column exists in users table...");
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Check if password column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
    `, [process.env.DB_NAME]);

    if (columns.length === 0) {
      console.log("Password column does not exist. Adding it...");
      
      // Add password column
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN password VARCHAR(255) NULL AFTER email
      `);
      
      console.log("Password column added successfully!");
    } else {
      console.log("Password column already exists.");
    }

    await connection.end();
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
  }
}

addPasswordColumn();
