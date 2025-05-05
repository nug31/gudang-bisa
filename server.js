import express from "express";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import mockPool from "./src/db/mock-db.js";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "null",
      "file://",
    ],
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

// Check if we should use mock database
const useMockDb = process.env.USE_MOCK_DB === "true";
console.log(`Database mode: ${useMockDb ? "MOCK DATABASE" : "REAL DATABASE"}`);

// Create database connection pool
const pool = useMockDb
  ? mockPool
  : mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
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
      useMockDb: useMockDb,
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

      case "getById":
        // Get request by ID
        const [requestResults] = await connection.query(
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
            ir.approved_at as approvedAt,
            ir.approved_by as approvedBy,
            ir.rejected_at as rejectedAt,
            ir.rejected_by as rejectedBy,
            ir.rejection_reason as rejectionReason,
            ir.fulfillment_date as fulfillmentDate,
            ir.quantity
          FROM item_requests ir
          JOIN categories c ON ir.category_id = c.id
          WHERE ir.id = ?
        `,
          [id]
        );

        if (requestResults.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Request not found" });
        }

        const requestResult = requestResults[0];

        // Get comments for the request
        const [commentResults] = await connection.query(
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
          [id]
        );

        requestResult.comments = commentResults;

        connection.release();
        res.json(requestResult);
        break;

      case "create":
        // Create a new request
        console.log("Handling create request action");
        const {
          title,
          description,
          category,
          priority,
          status,
          userId,
          quantity,
          fulfillmentDate,
          inventoryItemId,
        } = request;

        // Log the request data for debugging
        console.log("Creating request with data:", {
          id: request.id,
          title,
          description,
          category_id: category,
          priority,
          status,
          user_id: userId,
          quantity,
          fulfillment_date: fulfillmentDate,
          inventory_item_id: inventoryItemId,
        });

        // If inventory item is specified, update the stock
        if (inventoryItemId) {
          // Check if there's enough available quantity
          const [inventoryItem] = await connection.query(
            `SELECT quantity_available, quantity_reserved FROM inventory_items WHERE id = ?`,
            [inventoryItemId]
          );

          if (inventoryItem.length === 0) {
            connection.release();
            res.status(404).json({ message: "Inventory item not found" });
            return;
          }

          const availableQuantity = inventoryItem[0].quantity_available;

          if (availableQuantity < quantity) {
            connection.release();
            res.status(400).json({
              message: "Not enough quantity available",
              availableQuantity,
              requestedQuantity: quantity,
            });
            return;
          }

          // Update the inventory item's stock
          await connection.query(
            `UPDATE inventory_items
             SET quantity_available = quantity_available - ?,
                 quantity_reserved = quantity_reserved + ?
             WHERE id = ?`,
            [quantity, quantity, inventoryItemId]
          );

          console.log(
            `Updated inventory item ${inventoryItemId}: Reserved ${quantity} items`
          );
        }

        // Insert the request
        const [createResult] = await connection.query(
          `
          INSERT INTO item_requests (
            id,
            title,
            description,
            category_id,
            priority,
            status,
            user_id,
            quantity,
            fulfillment_date,
            inventory_item_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            request.id,
            title,
            description,
            category,
            priority,
            status,
            userId,
            quantity,
            fulfillmentDate ? new Date(fulfillmentDate) : null,
            inventoryItemId || null,
          ]
        );

        // Get the created request
        try {
          console.log("Retrieving created request with ID:", request.id);
          const [createdRequest] = await connection.query(
            `
            SELECT
              ir.id,
              ir.title,
              ir.description,
              c.id as category,
              c.name as categoryName,
              ir.priority,
              ir.status,
              ir.user_id as userId,
              ir.created_at as createdAt,
              ir.updated_at as updatedAt,
              ir.quantity,
              ir.fulfillment_date as fulfillmentDate,
              ir.inventory_item_id as inventoryItemId,
              CASE WHEN ii.id IS NOT NULL THEN ii.name ELSE NULL END as inventoryItemName,
              CASE WHEN ii.id IS NOT NULL THEN ii.quantity_available ELSE NULL END as inventoryQuantityAvailable,
              CASE WHEN ii.id IS NOT NULL THEN ii.quantity_reserved ELSE NULL END as inventoryQuantityReserved
            FROM item_requests ir
            JOIN categories c ON ir.category_id = c.id
            LEFT JOIN inventory_items ii ON ir.inventory_item_id = ii.id
            WHERE ir.id = ?
          `,
            [request.id]
          );

          console.log("Query result length:", createdRequest.length);

          if (!createdRequest || createdRequest.length === 0) {
            console.log(
              "Created request not found in database, using fallback response"
            );
            // Return a fallback response with the request data
            const fallbackResponse = {
              id: request.id,
              title: request.title,
              description: request.description,
              category: request.category,
              priority: request.priority,
              status: request.status,
              userId: request.userId,
              quantity: request.quantity,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              message: "Request created but could not retrieve details",
            };
            console.log("Sending fallback response:", fallbackResponse);
            connection.release();
            return res.json(fallbackResponse);
          }

          console.log(
            "Created request retrieved successfully:",
            createdRequest[0]
          );
          connection.release();

          // Return the response as JSON
          return res.json(createdRequest[0]);
        } catch (selectError) {
          console.error("Error retrieving created request:", selectError);
          // Return a fallback response with the request data
          const fallbackResponse = {
            id: request.id,
            title: request.title,
            description: request.description,
            category: request.category,
            priority: request.priority,
            status: request.status,
            userId: request.userId,
            quantity: request.quantity,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            message: "Request created but could not retrieve details",
          };
          console.log(
            "Sending fallback response due to error:",
            fallbackResponse
          );
          connection.release();

          // Return the fallback response as JSON
          return res.json(fallbackResponse);
        }
        break;

      case "update":
        // Update a request
        console.log("Handling update request action");
        console.log("Request data:", request);

        const {
          id: updateId,
          title: updateTitle,
          description: updateDescription,
          category: updateCategory,
          priority: updatePriority,
          status: updateStatus,
          quantity: updateQuantity,
          fulfillmentDate: updateFulfillmentDate,
          approvedAt,
          approvedBy,
          rejectedAt,
          rejectedBy,
          rejectionReason,
          inventoryItemId: updateInventoryItemId,
          oldStatus,
          oldQuantity,
        } = request;

        console.log("Extracted update data:", {
          updateId,
          updateTitle,
          updateDescription,
          updateCategory,
          updatePriority,
          updateStatus,
          updateQuantity,
          updateFulfillmentDate,
          approvedAt,
          approvedBy,
          rejectedAt,
          rejectedBy,
          rejectionReason,
          updateInventoryItemId,
          oldStatus,
          oldQuantity,
        });

        // Get the current request to check for changes
        const [currentRequest] = await connection.query(
          `SELECT status, quantity, inventory_item_id FROM item_requests WHERE id = ?`,
          [updateId]
        );

        if (currentRequest.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Request not found" });
        }

        const currentStatus = currentRequest[0].status;
        const currentQuantity = currentRequest[0].quantity;
        const currentInventoryItemId = currentRequest[0].inventory_item_id;

        // Handle inventory updates if needed
        if (currentInventoryItemId) {
          // If status is changing to fulfilled, update inventory
          if (currentStatus !== "fulfilled" && updateStatus === "fulfilled") {
            // When fulfilled, remove from reserved (it's been used)
            await connection.query(
              `UPDATE inventory_items
               SET quantity_reserved = quantity_reserved - ?
               WHERE id = ?`,
              [currentQuantity, currentInventoryItemId]
            );
            console.log(
              `Request fulfilled: Released ${currentQuantity} reserved items from inventory ${currentInventoryItemId}`
            );
          }

          // If status is changing to rejected, update inventory
          if (currentStatus !== "rejected" && updateStatus === "rejected") {
            // When rejected, return items to available stock
            await connection.query(
              `UPDATE inventory_items
               SET quantity_reserved = quantity_reserved - ?,
                   quantity_available = quantity_available + ?
               WHERE id = ?`,
              [currentQuantity, currentQuantity, currentInventoryItemId]
            );
            console.log(
              `Request rejected: Returned ${currentQuantity} items to available stock in inventory ${currentInventoryItemId}`
            );
          }

          // If quantity is changing, update inventory
          if (
            updateQuantity !== currentQuantity &&
            (currentStatus === "pending" || currentStatus === "approved")
          ) {
            const quantityDiff = updateQuantity - currentQuantity;

            if (quantityDiff > 0) {
              // Check if there's enough available quantity for the increase
              const [inventoryItem] = await connection.query(
                `SELECT quantity_available FROM inventory_items WHERE id = ?`,
                [currentInventoryItemId]
              );

              if (inventoryItem[0].quantity_available < quantityDiff) {
                connection.release();
                res.status(400).json({
                  message: "Not enough quantity available for the increase",
                  availableQuantity: inventoryItem[0].quantity_available,
                  requestedIncrease: quantityDiff,
                });
                return;
              }

              // Increase reserved and decrease available
              await connection.query(
                `UPDATE inventory_items
                 SET quantity_reserved = quantity_reserved + ?,
                     quantity_available = quantity_available - ?
                 WHERE id = ?`,
                [quantityDiff, quantityDiff, currentInventoryItemId]
              );
              console.log(
                `Request quantity increased: Reserved additional ${quantityDiff} items from inventory ${currentInventoryItemId}`
              );
            } else if (quantityDiff < 0) {
              // Decrease reserved and increase available
              const absQuantityDiff = Math.abs(quantityDiff);
              await connection.query(
                `UPDATE inventory_items
                 SET quantity_reserved = quantity_reserved - ?,
                     quantity_available = quantity_available + ?
                 WHERE id = ?`,
                [absQuantityDiff, absQuantityDiff, currentInventoryItemId]
              );
              console.log(
                `Request quantity decreased: Returned ${absQuantityDiff} items to available stock in inventory ${currentInventoryItemId}`
              );
            }
          }
        }

        // If inventory item is changing, handle both old and new inventory items
        if (updateInventoryItemId !== currentInventoryItemId) {
          // If removing an inventory item, return items to available stock
          if (
            currentInventoryItemId &&
            (!updateInventoryItemId || updateInventoryItemId === "")
          ) {
            await connection.query(
              `UPDATE inventory_items
               SET quantity_reserved = quantity_reserved - ?,
                   quantity_available = quantity_available + ?
               WHERE id = ?`,
              [currentQuantity, currentQuantity, currentInventoryItemId]
            );
            console.log(
              `Inventory item removed from request: Returned ${currentQuantity} items to available stock in inventory ${currentInventoryItemId}`
            );
          }

          // If adding a new inventory item, reserve items from available stock
          if (updateInventoryItemId && updateInventoryItemId !== "") {
            // Check if there's enough available quantity
            const [inventoryItem] = await connection.query(
              `SELECT quantity_available FROM inventory_items WHERE id = ?`,
              [updateInventoryItemId]
            );

            if (inventoryItem.length === 0) {
              connection.release();
              res.status(404).json({ message: "New inventory item not found" });
              return;
            }

            if (inventoryItem[0].quantity_available < updateQuantity) {
              connection.release();
              res.status(400).json({
                message:
                  "Not enough quantity available in the new inventory item",
                availableQuantity: inventoryItem[0].quantity_available,
                requestedQuantity: updateQuantity,
              });
              return;
            }

            // Reserve items from the new inventory item
            await connection.query(
              `UPDATE inventory_items
               SET quantity_reserved = quantity_reserved + ?,
                   quantity_available = quantity_available - ?
               WHERE id = ?`,
              [updateQuantity, updateQuantity, updateInventoryItemId]
            );
            console.log(
              `New inventory item added to request: Reserved ${updateQuantity} items from inventory ${updateInventoryItemId}`
            );
          }
        }

        // Update the request
        console.log("Executing SQL update for request:", updateId);

        const updateParams = [
          updateTitle,
          updateDescription,
          updateCategory,
          updatePriority,
          updateStatus,
          updateQuantity,
          updateFulfillmentDate ? new Date(updateFulfillmentDate) : null,
          approvedAt ? new Date(approvedAt) : null,
          approvedBy,
          rejectedAt ? new Date(rejectedAt) : null,
          rejectedBy,
          rejectionReason,
          updateInventoryItemId || null,
          updateId,
        ];

        console.log("Update parameters:", updateParams);

        const updateResult = await connection.query(
          `
          UPDATE item_requests
          SET
            title = ?,
            description = ?,
            category_id = ?,
            priority = ?,
            status = ?,
            quantity = ?,
            fulfillment_date = ?,
            approved_at = ?,
            approved_by = ?,
            rejected_at = ?,
            rejected_by = ?,
            rejection_reason = ?,
            inventory_item_id = ?
          WHERE id = ?
        `,
          updateParams
        );

        console.log("Update result:", updateResult);

        // Get the updated request
        const [updatedRequest] = await connection.query(
          `
          SELECT
            ir.id,
            ir.title,
            ir.description,
            c.id as category,
            c.name as categoryName,
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
            ir.quantity,
            ir.inventory_item_id as inventoryItemId,
            CASE WHEN ii.id IS NOT NULL THEN ii.name ELSE NULL END as inventoryItemName,
            CASE WHEN ii.id IS NOT NULL THEN ii.quantity_available ELSE NULL END as inventoryQuantityAvailable,
            CASE WHEN ii.id IS NOT NULL THEN ii.quantity_reserved ELSE NULL END as inventoryQuantityReserved
          FROM item_requests ir
          JOIN categories c ON ir.category_id = c.id
          LEFT JOIN inventory_items ii ON ir.inventory_item_id = ii.id
          WHERE ir.id = ?
        `,
          [updateId]
        );

        // Get comments for the request
        const [updatedComments] = await connection.query(
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
          [updateId]
        );

        updatedRequest[0].comments = updatedComments;

        connection.release();
        res.json(updatedRequest[0]);
        break;

      case "delete":
        // Check if the request has an inventory item
        const [requestToDelete] = await connection.query(
          `SELECT inventory_item_id, quantity, status FROM item_requests WHERE id = ?`,
          [id]
        );

        if (
          requestToDelete.length > 0 &&
          requestToDelete[0].inventory_item_id
        ) {
          const inventoryItemId = requestToDelete[0].inventory_item_id;
          const quantity = requestToDelete[0].quantity;
          const status = requestToDelete[0].status;

          // If the request is pending or approved, return the reserved quantity to available
          if (status === "pending" || status === "approved") {
            await connection.query(
              `UPDATE inventory_items
               SET quantity_reserved = quantity_reserved - ?,
                   quantity_available = quantity_available + ?
               WHERE id = ?`,
              [quantity, quantity, inventoryItemId]
            );
            console.log(
              `Request deleted: Returned ${quantity} items to available stock in inventory ${inventoryItemId}`
            );
          }
        }

        // Delete the request and related records
        await connection.query("DELETE FROM comments WHERE request_id = ?", [
          id,
        ]);
        await connection.query(
          "DELETE FROM notifications WHERE related_item_id = ?",
          [id]
        );
        await connection.query("DELETE FROM item_requests WHERE id = ?", [id]);

        connection.release();
        res.json({ success: true });
        break;

      case "addComment":
        // Add a comment to a request
        const {
          id: commentId,
          requestId,
          userId: commentUserId,
          content,
          createdAt,
        } = comment;

        // Insert the comment
        await connection.query(
          `
          INSERT INTO comments (
            id,
            request_id,
            user_id,
            content,
            created_at
          ) VALUES (?, ?, ?, ?, ?)
        `,
          [commentId, requestId, commentUserId, content, new Date(createdAt)]
        );

        // Get the created comment
        const [createdComment] = await connection.query(
          `
          SELECT
            id,
            request_id as requestId,
            user_id as userId,
            content,
            created_at as createdAt
          FROM comments
          WHERE id = ?
        `,
          [commentId]
        );

        connection.release();
        res.json(createdComment[0]);
        break;

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

