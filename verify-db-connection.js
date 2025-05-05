import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function verifyConnection() {
  console.log("Verifying database connection with the following settings:");
  console.log(`Host: ${DB_HOST}`);
  console.log(`Port: ${DB_PORT || 3306}`);
  console.log(`User: ${DB_USER}`);
  console.log(`Database: ${DB_NAME}`);
  console.log("Password: [HIDDEN]");

  try {
    // Create connection with a shorter timeout
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });

    console.log("Successfully connected to the database!");

    // Test a simple query
    const [result] = await connection.query("SELECT 1 + 1 AS test");
    console.log("Query result:", result);

    // Test tables
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables in database:");
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });

    // Close the connection
    await connection.end();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

verifyConnection();
