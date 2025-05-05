import express from "express";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import mockDb from "./mock-db.js";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Global variable to track if we're using mock database
let useMockDb = true; // Start with mock database by default
let pool = null;

// Try to create database connection pool for cPanel
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
    connectTimeout: 10000, // 10 seconds timeout
  });
  
  console.log("Created database pool for cPanel connection");
} catch (error) {
  console.error("Error creating database pool:", error);
  console.log("Using mock database");
}

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  if (useMockDb) {
    return res.json({ 
      success: true, 
      message: "Using mock database",
      usingMock: true
    });
  }
  
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
    res.json({ success: true, message: "cPanel database connected successfully" });
  } catch (error) {
    console.error("Error connecting to database:", error);
    useMockDb = true;
    console.log("Falling back to mock database");
    res.status(200).json({
      success: true,
      message: "Using mock database (cPanel connection failed)",
      usingMock: true,
      error: error.message,
    });
  }
});

// Try to connect to cPanel database endpoint
app.post("/api/try-cpanel", async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });
    
    console.log("Successfully connected to cPanel database!");
    
    // Test a simple query
    const [result] = await connection.query("SELECT 1 as test");
    console.log("Query result:", result);
    
    // Close the connection
    await connection.end();
    
    // Switch to using cPanel database
    useMockDb = false;
    
    res.json({ 
      success: true, 
      message: "Successfully connected to cPanel database",
      usingMock: false
    });
  } catch (error) {
    console.error("Error connecting to cPanel database:", error);
    
    res.status(200).json({
      success: false,
      message: "Failed to connect to cPanel database",
      usingMock: true,
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

  // For demo purposes, accept 'password' as the password for all users
  if (password !== "password") {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  try {
    let user;
    
    if (useMockDb) {
      // Use mock database
      let users = await mockDb.users.getAll();
      user = users.find(u => u.email === email);
      
      if (!user) {
        // Create a new user if not found
        user = await mockDb.users.create({
          name: email.split('@')[0],
          email,
          role: email.includes('admin') ? 'admin' : 'user',
          department: 'General',
          avatarUrl: null
        });
      }
    } else {
      // Use real database
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
          // If we can't find the user, fall back to mock
          console.log(`User with email ${email} not found in database, creating mock user`);
          useMockDb = true;
          
          // Create a mock user
          let mockUsers = await mockDb.users.getAll();
          user = mockUsers.find(u => u.email === email);
          
          if (!user) {
            user = await mockDb.users.create({
              name: email.split('@')[0],
              email,
              role: email.includes('admin') ? 'admin' : 'user',
              department: 'General',
              avatarUrl: null
            });
          }
        } else {
          user = users[0];
        }
      } catch (error) {
        console.error("Database error during login:", error);
        useMockDb = true;
        
        // Fall back to mock database
        let mockUsers = await mockDb.users.getAll();
        user = mockUsers.find(u => u.email === email);
        
        if (!user) {
          user = await mockDb.users.create({
            name: email.split('@')[0],
            email,
            role: email.includes('admin') ? 'admin' : 'user',
            department: 'General',
            avatarUrl: null
          });
        }
      }
    }

    res.json({
      user: user,
      message: "Login successful",
      usingMock: useMockDb
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
    if (useMockDb) {
      // Use mock database
      switch (action) {
        case "getAll":
          const requests = await mockDb.requests.getAll();
          res.json(requests);
          break;

        case "getById":
          const requestResult = await mockDb.requests.getById(id);
          
          if (!requestResult) {
            return res.status(404).json({ message: "Request not found" });
          }
          
          const comments = await mockDb.comments.getByRequestId(id);
          requestResult.comments = comments;
          
          res.json(requestResult);
          break;

        case "create":
          const newRequest = await mockDb.requests.create(request);
          res.json(newRequest);
          break;

        case "update":
          const updatedRequest = await mockDb.requests.update(id, request);
          
          if (!updatedRequest) {
            return res.status(404).json({ message: "Request not found" });
          }
          
          res.json(updatedRequest);
          break;

        case "delete":
          const deleted = await mockDb.requests.delete(id);
          
          if (!deleted) {
            return res.status(404).json({ message: "Request not found" });
          }
          
          res.json({ message: "Request deleted successfully" });
          break;

        case "addComment":
          if (!comment) {
            return res.status(400).json({ message: "Comment is required" });
          }
          
          const newComment = await mockDb.comments.create(comment);
          res.json(newComment);
          break;

        default:
          res.status(400).json({ message: "Invalid action" });
      }
    } else {
      // Use real database
      try {
        const connection = await pool.getConnection();
        
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
            
          // Add other cases for real database operations
          // ...
          
          default:
            connection.release();
            res.status(400).json({ message: "Invalid action" });
        }
      } catch (error) {
        console.error("Database error:", error);
        useMockDb = true;
        console.log("Falling back to mock database for requests");
        
        // Retry with mock database
        const requests = await mockDb.requests.getAll();
        res.json(requests);
      }
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
    if (useMockDb) {
      // Use mock database
      switch (action) {
        case "getAll":
          const items = await mockDb.inventory.getAll();
          res.json(items);
          break;

        case "getByCategory":
          if (!categoryId) {
            return res.status(400).json({ message: "Category ID is required" });
          }
          
          const categoryItems = await mockDb.inventory.getByCategory(categoryId);
          res.json(categoryItems);
          break;

        case "create":
          const { item } = req.body;
          
          if (!item) {
            return res.status(400).json({ message: "Item data is required" });
          }
          
          const newItem = await mockDb.inventory.create(item);
          res.json(newItem);
          break;

        case "update":
          const { id, itemData } = req.body;
          
          if (!id || !itemData) {
            return res.status(400).json({ message: "Item ID and data are required" });
          }
          
          const updatedItem = await mockDb.inventory.update(id, itemData);
          
          if (!updatedItem) {
            return res.status(404).json({ message: "Item not found" });
          }
          
          res.json(updatedItem);
          break;

        case "delete":
          const { id: deleteId } = req.body;
          
          if (!deleteId) {
            return res.status(400).json({ message: "Item ID is required" });
          }
          
          const deleted = await mockDb.inventory.delete(deleteId);
          
          if (!deleted) {
            return res.status(404).json({ message: "Item not found" });
          }
          
          res.json({ message: "Item deleted successfully" });
          break;

        default:
          res.status(400).json({ message: "Invalid action" });
      }
    } else {
      // Use real database
      try {
        const connection = await pool.getConnection();
        
        // Implement real database operations for inventory
        // ...
        
        connection.release();
      } catch (error) {
        console.error("Database error:", error);
        useMockDb = true;
        console.log("Falling back to mock database for inventory");
        
        // Retry with mock database
        const items = await mockDb.inventory.getAll();
        res.json(items);
      }
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
    if (useMockDb) {
      // Use mock database
      switch (action) {
        case "getAll":
          const users = await mockDb.users.getAll();
          res.json(users);
          break;

        case "getById":
          const { id } = req.body;
          
          if (!id) {
            return res.status(400).json({ message: "User ID is required" });
          }
          
          const user = await mockDb.users.getById(id);
          
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
          
          res.json(user);
          break;

        case "create":
          const { userData } = req.body;
          
          if (!userData) {
            return res.status(400).json({ message: "User data is required" });
          }
          
          const newUser = await mockDb.users.create(userData);
          res.json(newUser);
          break;

        case "update":
          const { id: updateId, name, email, role, department, avatarUrl } = req.body;
          
          if (!updateId) {
            return res.status(400).json({ message: "User ID is required" });
          }
          
          const updatedUser = await mockDb.users.update(updateId, {
            name,
            email,
            role,
            department,
            avatarUrl
          });
          
          if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
          }
          
          res.json(updatedUser);
          break;

        case "delete":
          const { id: deleteId } = req.body;
          
          if (!deleteId) {
            return res.status(400).json({ message: "User ID is required" });
          }
          
          const deleted = await mockDb.users.delete(deleteId);
          
          if (!deleted) {
            return res.status(404).json({ message: "User not found" });
          }
          
          res.json({ message: "User deleted successfully" });
          break;

        default:
          res.status(400).json({ message: "Invalid action" });
      }
    } else {
      // Use real database
      try {
        const connection = await pool.getConnection();
        
        // Implement real database operations for users
        // ...
        
        connection.release();
      } catch (error) {
        console.error("Database error:", error);
        useMockDb = true;
        console.log("Falling back to mock database for users");
        
        // Retry with mock database
        const users = await mockDb.users.getAll();
        res.json(users);
      }
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
    if (useMockDb) {
      // Use mock database
      switch (action) {
        case "getAll":
          const categories = await mockDb.categories.getAll();
          res.json(categories);
          break;

        case "create":
          const { name, description } = req.body;
          
          if (!name) {
            return res.status(400).json({ message: "Category name is required" });
          }
          
          const newCategory = await mockDb.categories.create({
            name,
            description
          });
          
          res.json(newCategory);
          break;

        case "update":
          const { id, categoryData } = req.body;
          
          if (!id || !categoryData) {
            return res.status(400).json({ message: "Category ID and data are required" });
          }
          
          const updatedCategory = await mockDb.categories.update(id, categoryData);
          
          if (!updatedCategory) {
            return res.status(404).json({ message: "Category not found" });
          }
          
          res.json(updatedCategory);
          break;

        case "delete":
          const { id: deleteId } = req.body;
          
          if (!deleteId) {
            return res.status(400).json({ message: "Category ID is required" });
          }
          
          const deleted = await mockDb.categories.delete(deleteId);
          
          if (!deleted) {
            return res.status(404).json({ message: "Category not found" });
          }
          
          res.json({ message: "Category deleted successfully" });
          break;

        default:
          res.status(400).json({ message: "Invalid action" });
      }
    } else {
      // Use real database
      try {
        const connection = await pool.getConnection();
        
        // Implement real database operations for categories
        // ...
        
        connection.release();
      } catch (error) {
        console.error("Database error:", error);
        useMockDb = true;
        console.log("Falling back to mock database for categories");
        
        // Retry with mock database
        const categories = await mockDb.categories.getAll();
        res.json(categories);
      }
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`cPanel-ready server running on port ${PORT}`);
  console.log(`Using ${useMockDb ? 'mock' : 'cPanel'} database`);
  console.log(`To try connecting to cPanel database, visit: http://localhost:${PORT}/api/try-cpanel`);
});

export default app;
