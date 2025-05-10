const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

// Initialize Neon PostgreSQL client
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    // Parse request body
    const data = JSON.parse(event.body);

    // Validate action
    if (!data.action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Action is required" }),
      };
    }

    const action = data.action;

    switch (action) {
      case "getAll":
        try {
          console.log("Fetching all item requests from Neon database");
          const userId = data.userId; // Optional filter by user ID
          const timestamp = data.timestamp; // For cache busting

          console.log(
            `Request parameters: userId=${userId}, timestamp=${timestamp}`
          );

          const client = await pool.connect();

          // Build the query
          let queryText = `
            SELECT
              ir.id,
              ir.title,
              ir.description,
              ir.status,
              ir.priority,
              ir.user_id,
              ir.category_id,
              ir.quantity,
              ir.total_cost,
              ir.created_at,
              ir.updated_at,
              ir.approved_at,
              ir.approved_by,
              ir.rejected_at,
              ir.rejected_by,
              ir.rejection_reason,
              ir.fulfillment_date,
              c.id as category_id,
              c.name as category_name
            FROM
              item_requests ir
            LEFT JOIN
              categories c ON ir.category_id = c.id
          `;

          const queryParams = [];

          // Add user filter if provided
          if (userId) {
            queryText += " WHERE ir.user_id = $1";
            queryParams.push(userId);
          }

          queryText += " ORDER BY ir.created_at DESC";

          console.log("Executing query:", queryText);
          console.log("Query parameters:", queryParams);

          const result = await client.query(queryText, queryParams);

          // Format the results to match the expected format
          const formattedRequests = result.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category_id,
            categoryName: row.category_name,
            priority: row.priority,
            status: row.status,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            approvedAt: row.approved_at,
            approvedBy: row.approved_by,
            rejectedAt: row.rejected_at,
            rejectedBy: row.rejected_by,
            rejectionReason: row.rejection_reason,
            fulfillmentDate: row.fulfillment_date,
            quantity: row.quantity,
            totalCost: row.total_cost,
          }));

          console.log(`Retrieved ${formattedRequests.length} item requests`);

          // Get comments for each request (in a single query for better performance)
          if (formattedRequests.length > 0) {
            const requestIds = formattedRequests.map((r) => r.id);

            // Build a parameterized query with all request IDs
            const placeholders = requestIds
              .map((_, i) => `$${i + 1}`)
              .join(",");
            const commentsQuery = `
              SELECT
                id,
                item_request_id as request_id,
                user_id,
                content,
                created_at
              FROM
                comments
              WHERE
                item_request_id IN (${placeholders})
              ORDER BY
                created_at ASC
            `;

            const commentsResult = await client.query(
              commentsQuery,
              requestIds
            );

            // Group comments by request ID
            const commentsByRequestId = {};
            commentsResult.rows.forEach((comment) => {
              if (!commentsByRequestId[comment.request_id]) {
                commentsByRequestId[comment.request_id] = [];
              }
              commentsByRequestId[comment.request_id].push({
                id: comment.id,
                requestId: comment.request_id,
                userId: comment.user_id,
                content: comment.content,
                createdAt: comment.created_at,
              });
            });

            // Add comments to each request
            formattedRequests.forEach((request) => {
              request.comments = commentsByRequestId[request.id] || [];
            });

            console.log(
              `Retrieved comments for ${
                Object.keys(commentsByRequestId).length
              } requests`
            );
          }

          client.release();

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(formattedRequests),
          };
        } catch (error) {
          console.error("Error fetching item requests:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error fetching requests",
              error: error.message,
            }),
          };
        }

      case "getById":
        // Validate ID
        if (!data.id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Request ID is required" }),
          };
        }

        const id = data.id;

        // Get request by ID
        const { data: request, error: requestError } = await supabase
          .from("item_requests")
          .select(
            `
            id,
            title,
            description,
            category_id,
            priority,
            status,
            user_id,
            created_at,
            updated_at,
            approved_at,
            approved_by,
            rejected_at,
            rejected_by,
            rejection_reason,
            fulfillment_date,
            quantity,
            categories (id, name)
          `
          )
          .eq("id", id)
          .single();

        if (requestError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              message: "Request not found",
              error: requestError.message,
            }),
          };
        }

        // Format the request to match the expected format
        const formattedRequest = {
          id: request.id,
          title: request.title,
          description: request.description,
          category: request.categories.id,
          priority: request.priority,
          status: request.status,
          userId: request.user_id,
          createdAt: request.created_at,
          updatedAt: request.updated_at,
          approvedAt: request.approved_at,
          approvedBy: request.approved_by,
          rejectedAt: request.rejected_at,
          rejectedBy: request.rejected_by,
          rejectionReason: request.rejection_reason,
          fulfillmentDate: request.fulfillment_date,
          quantity: request.quantity,
        };

        // Get comments for the request
        const { data: comments, error: commentsError } = await supabase
          .from("comments")
          .select("id, request_id, user_id, content, created_at")
          .eq("request_id", id);

        if (!commentsError) {
          formattedRequest.comments = comments.map((comment) => ({
            id: comment.id,
            requestId: comment.request_id,
            userId: comment.user_id,
            content: comment.content,
            createdAt: comment.created_at,
          }));
        } else {
          formattedRequest.comments = [];
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedRequest),
        };

      case "create":
        try {
          // Check for direct parameters first (for compatibility with neon-requests.js)
          const userId = data.userId || (data.request && data.request.userId);
          const itemId =
            data.itemId ||
            (data.request &&
              (data.request.itemId || data.request.inventoryItemId));
          const quantity =
            data.quantity || (data.request && data.request.quantity) || 1;
          const reason =
            data.reason ||
            (data.request &&
              (data.request.reason || data.request.description)) ||
            "";

          // If we have direct parameters, use them to create a request
          if (userId && itemId) {
            console.log("Creating request with direct parameters:", {
              userId,
              itemId,
              quantity,
              reason,
            });

            const client = await pool.connect();

            // Get the item details
            const itemQuery =
              "SELECT name, category_id FROM inventory_items WHERE id = $1";
            const itemResult = await client.query(itemQuery, [itemId]);

            if (itemResult.rows.length === 0) {
              client.release();
              return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ message: "Item not found" }),
              };
            }

            const itemName = itemResult.rows[0].name;
            const categoryId = itemResult.rows[0].category_id;
            const title = `Request for ${itemName}`;
            const description = reason || `Request for ${quantity} ${itemName}`;
            const requestId = uuidv4();
            const now = new Date().toISOString();

            // Insert the request
            const query = `
              INSERT INTO requests (id, title, description, status, user_id, item_id, quantity, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING *
            `;

            const values = [
              requestId,
              title,
              description,
              "pending",
              userId,
              itemId,
              quantity,
              now,
              now,
            ];

            const result = await client.query(query, values);
            client.release();

            return {
              statusCode: 201,
              headers,
              body: JSON.stringify(result.rows[0]),
            };
          }

          // Fall back to the request object if direct parameters aren't available
          if (!data.request) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                message: "User ID, item ID, and quantity are required",
              }),
            };
          }

          const newRequest = data.request;

          // Validate required fields
          if (!newRequest.userId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ message: "User ID is required" }),
            };
          }

          if (!newRequest.title) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ message: "Title is required" }),
            };
          }

          console.log("Creating new item request in Neon database:", {
            title: newRequest.title,
            userId: newRequest.userId,
            category: newRequest.category,
            inventoryItemId: newRequest.inventoryItemId,
          });

          const client = await pool.connect();

          // Generate a new UUID for the request if not provided
          const requestId = newRequest.id || uuidv4();
          const now = new Date().toISOString();

          // Insert the new item request
          const insertQuery = `
            INSERT INTO item_requests (
              id,
              title,
              description,
              category_id,
              priority,
              status,
              user_id,
              quantity,
              created_at,
              inventory_item_id,
              fulfillment_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `;

          const insertParams = [
            requestId,
            newRequest.title,
            newRequest.description || "",
            newRequest.category || newRequest.categoryId, // Support both formats
            newRequest.priority || "medium",
            newRequest.status || "pending",
            newRequest.userId,
            newRequest.quantity || 1,
            now,
            newRequest.inventoryItemId || null,
            newRequest.fulfillmentDate || null,
          ];

          console.log("Insert query params:", insertParams);

          const insertResult = await client.query(insertQuery, insertParams);
          const createdRequest = insertResult.rows[0];

          console.log("Item request created successfully:", createdRequest);

          // Get category name
          let categoryName = "Unknown";
          if (createdRequest.category_id) {
            const categoryQuery = `
              SELECT name FROM categories WHERE id = $1
            `;

            try {
              const categoryResult = await client.query(categoryQuery, [
                createdRequest.category_id,
              ]);
              if (categoryResult.rows.length > 0) {
                categoryName = categoryResult.rows[0].name;
              }
            } catch (categoryError) {
              console.error("Error fetching category name:", categoryError);
            }
          }

          client.release();

          // Format the created request to match the expected format
          const formattedCreatedRequest = {
            id: createdRequest.id,
            title: createdRequest.title,
            description: createdRequest.description,
            category: createdRequest.category_id,
            categoryName: categoryName,
            priority: createdRequest.priority,
            status: createdRequest.status,
            userId: createdRequest.user_id,
            createdAt: createdRequest.created_at,
            updatedAt: createdRequest.updated_at,
            quantity: createdRequest.quantity,
            fulfillmentDate: createdRequest.fulfillment_date,
            inventoryItemId: createdRequest.inventory_item_id,
          };
        } catch (error) {
          console.error("Error creating item request:", error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error creating request",
              error: error.message,
              stack:
                process.env.NODE_ENV === "development"
                  ? error.stack
                  : undefined,
            }),
          };
        }

        // Make sure formattedCreatedRequest is defined before returning
        if (!formattedCreatedRequest) {
          console.error("formattedCreatedRequest is undefined");
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error creating request: formatted request is undefined",
            }),
          };
        }

        console.log("Successfully created request:", formattedCreatedRequest);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(formattedCreatedRequest),
        };

      case "addComment":
        // Validate comment data
        if (!data.comment) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Comment data is required" }),
          };
        }

        const newComment = data.comment;

        // Insert the comment
        const { data: createdComment, error: commentError } = await supabase
          .from("comments")
          .insert([
            {
              id: newComment.id,
              request_id: newComment.requestId,
              user_id: newComment.userId,
              content: newComment.content,
              created_at: newComment.createdAt || new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (commentError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              message: "Error creating comment",
              error: commentError.message,
            }),
          };
        }

        // Format the created comment to match the expected format
        const formattedComment = {
          id: createdComment.id,
          requestId: createdComment.request_id,
          userId: createdComment.user_id,
          content: createdComment.content,
          createdAt: createdComment.created_at,
        };

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(formattedComment),
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Invalid action" }),
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Server error", error: error.message }),
    };
  }
};
