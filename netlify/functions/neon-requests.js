const { Client } = require("pg");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

// Always use the hardcoded connection string for reliability in Netlify functions
const connectionString =
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
console.log("Using hardcoded connection string for reliability");

// Log connection string details (safely)
console.log("Neon connection string available:", !!connectionString);
console.log(
  "Connection string length:",
  connectionString ? connectionString.length : 0
);
console.log(
  "Connection string first 20 chars:",
  connectionString ? connectionString.substring(0, 20) + "..." : "N/A"
);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
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

  // Parse the request body
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Invalid request body" }),
    };
  }

  const { action } = requestBody;
  console.log(`Request action: ${action}, timestamp: ${Date.now()}`);

  // Create a new client with explicit SSL configuration for Neon
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Neon PostgreSQL
    },
    keepAlive: true, // Enable keep-alive to prevent connection timeouts
    statement_timeout: 10000, // Set statement timeout to 10 seconds
    query_timeout: 10000, // Set query timeout to 10 seconds
    connectionTimeoutMillis: 10000, // Set connection timeout to 10 seconds
    idle_in_transaction_session_timeout: 10000, // Set idle timeout to 10 seconds
  });

  console.log("Created Postgres client with enhanced connection settings");

  try {
    // Connect to the database with retry logic
    let connected = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!connected && retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to connect to Neon database...`);
        await client.connect();
        connected = true;
        console.log("Successfully connected to Neon database");
      } catch (connectError) {
        retryCount++;
        console.error(
          `Connection attempt ${retryCount} failed:`,
          connectError.message
        );

        if (retryCount >= maxRetries) {
          throw new Error(
            `Failed to connect to database after ${maxRetries} attempts: ${connectError.message}`
          );
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Handle different actions
    switch (action) {
      case "getAll": {
        const { userId, status } = requestBody;
        console.log(
          `Handling getAll request with userId: ${userId}, status: ${status}`
        );

        let query = `
          SELECT r.*,
                 u.name as requester_name,
                 u.email as requester_email,
                 i.name as item_name,
                 i.description as item_description,
                 i.image_url as item_image_url,
                 c.name as category_name
          FROM item_requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN inventory_items i ON r.inventory_item_id = i.id
          LEFT JOIN categories c ON i.category_id = c.id
        `;

        const queryParams = [];
        const conditions = [];

        if (userId) {
          conditions.push(`r.user_id = $${queryParams.length + 1}`);
          queryParams.push(userId);
        }

        if (status) {
          conditions.push(`r.status = $${queryParams.length + 1}`);
          queryParams.push(status);
        }

        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += " ORDER BY r.created_at DESC";

        const result = await client.query(query, queryParams);

        // If no results, return mock data for development
        if (result.rows.length === 0) {
          console.log("No requests found, returning 20 mock requests");

          // Generate 20 mock requests
          const mockRequests = Array.from({ length: 20 }, (_, i) => {
            const id = `Auto-generated Request ${Math.random()
              .toString(36)
              .substring(2, 10)}`;
            return {
              id,
              title: `Request for Office Supplies ${i + 1}`,
              description: `This is a mock request for testing purposes ${
                i + 1
              }`,
              status: ["pending", "approved", "rejected"][
                Math.floor(Math.random() * 3)
              ],
              user_id: "00000000-0000-0000-0000-000000000001",
              requester_name: "Mock User",
              requester_email: "mock@example.com",
              item_id: "00000000-0000-0000-0000-000000000001",
              item_name: `Mock Item ${i + 1}`,
              item_description: `This is a mock item for testing purposes ${
                i + 1
              }`,
              category_name: ["Office", "Cleaning", "Hardware", "Other"][
                Math.floor(Math.random() * 4)
              ],
              quantity: Math.floor(Math.random() * 10) + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          });

          console.log(
            `Returning ${mockRequests.length} mock requests in the expected format`
          );
          console.log("Mock response format:", {
            requests: "Array of mock requests",
            totalRequests: mockRequests.length,
            success: true,
            isMock: true,
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              requests: mockRequests,
              totalRequests: mockRequests.length,
              success: true,
              isMock: true,
            }),
          };
        }

        // Make sure we're returning an array of requests
        const requestsArray = Array.isArray(result.rows) ? result.rows : [];

        console.log(
          `Returning ${requestsArray.length} requests in the expected format`
        );
        console.log("Response format:", {
          requests: "Array of requests",
          totalRequests: requestsArray.length,
          success: true,
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            requests: requestsArray,
            totalRequests: requestsArray.length,
            success: true,
          }),
        };
      }

      case "getById": {
        const { id } = requestBody;

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Request ID is required" }),
          };
        }

        const query = `
          SELECT r.*,
                 u.name as requester_name,
                 u.email as requester_email,
                 i.name as item_name,
                 i.description as item_description,
                 i.image_url as item_image_url,
                 c.name as category_name
          FROM item_requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN inventory_items i ON r.inventory_item_id = i.id
          LEFT JOIN categories c ON i.category_id = c.id
          WHERE r.id = $1
        `;

        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Request not found" }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0]),
        };
      }

      case "create": {
        console.log("Create request received:", requestBody);

        // Extract data from either the top-level fields or the request object
        const request = requestBody.request || {};
        const userId = requestBody.userId || request.userId;
        const itemId =
          requestBody.itemId || request.itemId || request.inventoryItemId;
        const quantity = requestBody.quantity || request.quantity || 1;
        const reason =
          requestBody.reason || request.reason || request.description;
        let title = request.title || `Request for Item`;
        let description = reason || `Request for item`;
        const priority = request.priority || "medium";
        const categoryId = request.categoryId || request.category_id || null;
        const status = request.status || "pending";

        console.log("Extracted request data:", {
          userId,
          itemId,
          quantity,
          reason,
          title,
          description,
          priority,
          categoryId,
          status,
        });

        if (!userId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              message: "User ID is required",
              receivedData: requestBody,
            }),
          };
        }

        // Generate a UUID if not provided
        const id = request.id || uuidv4();
        const now = new Date().toISOString();

        try {
          // Check if the item exists if itemId is provided
          if (itemId) {
            const itemQuery = "SELECT name FROM inventory_items WHERE id = $1";
            const itemResult = await client.query(itemQuery, [itemId]);

            // If item exists, use its name in the title/description if not already provided
            if (itemResult.rows.length > 0) {
              const itemName = itemResult.rows[0].name;
              if (!request.title) {
                title = `Request for ${itemName}`;
              }
              if (!reason && !request.description) {
                description = `Request for ${quantity} ${itemName}`;
              }
            }
          }

          // Build a more comprehensive query that handles all possible fields
          const query = `
            INSERT INTO item_requests (
              id,
              title,
              description,
              status,
              user_id,
              inventory_item_id,
              quantity,
              priority,
              category_id,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `;

          const values = [
            id,
            title,
            description,
            status,
            userId,
            itemId,
            quantity,
            priority,
            categoryId,
            now,
            now,
          ];

          console.log("Executing query with values:", values);
          const result = await client.query(query, values);
          console.log("Query result:", result.rows[0]);

          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(result.rows[0]),
          };
        } catch (error) {
          console.error("Error creating request:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error creating request",
              error: error.message,
              detail: error.detail,
              hint: error.hint,
              code: error.code,
            }),
          };
        }
      }

      case "update": {
        console.log("Update request received:", requestBody);

        // Extract data from either the top-level fields or the request object
        const request = requestBody.request || {};
        const id = requestBody.id || request.id;
        const status = requestBody.status || request.status;
        const adminComment =
          requestBody.adminComment ||
          request.adminComment ||
          request.admin_comment;
        const approvedBy = request.approvedBy || request.approved_by;
        const rejectedBy = request.rejectedBy || request.rejected_by;
        const rejectionReason =
          request.rejectionReason || request.rejection_reason;
        const title = request.title;
        const description = request.description;
        const priority = request.priority;
        const quantity = request.quantity;
        const categoryId = request.categoryId || request.category_id;

        console.log("Extracted update data:", {
          id,
          status,
          adminComment,
          approvedBy,
          rejectedBy,
          rejectionReason,
          title,
          description,
          priority,
          quantity,
          categoryId,
        });

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              message: "Request ID is required",
              receivedData: requestBody,
            }),
          };
        }

        const now = new Date().toISOString();
        let query = `
          UPDATE item_requests
          SET updated_at = $1
        `;

        const values = [now];
        let paramIndex = 2;

        // Add fields to update only if they are provided
        if (status) {
          query += `, status = $${paramIndex++}`;
          values.push(status);
        }

        if (adminComment) {
          query += `, admin_comment = $${paramIndex++}`;
          values.push(adminComment);
        }

        if (approvedBy) {
          query += `, approved_by = $${paramIndex++}, approved_at = $${paramIndex++}`;
          values.push(approvedBy, now);
        }

        if (rejectedBy) {
          query += `, rejected_by = $${paramIndex++}, rejected_at = $${paramIndex++}`;
          values.push(rejectedBy, now);
        }

        if (rejectionReason) {
          query += `, rejection_reason = $${paramIndex++}`;
          values.push(rejectionReason);
        }

        if (title) {
          query += `, title = $${paramIndex++}`;
          values.push(title);
        }

        if (description) {
          query += `, description = $${paramIndex++}`;
          values.push(description);
        }

        if (priority) {
          query += `, priority = $${paramIndex++}`;
          values.push(priority);
        }

        if (quantity) {
          query += `, quantity = $${paramIndex++}`;
          values.push(quantity);
        }

        if (categoryId) {
          query += `, category_id = $${paramIndex++}`;
          values.push(categoryId);
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        values.push(id);

        console.log("Executing update query:", query);
        console.log("With values:", values);

        try {
          const result = await client.query(query, values);

          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ message: "Request not found" }),
            };
          }

          console.log("Update successful, returning:", result.rows[0]);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result.rows[0]),
          };
        } catch (error) {
          console.error("Error updating request:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error updating request",
              error: error.message,
              detail: error.detail,
              hint: error.hint,
              code: error.code,
            }),
          };
        }
      }

      case "delete": {
        const { id } = requestBody;

        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Request ID is required" }),
          };
        }

        const query = "DELETE FROM item_requests WHERE id = $1 RETURNING id";
        const result = await client.query(query, [id]);

        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Request not found" }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: "Request deleted successfully" }),
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
    console.error("Error handling request:", error);

    // Provide more detailed error information for debugging
    const errorMessage = error.message || "Unknown error";
    const errorCode = error.code || "UNKNOWN";
    const errorStack = error.stack || "";

    console.error("Error details:");
    console.error(`- Message: ${errorMessage}`);
    console.error(`- Code: ${errorCode}`);
    console.error(`- Stack: ${errorStack}`);

    // Return a more informative error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Internal server error",
        error: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        action: action || "unknown",
      }),
    };
  } finally {
    // Close the client connection
    try {
      if (client) {
        console.log("Closing database connection...");
        await client.end();
        console.log("Database connection closed successfully");
      }
    } catch (closeError) {
      console.error("Error closing client connection:", closeError);
    }
  }
};
