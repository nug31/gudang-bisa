import express from "express";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

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

// PlanetScale connection details
const host = process.env.PLANETSCALE_HOST;
const username = process.env.PLANETSCALE_USERNAME;
const password = process.env.PLANETSCALE_PASSWORD;
const database = process.env.PLANETSCALE_DATABASE;

if (!host || !username || !password || !database) {
  console.error('Missing PlanetScale environment variables. Please set PLANETSCALE_HOST, PLANETSCALE_USERNAME, PLANETSCALE_PASSWORD, and PLANETSCALE_DATABASE in your .env file.');
  process.exit(1);
}

// Create a connection pool
const pool = mysql.createPool({
  host,
  user: username,
  password,
  database,
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to PlanetScale database!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to PlanetScale database:', error);
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
          const [rows] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
          );

          if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
          }

          const user = rows[0];
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
          const [existingUsers] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
          );

          if (existingUsers.length > 0) {
            return res.status(400).json({ message: "User already exists" });
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);
          const userId = uuidv4();

          // Insert new user
          await pool.query(
            "INSERT INTO users (id, name, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, name, email, hashedPassword, role, department || null]
          );

          // Get the newly created user
          const [newUsers] = await pool.query(
            "SELECT * FROM users WHERE id = ?",
            [userId]
          );

          if (newUsers.length === 0) {
            return res.status(500).json({ message: "Failed to create user" });
          }

          // Return user data without password
          const { password: _, ...userData } = newUsers[0];
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
            query += " WHERE i.category_id = ?";
            params.push(categoryId);
          }

          const [rows] = await pool.query(query, params);

          // Transform data to match the expected format
          const formattedData = rows.map((item) => ({
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
          const [rows] = await pool.query(
            "SELECT i.*, c.name as category_name FROM inventory_items i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = ?",
            [id]
          );

          if (rows.length === 0) {
            return res.status(404).json({ message: "Item not found" });
          }

          // Transform data to match the expected format
          const item = rows[0];
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          const [categories] = await pool.query(
            "SELECT name FROM categories WHERE id = ?",
            [categoryId]
          );

          const categoryName = categories.length > 0 ? categories[0].name : "Unknown Category";

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
      console.log(`Connected to PlanetScale database at ${host}`);
    });
  } else {
    console.error('Failed to connect to PlanetScale database. Server not started.');
    process.exit(1);
  }
});
