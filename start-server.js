import express from "express";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

// Load environment variables
config();

const app = express();
const PORT = 3002; // Use a different port

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create database connection pool
console.log("Creating database connection pool with the following settings:");
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);

let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log("Database pool created successfully");
} catch (error) {
  console.error("Error creating database pool:", error);
  process.exit(1);
}

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  try {
    console.log("Testing database connection...");

    const connection = await pool.getConnection();
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

    connection.release();

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

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", { email });

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const connection = await pool.getConnection();

    // Find user by email
    const [users] = await connection.query(
      `SELECT
        id,
        name,
        email,
        role,
        department
      FROM users
      WHERE email = ?`,
      [email]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    // For demo purposes, accept 'password' as the password for all users
    if (password !== "password") {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      user: user,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Direct database access endpoint for requests
app.post("/db/requests", async (req, res) => {
  const { action, id, request } = req.body;
  console.log("Request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        console.log("Getting all requests");
        const [requests] = await connection.query(`
          SELECT
            r.id,
            r.project_name as title,
            r.reason as description,
            i.category as category,
            r.priority,
            r.status,
            r.requester_id as userId,
            r.created_at as createdAt,
            r.updated_at as updatedAt,
            ri.quantity
          FROM requests r
          LEFT JOIN request_items ri ON r.id = ri.request_id
          LEFT JOIN items i ON ri.item_id = i.id
          GROUP BY r.id
        `);
        console.log(`Found ${requests.length} requests`);

        connection.release();
        res.json(requests);
        break;

      default:
        connection.release();
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Direct database access endpoint for categories
app.post("/db/categories", async (req, res) => {
  const { action } = req.body;
  console.log("Categories request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        console.log("Getting all categories");
        const [categories] = await connection.query(`
          SELECT
            id,
            name,
            description
          FROM items
          GROUP BY name
        `);
        console.log(`Found ${categories.length} categories`);

        // Log each category
        categories.forEach((category) => {
          console.log(`- ${category.name}: ${category.description}`);
        });

        connection.release();
        res.json(categories);
        break;

      default:
        connection.release();
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Direct database access endpoint for inventory
app.post("/db/inventory", async (req, res) => {
  const { action } = req.body;
  console.log("Inventory request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        console.log("Getting all inventory items");
        const [items] = await connection.query(`
          SELECT
            id,
            name,
            description,
            category as categoryId,
            quantity as quantityAvailable,
            (max_quantity - quantity) as quantityReserved,
            location,
            created_at as createdAt,
            updated_at as updatedAt
          FROM items
        `);
        console.log(`Found ${items.length} inventory items`);

        connection.release();
        res.json(items);
        break;

      default:
        connection.release();
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Visit http://localhost:${PORT}/api/test-connection to test the database connection`
  );
});

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Keep the script running
process.stdin.resume();
