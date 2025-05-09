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
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  const path = event.path.replace("/.netlify/functions/item-requests", "");
  const segments = path.split("/").filter(Boolean);
  const id = segments[0];

  try {
    // GET /item-requests - Get all item requests
    if (event.httpMethod === "GET" && !id) {
      const params = event.queryStringParameters || {};
      const { status, user_id } = params;

      try {
        console.log("Fetching all item requests from Neon database");
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
            u.id as "user.id",
            u.name as "user.name",
            u.email as "user.email",
            u.department as "user.department",
            c.id as "category.id",
            c.name as "category.name"
          FROM
            item_requests ir
          LEFT JOIN
            users u ON ir.user_id = u.id
          LEFT JOIN
            categories c ON ir.category_id = c.id
        `;

        const queryParams = [];
        const conditions = [];

        if (status) {
          conditions.push(`ir.status = $${queryParams.length + 1}`);
          queryParams.push(status);
        }

        if (user_id) {
          conditions.push(`ir.user_id = $${queryParams.length + 1}`);
          queryParams.push(user_id);
        }

        if (conditions.length > 0) {
          queryText += " WHERE " + conditions.join(" AND ");
        }

        queryText += " ORDER BY ir.created_at DESC";

        console.log("Executing query:", queryText);
        console.log("Query parameters:", queryParams);

        const result = await client.query(queryText, queryParams);
        client.release();

        // Format the results to match the Supabase format
        const formattedData = result.rows.map((row) => {
          const formattedRow = {
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            user_id: row.user_id,
            category_id: row.category_id,
            quantity: row.quantity,
            total_cost: row.total_cost,
            created_at: row.created_at,
            updated_at: row.updated_at,
            approved_at: row.approved_at,
            approved_by: row.approved_by,
            rejected_at: row.rejected_at,
            rejected_by: row.rejected_by,
            rejection_reason: row.rejection_reason,
            fulfillment_date: row.fulfillment_date,
            user: row["user.id"]
              ? {
                  id: row["user.id"],
                  name: row["user.name"],
                  email: row["user.email"],
                  department: row["user.department"],
                }
              : null,
            category: row["category.id"]
              ? {
                  id: row["category.id"],
                  name: row["category.name"],
                }
              : null,
          };

          return formattedRow;
        });

        console.log(`Retrieved ${formattedData.length} item requests`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(formattedData),
        };
      } catch (error) {
        console.error("Error fetching item requests:", error);
        throw error;
      }
    }

    // GET /item-requests/:id - Get item request by ID
    if (event.httpMethod === "GET" && id) {
      try {
        console.log(`Fetching item request with ID ${id} from Neon database`);
        const client = await pool.connect();

        // Query for the item request with related data
        const requestQuery = `
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
            u.id as "user.id",
            u.name as "user.name",
            u.email as "user.email",
            u.department as "user.department",
            c.id as "category.id",
            c.name as "category.name",
            approver.id as "approver.id",
            approver.name as "approver.name",
            rejecter.id as "rejecter.id",
            rejecter.name as "rejecter.name"
          FROM
            item_requests ir
          LEFT JOIN
            users u ON ir.user_id = u.id
          LEFT JOIN
            categories c ON ir.category_id = c.id
          LEFT JOIN
            users approver ON ir.approved_by = approver.id
          LEFT JOIN
            users rejecter ON ir.rejected_by = rejecter.id
          WHERE
            ir.id = $1
        `;

        const requestResult = await client.query(requestQuery, [id]);

        if (requestResult.rows.length === 0) {
          client.release();
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Item request not found" }),
          };
        }

        const row = requestResult.rows[0];

        // Format the request data
        const formattedRequest = {
          id: row.id,
          title: row.title,
          description: row.description,
          status: row.status,
          priority: row.priority,
          user_id: row.user_id,
          category_id: row.category_id,
          quantity: row.quantity,
          total_cost: row.total_cost,
          created_at: row.created_at,
          updated_at: row.updated_at,
          approved_at: row.approved_at,
          approved_by: row.approved_by,
          rejected_at: row.rejected_at,
          rejected_by: row.rejected_by,
          rejection_reason: row.rejection_reason,
          fulfillment_date: row.fulfillment_date,
          user: row["user.id"]
            ? {
                id: row["user.id"],
                name: row["user.name"],
                email: row["user.email"],
                department: row["user.department"],
              }
            : null,
          category: row["category.id"]
            ? {
                id: row["category.id"],
                name: row["category.name"],
              }
            : null,
          approver: row["approver.id"]
            ? {
                id: row["approver.id"],
                name: row["approver.name"],
              }
            : null,
          rejecter: row["rejecter.id"]
            ? {
                id: row["rejecter.id"],
                name: row["rejecter.name"],
              }
            : null,
        };

        // Query for comments
        const commentsQuery = `
          SELECT
            c.id,
            c.content,
            c.created_at,
            c.user_id,
            u.id as "user.id",
            u.name as "user.name",
            u.avatar_url as "user.avatar_url"
          FROM
            comments c
          LEFT JOIN
            users u ON c.user_id = u.id
          WHERE
            c.item_request_id = $1
          ORDER BY
            c.created_at ASC
        `;

        const commentsResult = await client.query(commentsQuery, [id]);
        client.release();

        // Format the comments
        const formattedComments = commentsResult.rows.map((comment) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: comment.user_id,
          user: comment["user.id"]
            ? {
                id: comment["user.id"],
                name: comment["user.name"],
                avatar_url: comment["user.avatar_url"],
              }
            : null,
        }));

        // Combine request with comments
        const requestWithComments = {
          ...formattedRequest,
          comments: formattedComments || [],
        };

        console.log(
          `Retrieved item request with ID ${id} and ${formattedComments.length} comments`
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(requestWithComments),
        };
      } catch (error) {
        console.error(`Error fetching item request with ID ${id}:`, error);
        throw error;
      }
    }

    // POST /item-requests - Create new item request
    if (event.httpMethod === "POST") {
      try {
        const requestBody = JSON.parse(event.body);
        console.log("Received request body:", requestBody);

        const {
          title,
          description,
          category_id,
          categoryId,
          priority,
          user_id,
          userId,
          quantity,
          total_cost,
          inventoryItemId,
          inventory_item_id,
        } = requestBody;

        // Validate required fields
        const effectiveUserId = user_id || userId;
        const effectiveItemId = inventoryItemId || inventory_item_id;

        if (!effectiveUserId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "User ID is required" }),
          };
        }

        if (!title) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Title is required" }),
          };
        }

        if (!quantity && quantity !== 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Quantity is required" }),
          };
        }

        console.log("Creating new item request in Neon database:", {
          title,
          userId: effectiveUserId,
          categoryId: category_id || categoryId,
          inventoryItemId: effectiveItemId,
        });

        const client = await pool.connect();

        // Generate a new UUID for the request
        const requestId = uuidv4();
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
            total_cost,
            created_at,
            inventory_item_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;

        const insertParams = [
          requestId,
          title,
          description || "",
          category_id || categoryId || null,
          priority || "medium",
          "pending",
          effectiveUserId,
          quantity || 1,
          total_cost || null,
          now,
          effectiveItemId || null,
        ];

        const insertResult = await client.query(insertQuery, insertParams);
        const newRequest = insertResult.rows[0];

        console.log("Item request created successfully:", newRequest);

        // Get user name for notifications
        const userQuery = `
          SELECT name FROM users WHERE id = $1
        `;

        const userResult = await client.query(userQuery, [user_id]);
        const userName = userResult.rows[0]?.name || "Unknown User";

        // Get admin and manager IDs for notifications
        const adminsQuery = `
          SELECT id FROM users WHERE role IN ('admin', 'manager')
        `;

        const adminsResult = await client.query(adminsQuery);
        const admins = adminsResult.rows;

        console.log(`Found ${admins.length} admins/managers for notifications`);

        // Create notifications for each admin/manager
        if (admins.length > 0) {
          const notificationValues = admins
            .map((admin, index) => {
              const notificationId = uuidv4();
              return `($${index * 5 + 1}, $${index * 5 + 2}, $${
                index * 5 + 3
              }, $${index * 5 + 4}, $${index * 5 + 5})`;
            })
            .join(", ");

          const notificationParams = admins.flatMap((admin) => [
            uuidv4(),
            admin.id,
            "request_submitted",
            `New request "${title}" submitted by ${userName}`,
            now,
          ]);

          const notificationQuery = `
            INSERT INTO notifications (
              id,
              user_id,
              type,
              message,
              created_at
            )
            VALUES ${notificationValues}
          `;

          try {
            await client.query(notificationQuery, notificationParams);
            console.log(`Created ${admins.length} notifications`);
          } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
            // Continue even if notifications fail
          }
        }

        client.release();

        // Format the response to match the Supabase format
        const formattedResponse = {
          id: newRequest.id,
          title: newRequest.title,
          description: newRequest.description,
          category_id: newRequest.category_id,
          priority: newRequest.priority,
          status: newRequest.status,
          user_id: newRequest.user_id,
          userId: newRequest.user_id, // Add camelCase version for frontend
          quantity: newRequest.quantity,
          total_cost: newRequest.total_cost,
          created_at: newRequest.created_at,
          createdAt: newRequest.created_at, // Add camelCase version for frontend
          inventory_item_id: newRequest.inventory_item_id,
          inventoryItemId: newRequest.inventory_item_id, // Add camelCase version for frontend
        };

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(formattedResponse),
        };
      } catch (error) {
        console.error("Error creating item request:", error);
        throw error;
      }
    }

    // PUT /item-requests/:id - Update item request
    if (event.httpMethod === "PUT" && id) {
      const {
        title,
        description,
        category_id,
        priority,
        status,
        quantity,
        total_cost,
        approved_by,
        rejected_by,
        rejection_reason,
      } = JSON.parse(event.body);

      // Get the current request to check for status changes
      const { data: currentRequest, error: currentRequestError } =
        await supabase
          .from("item_requests")
          .select("status, user_id, title")
          .eq("id", id)
          .single();

      if (currentRequestError) throw currentRequestError;

      const updateData = {
        title,
        description,
        category_id,
        priority,
        status,
        quantity,
        total_cost,
        updated_at: new Date().toISOString(),
      };

      // Add approval/rejection data if status changed
      if (status === "approved" && currentRequest.status !== "approved") {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = approved_by;
      } else if (
        status === "rejected" &&
        currentRequest.status !== "rejected"
      ) {
        updateData.rejected_at = new Date().toISOString();
        updateData.rejected_by = rejected_by;
        updateData.rejection_reason = rejection_reason;
      } else if (
        status === "fulfilled" &&
        currentRequest.status !== "fulfilled"
      ) {
        updateData.fulfillment_date = new Date().toISOString();
      }

      // Update item request
      const { data, error } = await supabase
        .from("item_requests")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) throw error;

      // Create notification for status changes
      if (status && status !== currentRequest.status) {
        let notificationType = "";
        let message = "";

        if (status === "approved") {
          notificationType = "request_approved";
          message = `Your request "${currentRequest.title}" has been approved`;
        } else if (status === "rejected") {
          notificationType = "request_rejected";
          message = `Your request "${currentRequest.title}" has been rejected`;
        } else if (status === "fulfilled") {
          notificationType = "request_fulfilled";
          message = `Your request "${currentRequest.title}" has been fulfilled`;
        }

        if (notificationType) {
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert([
              {
                id: uuidv4(),
                user_id: currentRequest.user_id,
                type: notificationType,
                message,
                is_read: false,
                created_at: new Date().toISOString(),
                related_item_id: id,
              },
            ]);

          if (notificationError) {
            console.error("Error creating notification:", notificationError);
          }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data[0]),
      };
    }

    // DELETE /item-requests/:id - Delete item request
    if (event.httpMethod === "DELETE" && id) {
      // Delete item request
      const { error } = await supabase
        .from("item_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return {
        statusCode: 204,
        headers,
        body: "",
      };
    }

    // If no route matches
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", details: error.message }),
    };
  }
};
