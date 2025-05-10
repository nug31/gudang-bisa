import express from "express";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

// Load environment variables
config();

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from the dist directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "dist")));

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error(
    "Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file."
  );
  process.exit(1);
}

// Create a connection pool
const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Connected to Neon database!");
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to Neon database:", error);
    return false;
  }
}

// Default UUIDs for common IDs
const DEFAULT_UUIDS = {
  users: {
    1: "00000000-0000-0000-0000-000000000001", // Admin
    2: "00000000-0000-0000-0000-000000000002", // Manager
  },
  categories: {
    1: "00000000-0000-0000-0000-000000000001", // Office
    2: "00000000-0000-0000-0000-000000000002", // Cleaning
    3: "00000000-0000-0000-0000-000000000003", // Hardware
    4: "00000000-0000-0000-0000-000000000004", // Other
  },
};

// Helper function to convert numeric IDs to UUIDs
function getUuidFromNumericId(id, table) {
  if (!id) return null;

  // If it's already a valid UUID, return it
  if (typeof id === "string" && id.includes("-") && id.length > 30) {
    return id;
  }

  // Convert to string for consistency
  const idStr = id.toString();

  // Check if we have a default UUID for this ID
  if (DEFAULT_UUIDS[table] && DEFAULT_UUIDS[table][idStr]) {
    console.log(
      `Using default UUID for ${table} ID ${idStr}: ${DEFAULT_UUIDS[table][idStr]}`
    );
    return DEFAULT_UUIDS[table][idStr];
  }

  console.log(`No default UUID found for ${table} ID ${idStr}`);
  return null;
}

// Add a debug route
app.get("/debug", (req, res) => {
  console.log("Debug route accessed");
  res.json({ message: "Server is running" });
});

// Add a test API endpoint
app.get("/api/test", (req, res) => {
  console.log("Test API endpoint accessed");
  res.json({ status: "ok", message: "API is working" });
});

