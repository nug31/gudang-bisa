const { Client } = require("pg");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

// Try to get the connection string from environment variables first
const envConnectionString = process.env.NEON_CONNECTION_STRING;
console.log(
  "Environment NEON_CONNECTION_STRING available:",
  !!envConnectionString
);
console.log("Environment variables:", Object.keys(process.env).join(", "));

// Use environment variable if available, otherwise use hardcoded connection string
const connectionString =
  envConnectionString ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
console.log(
  "Using connection string from:",
  envConnectionString ? "environment variable" : "hardcoded fallback"
);

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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

  // Allow both POST and GET requests
  if (event.httpMethod !== "POST" && event.httpMethod !== "GET") {
    console.log(
      `Received ${event.httpMethod} request, but only POST and GET are supported`
    );
    console.log(
      `Converting ${event.httpMethod} to POST for backward compatibility`
    );
    // Instead of rejecting, we'll treat all methods as POST for backward compatibility
    // This ensures our function works with both old and new API calls
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

  // Create a new client with optimized SSL configuration for Neon in serverless environment
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Neon PostgreSQL
    },
    keepAlive: false, // Disable keep-alive in serverless environment
    statement_timeout: 10000, // Statement timeout to 10 seconds
    query_timeout: 10000, // Query timeout to 10 seconds
    connectionTimeoutMillis: 10000, // Connection timeout to 10 seconds
    idle_in_transaction_session_timeout: 10000, // Idle timeout to 10 seconds
  });

  console.log(
    "Created Postgres client with optimized connection settings for Netlify"
  );

  try {
    // Connect to the database with enhanced retry logic
    let connected = false;
    let retryCount = 0;
    const maxRetries = 5; // Increased max retries

    while (!connected && retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to connect to Neon database...`);
        console.log(
          `Connection string first 20 chars: ${connectionString.substring(
            0,
            20
          )}...`
        );
        console.log(`Connection string length: ${connectionString.length}`);
        console.log(`SSL config:`, JSON.stringify(client.ssl));

        // Set a timeout for the connection attempt
        const connectPromise = client.connect();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout after 15 seconds")),
            15000
          )
        );

        // Race the connection against the timeout
        await Promise.race([connectPromise, timeoutPromise]);

        connected = true;
        console.log("Successfully connected to Neon database");

        // Verify connection with a simple query
        const testResult = await client.query("SELECT NOW()");
        console.log(
          `Connection verified with timestamp: ${testResult.rows[0].now}`
        );
      } catch (connectError) {
        retryCount++;
        console.error(
          `Connection attempt ${retryCount} failed:`,
          connectError.message
        );
        console.error(`Error details:`, {
          code: connectError.code,
          detail: connectError.detail,
          hint: connectError.hint,
          position: connectError.position,
          internalPosition: connectError.internalPosition,
          internalQuery: connectError.internalQuery,
          where: connectError.where,
          schema: connectError.schema,
          table: connectError.table,
          column: connectError.column,
          dataType: connectError.dataType,
          constraint: connectError.constraint,
          file: connectError.file,
          line: connectError.line,
          routine: connectError.routine,
        });

        if (retryCount >= maxRetries) {
          console.error("All connection attempts failed, giving up");
          throw new Error(
            `Failed to connect to database after ${maxRetries} attempts: ${connectError.message}`
          );
        }

        // Wait before retrying (exponential backoff with jitter)
        const baseDelay = Math.pow(2, retryCount) * 1000;
        const jitter = Math.floor(Math.random() * 1000);
        const delay = baseDelay + jitter;
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
        console.log(`Request timestamp: ${new Date().toISOString()}`);
        console.log(`Request body:`, JSON.stringify(requestBody));

        try {
          // First check if the item_requests table exists
          console.log("Checking if item_requests table exists...");
          const tableCheckQuery = `
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = 'public'
              AND table_name = 'item_requests'
            );
          `;

          const tableCheckResult = await client.query(tableCheckQuery);
          const tableExists = tableCheckResult.rows[0].exists;

          console.log(`item_requests table exists: ${tableExists}`);

          if (!tableExists) {
            console.error(
              "item_requests table does not exist! Creating it now..."
            );

            // Create the item_requests table
            const createTableQuery = `
              CREATE TABLE IF NOT EXISTS item_requests (
                id UUID PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category_id UUID NOT NULL,
                priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
                status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'fulfilled')),
                user_id UUID NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                total_cost DECIMAL(10,2),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMP WITH TIME ZONE,
                approved_by UUID,
                rejected_at TIMESTAMP WITH TIME ZONE,
                rejected_by UUID,
                rejection_reason TEXT,
                fulfillment_date TIMESTAMP WITH TIME ZONE
              );
            `;

            try {
              await client.query(createTableQuery);
              console.log("Successfully created item_requests table");
            } catch (createError) {
              console.error("Error creating item_requests table:", createError);
              return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                  message: "Failed to create item_requests table",
                  success: false,
                  error: createError.message,
                }),
              };
            }
          }

          // Check the structure of the item_requests table
          console.log("Checking item_requests table structure...");
          const tableStructureQuery = `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'item_requests'
            ORDER BY ordinal_position;
          `;

          const tableStructureResult = await client.query(tableStructureQuery);
          console.log(
            "Table structure:",
            JSON.stringify(tableStructureResult.rows)
          );
        } catch (schemaError) {
          console.error("Error checking database schema:", schemaError);
          // Continue anyway as this is just diagnostic
        }

        let query = `
          SELECT r.*,
                 u.name as requester_name,
                 u.email as requester_email,
                 c.name as category_name
          FROM item_requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN categories c ON r.category_id = c.id
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

        console.log("Executing query:", query);
        console.log("Query parameters:", queryParams);

        try {
          const result = await client.query(query, queryParams);

          // Log the number of requests found
          if (result.rows.length === 0) {
            console.log("No requests found in the database");
          } else {
            console.log(`Found ${result.rows.length} requests in the database`);
            console.log("First request:", JSON.stringify(result.rows[0]));
          }

          // Make sure we're returning an array of requests
          const requestsArray = Array.isArray(result.rows) ? result.rows : [];

          console.log(
            `Returning ${requestsArray.length} requests in the expected format`
          );

          // Log more detailed information about the requests
          if (requestsArray.length > 0) {
            console.log("First request:", JSON.stringify(requestsArray[0]));
            console.log(
              "Request statuses:",
              requestsArray.map((r) => r.status)
            );
            console.log(
              "Request IDs:",
              requestsArray.map((r) => r.id)
            );
          } else {
            console.warn("No requests found in the database to return");
          }

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
        } catch (queryError) {
          console.error("Error executing query:", queryError);
          console.error("Error details:", {
            code: queryError.code,
            detail: queryError.detail,
            hint: queryError.hint,
            position: queryError.position,
            internalPosition: queryError.internalPosition,
            internalQuery: queryError.internalQuery,
            where: queryError.where,
            schema: queryError.schema,
            table: queryError.table,
            column: queryError.column,
            dataType: queryError.dataType,
            constraint: queryError.constraint,
            file: queryError.file,
            line: queryError.line,
            routine: queryError.routine,
          });

          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error retrieving requests",
              error: queryError.message,
              success: false,
            }),
          };
        }
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
                 c.name as category_name
          FROM item_requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN categories c ON r.category_id = c.id
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
        console.log("Create request received at:", new Date().toISOString());
        console.log("Request body:", JSON.stringify(requestBody, null, 2));

        // Extract data from either the top-level fields or the request object
        const request = requestBody.request || {};

        // Log the full request object for debugging
        console.log("Request object:", JSON.stringify(request, null, 2));

        // Extract all possible field variations to handle different client formats
        const userId = requestBody.userId || request.userId || request.user_id;

        // Extract and validate itemId (must be a valid UUID or null)
        let rawItemId =
          requestBody.itemId ||
          request.itemId ||
          request.inventoryItemId ||
          request.inventory_item_id;
        let itemId = null;

        // Validate UUID format if itemId is provided and not null
        if (rawItemId) {
          // Check if it's a valid UUID
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(rawItemId)) {
            itemId = rawItemId;
          } else {
            console.warn(
              `Invalid UUID format for inventory_item_id: "${rawItemId}". Setting to null.`
            );
            // Don't throw an error, just set to null
          }
        }

        const quantity = requestBody.quantity || request.quantity || 1;
        const reason =
          requestBody.reason || request.reason || request.description;
        let title = request.title || request.projectName || `Request for Item`;
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

        // Validate required fields
        if (!userId) {
          console.error("Missing required field: userId");
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              message: "User ID is required",
              receivedData: requestBody,
              success: false,
              error: "MISSING_USER_ID",
            }),
          };
        }

        // Generate a UUID if not provided
        const id = request.id || uuidv4();
        console.log("Using request ID:", id);
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

          // First, check the table schema to see what columns exist
          console.log("Checking item_requests table schema...");
          const schemaQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'item_requests'
            ORDER BY ordinal_position
          `;

          const schemaResult = await client.query(schemaQuery);
          const columns = schemaResult.rows.map((row) => row.column_name);
          console.log("Available columns in item_requests table:", columns);

          // Determine if we should use inventory_item_id or item_id
          let itemIdColumn = null;
          if (columns.includes("inventory_item_id")) {
            itemIdColumn = "inventory_item_id";
          } else if (columns.includes("item_id")) {
            itemIdColumn = "item_id";
          }

          console.log(`Using ${itemIdColumn} as the item ID column`);

          // Check if the category_id column exists
          const hasCategoryId = columns.includes("category_id");
          console.log(`category_id column exists: ${hasCategoryId}`);

          // Build a more comprehensive query that handles all possible fields
          let query;
          let values;

          // Create a table if it doesn't exist
          if (columns.length === 0) {
            console.log(
              "item_requests table doesn't exist or has no columns, creating it..."
            );
            const createTableQuery = `
              CREATE TABLE IF NOT EXISTS item_requests (
                id UUID PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category_id UUID,
                priority VARCHAR(20) NOT NULL DEFAULT 'medium',
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                user_id UUID NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                inventory_item_id UUID,
                item_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              )
            `;
            await client.query(createTableQuery);
            console.log("item_requests table created successfully");

            // Now the table exists with inventory_item_id column
            itemIdColumn = "inventory_item_id";
          } else {
            // Check if inventory_item_id column exists, if not add it
            if (!columns.includes("inventory_item_id")) {
              console.log(
                "inventory_item_id column doesn't exist, adding it..."
              );
              const addColumnQuery = `
                ALTER TABLE item_requests
                ADD COLUMN inventory_item_id UUID
              `;
              await client.query(addColumnQuery);
              console.log("inventory_item_id column added successfully");

              // Update columns list
              columns.push("inventory_item_id");
              itemIdColumn = "inventory_item_id";
            }

            // Check if item_id column exists, if not add it
            if (!columns.includes("item_id")) {
              console.log("item_id column doesn't exist, adding it...");
              const addColumnQuery = `
                ALTER TABLE item_requests
                ADD COLUMN item_id UUID
              `;
              await client.query(addColumnQuery);
              console.log("item_id column added successfully");

              // Update columns list
              columns.push("item_id");
            }
          }

          // Build the query based on available columns
          const queryFields = [
            "id",
            "title",
            "description",
            "status",
            "user_id",
            "quantity",
            "priority",
            "created_at",
            "updated_at",
          ];
          const queryValues = [
            id,
            title,
            description,
            status,
            userId,
            quantity,
            priority,
            now,
            now,
          ];
          const placeholders = [
            "$1",
            "$2",
            "$3",
            "$4",
            "$5",
            "$6",
            "$7",
            "$8",
            "$9",
          ];
          let paramIndex = 10;

          // Add category_id if it exists
          if (hasCategoryId && categoryId) {
            queryFields.push("category_id");
            queryValues.push(categoryId);
            placeholders.push(`$${paramIndex++}`);
          }

          // Add item_id or inventory_item_id if it exists
          if (itemIdColumn && itemId) {
            queryFields.push(itemIdColumn);
            queryValues.push(itemId);
            placeholders.push(`$${paramIndex++}`);
          }

          // Construct the final query
          query = `
            INSERT INTO item_requests (
              ${queryFields.join(", ")}
            )
            VALUES (${placeholders.join(", ")})
            RETURNING *
          `;

          values = queryValues;

          console.log("Executing query with values:", values);

          // Set a timeout for the query execution
          let queryResult;
          try {
            const queryPromise = client.query(query, values);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Query timeout after 15 seconds")),
                15000
              )
            );

            // Race the query against the timeout
            queryResult = await Promise.race([queryPromise, timeoutPromise]);
            console.log("Query executed successfully");
          } catch (queryTimeoutError) {
            console.error(
              "Query execution timed out:",
              queryTimeoutError.message
            );
            throw new Error(`Query timed out: ${queryTimeoutError.message}`);
          }

          if (
            !queryResult ||
            !queryResult.rows ||
            queryResult.rows.length === 0
          ) {
            console.error("Query returned no results");
            throw new Error("Query returned no results");
          }

          console.log("Query result:", queryResult.rows[0]);

          // Create a more complete response
          const createdRequest = queryResult.rows[0];
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
              ...createdRequest,
              success: true,
              message: "Request created successfully",
            }),
          };
        } catch (error) {
          console.error("Error creating request:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code || "UNKNOWN",
            detail: error.detail || "No additional details",
            hint: error.hint || "No hint available",
            stack: error.stack,
          });

          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error creating request",
              error: error.message,
              detail: error.detail || "No additional details",
              hint: error.hint || "No hint available",
              code: error.code || "UNKNOWN",
              success: false,
              timestamp: new Date().toISOString(),
            }),
          };
        }
      }

      case "update": {
        console.log("Update request received at:", new Date().toISOString());
        console.log("Request body:", JSON.stringify(requestBody, null, 2));

        // Extract data from either the top-level fields or the request object
        const request = requestBody.request || {};

        // Log the full request object for debugging
        console.log("Request object:", JSON.stringify(request, null, 2));

        // Extract all possible field variations to handle different client formats
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
        const title = request.title || request.projectName;
        const description = request.description;
        const priority = request.priority;
        const quantity = request.quantity;
        const categoryId = request.categoryId || request.category_id;

        // Extract and validate inventoryItemId (must be a valid UUID or null)
        let rawInventoryItemId =
          request.inventoryItemId || request.inventory_item_id;
        let inventoryItemId = null;

        // Validate UUID format if inventoryItemId is provided and not null
        if (rawInventoryItemId) {
          // Check if it's a valid UUID
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(rawInventoryItemId)) {
            inventoryItemId = rawInventoryItemId;
          } else {
            console.warn(
              `Invalid UUID format for inventory_item_id: "${rawInventoryItemId}". Setting to null.`
            );
            // Don't throw an error, just set to null
          }
        }

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
          inventoryItemId,
        });

        // Validate required fields
        if (!id) {
          console.error("Missing required field: id");
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              message: "Request ID is required",
              receivedData: requestBody,
              success: false,
              error: "MISSING_REQUEST_ID",
            }),
          };
        }

        // First, check if the request exists
        try {
          console.log(`Checking if request with ID ${id} exists...`);
          const checkQuery = "SELECT id FROM item_requests WHERE id = $1";
          const checkResult = await client.query(checkQuery, [id]);

          if (checkResult.rows.length === 0) {
            console.error(`Request with ID ${id} not found in database`);
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({
                message: "Request not found",
                requestId: id,
                success: false,
                error: "REQUEST_NOT_FOUND",
              }),
            };
          }

          console.log(`Request with ID ${id} found, proceeding with update`);
        } catch (checkError) {
          console.error("Error checking if request exists:", checkError);
          throw new Error(
            `Failed to check if request exists: ${checkError.message}`
          );
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

        // Check if we need to update the item ID
        if (inventoryItemId) {
          // First, check the table schema to see what columns exist
          console.log("Checking item_requests table schema for update...");
          const schemaQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'item_requests'
            ORDER BY ordinal_position
          `;

          const schemaResult = await client.query(schemaQuery);
          const columns = schemaResult.rows.map((row) => row.column_name);
          console.log("Available columns in item_requests table:", columns);

          // Determine if we should use inventory_item_id or item_id
          const itemIdColumn = columns.includes("inventory_item_id")
            ? "inventory_item_id"
            : columns.includes("item_id")
            ? "item_id"
            : "inventory_item_id";

          console.log(`Using ${itemIdColumn} as the item ID column for update`);

          query += `, ${itemIdColumn} = $${paramIndex++}`;
          values.push(inventoryItemId);
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        values.push(id);

        console.log("Executing update query:", query);
        console.log("With values:", values);

        try {
          // Set a timeout for the query execution
          let queryResult;
          try {
            const queryPromise = client.query(query, values);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Query timeout after 15 seconds")),
                15000
              )
            );

            // Race the query against the timeout
            queryResult = await Promise.race([queryPromise, timeoutPromise]);
            console.log("Update query executed successfully");
          } catch (queryTimeoutError) {
            console.error(
              "Update query execution timed out:",
              queryTimeoutError.message
            );
            throw new Error(
              `Update query timed out: ${queryTimeoutError.message}`
            );
          }

          if (
            !queryResult ||
            !queryResult.rows ||
            queryResult.rows.length === 0
          ) {
            console.error("Update query returned no results");
            throw new Error("Update query returned no results");
          }

          console.log("Update successful, returning:", queryResult.rows[0]);

          // Create a more complete response
          const updatedRequest = queryResult.rows[0];
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              ...updatedRequest,
              success: true,
              message: "Request updated successfully",
              timestamp: new Date().toISOString(),
            }),
          };
        } catch (error) {
          console.error("Error updating request:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code || "UNKNOWN",
            detail: error.detail || "No additional details",
            hint: error.hint || "No hint available",
            stack: error.stack,
          });

          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error updating request",
              error: error.message,
              detail: error.detail || "No additional details",
              hint: error.hint || "No hint available",
              code: error.code || "UNKNOWN",
              success: false,
              timestamp: new Date().toISOString(),
              requestId: id,
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
