import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function fetchCategories() {
  console.log("Fetching categories from the database:");
  console.log(`Host: ${DB_HOST}`);
  console.log(`Port: ${DB_PORT || 3306}`);
  console.log(`User: ${DB_USER}`);
  console.log(`Database: ${DB_NAME}`);
  
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
    
    // Fetch all categories
    const [categories] = await connection.query(`
      SELECT
        id,
        name,
        description,
        created_at as createdAt
      FROM categories
      ORDER BY name
    `);
    
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`- ${category.name} (${category.id}): ${category.description}`);
    });
    
    // Close the connection
    await connection.end();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Error:", error);
  }
}

fetchCategories();
