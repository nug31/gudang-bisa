import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function testConnection() {
  console.log("Testing database connection with the following settings:");
  console.log(`Host: ${DB_HOST}`);
  console.log(`Port: ${DB_PORT || 3306}`);
  console.log(`User: ${DB_USER}`);
  console.log(`Database: ${DB_NAME}`);
  console.log("Password: [HIDDEN]");

  try {
    console.log("Attempting to connect to cPanel database...");
    console.log("This may take a minute. Please be patient.");

    // Create connection with a longer timeout for remote cPanel connections
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      connectTimeout: 60000, // 60 seconds - increased for remote connections
    });

    console.log("Successfully connected to the database!");

    // Test a simple query
    const [result] = await connection.query("SELECT 1 as test");
    console.log("Query result:", result);

    // Close the connection
    await connection.end();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Error connecting to the database:", error);

    if (error.code === "ETIMEDOUT") {
      console.log("\nThe connection timed out. This could be because:");
      console.log("1. The database server is not accessible from your network");
      console.log(
        "2. Your IP address is not allowed to connect to the database server"
      );
      console.log("3. The database server is down or not responding");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\nAccess denied. This could be because:");
      console.log("1. The username or password is incorrect");
      console.log(
        "2. The user does not have permission to access the database"
      );
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.log("\nDatabase not found. This could be because:");
      console.log("1. The database name is incorrect");
      console.log("2. The database has not been created yet");
    }

    console.log("\nPlease check your cPanel database settings and make sure:");
    console.log("1. The database exists in cPanel");
    console.log("2. The user has been created and has access to the database");
    console.log(
      "3. Your IP address is allowed to connect to the database server"
    );
    console.log("   - This is the most common issue with cPanel databases");
    console.log(
      "   - Log in to cPanel > MySQL Databases > Remote MySQL > Add your current IP"
    );
    console.log("4. The credentials in your .env file are correct");
    console.log(
      "5. The cPanel server is not blocking connections on port 3306"
    );
  }
}

testConnection();
