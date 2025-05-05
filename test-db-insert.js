import mysql from "mysql2/promise";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function testDatabaseInsert() {
  console.log("Testing database insert with the following settings:");
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
    
    // Check if the categories table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'categories'");
    
    if (tables.length === 0) {
      console.log("Categories table does not exist. Creating it...");
      
      await connection.query(`
        CREATE TABLE categories (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log("Categories table created successfully!");
    } else {
      console.log("Categories table already exists.");
    }
    
    // Insert a test category
    const categoryId = uuidv4();
    const categoryName = `Test Category ${new Date().toISOString()}`;
    
    await connection.query(
      `INSERT INTO categories (id, name, description) VALUES (?, ?, ?)`,
      [categoryId, categoryName, "This is a test category"]
    );
    
    console.log(`Inserted test category with ID: ${categoryId}`);
    
    // Verify the insertion
    const [categories] = await connection.query(
      `SELECT * FROM categories WHERE id = ?`,
      [categoryId]
    );
    
    console.log("Retrieved category:", categories[0]);
    
    // Close the connection
    await connection.end();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Error:", error);
  }
}

testDatabaseInsert();