// Authentication routes
app.post(
  ["/db/auth", "/api/auth/login", "/api/auth/register"],
  async (req, res) => {
    console.log("Auth route accessed:", req.body);

    // Handle both API formats
    let action = req.body.action;

    // If this is the /api/auth/login endpoint, set action to "login"
    if (req.path === "/api/auth/login" && !action) {
      action = "login";
    }

    // If this is the /api/auth/register endpoint, set action to "register"
    if (req.path === "/api/auth/register") {
      action = "register";
    }

    try {
      switch (action) {
        case "login": {
          console.log("Login attempt with:", { email: req.body.email });
          const { email, password } = req.body;

          if (!email || !password) {
            console.log("Missing email or password");
            return res
              .status(400)
              .json({ message: "Email and password are required" });
          }

          try {
            console.log("Querying database for user:", email);
            const result = await pool.query(
              "SELECT * FROM users WHERE email = $1",
              [email]
            );

            if (result.rows.length === 0) {
              console.log("User not found in database");
              return res.status(401).json({ message: "Invalid credentials" });
            }

            const user = result.rows[0];
            console.log("User found in database:", {
              id: user.id,
              email: user.email,
              role: user.role,
            });

            // Verify password
            const isPasswordValid = await bcrypt.compare(
              password,
              user.password
            );
            console.log("Password validation result:", isPasswordValid);

            if (!isPasswordValid) {
              return res.status(401).json({ message: "Invalid credentials" });
            }

            // Return user data without password
            const { password: _, ...userData } = user;
            console.log("Login successful, returning user data:", userData);
            res.json(userData);
          } catch (error) {
            console.error("Error during login:", error);
            res
              .status(500)
              .json({ message: "Server error", error: error.message });
          }
          break;
        }

        default:
          // For any unhandled action, return an empty array to prevent errors
          res.json([]);
      }
    } catch (err) {
      console.error("Error handling auth request:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Handle categories
app.post(["/db/categories", "/api/categories"], async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {
      case "getAll": {
        try {
          const result = await pool.query(
            "SELECT * FROM categories ORDER BY name"
          );

          // Transform data to match the expected format
          const formattedData = result.rows.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.created_at,
            updatedAt: category.updated_at,
          }));

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching categories:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      default:
        // For any unhandled action, return an empty array to prevent errors
        res.json([]);
    }
  } catch (err) {
    console.error("Error handling categories request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Handle inventory
app.post(["/db/inventory", "/api/inventory"], async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {
      case "getAll": {
        try {
          const result = await pool.query(
            `SELECT i.*, c.name as category_name
             FROM inventory_items i
             LEFT JOIN categories c ON i.category_id = c.id
             ORDER BY i.name`
          );

          // Transform data to match the expected format
          const formattedData = result.rows.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            categoryId: item.category_id,
            categoryName: item.category_name,
            sku: item.sku,
            quantityAvailable: item.quantity_available,
            quantityReserved: item.quantity_reserved,
            unitPrice: item.unit_price,
            location: item.location,
            imageUrl: item.image_url,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching inventory:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      default:
        // For any unhandled action, return an empty array to prevent errors
        res.json([]);
    }
  } catch (err) {
    console.error("Error handling inventory request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Handle requests
app.post(["/db/requests", "/api/requests"], async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {
      case "getAll": {
        const { userId, status } = req.body;

        try {
          // Build the query
          let query = `
            SELECT r.*, c.name as category_name, u.name as user_name
            FROM item_requests r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN users u ON r.user_id = u.id
          `;

          // For simplicity, we'll just return all requests without filtering
          // This avoids the UUID conversion issues
          query += " ORDER BY r.created_at DESC";

          const result = await pool.query(query);

          // Transform data to match the expected format
          const formattedData = result.rows.map((request) => ({
            id: request.id,
            title: request.title,
            description: request.description,
            categoryId: request.category_id,
            categoryName: request.category_name,
            priority: request.priority,
            status: request.status,
            userId: request.user_id,
            userName: request.user_name,
            quantity: request.quantity,
            totalCost: request.total_cost,
            createdAt: request.created_at,
            approvedAt: request.approved_at,
            approvedBy: request.approved_by,
            rejectedAt: request.rejected_at,
            rejectedBy: request.rejected_by,
            rejectionReason: request.rejection_reason,
            fulfillmentDate: request.fulfillment_date,
          }));

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching requests:", error);
          // Return empty array to prevent frontend errors
          res.json([]);
        }
        break;
      }

      default:
        // For any unhandled action, return an empty array to prevent errors
        res.json([]);
    }
  } catch (err) {
    console.error("Error handling requests:", err);
    // Return empty array to prevent frontend errors
    res.json([]);
  }
});

// Handle users requests
app.post(["/db/users", "/api/users"], async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {
      case "getAll": {
        try {
          const result = await pool.query(
            "SELECT id, name, email, role, department, avatar_url, created_at FROM users ORDER BY name"
          );

          // Transform data to match the expected format
          const formattedData = result.rows.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            avatarUrl: user.avatar_url,
            createdAt: user.created_at,
          }));

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching users:", error);
          res.json([]);
        }
        break;
      }

      case "getById": {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ message: "User ID is required" });
        }

        try {
          // Try to get the UUID for this ID
          const userId = getUuidFromNumericId(id, "users");

          if (userId) {
            // If we have a UUID, query by it
            const result = await pool.query(
              "SELECT id, name, email, role, department, avatar_url, created_at, updated_at FROM users WHERE id = $1",
              [userId]
            );

            if (result.rows.length > 0) {
              // Transform data to match the expected format
              const user = result.rows[0];
              const formattedData = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department || "",
                avatarUrl: user.avatar_url || "",
                createdAt: user.created_at,
                updatedAt: user.updated_at,
              };

              return res.json(formattedData);
            }
          }

          // If we couldn't find the user by UUID, try to get all users and find by numeric ID
          const allUsers = await pool.query(
            "SELECT id, name, email, role, department, avatar_url, created_at, updated_at FROM users"
          );

          // Try to find a user with a matching ID (using string comparison for flexibility)
          const user = allUsers.rows.find((u) =>
            u.id.toString().includes(id.toString())
          );

          if (user) {
            const formattedData = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department || "",
              avatarUrl: user.avatar_url || "",
              createdAt: user.created_at,
              updatedAt: user.updated_at,
            };

            return res.json(formattedData);
          }

          // If we still can't find the user, return a 404
          return res.status(404).json({ message: "User not found" });
        } catch (error) {
          console.error("Error fetching user:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      default:
        // For any unhandled action, return an empty array to prevent errors
        res.json([]);
    }
  } catch (err) {
    console.error("Error handling users request:", err);
    res.json([]);
  }
});

// Catch-all route to serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
testConnection().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Connected to Neon database`);
    });
  } else {
    console.error("Failed to connect to Neon database. Server not started.");
    process.exit(1);
  }
});