// Handle inventory requests
app.post("/db/inventory", async (req, res) => {
  const { action, categoryId } = req.body;
  console.log("Request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        // Build the query based on whether a category filter is provided
        let query = `
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
            i.created_at as createdAt,
            i.updated_at as updatedAt
          FROM inventory_items i
          JOIN categories c ON i.category_id = c.id
        `;

        // Add category filter if provided
        const params = [];
        if (categoryId) {
          query += ` WHERE i.category_id = ?`;
          params.push(categoryId);
        }

        // Add ordering
        query += ` ORDER BY i.name`;

        // Execute the query
        const [items] = await connection.query(query, params);

        connection.release();
        res.json(items);
        break;

      case "getById":
        // Get a specific inventory item by ID
        const { id } = req.body;
        if (!id) {
          connection.release();
          return res.status(400).json({ message: "Item ID is required" });
        }

        const [item] = await connection.query(
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
            i.image_url as imageUrl,
            i.created_at as createdAt,
            i.updated_at as updatedAt
          FROM inventory_items i
          JOIN categories c ON i.category_id = c.id
          WHERE i.id = ?
        `,
          [id]
        );

        if (item.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Item not found" });
        }

        connection.release();
        res.json(item[0]);
        break;

      case "create":
        // Create a new inventory item
        const {
          name,
          description,
          categoryId: newItemCategoryId,
          sku,
          quantityAvailable,
          quantityReserved,
          location,
          imageUrl,
        } = req.body;

        // Validate required fields
        if (!name || !newItemCategoryId || quantityAvailable === undefined) {
          connection.release();
          return res.status(400).json({
            message: "Name, category, and quantity available are required",
          });
        }

        // Generate a new UUID for the item
        const newItemId = uuidv4();

        // Insert the new item
        await connection.query(
          `
          INSERT INTO inventory_items (
            id,
            name,
            description,
            category_id,
            sku,
            quantity_available,
            quantity_reserved,
            location,
            image_url,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
          [
            newItemId,
            name,
            description || null,
            newItemCategoryId,
            sku || null,
            quantityAvailable,
            quantityReserved || 0,
            location || null,
            imageUrl || null,
          ]
        );

        // Get the newly created item with category name
        const [newItem] = await connection.query(
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
            i.image_url as imageUrl,
            i.created_at as createdAt,
            i.updated_at as updatedAt
          FROM inventory_items i
          JOIN categories c ON i.category_id = c.id
          WHERE i.id = ?
          `,
          [newItemId]
        );

        connection.release();
        res.status(201).json(newItem[0]);
        break;

      case "update":
        // Update an existing inventory item
        const {
          id: updateItemId,
          name: updateName,
          description: updateDescription,
          categoryId: updateCategoryId,
          sku: updateSku,
          quantityAvailable: updateQuantityAvailable,
          quantityReserved: updateQuantityReserved,
          location: updateLocation,
          imageUrl: updateImageUrl,
        } = req.body;

        // Validate required fields
        if (!updateItemId) {
          connection.release();
          return res.status(400).json({ message: "Item ID is required" });
        }

        // Check if the item exists
        const [existingItem] = await connection.query(
          "SELECT * FROM inventory_items WHERE id = ?",
          [updateItemId]
        );

        if (existingItem.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Item not found" });
        }

        // Build the update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (updateName !== undefined) {
          updateFields.push("name = ?");
          updateValues.push(updateName);
        }

        if (updateDescription !== undefined) {
          updateFields.push("description = ?");
          updateValues.push(updateDescription);
        }

        if (updateCategoryId !== undefined) {
          updateFields.push("category_id = ?");
          updateValues.push(updateCategoryId);
        }

        if (updateSku !== undefined) {
          updateFields.push("sku = ?");
          updateValues.push(updateSku);
        }

        if (updateQuantityAvailable !== undefined) {
          updateFields.push("quantity_available = ?");
          updateValues.push(updateQuantityAvailable);
        }

        if (updateQuantityReserved !== undefined) {
          updateFields.push("quantity_reserved = ?");
          updateValues.push(updateQuantityReserved);
        }

        if (updateLocation !== undefined) {
          updateFields.push("location = ?");
          updateValues.push(updateLocation);
        }

        if (updateImageUrl !== undefined) {
          updateFields.push("image_url = ?");
          updateValues.push(updateImageUrl);
        }

        // Add updated_at timestamp
        updateFields.push("updated_at = NOW()");

        // If no fields to update, return the existing item
        if (updateFields.length === 0) {
          connection.release();
          return res.status(400).json({ message: "No fields to update" });
        }

        // Execute the update query
        await connection.query(
          `UPDATE inventory_items SET ${updateFields.join(", ")} WHERE id = ?`,
          [...updateValues, updateItemId]
        );

        // Get the updated item with category name
        const [updatedItem] = await connection.query(
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
            i.image_url as imageUrl,
            i.created_at as createdAt,
            i.updated_at as updatedAt
          FROM inventory_items i
          JOIN categories c ON i.category_id = c.id
          WHERE i.id = ?
          `,
          [updateItemId]
        );

        connection.release();
        res.json(updatedItem[0]);
        break;

      case "delete":
        // Delete an inventory item
        const { id: deleteItemId } = req.body;

        if (!deleteItemId) {
          connection.release();
          return res.status(400).json({ message: "Item ID is required" });
        }

        // Check if the item exists
        const [itemToDelete] = await connection.query(
          "SELECT * FROM inventory_items WHERE id = ?",
          [deleteItemId]
        );

        if (itemToDelete.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Item not found" });
        }

        // Check if the item is referenced in any requests
        const [referencedRequests] = await connection.query(
          "SELECT COUNT(*) as count FROM item_requests WHERE inventory_item_id = ?",
          [deleteItemId]
        );

        if (referencedRequests[0].count > 0) {
          connection.release();
          return res.status(400).json({
            message: "Cannot delete item that is referenced in requests",
          });
        }

        // Delete the item
        await connection.query("DELETE FROM inventory_items WHERE id = ?", [
          deleteItemId,
        ]);

        connection.release();
        res.json({ message: "Item deleted successfully" });
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

// Handle users requests
app.post("/db/users", async (req, res) => {
  const { action } = req.body;
  console.log("Users request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        // Get all users
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

        connection.release();
        res.json(users);
        break;

      case "getById":
        // Get a specific user by ID
        const { id } = req.body;
        if (!id) {
          connection.release();
          return res.status(400).json({ message: "User ID is required" });
        }

        const [user] = await connection.query(
          `
          SELECT
            id,
            name,
            email,
            role,
            department,
            avatar_url as avatarUrl,
            created_at as createdAt
          FROM users
          WHERE id = ?
        `,
          [id]
        );

        if (user.length === 0) {
          connection.release();
          return res.status(404).json({ message: "User not found" });
        }

        connection.release();
        res.json(user[0]);
        break;

      case "create":
        // Create a new user
        const { name, email, password, role, department, avatarUrl } = req.body;

        // Validate required fields
        if (!name || !email || !role) {
          connection.release();
          return res
            .status(400)
            .json({ message: "Name, email, and role are required" });
        }

        // Check if email already exists
        const [existingEmail] = await connection.query(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );

        if (existingEmail.length > 0) {
          connection.release();
          return res.status(400).json({ message: "Email already exists" });
        }

        // Generate a new UUID for the user
        const newUserId = uuidv4();

        // Insert the new user
        await connection.query(
          `
          INSERT INTO users (
            id,
            name,
            email,
            role,
            department,
            avatar_url,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
          `,
          [newUserId, name, email, role, department || null, avatarUrl || null]
        );

        // Get the newly created user
        const [newUser] = await connection.query(
          `
          SELECT
            id,
            name,
            email,
            role,
            department,
            avatar_url as avatarUrl,
            created_at as createdAt
          FROM users
          WHERE id = ?
          `,
          [newUserId]
        );

        connection.release();
        res.status(201).json(newUser[0]);
        break;

      case "update":
        // Update an existing user
        const {
          id: updateUserId,
          name: updateName,
          email: updateEmail,
          password: updatePassword,
          role: updateRole,
          department: updateDepartment,
          avatarUrl: updateAvatarUrl,
        } = req.body;

        console.log("Update user request:", {
          updateUserId,
          updateName,
          updateEmail,
          updateRole,
          updateDepartment,
          updateAvatarUrl,
        });

        // Validate required fields
        if (!updateUserId) {
          connection.release();
          return res.status(400).json({ message: "User ID is required" });
        }

        // Check if the user exists
        const [existingUser] = await connection.query(
          "SELECT * FROM users WHERE id = ?",
          [updateUserId]
        );

        if (existingUser.length === 0) {
          connection.release();
          return res.status(404).json({ message: "User not found" });
        }

        // If email is changing, check if the new email already exists
        if (updateEmail && updateEmail !== existingUser[0].email) {
          const [existingEmailCheck] = await connection.query(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            [updateEmail, updateUserId]
          );

          if (existingEmailCheck.length > 0) {
            connection.release();
            return res.status(400).json({ message: "Email already exists" });
          }
        }

        // Build the update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (updateName !== undefined) {
          updateFields.push("name = ?");
          updateValues.push(updateName);
        }

        if (updateEmail !== undefined) {
          updateFields.push("email = ?");
          updateValues.push(updateEmail);
        }

        // Password field is not in the database yet
        // if (updatePassword !== undefined) {
        //   updateFields.push("password = ?");
        //   updateValues.push(updatePassword);
        // }

        if (updateRole !== undefined) {
          updateFields.push("role = ?");
          updateValues.push(updateRole);
        }

        if (updateDepartment !== undefined) {
          updateFields.push("department = ?");
          updateValues.push(updateDepartment);
        }

        if (updateAvatarUrl !== undefined) {
          updateFields.push("avatar_url = ?");
          updateValues.push(updateAvatarUrl);
        }

        // If no fields to update, return the existing user
        if (updateFields.length === 0) {
          connection.release();
          return res.status(400).json({ message: "No fields to update" });
        }

        // Execute the update query
        const updateQuery = `UPDATE users SET ${updateFields.join(
          ", "
        )} WHERE id = ?`;
        console.log("Update query:", updateQuery);
        console.log("Update values:", [...updateValues, updateUserId]);

        await connection.query(updateQuery, [...updateValues, updateUserId]);

        // Get the updated user
        const [updatedUser] = await connection.query(
          `
          SELECT
            id,
            name,
            email,
            role,
            department,
            avatar_url as avatarUrl,
            created_at as createdAt
          FROM users
          WHERE id = ?
          `,
          [updateUserId]
        );

        console.log("Updated user from database:", updatedUser[0]);

        connection.release();
        res.json(updatedUser[0]);
        break;

      case "delete":
        // Delete a user
        const { id: deleteUserId } = req.body;

        if (!deleteUserId) {
          connection.release();
          return res.status(400).json({ message: "User ID is required" });
        }

        // Check if the user exists
        const [userToDelete] = await connection.query(
          "SELECT * FROM users WHERE id = ?",
          [deleteUserId]
        );

        if (userToDelete.length === 0) {
          connection.release();
          return res.status(404).json({ message: "User not found" });
        }

        // Check if the user is referenced in any requests
        const [referencedRequests] = await connection.query(
          "SELECT COUNT(*) as count FROM item_requests WHERE user_id = ?",
          [deleteUserId]
        );

        if (referencedRequests[0].count > 0) {
          connection.release();
          return res.status(400).json({
            message: "Cannot delete user that has created requests",
          });
        }

        // Delete the user
        await connection.query("DELETE FROM users WHERE id = ?", [
          deleteUserId,
        ]);

        connection.release();
        res.json({ message: "User deleted successfully" });
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

// Handle categories requests
app.post("/db/categories", async (req, res) => {
  const { action } = req.body;
  console.log("Request body:", req.body);

  try {
    const connection = await pool.getConnection();

    switch (action) {
      case "getAll":
        // Get all categories
        const [categories] = await connection.query(`
          SELECT
            id,
            name,
            description
          FROM categories
          ORDER BY name
        `);

        // Get item counts for each category
        for (const category of categories) {
          const [countResult] = await connection.query(
            `SELECT COUNT(*) as count FROM inventory_items WHERE category_id = ?`,
            [category.id]
          );
          category.itemCount = countResult[0].count;
        }

        connection.release();
        res.json(categories);
        break;

      case "getById":
        // Get a specific category by ID
        const { id } = req.body;
        if (!id) {
          connection.release();
          return res.status(400).json({ message: "Category ID is required" });
        }

        const [category] = await connection.query(
          `
          SELECT
            id,
            name,
            description
          FROM categories
          WHERE id = ?
        `,
          [id]
        );

        if (category.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Category not found" });
        }

        // Get item count for the category
        const [countResult] = await connection.query(
          `SELECT COUNT(*) as count FROM inventory_items WHERE category_id = ?`,
          [id]
        );
        category[0].itemCount = countResult[0].count;

        connection.release();
        res.json(category[0]);
        break;

      case "create":
        // Create a new category
        const { name, description } = req.body;

        // Validate required fields
        if (!name) {
          connection.release();
          return res.status(400).json({ message: "Category name is required" });
        }

        // Generate a new UUID for the category
        const newCategoryId = uuidv4();

        // Insert the new category
        await connection.query(
          `
          INSERT INTO categories (
            id,
            name,
            description
          ) VALUES (?, ?, ?)
          `,
          [newCategoryId, name, description || null]
        );

        // Get the newly created category
        const [newCategory] = await connection.query(
          `
          SELECT
            id,
            name,
            description
          FROM categories
          WHERE id = ?
          `,
          [newCategoryId]
        );

        connection.release();
        res.status(201).json(newCategory[0]);
        break;

      case "update":
        // Update an existing category
        const {
          id: updateCategoryId,
          name: updateName,
          description: updateDescription,
        } = req.body;

        // Validate required fields
        if (!updateCategoryId) {
          connection.release();
          return res.status(400).json({ message: "Category ID is required" });
        }

        // Check if the category exists
        const [existingCategory] = await connection.query(
          "SELECT * FROM categories WHERE id = ?",
          [updateCategoryId]
        );

        if (existingCategory.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Category not found" });
        }

        // Build the update query dynamically
        const updateFields = [];
        const updateValues = [];

        if (updateName !== undefined) {
          updateFields.push("name = ?");
          updateValues.push(updateName);
        }

        if (updateDescription !== undefined) {
          updateFields.push("description = ?");
          updateValues.push(updateDescription);
        }

        // If no fields to update, return the existing category
        if (updateFields.length === 0) {
          connection.release();
          return res.status(400).json({ message: "No fields to update" });
        }

        // Execute the update query
        await connection.query(
          `UPDATE categories SET ${updateFields.join(", ")} WHERE id = ?`,
          [...updateValues, updateCategoryId]
        );

        // Get the updated category
        const [updatedCategory] = await connection.query(
          `
          SELECT
            id,
            name,
            description
          FROM categories
          WHERE id = ?
          `,
          [updateCategoryId]
        );

        connection.release();
        res.json(updatedCategory[0]);
        break;

      case "delete":
        // Delete a category
        const { id: deleteCategoryId } = req.body;

        if (!deleteCategoryId) {
          connection.release();
          return res.status(400).json({ message: "Category ID is required" });
        }

        // Check if the category exists
        const [categoryToDelete] = await connection.query(
          "SELECT * FROM categories WHERE id = ?",
          [deleteCategoryId]
        );

        if (categoryToDelete.length === 0) {
          connection.release();
          return res.status(404).json({ message: "Category not found" });
        }

        // Check if the category is referenced in any inventory items
        const [referencedItems] = await connection.query(
          "SELECT COUNT(*) as count FROM inventory_items WHERE category_id = ?",
          [deleteCategoryId]
        );

        if (referencedItems[0].count > 0) {
          connection.release();
          return res.status(400).json({
            message:
              "Cannot delete category that is referenced in inventory items",
          });
        }

        // Check if the category is referenced in any requests
        const [referencedRequests] = await connection.query(
          "SELECT COUNT(*) as count FROM item_requests WHERE category_id = ?",
          [deleteCategoryId]
        );

        if (referencedRequests[0].count > 0) {
          connection.release();
          return res.status(400).json({
            message: "Cannot delete category that is referenced in requests",
          });
        }

        // Delete the category
        await connection.query("DELETE FROM categories WHERE id = ?", [
          deleteCategoryId,
        ]);

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
