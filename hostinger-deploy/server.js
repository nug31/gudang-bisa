import express from "express";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyParser.json());

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  try {
    console.log("Testing database connection with settings:", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const connection = await pool.getConnection();
    console.log("Database connected successfully");

    // Test a simple query
    try {
      const [result] = await connection.query("SELECT 1 as test");
      console.log("Test query result:", result);
    } catch (queryError) {
      console.error("Error executing test query:", queryError);
    }

    connection.release();
    res.json({ success: true, message: "Database connected successfully" });
  } catch (error) {
    console.error("Error connecting to database:", error);
    res.status(500).json({
      success: false,
      message: "Error connecting to database",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Registration endpoint
app.post("/api/register", async (req, res) => {
  const { name, email, password, role, department } = req.body;
  console.log("Registration attempt:", { name, email, role, department });

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Name, email, password, and role are required" });
  }

  try {
    const connection = await pool.getConnection();

    // Check if email already exists
    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a new UUID for the user
    const userId = uuidv4();

    // Insert the new user
    await connection.query(
      `INSERT INTO users (
        id,
        name,
        email,
        password,
        role,
        department,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, name, email, hashedPassword, role, department || null]
    );

    // Get the newly created user (without password)
    const [newUser] = await connection.query(
      `SELECT
        id,
        name,
        email,
        role,
        department,
        avatar_url as avatarUrl,
        created_at as createdAt
      FROM users
      WHERE id = ?`,
      [userId]
    );

    connection.release();

    res.status(201).json({
      user: newUser[0],
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", {
    email,
    password: password ? "********" : undefined,
  });

  if (!email || !password) {
    console.log("Missing email or password");
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const connection = await pool.getConnection();

    // Find user by email
    console.log(`Searching for user with email: ${email}`);
    const [users] = await connection.query(
      `SELECT
        id,
        name,
        email,
        password,
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
      console.log(`No user found with email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = users[0];
    const storedPassword = user.password;
    console.log(`User found: ${user.name} (${user.email}), Role: ${user.role}`);
    console.log(
      `Stored password type: ${typeof storedPassword}, Starts with $: ${
        storedPassword && storedPassword.startsWith("$")
      }`
    );

    // Remove password from user object before sending to client
    delete user.password;

    // Check if the password is correct
    // For backward compatibility, still accept 'password' as the password for all users
    let isPasswordValid = password === "password";
    console.log(`Password matches 'password': ${isPasswordValid}`);

    // If the user has a hashed password, verify it
    if (storedPassword && storedPassword.startsWith("$")) {
      const bcryptResult = await bcrypt.compare(password, storedPassword);
      console.log(`bcrypt comparison result: ${bcryptResult}`);
      isPasswordValid = isPasswordValid || bcryptResult;
    }

    console.log(`Final password validation result: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log("Password validation failed");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log(`Login successful for user: ${user.email}`);
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
  console.log(
    "Request body for /db/requests:",
    JSON.stringify(req.body, null, 2)
  );

  try {
    console.log("Getting database connection");
    const connection = await pool.getConnection();
    console.log("Database connection obtained");

    switch (action) {
      case "getAll":
        // Get all requests
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

      // Add other cases from the original server.js file
      // ...

      default:
        connection.release();
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    console.error("Request body:", req.body);

    // Provide more detailed error message
    let errorMessage = "Error executing database operation";
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      errorMessage =
        "Invalid reference: The category, user, or other referenced ID does not exist";
    } else if (error.code === "ER_BAD_NULL_ERROR") {
      errorMessage =
        "Required field missing: A required field was not provided";
    } else if (error.code === "ER_DUP_ENTRY") {
      errorMessage = "Duplicate entry: An item with this ID already exists";
    }

    res.status(500).json({
      message: errorMessage,
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    });
  }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database host: ${process.env.DB_HOST}`);
  console.log(`Database name: ${process.env.DB_NAME}`);
  console.log(`Database user: ${process.env.DB_USER}`);
});

export default app;
