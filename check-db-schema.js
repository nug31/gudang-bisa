import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function checkDbSchema() {
  console.log("Checking database schema with the following settings:");
  console.log(`Host: ${DB_HOST}`);
  console.log(`Port: ${DB_PORT || 3306}`);
  console.log(`User: ${DB_USER}`);
  console.log(`Database: ${DB_NAME}`);
  console.log("Password: [HIDDEN]");
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });
    
    console.log("Successfully connected to the database!");
    
    // Get all tables
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables in the database:");
    
    if (tables.length === 0) {
      console.log("No tables found in the database.");
    } else {
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        console.log(`\nTable: ${tableName}`);
        
        // Get table schema
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        console.log("Columns:");
        columns.forEach(column => {
          console.log(`- ${column.Field} (${column.Type})${column.Key === 'PRI' ? ' [PRIMARY KEY]' : ''}`);
        });
      }
    }
    
    // Close the connection
    await connection.end();
    console.log("\nConnection closed.");
  } catch (error) {
    console.error("Error:", error);
  }
}

checkDbSchema();
