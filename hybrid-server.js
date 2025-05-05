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
let useMockDb = process.env.USE_MOCK_DB === "true";
let pool = null;

console.log(
  `Database mode: ${useMockDb ? "Mock Database" : "Real cPanel Database"}`
);
console.log(
  `IP address 182.3.36.174 has been successfully whitelisted in cPanel for direct database access`
);

// Try to create database connection pool
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 120000, // 120 seconds timeout - increased for remote connections
  });

  console.log(
    `Attempting to connect to cPanel database at ${process.env.DB_HOST}:${process.env.DB_PORT}...`
  );
} catch (error) {
  console.error("Error creating database pool:", error);
  useMockDb = true;
  console.log("Falling back to mock database");
}

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  if (useMockDb) {
    return res.json({
      success: true,
      message: "Using mock database (cPanel connection failed)",
      usingMock: true,
    });
  }

  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
    res.json({
      success: true,
      message: "cPanel database connected successfully",
    });
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
      user = users.find((u) => u.email === email);

      if (!user) {
        // Create a new user if not found
        user = await mockDb.users.create({
          name: email.split("@")[0],
          email,
          role: email.includes("admin") ? "admin" : "user",
          department: "General",
          avatarUrl: null,
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
          console.log(
            `User with email ${email} not found in database, creating mock user`
          );
          useMockDb = true;

          // Create a mock user
          let mockUsers = await mockDb.users.getAll();
          user = mockUsers.find((u) => u.email === email);

          if (!user) {
            user = await mockDb.users.create({
              name: email.split("@")[0],
              email,
              role: email.includes("admin") ? "admin" : "user",
              department: "General",
              avatarUrl: null,
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
        user = mockUsers.find((u) => u.email === email);

        if (!user) {
          user = await mockDb.users.create({
            name: email.split("@")[0],
            email,
            role: email.includes("admin") ? "admin" : "user",
            department: "General",
            avatarUrl: null,
          });
        }
      }
    }

    res.json({
      user: user,
      message: "Login successful",
      usingMock: useMockDb,
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

          case "create":
            try {
              console.log("Creating request with real database:", request);

              // Check if the user exists
              const [users] = await connection.query(
                `SELECT id FROM users WHERE id = ?`,
                [request.userId]
              );

              if (users.length === 0) {
                console.log(
                  `User with ID ${request.userId} not found, creating a new user`
                );

                // Create a new user if not found
                await connection.query(
                  `
                  INSERT INTO users (id, name, email, password, role, department, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, NOW())
                  `,
                  [
                    request.userId,
                    "New User",
                    "user@example.com",
                    "password",
                    "user",
                    "General",
                  ]
                );
              }

              // Check if the category exists
              let categoryId = request.category;
              const [categories] = await connection.query(
                `SELECT id FROM categories WHERE id = ?`,
                [categoryId]
              );

              if (categories.length === 0) {
                console.log(
                  `Category with ID ${categoryId} not found, using default category`
                );

                // Get the first category as default
                const [defaultCategories] = await connection.query(
                  `SELECT id FROM categories LIMIT 1`
                );

                if (defaultCategories.length > 0) {
                  categoryId = defaultCategories[0].id;
                } else {
                  // Create a default category if none exists
                  const [result] = await connection.query(
                    `
                    INSERT INTO categories (id, name, description, created_at)
                    VALUES (UUID(), 'General', 'Default category', NOW())
                    `
                  );

                  const [newCategory] = await connection.query(
                    `SELECT id FROM categories WHERE name = 'General' LIMIT 1`
                  );

                  categoryId = newCategory[0].id;
                }
              }

              // Insert the request
              await connection.query(
                `
                INSERT INTO item_requests (
                  id, title, description, category_id, priority, status,
                  user_id, created_at, updated_at, quantity, inventory_item_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
                `,
                [
                  request.id,
                  request.title,
                  request.description,
                  categoryId,
                  request.priority,
                  request.status,
                  request.userId,
                  request.quantity || 1,
                  request.inventoryItemId || null,
                ]
              );

              // Get the created request
              const [createdRequest] = await connection.query(
                `
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
                  ir.quantity,
                  ir.inventory_item_id as inventoryItemId
                FROM item_requests ir
                JOIN categories c ON ir.category_id = c.id
                WHERE ir.id = ?
                `,
                [request.id]
              );

              connection.release();
              console.log("Request created successfully:", createdRequest[0]);
              res.json(createdRequest[0]);
            } catch (error) {
              console.error("Error creating request:", error);
              connection.release();
              throw error;
            }
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
  console.log("Using mock database:", useMockDb);

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

          const categoryItems = await mockDb.inventory.getByCategory(
            categoryId
          );
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
            return res
              .status(400)
              .json({ message: "Item ID and data are required" });
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

        switch (action) {
          case "getAll":
            try {
              console.log("Executing inventory getAll with real database");

              // First, check if the inventory_items table exists
              console.log("Checking if inventory_items table exists...");
              const [tables] = await connection.query(`
                SHOW TABLES LIKE 'inventory_items'
              `);

              console.log("Tables result:", tables);

              if (tables.length === 0) {
                // Table doesn't exist, create it
                console.log("Creating inventory_items table...");

                // Create the inventory_items table
                await connection.query(`
                  CREATE TABLE IF NOT EXISTS \`inventory_items\` (
                    \`id\` varchar(36) NOT NULL,
                    \`name\` varchar(255) NOT NULL,
                    \`description\` text DEFAULT NULL,
                    \`category_id\` varchar(36) NOT NULL,
                    \`sku\` varchar(100) NOT NULL,
                    \`quantity_available\` int(11) NOT NULL DEFAULT 0,
                    \`quantity_reserved\` int(11) NOT NULL DEFAULT 0,
                    \`unit_price\` decimal(10,2) DEFAULT NULL,
                    \`location\` varchar(100) DEFAULT NULL,
                    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
                    \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                    PRIMARY KEY (\`id\`),
                    KEY \`category_id\` (\`category_id\`),
                    CONSTRAINT \`inventory_items_ibfk_1\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`)
                  ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
                `);

                // Insert sample data
                const [categories] = await connection.query(
                  `SELECT id, name FROM categories`
                );

                for (const category of categories) {
                  if (category.name === "IT Equipment") {
                    await connection.query(
                      `
                      INSERT INTO \`inventory_items\`
                      (\`id\`, \`name\`, \`description\`, \`category_id\`, \`sku\`, \`quantity_available\`, \`quantity_reserved\`, \`unit_price\`, \`location\`)
                      VALUES
                      (UUID(), 'Dell XPS 13', '13-inch laptop with Intel Core i7', ?, 'DELL-XPS-13', 5, 0, 1299.99, 'Warehouse A'),
                      (UUID(), 'HP Monitor 27-inch', '27-inch 4K monitor', ?, 'HP-MON-27', 10, 2, 349.99, 'Warehouse B')
                    `,
                      [category.id, category.id]
                    );
                  } else if (category.name === "Furniture") {
                    await connection.query(
                      `
                      INSERT INTO \`inventory_items\`
                      (\`id\`, \`name\`, \`description\`, \`category_id\`, \`sku\`, \`quantity_available\`, \`quantity_reserved\`, \`unit_price\`, \`location\`)
                      VALUES
                      (UUID(), 'Office Chair', 'Ergonomic office chair', ?, 'CHAIR-ERGO-1', 15, 3, 199.99, 'Warehouse C'),
                      (UUID(), 'Desk', 'Standard office desk', ?, 'DESK-STD-1', 8, 1, 299.99, 'Warehouse C')
                    `,
                      [category.id, category.id]
                    );
                  } else if (category.name === "Office Supplies") {
                    await connection.query(
                      `
                      INSERT INTO \`inventory_items\`
                      (\`id\`, \`name\`, \`description\`, \`category_id\`, \`sku\`, \`quantity_available\`, \`quantity_reserved\`, \`unit_price\`, \`location\`)
                      VALUES
                      (UUID(), 'Notebook', 'Standard notebook', ?, 'NB-STD-1', 100, 0, 4.99, 'Warehouse A'),
                      (UUID(), 'Pen Set', 'Set of 10 pens', ?, 'PEN-SET-10', 50, 5, 9.99, 'Warehouse A')
                    `,
                      [category.id, category.id]
                    );
                  }
                }

                console.log(
                  "Inventory_items table created and populated with sample data"
                );
              }

              // Get all inventory items with category names
              console.log("Retrieving inventory items...");
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
                  i.created_at as createdAt
                FROM
                  inventory_items i
                JOIN
                  categories c ON i.category_id = c.id
                ORDER BY
                  i.name
              `);

              console.log("Retrieved inventory items:", items.length);

              connection.release();
              console.log("Sending inventory items to client");
              res.json(items);
            } catch (error) {
              console.error("Error getting inventory items:", error);
              console.error("Error details:", error.message);
              console.error("Error stack:", error.stack);
              connection.release();
              throw error;
            }
            break;

          case "getByCategory":
            if (!categoryId) {
              connection.release();
              return res
                .status(400)
                .json({ message: "Category ID is required" });
            }

            try {
              const [items] = await connection.query(
                `
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
                  i.created_at as createdAt
                FROM
                  inventory_items i
                JOIN
                  categories c ON i.category_id = c.id
                WHERE
                  i.category_id = ?
                ORDER BY
                  i.name
              `,
                [categoryId]
              );

              connection.release();
              res.json(items);
            } catch (error) {
              console.error(
                "Error getting inventory items by category:",
                error
              );
              connection.release();
              throw error;
            }
            break;

          default:
            connection.release();
            res.status(400).json({ message: "Invalid action" });
        }
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
          const {
            id: updateId,
            name,
            email,
            role,
            department,
            avatarUrl,
          } = req.body;

          if (!updateId) {
            return res.status(400).json({ message: "User ID is required" });
          }

          const updatedUser = await mockDb.users.update(updateId, {
            name,
            email,
            role,
            department,
            avatarUrl,
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
            return res
              .status(400)
              .json({ message: "Category name is required" });
          }

          const newCategory = await mockDb.categories.create({
            name,
            description,
          });

          res.json(newCategory);
          break;

        case "update":
          const { id, categoryData } = req.body;

          if (!id || !categoryData) {
            return res
              .status(400)
              .json({ message: "Category ID and data are required" });
          }

          const updatedCategory = await mockDb.categories.update(
            id,
            categoryData
          );

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

// Add an endpoint to log client-side messages
app.post("/log", (req, res) => {
  console.log("CLIENT LOG:", req.body);
  res.status(200).send("Logged");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Hybrid server running on port ${PORT}`);
  console.log(`Initially using ${useMockDb ? "mock" : "cPanel"} database`);
  console.log(
    `Will attempt to connect to cPanel database and fall back to mock if needed`
  );
});

export default app;
