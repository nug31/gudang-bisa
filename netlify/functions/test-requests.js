const { Client } = require("pg");
const { v4: uuidv4 } = require("uuid");

// Get the Neon PostgreSQL connection string from environment variables
const connectionString = process.env.NEON_CONNECTION_STRING;

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  // Create a new client
  const client = new Client({
    connectionString,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log("Connected to Neon database");

    // Parse request body if present
    let requestBody = {};
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
      } catch (parseError) {
        console.error("Error parsing request body:", parseError);
      }
    }

    // Get the action from the request body or default to "test"
    const action = requestBody.action || "test";
    console.log(`Executing action: ${action}`);

    switch (action) {
      case "test": {
        // Test database connection and return basic info
        const result = {
          message: "Database connection test successful",
          timestamp: new Date().toISOString(),
          connectionString: connectionString ? "Provided" : "Missing",
          requestBody: requestBody,
        };

        // Test if the requests table exists
        try {
          const tableCheckQuery = `
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'requests'
            );
          `;
          const tableCheckResult = await client.query(tableCheckQuery);
          result.requestsTableExists = tableCheckResult.rows[0].exists;

          // If the table exists, get the column names
          if (result.requestsTableExists) {
            const columnsQuery = `
              SELECT column_name, data_type
              FROM information_schema.columns
              WHERE table_name = 'requests';
            `;
            const columnsResult = await client.query(columnsQuery);
            result.requestsTableColumns = columnsResult.rows;

            // Count the number of rows in the table
            const countQuery = `SELECT COUNT(*) FROM requests;`;
            const countResult = await client.query(countQuery);
            result.requestsTableRowCount = parseInt(
              countResult.rows[0].count,
              10
            );

            // Get a sample row if available
            if (result.requestsTableRowCount > 0) {
              const sampleQuery = `SELECT * FROM requests LIMIT 1;`;
              const sampleResult = await client.query(sampleQuery);
              result.sampleRow = sampleResult.rows[0];
            }
          }
        } catch (tableCheckError) {
          console.error("Error checking requests table:", tableCheckError);
          result.tableCheckError = tableCheckError.message;
        }

        // Test if the item_requests table exists
        try {
          const itemTableCheckQuery = `
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'item_requests'
            );
          `;
          const itemTableCheckResult = await client.query(itemTableCheckQuery);
          result.itemRequestsTableExists = itemTableCheckResult.rows[0].exists;

          // If the table exists, get the column names
          if (result.itemRequestsTableExists) {
            const itemColumnsQuery = `
              SELECT column_name, data_type
              FROM information_schema.columns
              WHERE table_name = 'item_requests';
            `;
            const itemColumnsResult = await client.query(itemColumnsQuery);
            result.itemRequestsTableColumns = itemColumnsResult.rows;

            // Count the number of rows in the table
            const itemCountQuery = `SELECT COUNT(*) FROM item_requests;`;
            const itemCountResult = await client.query(itemCountQuery);
            result.itemRequestsTableRowCount = parseInt(
              itemCountResult.rows[0].count,
              10
            );
          }
        } catch (itemTableCheckError) {
          console.error(
            "Error checking item_requests table:",
            itemTableCheckError
          );
          result.itemTableCheckError = itemTableCheckError.message;
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      }

      case "create-test-request": {
        // Create a test request in the requests table
        const id = uuidv4();
        const now = new Date().toISOString();
        const userId =
          requestBody.userId || "00000000-0000-0000-0000-000000000001";
        const itemId = requestBody.itemId || "1";
        const quantity = requestBody.quantity || 1;
        const title = requestBody.title || "Test Request";
        const description = requestBody.description || "This is a test request";

        try {
          // First, check if the item exists
          const itemCheckQuery = `
            SELECT EXISTS (
              SELECT 1 FROM inventory_items WHERE id = $1
            );
          `;
          const itemCheckResult = await client.query(itemCheckQuery, [itemId]);
          const itemExists = itemCheckResult.rows[0].exists;

          if (!itemExists) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                message: "Item not found",
                itemId,
                suggestion:
                  "Try using a valid item ID from the inventory_items table",
              }),
            };
          }

          // Check if the user exists
          const userCheckQuery = `
            SELECT EXISTS (
              SELECT 1 FROM users WHERE id = $1
            );
          `;
          const userCheckResult = await client.query(userCheckQuery, [userId]);
          const userExists = userCheckResult.rows[0].exists;

          if (!userExists) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                message: "User not found",
                userId,
                suggestion: "Try using a valid user ID from the users table",
              }),
            };
          }

          // Try to insert with a simpler query first
          const query = `
            INSERT INTO requests (id, title, description, status, user_id, item_id, quantity, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `;

          const values = [
            id,
            title,
            description,
            "pending",
            userId,
            itemId,
            quantity,
            now,
            now,
          ];

          console.log("Executing query:", query);
          console.log("With values:", values);

          try {
            const result = await client.query(query, values);

            return {
              statusCode: 201,
              headers,
              body: JSON.stringify({
                message: "Test request created successfully",
                request: result.rows[0],
              }),
            };
          } catch (insertError) {
            console.error("Error inserting request:", insertError);

            // Check the structure of the requests table
            const tableStructureQuery = `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_name = 'requests'
              ORDER BY ordinal_position;
            `;
            const tableStructure = await client.query(tableStructureQuery);

            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({
                message: "Error creating test request",
                error: insertError.message,
                tableStructure: tableStructure.rows,
                values: values,
                stack: insertError.stack,
              }),
            };
          }
        } catch (error) {
          console.error("Error in create-test-request:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error in create-test-request",
              error: error.message,
              stack: error.stack,
            }),
          };
        }
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid action" }),
        };
    }
  } catch (error) {
    console.error("Error in test-requests function:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  } finally {
    // Close the database connection
    await client.end();
  }
};
