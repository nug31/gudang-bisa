const { pool } = require("./neon-client");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    // Parse request body
    const data = JSON.parse(event.body);

    // Get the path to determine the action
    const path = event.path;
    let action = data.action;

    // If this is the login endpoint, set action to "login"
    if (path.includes("/login") && !action) {
      action = "login";
    }

    // If this is the register endpoint, set action to "register"
    if (path.includes("/register") && !action) {
      action = "register";
    }

    switch (action) {
      case "verify": {
        const { userId } = data;

        if (!userId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "User ID is required" }),
          };
        }

        // Get user by ID
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [
          userId,
        ]);

        if (result.rows.length === 0) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ message: "Invalid session" }),
          };
        }

        // Return success
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: "Session valid" }),
        };
      }

      case "login": {
        const { email, password } = data;

        if (!email || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              message: "Email and password are required",
            }),
          };
        }

        // Get user by email
        const result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        if (result.rows.length === 0) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ message: "Invalid credentials" }),
          };
        }

        const user = result.rows[0];

        // For development purposes, accept any password for admin@gudangmitra.com
        let isPasswordValid = false;

        if (user.email === "admin@gudangmitra.com") {
          isPasswordValid = true;
        } else if (user.password) {
          // If the user has a password, verify it with bcrypt
          isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
          // For backward compatibility, accept 'admin123' as the password for all users
          isPasswordValid = password === "admin123";
        }

        if (!isPasswordValid) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ message: "Invalid credentials" }),
          };
        }

        // Return user data without password
        const userData = { ...user };
        delete userData.password;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(userData),
        };
      }

      case "register": {
        const { name, email, password, role = "user", department } = data;

        if (!name || !email || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              message: "Name, email, and password are required",
            }),
          };
        }

        // Check if user already exists
        const existingUser = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        if (existingUser.rows.length > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "User already exists" }),
          };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Insert new user
        const result = await pool.query(
          "INSERT INTO users (id, name, email, password, role, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [userId, name, email, hashedPassword, role, department || null]
        );

        if (result.rows.length === 0) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Failed to create user" }),
          };
        }

        // Return user data without password
        const userData = { ...result.rows[0] };
        delete userData.password;

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(userData),
        };
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid action" }),
        };
    }
  } catch (error) {
    console.error("Error handling auth request:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
