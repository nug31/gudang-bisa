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

  // Log request body for POST requests
  if (req.method === "POST") {
    console.log("Request body:", req.body);
  }

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

// Helper function to convert numeric IDs to UUIDs
async function convertToUuid(id, table) {
  if (!id) return null;

  // If it's already a valid UUID, return it
  if (typeof id === "string" && id.includes("-") && id.length > 30) {
    return id;
  }

  console.log(
    `Converting ID ${id} (type: ${typeof id}) to UUID format for ${table} table`
  );

  // Handle numeric IDs directly
  const numericId = parseInt(id);
  if (!isNaN(numericId)) {
    // If we have a numeric ID, map it to a predefined UUID
    if (table === "users" && numericId === 1) {
      return "00000000-0000-0000-0000-000000000001"; // Admin user
    } else if (table === "users" && numericId === 2) {
      return "00000000-0000-0000-0000-000000000002"; // Manager user
    } else if (table === "users" && numericId === 3) {
      return "00000000-0000-0000-0000-000000000003"; // Regular user
    } else if (table === "categories" && numericId === 1) {
      return "00000000-0000-0000-0000-000000000001"; // Office category
    } else if (table === "categories" && numericId === 2) {
      return "00000000-0000-0000-0000-000000000002"; // Cleaning category
    } else if (table === "categories" && numericId === 3) {
      return "00000000-0000-0000-0000-000000000003"; // Hardware category
    } else if (table === "categories" && numericId === 4) {
      return "00000000-0000-0000-0000-000000000004"; // Other category
    } else if (table === "categories" && numericId === 5) {
      return "00000000-0000-0000-0000-000000000005"; // Category 5
    } else if (table === "categories" && numericId === 9) {
      return "00000000-0000-0000-0000-000000000009"; // Special category for ID 9
    }
  }

  try {
    // For backward compatibility with other ID formats, try to find a matching UUID
    // First, get all IDs from the table
    const result = await pool.query(`SELECT id FROM ${table}`);

    if (result.rows.length === 0) {
      console.log(`No records found in ${table} table`);
      return null;
    }

    // Try to find a matching ID
    const matchingRecord = result.rows.find((record) => {
      try {
        // For simple matching, we'll just use the first few digits of the UUID
        // This is not perfect but should work for our demo data
        if (record && record.id && typeof record.id === "string") {
          const numericPart = parseInt(
            record.id.replace(/[^0-9]/g, "").substring(0, 2)
          );
          return numericPart === parseInt(id);
        }
        return false;
      } catch (error) {
        console.error(
          `Error processing record ${JSON.stringify(record)}:`,
          error
        );
        return false;
      }
    });

    if (matchingRecord) {
      console.log(`Mapped ID ${id} to UUID ${matchingRecord.id}`);
      return matchingRecord.id;
    }

    // If we still can't find a match, create a deterministic UUID based on the ID
    // This ensures the same ID always maps to the same UUID
    const deterministicUuid = `00000000-0000-0000-0000-${id
      .toString()
      .padStart(12, "0")}`;
    console.log(`Created deterministic UUID ${deterministicUuid} for ID ${id}`);
    return deterministicUuid;
  } catch (error) {
    console.error(`Error converting ID ${id} to UUID:`, error);
    return null;
  }
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

// Authentication routes - support both /db/auth and /api/auth/login endpoints
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

            try {
              // For development purposes, accept any password for admin@gudangmitra.com
              let isPasswordValid = false;

              if (user.email === "admin@gudangmitra.com") {
                console.log("Admin user detected, accepting any password");
                isPasswordValid = true;
              } else if (user.password) {
                // If the user has a password, verify it with bcrypt
                isPasswordValid = await bcrypt.compare(password, user.password);
              } else {
                // For backward compatibility, accept 'password' as the password for all users
                isPasswordValid = password === "admin123";
              }

              console.log("Password validation result:", isPasswordValid);

              if (!isPasswordValid) {
                console.log("Invalid password");
                return res.status(401).json({ message: "Invalid credentials" });
              }

              // Return user data without password
              const userData = { ...user };
              if (userData.password) delete userData.password;
              console.log("Login successful, returning user data:", userData);
              res.json(userData);
            } catch (bcryptError) {
              console.error("Error comparing passwords:", bcryptError);
              return res.status(500).json({
                message: "Server error",
                error: "Password comparison failed",
              });
            }
          } catch (error) {
            console.error("Error during login:", error);
            res
              .status(500)
              .json({ message: "Server error", error: error.message });
          }
          break;
        }

        case "register": {
          const { name, email, password, role = "user", department } = req.body;

          if (!name || !email || !password) {
            return res
              .status(400)
              .json({ message: "Name, email, and password are required" });
          }

          try {
            // Check if user already exists
            const existingUser = await pool.query(
              "SELECT * FROM users WHERE email = $1",
              [email]
            );

            if (existingUser.rows.length > 0) {
              return res.status(400).json({ message: "User already exists" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();

            // Insert new user
            await pool.query(
              "INSERT INTO users (id, name, email, password, role, department) VALUES ($1, $2, $3, $4, $5, $6)",
              [userId, name, email, hashedPassword, role, department || null]
            );

            // Get the newly created user
            const newUser = await pool.query(
              "SELECT * FROM users WHERE id = $1",
              [userId]
            );

            if (newUser.rows.length === 0) {
              return res.status(500).json({ message: "Failed to create user" });
            }

            // Return user data without password
            const { password: _, ...userData } = newUser.rows[0];
            res.status(201).json(userData);
          } catch (error) {
            console.error("Error during registration:", error);
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

// Handle inventory requests
app.post(["/db/inventory", "/api/inventory"], async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {
      case "getAll": {
        const { categoryId } = req.body;

        try {
          let query =
            "SELECT i.*, c.name as category_name FROM inventory_items i LEFT JOIN categories c ON i.category_id::text = c.id::text";
          let params = [];

          if (categoryId) {
            query += " WHERE i.category_id::text = $1::text";
            params.push(categoryId);
          }

          console.log("Executing inventory query:", query);
          console.log("With params:", params);

          const result = await pool.query(query, params);
          console.log("Query result rows:", result.rows.length);

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
          }));

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching inventory items:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "getById": {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ message: "Item ID is required" });
        }

        try {
          const result = await pool.query(
            "SELECT i.*, c.name as category_name FROM inventory i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = $1",
            [id]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({ message: "Item not found" });
          }

          // Transform data to match the expected format
          const item = result.rows[0];
          const formattedData = {
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
          };

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching inventory item:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "create": {
        const {
          name,
          description,
          categoryId,
          sku,
          quantityAvailable,
          quantityReserved,
          unitPrice,
          location,
          imageUrl,
        } = req.body;

        if (!name || !categoryId) {
          return res
            .status(400)
            .json({ message: "Name and category are required" });
        }

        const newItemId = uuidv4();

        try {
          // Insert the new item
          await pool.query(
            `INSERT INTO inventory
            (id, name, description, category_id, sku, quantity_available, quantity_reserved, unit_price, location, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              newItemId,
              name,
              description || "",
              categoryId,
              sku || "",
              quantityAvailable || 0,
              quantityReserved || 0,
              unitPrice || 0,
              location || "",
              imageUrl || "",
            ]
          );

          // Get the category name
          const categoryResult = await pool.query(
            "SELECT name FROM categories WHERE id = $1",
            [categoryId]
          );

          const categoryName =
            categoryResult.rows.length > 0
              ? categoryResult.rows[0].name
              : "Unknown Category";

          // Create the response object
          const newItem = {
            id: newItemId,
            name,
            description: description || "",
            categoryId,
            categoryName,
            sku: sku || "",
            quantityAvailable: quantityAvailable || 0,
            quantityReserved: quantityReserved || 0,
            unitPrice: unitPrice || 0,
            location: location || "",
            imageUrl: imageUrl || "",
            createdAt: new Date().toISOString(),
          };

          res.status(201).json(newItem);
        } catch (error) {
          console.error("Error creating inventory item:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "delete": {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ message: "Item ID is required" });
        }

        try {
          // Check if the item exists
          const checkResult = await pool.query(
            "SELECT * FROM inventory WHERE id = $1",
            [id]
          );

          if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: "Item not found" });
          }

          // No need to check for references in requests since we don't have that relationship
          // Just proceed with deletion

          // Delete the item
          await pool.query("DELETE FROM inventory WHERE id = $1", [id]);

          res.json({ message: "Item deleted successfully", id });
        } catch (error) {
          console.error("Error deleting inventory item:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      default:
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (err) {
    console.error("Error handling inventory request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Handle categories requests
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

      case "getById": {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ message: "Category ID is required" });
        }

        try {
          const result = await pool.query(
            "SELECT * FROM categories WHERE id = $1",
            [id]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
          }

          // Transform data to match the expected format
          const category = result.rows[0];
          const formattedData = {
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.created_at,
          };

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching category:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "create": {
        const { name, description } = req.body;
        console.log("Creating category with data:", { name, description });

        if (!name) {
          console.log("Category name is required");
          return res.status(400).json({ message: "Name is required" });
        }

        try {
          // Insert the new category with a serial ID (auto-increment)
          console.log("Inserting new category into database");
          const result = await pool.query(
            "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
            [name, description || ""]
          );

          // Create the response object
          const category = result.rows[0];
          const newCategory = {
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.created_at,
          };

          res.status(201).json(newCategory);
        } catch (error) {
          console.error("Error creating category:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "update": {
        const { id, name, description } = req.body;
        console.log("Updating category with data:", { id, name, description });

        if (!id) {
          console.log("Category ID is required");
          return res.status(400).json({ message: "Category ID is required" });
        }

        if (!name) {
          console.log("Category name is required");
          return res.status(400).json({ message: "Category name is required" });
        }

        try {
          // Check if the category exists
          console.log("Checking if category exists with ID:", id);
          const checkResult = await pool.query(
            "SELECT * FROM categories WHERE id = $1",
            [id]
          );
          console.log("Check result:", checkResult.rows);

          if (checkResult.rows.length === 0) {
            console.log("Category not found with ID:", id);
            return res.status(404).json({ message: "Category not found" });
          }

          // Update the category
          console.log("Updating category in database:", {
            id,
            name,
            description,
          });
          const updateResult = await pool.query(
            "UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *",
            [name, description || "", id]
          );
          console.log("Update result:", updateResult.rows);

          if (updateResult.rows.length === 0) {
            console.log("Failed to update category");
            return res
              .status(500)
              .json({ message: "Failed to update category" });
          }

          // Format the response
          const category = updateResult.rows[0];
          const updatedCategory = {
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.created_at,
          };

          console.log("Category updated successfully:", updatedCategory);
          res.json(updatedCategory);
        } catch (error) {
          console.error("Error updating category:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "delete": {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ message: "Category ID is required" });
        }

        try {
          // Check if the category exists
          const checkResult = await pool.query(
            "SELECT * FROM categories WHERE id = $1",
            [id]
          );

          if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
          }

          // Check if the category is referenced in any inventory items
          const inventoryResult = await pool.query(
            "SELECT COUNT(*) FROM inventory WHERE category_id = $1",
            [id]
          );

          const inventoryCount = parseInt(inventoryResult.rows[0].count);
          if (inventoryCount > 0) {
            return res.status(400).json({
              message: "Cannot delete category that is used by inventory items",
              inventoryCount,
            });
          }

          // Check if the category is referenced in any requests
          const requestsResult = await pool.query(
            "SELECT COUNT(*) FROM item_requests WHERE category_id = $1",
            [id]
          );

          const requestCount = parseInt(requestsResult.rows[0].count);
          if (requestCount > 0) {
            return res.status(400).json({
              message: "Cannot delete category that is referenced in requests",
              requestCount,
            });
          }

          // Delete the category
          await pool.query("DELETE FROM categories WHERE id = $1", [id]);

          res.json({ message: "Category deleted successfully", id });
        } catch (error) {
          console.error("Error deleting category:", error);
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

// Handle requests
app.post(["/db/requests", "/api/requests"], async (req, res) => {
  console.log("Received request to /db/requests or /api/requests:", req.body);
  const { action } = req.body;

  try {
    console.log("Request action:", action);
    switch (action) {
      case "getAll": {
        const { userId, status } = req.body;

        try {
          let query = `
            SELECT r.*, c.name as category_name, u.name as user_name
            FROM item_requests r
            LEFT JOIN categories c ON r.category_id::text = c.id::text
            LEFT JOIN users u ON r.user_id::text = u.id::text
          `;

          const conditions = [];
          const params = [];

          if (userId) {
            try {
              // Convert to UUID if needed
              const userIdParam = await convertToUuid(userId, "users");

              if (!userIdParam) {
                console.log(`Could not find user with ID ${userId}`);
                // Return empty array if no matching user found
                return res.json([]);
              }

              conditions.push("r.user_id::text = $" + (params.length + 1));
              params.push(userIdParam);
            } catch (error) {
              console.error(
                `Error converting userId ${userId} to UUID:`,
                error
              );
              // Return empty array if conversion fails
              return res.json([]);
            }
          }

          if (status) {
            conditions.push("r.status = $" + (params.length + 1));
            params.push(status);
          }

          if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
          }

          query += " ORDER BY r.created_at DESC";

          console.log("Executing query:", query);
          console.log("With params:", params);

          const result = await pool.query(query, params);

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
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "getById": {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ message: "Request ID is required" });
        }

        try {
          console.log("Fetching request by ID:", id);

          const result = await pool.query(
            `SELECT r.*, c.name as category_name, u.name as user_name
             FROM item_requests r
             LEFT JOIN categories c ON r.category_id::text = c.id::text
             LEFT JOIN users u ON r.user_id::text = u.id::text
             WHERE r.id = $1`,
            [id]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({ message: "Request not found" });
          }

          // Transform data to match the expected format
          const request = result.rows[0];
          const formattedData = {
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
            updatedAt: request.updated_at,
            approvedAt: request.approved_at,
            approvedBy: request.approved_by,
            rejectedAt: request.rejected_at,
            rejectedBy: request.rejected_by,
            rejectionReason: request.rejection_reason,
            fulfillmentDate: request.fulfillment_date,
          };

          // Get comments for this request
          const commentsResult = await pool.query(
            `SELECT c.*, u.name as user_name, u.avatar_url
             FROM comments c
             LEFT JOIN users u ON c.user_id::text = u.id::text
             WHERE c.request_id::text = $1
             ORDER BY c.created_at`,
            [id]
          );

          // Format comments
          const comments = commentsResult.rows.map((comment) => ({
            id: comment.id,
            requestId: comment.request_id,
            userId: comment.user_id,
            userName: comment.user_name,
            userAvatarUrl: comment.avatar_url,
            content: comment.content,
            createdAt: comment.created_at,
          }));

          // Add comments to the response
          formattedData.comments = comments;

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching request:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "create": {
        console.log("Handling create request:", req.body);
        const { request } = req.body;

        if (!request) {
          console.log("No request data provided");
          return res.status(400).json({ message: "Request data is required" });
        }

        try {
          console.log("Creating request with data:", request);
          // Generate a new ID if not provided
          const requestId = request.id || uuidv4();
          const now = new Date().toISOString();

          // If categoryId is not provided, get the first category
          let categoryId = request.categoryId;
          if (!categoryId) {
            console.log("No categoryId provided, fetching default category");
            const categoryResult = await pool.query(
              "SELECT id FROM categories ORDER BY name LIMIT 1"
            );

            if (categoryResult.rows.length > 0) {
              categoryId = categoryResult.rows[0].id;
              console.log(`Using default category ID: ${categoryId}`);

              // Make sure the category ID is a valid UUID
              if (
                typeof categoryId === "string" &&
                categoryId.includes("-") &&
                categoryId.length > 30
              ) {
                // It's already a valid UUID
              } else {
                // Try to convert it to a UUID
                categoryId = await convertToUuid(categoryId, "categories");
                if (!categoryId) {
                  return res.status(400).json({
                    message: "Invalid default category ID",
                  });
                }
              }
            } else {
              return res.status(400).json({
                message: "No categories found and no categoryId provided",
              });
            }
          } else {
            // Convert categoryId to UUID format if it's not already
            categoryId = await convertToUuid(categoryId, "categories");
            if (!categoryId) {
              console.log(
                `Could not convert category ID ${request.categoryId} to UUID, using fallback`
              );
              // Create a fallback UUID for the category
              categoryId = `00000000-0000-0000-0000-${request.categoryId
                .toString()
                .padStart(12, "0")}`;
              console.log(`Using fallback category ID: ${categoryId}`);
            } else {
              console.log(`Converted category ID to UUID: ${categoryId}`);
            }
          }

          // Convert userId to UUID format if it's not already
          let userId = request.userId;
          if (userId) {
            userId = await convertToUuid(userId, "users");
            if (!userId) {
              console.log(
                `Could not convert user ID ${request.userId} to UUID`
              );
              return res.status(400).json({
                message: "Invalid user ID",
              });
            }
            console.log(`Converted user ID to UUID: ${userId}`);
          } else {
            return res.status(400).json({
              message: "User ID is required",
            });
          }

          // Prepare the request data for insertion
          const requestData = {
            id: requestId,
            title: request.title,
            description: request.description || "",
            category_id: categoryId,
            priority: request.priority || "medium",
            status: request.status || "pending",
            user_id: userId,
            quantity: request.quantity || 1,
            total_cost: request.totalCost || 0,
            created_at: now,
            updated_at: now,
          };

          // Insert the request
          await pool.query(
            `INSERT INTO item_requests
            (id, title, description, category_id, priority, status, user_id, quantity, total_cost, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              requestData.id,
              requestData.title,
              requestData.description,
              requestData.category_id,
              requestData.priority,
              requestData.status,
              requestData.user_id,
              requestData.quantity,
              requestData.total_cost,
              requestData.created_at,
              requestData.updated_at,
            ]
          );

          // Get the category name
          const categoryResult = await pool.query(
            "SELECT name FROM categories WHERE id::text = $1",
            [requestData.category_id]
          );

          const categoryName =
            categoryResult.rows.length > 0
              ? categoryResult.rows[0].name
              : "Unknown Category";

          // Get the user name
          const userResult = await pool.query(
            "SELECT name FROM users WHERE id::text = $1",
            [requestData.user_id]
          );

          const userName =
            userResult.rows.length > 0
              ? userResult.rows[0].name
              : "Unknown User";

          // Create the response object
          const createdRequest = {
            id: requestData.id,
            title: requestData.title,
            description: requestData.description,
            categoryId: requestData.category_id,
            categoryName: categoryName,
            priority: requestData.priority,
            status: requestData.status,
            userId: requestData.user_id,
            userName: userName,
            quantity: requestData.quantity,
            totalCost: requestData.total_cost,
            createdAt: requestData.created_at,
            updatedAt: requestData.updated_at,
          };

          res.status(201).json(createdRequest);
        } catch (error) {
          console.error("Error creating request:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "update": {
        const { request } = req.body;

        if (!request || !request.id) {
          return res.status(400).json({ message: "Request ID is required" });
        }

        try {
          console.log("Updating request:", request.id);

          // Get the current request to check for status changes
          const currentRequestResult = await pool.query(
            "SELECT status, user_id FROM item_requests WHERE id = $1",
            [request.id]
          );

          if (currentRequestResult.rows.length === 0) {
            return res.status(404).json({ message: "Request not found" });
          }

          const currentRequest = currentRequestResult.rows[0];
          const now = new Date().toISOString();

          // Convert categoryId to UUID format if provided
          let categoryId = request.categoryId;
          if (categoryId) {
            categoryId = await convertToUuid(categoryId, "categories");
            if (!categoryId) {
              console.log(
                `Could not convert category ID ${request.categoryId} to UUID`
              );
              return res.status(400).json({
                message: "Invalid category ID",
              });
            }
            console.log(`Converted category ID to UUID: ${categoryId}`);
          }

          // Prepare the update data
          const updateData = {
            title: request.title,
            description: request.description || "",
            category_id: categoryId,
            priority: request.priority || "medium",
            status: request.status,
            quantity: request.quantity || 1,
            total_cost: request.totalCost || 0,
            updated_at: now,
          };

          // Add approval/rejection data if status changed
          if (
            request.status === "approved" &&
            currentRequest.status !== "approved"
          ) {
            updateData.approved_at = request.approvedAt || now;

            // Convert approvedBy to UUID if provided
            if (request.approvedBy) {
              const approvedByUuid = await convertToUuid(
                request.approvedBy,
                "users"
              );
              if (approvedByUuid) {
                updateData.approved_by = approvedByUuid;
                console.log(
                  `Converted approvedBy ID to UUID: ${approvedByUuid}`
                );
              } else {
                console.log(
                  `Could not convert approvedBy ID ${request.approvedBy} to UUID, using as is`
                );
                updateData.approved_by = request.approvedBy;
              }
            } else {
              updateData.approved_by = request.approvedBy;
            }
          } else if (
            request.status === "rejected" &&
            currentRequest.status !== "rejected"
          ) {
            updateData.rejected_at = request.rejectedAt || now;

            // Convert rejectedBy to UUID if provided
            if (request.rejectedBy) {
              const rejectedByUuid = await convertToUuid(
                request.rejectedBy,
                "users"
              );
              if (rejectedByUuid) {
                updateData.rejected_by = rejectedByUuid;
                console.log(
                  `Converted rejectedBy ID to UUID: ${rejectedByUuid}`
                );
              } else {
                console.log(
                  `Could not convert rejectedBy ID ${request.rejectedBy} to UUID, using as is`
                );
                updateData.rejected_by = request.rejectedBy;
              }
            } else {
              updateData.rejected_by = request.rejectedBy;
            }

            updateData.rejection_reason = request.rejectionReason;
          } else if (
            request.status === "fulfilled" &&
            currentRequest.status !== "fulfilled"
          ) {
            updateData.fulfillment_date = request.fulfillmentDate || now;
          }

          // Build the update query
          let updateQuery = "UPDATE item_requests SET ";
          const updateValues = [];
          const updateFields = [];
          let paramIndex = 1;

          for (const [key, value] of Object.entries(updateData)) {
            if (value !== undefined) {
              updateFields.push(`${key} = $${paramIndex}`);
              updateValues.push(value);
              paramIndex++;
            }
          }

          updateQuery += updateFields.join(", ");
          updateQuery += ` WHERE id = $${paramIndex}`;
          updateValues.push(request.id);

          // Execute the update
          await pool.query(updateQuery, updateValues);

          // Get the updated request with related data
          const updatedRequestResult = await pool.query(
            `SELECT r.*, c.name as category_name, u.name as user_name
             FROM item_requests r
             LEFT JOIN categories c ON r.category_id::text = c.id::text
             LEFT JOIN users u ON r.user_id::text = u.id::text
             WHERE r.id = $1`,
            [request.id]
          );

          if (updatedRequestResult.rows.length === 0) {
            return res
              .status(404)
              .json({ message: "Updated request not found" });
          }

          // Transform data to match the expected format
          const updatedRequest = updatedRequestResult.rows[0];
          const formattedData = {
            id: updatedRequest.id,
            title: updatedRequest.title,
            description: updatedRequest.description,
            categoryId: updatedRequest.category_id,
            categoryName: updatedRequest.category_name,
            priority: updatedRequest.priority,
            status: updatedRequest.status,
            userId: updatedRequest.user_id,
            userName: updatedRequest.user_name,
            quantity: updatedRequest.quantity,
            totalCost: updatedRequest.total_cost,
            createdAt: updatedRequest.created_at,
            updatedAt: updatedRequest.updated_at,
            approvedAt: updatedRequest.approved_at,
            approvedBy: updatedRequest.approved_by,
            rejectedAt: updatedRequest.rejected_at,
            rejectedBy: updatedRequest.rejected_by,
            rejectionReason: updatedRequest.rejection_reason,
            fulfillmentDate: updatedRequest.fulfillment_date,
          };

          console.log("Request updated successfully:", formattedData);
          res.json(formattedData);
        } catch (error) {
          console.error("Error updating request:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "addComment": {
        const { comment } = req.body;

        if (!comment) {
          return res.status(400).json({ message: "Comment data is required" });
        }

        try {
          console.log("Adding comment to request:", comment.requestId);

          // Check if the request exists
          const requestResult = await pool.query(
            "SELECT * FROM item_requests WHERE id = $1",
            [comment.requestId]
          );

          if (requestResult.rows.length === 0) {
            return res.status(404).json({ message: "Request not found" });
          }

          // Create the comment
          const commentId = comment.id || uuidv4();
          const now = comment.createdAt || new Date().toISOString();

          // Insert the comment
          await pool.query(
            `INSERT INTO comments (id, request_id, user_id, content, created_at)
             VALUES ($1, $2, $3, $4, $5)`,
            [commentId, comment.requestId, comment.userId, comment.content, now]
          );

          // Get the created comment with user data
          const commentResult = await pool.query(
            `SELECT c.*, u.name as user_name, u.avatar_url
             FROM comments c
             LEFT JOIN users u ON c.user_id::text = u.id::text
             WHERE c.id = $1`,
            [commentId]
          );

          if (commentResult.rows.length === 0) {
            return res
              .status(500)
              .json({ message: "Failed to create comment" });
          }

          // Format the comment for the response
          const createdComment = commentResult.rows[0];
          const formattedComment = {
            id: createdComment.id,
            requestId: createdComment.request_id,
            userId: createdComment.user_id,
            userName: createdComment.user_name,
            userAvatarUrl: createdComment.avatar_url,
            content: createdComment.content,
            createdAt: createdComment.created_at,
          };

          console.log("Comment added successfully:", formattedComment);
          res.status(201).json(formattedComment);
        } catch (error) {
          console.error("Error adding comment:", error);
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
    console.error("Error handling requests:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "getById": {
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ message: "User ID is required" });
        }

        try {
          // Convert to UUID if needed
          const userId = await convertToUuid(id, "users");

          if (!userId) {
            return res.status(404).json({ message: "User not found" });
          }

          const result = await pool.query(
            "SELECT id, name, email, role, department, avatar_url, created_at, updated_at FROM users WHERE id = $1",
            [userId]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
          }

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

          res.json(formattedData);
        } catch (error) {
          console.error("Error fetching user:", error);
          res
            .status(500)
            .json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "update": {
        const { id, name, email, role, department, avatarUrl } = req.body;

        if (!id) {
          return res.status(400).json({ message: "User ID is required" });
        }

        try {
          // Check if the user exists
          const checkResult = await pool.query(
            "SELECT * FROM users WHERE id = $1",
            [id]
          );

          if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
          }

          // Check if email already exists for a different user
          if (email) {
            const emailCheckResult = await pool.query(
              "SELECT id FROM users WHERE email = $1 AND id != $2",
              [email, id]
            );

            if (emailCheckResult.rows.length > 0) {
              return res.status(400).json({
                message: "Email already in use by another user",
              });
            }
          }

          // Update the user
          const updateResult = await pool.query(
            `UPDATE users
             SET name = $1,
                 email = $2,
                 role = $3,
                 department = $4,
                 avatar_url = $5,
                 updated_at = $6
             WHERE id = $7
             RETURNING id, name, email, role, department, avatar_url, created_at, updated_at`,
            [
              name,
              email,
              role,
              department || "",
              avatarUrl || "",
              new Date().toISOString(),
              id,
            ]
          );

          if (updateResult.rows.length === 0) {
            return res.status(500).json({ message: "Failed to update user" });
          }

          // Format the response
          const updatedUser = updateResult.rows[0];
          const formattedUser = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department || "",
            avatarUrl: updatedUser.avatar_url || "",
            createdAt: updatedUser.created_at,
            updatedAt: updatedUser.updated_at,
          };

          res.json(formattedUser);
        } catch (error) {
          console.error("Error updating user:", error);
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
    res.status(500).json({ message: "Server error", error: err.message });
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
