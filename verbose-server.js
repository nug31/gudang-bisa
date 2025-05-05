import express from "express";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
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
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
    res.json({ success: true, message: "Database connected successfully" });
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
        department,
        avatar_url as avatarUrl,
        created_at as createdAt
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

// Direct database access endpoint
app.post("/db/requests", async (req, res) => {
  const { action, id, request, comment } = req.body;
  console.log("Request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        // Get all requests
        console.log("Getting all requests");
        const [requests] = await connection.query(`
          SELECT
            ir.id,
            ir.title,
            ir.description,
            c.id as category,
            ir.priority,
            ir.status,
            ir.user_id as userId,
            ir.created_at as createdAt,
            ir.updated_at as updatedAt,
            ir.approved_at as approvedAt,
            ir.approved_by as approvedBy,
            ir.rejected_at as rejectedAt,
            ir.rejected_by as rejectedBy,
            ir.rejection_reason as rejectionReason,
            ir.fulfillment_date as fulfillmentDate,
            ir.quantity
          FROM item_requests ir
          JOIN categories c ON ir.category_id = c.id
        `);
        console.log(`Found ${requests.length} requests`);

        // Get comments for each request
        for (const request of requests) {
          const [comments] = await connection.query(
            `
            SELECT
              id,
              request_id as requestId,
              user_id as userId,
              content,
              created_at as createdAt
            FROM comments
            WHERE request_id = ?
          `,
            [request.id]
          );

          request.comments = comments;
        }

        connection.release();
        res.json(requests);
        break;

      // Add other cases here...

      default:
        connection.release();
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Handle inventory requests
app.post("/db/inventory", async (req, res) => {
  const { action, categoryId } = req.body;
  console.log("Inventory request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        console.log("Getting all inventory items");
        const [items] = await connection.query(`
          SELECT
            i.id,
            i.name,
            i.description,
            i.category_id as categoryId,
            c.name as categoryName,
            i.sku,
            i.quantity_available as quantityAvailable,
            i.quantity_reserved as quantityReserved,
            i.unit_price as unitPrice,
            i.location,
            i.image_url as imageUrl,
            i.created_at as createdAt
          FROM inventory_items i
          JOIN categories c ON i.category_id = c.id
        `);
        console.log(`Found ${items.length} inventory items`);

        connection.release();
        res.json(items);
        break;

      // Add other cases here...

      default:
        connection.release();
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Handle users requests
app.post("/db/users", async (req, res) => {
  const { action } = req.body;
  console.log("Users request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        // Get all users
        console.log("Getting all users");
        const [users] = await connection.query(`
          SELECT
            id,
            name,
            email,
            role,
            department,
            avatar_url as avatarUrl,
            created_at as createdAt
          FROM users
          ORDER BY name
        `);
        console.log(`Found ${users.length} users`);

        connection.release();
        res.json(users);
        break;

      // Add other cases here...

      default:
        connection.release();
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Handle categories requests
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
            description,
            created_at as createdAt
          FROM categories
          ORDER BY name
        `);
        console.log(`Found ${categories.length} categories`);

        // Log each category
        categories.forEach((category) => {
          console.log(
            `- ${category.name} (${category.id}): ${category.description}`
          );
        });

        connection.release();
        res.json(categories);
        break;

      case "create":
        const { name, description } = req.body;
        console.log(`Creating new category: ${name}, ${description}`);

        if (!name) {
          connection.release();
          return res.status(400).json({ message: "Category name is required" });
        }

        const categoryId = uuidv4();

        await connection.query(
          `INSERT INTO categories (id, name, description) VALUES (?, ?, ?)`,
          [categoryId, name, description]
        );

        console.log(`Created new category with ID: ${categoryId}`);

        const [newCategory] = await connection.query(
          `SELECT
            id,
            name,
            description,
            created_at as createdAt
          FROM categories
          WHERE id = ?`,
          [categoryId]
        );

        connection.release();
        res.json(newCategory[0]);
        break;

      case "update":
        const { id, categoryData } = req.body;
        console.log(`Updating category: ${id}`, categoryData);

        if (!id || !categoryData) {
          connection.release();
          return res
            .status(400)
            .json({ message: "Category ID and data are required" });
        }

        await connection.query(
          `UPDATE categories
           SET name = ?, description = ?
           WHERE id = ?`,
          [categoryData.name, categoryData.description, id]
        );

        console.log(`Updated category with ID: ${id}`);

        const [updatedCategory] = await connection.query(
          `SELECT
            id,
            name,
            description,
            created_at as createdAt
          FROM categories
          WHERE id = ?`,
          [id]
        );

        connection.release();

        if (updatedCategory.length === 0) {
          return res.status(404).json({ message: "Category not found" });
        }

        res.json(updatedCategory[0]);
        break;

      case "delete":
        const { id: deleteId } = req.body;
        console.log(`Deleting category: ${deleteId}`);

        if (!deleteId) {
          connection.release();
          return res.status(400).json({ message: "Category ID is required" });
        }

        // Check if the category is being used by any requests
        const [referencedRequests] = await connection.query(
          `SELECT COUNT(*) as count FROM item_requests WHERE category_id = ?`,
          [deleteId]
        );

        if (referencedRequests[0].count > 0) {
          connection.release();
          return res.status(400).json({
            message: "Cannot delete category that is being used by requests",
          });
        }

        // Delete the category
        await connection.query("DELETE FROM categories WHERE id = ?", [
          deleteId,
        ]);

        console.log(`Deleted category with ID: ${deleteId}`);

        connection.release();
        res.json({ message: "Category deleted successfully" });
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
  console.log(`Verbose server running on port ${PORT}`);
  console.log(
    `Visit http://localhost:${PORT}/api/test-connection to test the database connection`
  );
});

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default app;
