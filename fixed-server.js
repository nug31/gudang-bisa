import express from "express";
import mysql from "mysql2/promise";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import mockPool from "./src/db/mock-db.js";
import fs from "fs";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create a log file for debugging
const logStream = fs.createWriteStream('./server-fixed.log', { flags: 'a' });

// Custom logging function
function logDebug(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  logStream.write(logMessage + '\n');
  
  if (data) {
    const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    console.log(dataStr);
    logStream.write(dataStr + '\n');
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Check if we should use mock database
const useMockDb = process.env.USE_MOCK_DB === "true";
logDebug(`Database mode: ${useMockDb ? "MOCK DATABASE" : "REAL DATABASE"}`);
logDebug("Database settings:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

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
    logDebug("Testing database connection");
    const connection = await pool.getConnection();
    logDebug("Database connected successfully");
    
    // Test a simple query
    try {
      const [result] = await connection.query("SELECT 1 as test");
      logDebug("Test query result:", result);
    } catch (queryError) {
      logDebug("Error executing test query:", queryError);
    }
    
    connection.release();
    res.json({ success: true, message: "Database connected successfully" });
  } catch (error) {
    logDebug("Error connecting to database:", error);
    res.status(500).json({
      success: false,
      message: "Error connecting to database",
      error: error.message,
      stack: error.stack
    });
  }
});

// Direct database access endpoint
app.post("/db/requests", async (req, res) => {
  const { action, id, request, comment } = req.body;
  logDebug("Request body for /db/requests:", req.body);

  try {
    logDebug("Getting database connection");
    const connection = await pool.getConnection();
    logDebug("Database connection obtained");

    switch (action) {
      case "getAll":
        // Get all requests
        logDebug("Getting all requests");
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
        logDebug(`Found ${requests.length} requests`);

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
        // Create a new request
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
        logDebug("Creating request with data:", {
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
          logDebug(`Checking inventory item ${inventoryItemId}`);
          // Check if there's enough available quantity
          const [inventoryItem] = await connection.query(
            `SELECT quantity_available, quantity_reserved FROM inventory_items WHERE id = ?`,
            [inventoryItemId]
          );

          if (inventoryItem.length === 0) {
            logDebug(`Inventory item ${inventoryItemId} not found`);
            connection.release();
            res.status(404).json({ message: "Inventory item not found" });
            return;
          }

          const availableQuantity = inventoryItem[0].quantity_available;
          logDebug(`Inventory item has ${availableQuantity} available, requesting ${quantity}`);

          if (availableQuantity < quantity) {
            logDebug(`Not enough quantity available: ${availableQuantity} < ${quantity}`);
            connection.release();
            res.status(400).json({
              message: "Not enough quantity available",
              availableQuantity,
              requestedQuantity: quantity,
            });
            return;
          }

          // Update the inventory item's stock
          logDebug(`Updating inventory item stock`);
          await connection.query(
            `UPDATE inventory_items
             SET quantity_available = quantity_available - ?,
                 quantity_reserved = quantity_reserved + ?
             WHERE id = ?`,
            [quantity, quantity, inventoryItemId]
          );

          logDebug(
            `Updated inventory item ${inventoryItemId}: Reserved ${quantity} items`
          );
        }

        // Insert the request
        logDebug("Inserting request into database");
        try {
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
          logDebug("Request inserted successfully", createResult);
        } catch (insertError) {
          logDebug("Error inserting request:", insertError);
          throw insertError;
        }

        // Get the created request
        logDebug("Retrieving created request");
        try {
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
          
          if (createdRequest.length === 0) {
            logDebug("Created request not found in database");
            // Return a fallback response with the request data
            const fallbackResponse = {
              ...request,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              message: "Request created but could not retrieve details"
            };
            logDebug("Sending fallback response:", fallbackResponse);
            connection.release();
            return res.json(fallbackResponse);
          }
          
          logDebug("Created request retrieved", createdRequest[0]);
          connection.release();
          return res.json(createdRequest[0]);
        } catch (selectError) {
          logDebug("Error retrieving created request:", selectError);
          // Return a fallback response with the request data
          const fallbackResponse = {
            ...request,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            message: "Request created but could not retrieve details"
          };
          logDebug("Sending fallback response due to error:", fallbackResponse);
          connection.release();
          return res.json(fallbackResponse);
        }
        break;

      default:
        connection.release();
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    logDebug("Error executing database operation:", error);
    logDebug("Request body:", req.body);

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

// Start the server
app.listen(PORT, () => {
  logDebug(`Server running on port ${PORT}`);
});

export default app;
