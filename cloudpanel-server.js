import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Check if we should use mock database
const useMockDb = process.env.USE_MOCK_DB === "true";
console.log(`Database mode: ${useMockDb ? "MOCK DATABASE" : "REAL DATABASE"}`);

// Create database connection pool
let pool;

// Try to create database connection pool for CloudPanel
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "gudang-mitra",
    password: process.env.DB_PASSWORD || "J2T3plKAwGJceh4A4ttZ",
    database: process.env.DB_NAME || "gudang-mitra",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // 10 seconds timeout
  });

  console.log("Created database pool for CloudPanel connection");
  console.log(`Host: ${process.env.DB_HOST || "127.0.0.1"}`);
  console.log(`User: ${process.env.DB_USER || "gudang-mitra"}`);
  console.log(`Database: ${process.env.DB_NAME || "gudang-mitra"}`);
} catch (error) {
  console.error("Error creating database pool:", error);
  console.log("Using mock database");
}

// Test database connection
async function testDatabaseConnection() {
  if (useMockDb) {
    console.log("Using mock database (as specified in .env)");
    return;
  }

  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully");

    // Test a simple query
    const [result] = await connection.query("SELECT 1 as test");
    console.log("Query result:", result);

    connection.release();
  } catch (error) {
    console.error("❌ Error connecting to database:", error);
    console.log(
      "⚠️ Consider setting USE_MOCK_DB=true in .env to use mock data"
    );
  }
}

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: useMockDb ? "mock" : "database" });
});

// Test database connection endpoint
app.get("/api/test-db", async (req, res) => {
  if (useMockDb) {
    return res.json({
      success: true,
      message: "Using mock database mode",
      usingMock: true,
    });
  }

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query("SELECT 1 as test");
    connection.release();

    res.json({
      success: true,
      message: "Database connection successful",
      result,
      usingMock: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      usingMock: false,
    });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, "dist")));

// Handle all other routes by serving the index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Test the database connection
testDatabaseConnection();

// Start the server
app.listen(PORT, () => {
  console.log(`CloudPanel server running on port ${PORT}`);
  console.log(`Using ${useMockDb ? "mock" : "real"} database`);
  console.log(
    `To test database connection, visit: http://localhost:${PORT}/api/test-db`
  );
});

export default app;
