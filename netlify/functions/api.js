// Netlify serverless function for API
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper function to execute SQL queries
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// JWT secret for token generation
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Handler for authentication routes
async function handleAuth(event) {
  const { path, httpMethod, body } = event;
  const data = JSON.parse(body);

  // Login route
  if (path === "/api/auth/login") {
    const { email, password } = data;

    try {
      // Find user by email
      const userResult = await query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (userResult.rows.length === 0) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: "Invalid email or password" }),
        };
      }

      const user = userResult.rows[0];

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return {
          statusCode: 401,
          body: JSON.stringify({ message: "Invalid email or password" }),
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Return user data and token
      return {
        statusCode: 200,
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          token,
        }),
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server error" }),
      };
    }
  }

  // Register route
  if (path === "/api/auth/register") {
    const { name, email, password, role = "user", department } = data;

    try {
      // Check if user already exists
      const existingUser = await query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      if (existingUser.rows.length > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "User already exists" }),
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = await query(
        "INSERT INTO users (name, email, password, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, department",
        [name, email, hashedPassword, role, department]
      );

      const user = newUser.rows[0];

      return {
        statusCode: 201,
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        }),
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server error" }),
      };
    }
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ message: "Not found" }),
  };
}

// Handler for inventory routes
async function handleInventory(event) {
  const { path, httpMethod, body } = event;
  const data = JSON.parse(body);
  const { action } = data;

  // Get all inventory items
  if (action === "getAll") {
    try {
      const result = await query("SELECT * FROM inventory_items ORDER BY name");
      return {
        statusCode: 200,
        body: JSON.stringify(result.rows),
      };
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server error" }),
      };
    }
  }

  // Get inventory item by ID
  if (action === "getById") {
    const { id } = data;
    try {
      const result = await query(
        "SELECT * FROM inventory_items WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Item not found" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(result.rows[0]),
      };
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Server error" }),
      };
    }
  }

  // Add more inventory handlers as needed

  return {
    statusCode: 400,
    body: JSON.stringify({ message: "Invalid action" }),
  };
}

// Main handler function
exports.handler = async function (event, context) {
  const { path } = event;

  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle OPTIONS requests (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
    };
  }

  try {
    let response;

    // Route to appropriate handler based on path
    if (path.startsWith("/api/auth")) {
      response = await handleAuth(event);
    } else if (path.startsWith("/api/inventory")) {
      response = await handleInventory(event);
    } else {
      response = {
        statusCode: 404,
        body: JSON.stringify({ message: "Not found" }),
      };
    }

    // Add CORS headers to response
    return {
      ...response,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Server error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error" }),
    };
  }
};
