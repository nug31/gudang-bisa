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
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the dist directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "dist")));

// PostgreSQL connection details
const host = process.env.POSTGRES_HOST;
const port = process.env.POSTGRES_PORT;
const database = process.env.POSTGRES_DATABASE;
const username = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASSWORD;
const ssl = process.env.POSTGRES_SSL === 'true';

if (!host || !port || !database || !username || !password) {
  console.error('Missing PostgreSQL environment variables. Please set POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DATABASE, POSTGRES_USER, and POSTGRES_PASSWORD in your .env file.');
  process.exit(1);
}

// Create a connection pool
const pool = new pg.Pool({
  host,
  port,
  database,
  user: username,
  password,
  ssl: ssl ? { rejectUnauthorized: false } : false
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database!');
    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    return false;
  }
}

// Authentication routes
app.post("/db/auth", async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {
      case "login": {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }

        try {
          const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
          );

          if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
          }

          const user = result.rows[0];
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
          }

          // Return user data without password
          const { password: _, ...userData } = user;
          res.json(userData);
        } catch (error) {
          console.error("Error during login:", error);
          res.status(500).json({ message: "Server error", error: error.message });
        }
        break;
      }

      case "register": {
        const { name, email, password, role = "user", department } = req.body;

        if (!name || !email || !password) {
          return res.status(400).json({ message: "Name, email, and password are required" });
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
          res.status(500).json({ message: "Server error", error: error.message });
        }
        break;
      }

      default:
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (err) {
    console.error("Error handling auth request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Handle inventory requests
app.post("/db/inventory", async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {
      case "getAll": {
        const { categoryId } = req.body;

        try {
          let query = "SELECT i.*, c.name as category_name FROM inventory_items i LEFT JOIN categories c ON i.category_id = c.id";
          let params = [];

          if (categoryId) {
            query += " WHERE i.category_id = $1";
            params.push(categoryId);
          }

          const result = await pool.query(query, params);

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
          res.status(500).json({ message: "Server error", error: error.message });
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
            "SELECT i.*, c.name as category_name FROM inventory_items i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = $1",
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
          res.status(500).json({ message: "Server error", error: error.message });
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
            `INSERT INTO inventory_items 
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

          const categoryName = categoryResult.rows.length > 0 ? categoryResult.rows[0].name : "Unknown Category";

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
          res.status(500).json({ message: "Server error", error: error.message });
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

// Catch-all route to serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
testConnection().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Connected to PostgreSQL database at ${host}`);
    });
  } else {
    console.error('Failed to connect to PostgreSQL database. Server not started.');
    process.exit(1);
  }
});
