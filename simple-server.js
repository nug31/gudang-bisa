import express from "express";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create database connection pool
console.log("Creating database connection pool with the following settings:");
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  try {
    console.log("Testing database connection...");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });

    console.log("Database connected successfully");

    // Get all tables
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables in the database:");

    if (tables.length === 0) {
      console.log("No tables found in the database.");
    } else {
      tables.forEach((table) => {
        const tableName = Object.values(table)[0];
        console.log(`- ${tableName}`);
      });
    }

    // Close the connection
    await connection.end();

    res.json({
      success: true,
      message: "Database connected successfully",
      tables: tables.map((table) => Object.values(table)[0]),
    });
  } catch (error) {
    console.error("Error connecting to database:", error);
    res.status(500).json({
      success: false,
      message: "Error connecting to database",
      error: error.message,
    });
  }
});

// Simple endpoint to create a request
app.post("/api/create-request", async (req, res) => {
  console.log("Received request:", req.body);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });

    console.log("Database connection obtained");

    const {
      id,
      title,
      description,
      category,
      priority,
      status,
      userId,
      quantity,
      fulfillmentDate,
      inventoryItemId,
    } = req.body;

    // Insert the request
    console.log("Inserting request with ID:", id);
    await connection.query(
      `
      INSERT INTO item_requests (
        id,
        title,
        description,
        category_id,
        priority,
        status,
        user_id,
        quantity,
        fulfillment_date,
        inventory_item_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        title,
        description,
        category,
        priority,
        status,
        userId,
        quantity,
        fulfillmentDate ? new Date(fulfillmentDate) : null,
        inventoryItemId || null,
      ]
    );

    console.log("Request inserted successfully");

    // Get the created request
    console.log("Retrieving created request");
    const [createdRequest] = await connection.query(
      `
      SELECT
        ir.id,
        ir.title,
        ir.description,
        c.id as category,
        c.name as categoryName,
        ir.priority,
        ir.status,
        ir.user_id as userId,
        ir.created_at as createdAt,
        ir.updated_at as updatedAt,
        ir.quantity,
        ir.fulfillment_date as fulfillmentDate,
        ir.inventory_item_id as inventoryItemId
      FROM item_requests ir
      JOIN categories c ON ir.category_id = c.id
      WHERE ir.id = ?
      `,
      [id]
    );

    // Close the connection
    await connection.end();

    if (createdRequest.length === 0) {
      console.log("Created request not found in database");
      return res.json({
        success: false,
        message: "Request created but could not be retrieved",
        fallback: {
          id,
          title,
          description,
          category,
          priority,
          status,
          userId,
          quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    console.log("Created request retrieved:", createdRequest[0]);
    return res.json({
      success: true,
      request: createdRequest[0],
    });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({
      success: false,
      message: "Error creating request",
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(
    `Visit http://localhost:${PORT}/api/test-connection to test the database connection`
  );
});
