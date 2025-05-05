import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// In-memory data store
let mockData = {
  users: [],
  categories: [],
  item_requests: [],
  comments: [],
  notifications: [],
  inventory_items: [],
};

// Load mock data from JSON file
async function loadMockData() {
  try {
    const data = await fs.readFile(
      path.join(process.cwd(), "src", "data", "mockData.json"),
      "utf8"
    );
    mockData = JSON.parse(data);
    console.log("✅ Mock data loaded successfully!");
  } catch (error) {
    console.error("❌ Error loading mock data:", error);
    console.log("Using empty mock database instead.");
  }
}

// Initialize the mock database
loadMockData();

// Helper function to create a query result format similar to mysql2
function createQueryResult(data) {
  return [data, []];
}

// Mock database pool
const mockPool = {
  // Mock getConnection method
  getConnection: async () => {
    return mockConnection;
  },

  // Mock query method
  query: async (sql, params = []) => {
    return mockConnection.query(sql, params);
  },
};

// Mock database connection
const mockConnection = {
  // Mock release method
  release: () => {},

  // Mock query method
  query: async (sql, params = []) => {
    // Parse the SQL query to determine what operation to perform
    sql = sql.trim().toLowerCase();

    // SELECT queries
    if (sql.startsWith("select")) {
      return handleSelect(sql, params);
    }

    // INSERT queries
    if (sql.startsWith("insert")) {
      return handleInsert(sql, params);
    }

    // UPDATE queries
    if (sql.startsWith("update")) {
      return handleUpdate(sql, params);
    }

    // DELETE queries
    if (sql.startsWith("delete")) {
      return handleDelete(sql, params);
    }

    // SHOW TABLES query
    if (sql.startsWith("show tables")) {
      return createQueryResult(
        Object.keys(mockData).map((table) => ({ Tables_in_database: table }))
      );
    }

    // Default: return empty result
    return createQueryResult([]);
  },
};

// Handle SELECT queries
function handleSelect(sql, params) {
  // Simple test query
  if (sql.includes("select 1 + 1")) {
    return createQueryResult([{ test: 2 }]);
  }

  // Get all users
  if (sql.includes("select * from users")) {
    return createQueryResult(mockData.users);
  }

  // Get user by id
  if (sql.includes("select * from users where id =")) {
    const userId = params[0];
    const user = mockData.users.find((u) => u.id === userId);
    return createQueryResult(user ? [user] : []);
  }

  // Get user by email
  if (sql.includes("select * from users where email =")) {
    const email = params[0];
    const user = mockData.users.find((u) => u.email === email);
    return createQueryResult(user ? [user] : []);
  }

  // Get all categories
  if (sql.includes("select * from categories")) {
    return createQueryResult(mockData.categories);
  }

  // Get category by id
  if (sql.includes("select * from categories where id =")) {
    const categoryId = params[0];
    const category = mockData.categories.find((c) => c.id === categoryId);
    return createQueryResult(category ? [category] : []);
  }

  // Get all item requests
  if (sql.includes("select * from item_requests")) {
    // Filter by user_id if specified
    if (sql.includes("where user_id =")) {
      const userId = params[0];
      const requests = mockData.item_requests.filter(
        (r) => r.user_id === userId
      );
      return createQueryResult(requests);
    }

    // Filter by status if specified
    if (sql.includes("where status =")) {
      const status = params[0];
      const requests = mockData.item_requests.filter(
        (r) => r.status === status
      );
      return createQueryResult(requests);
    }

    return createQueryResult(mockData.item_requests);
  }

  // Get item request by id
  if (sql.includes("select * from item_requests where id =")) {
    const requestId = params[0];
    const request = mockData.item_requests.find((r) => r.id === requestId);
    return createQueryResult(request ? [request] : []);
  }

  // Get comments by request_id
  if (sql.includes("select * from comments where request_id =")) {
    const requestId = params[0];
    const comments = mockData.comments.filter(
      (c) => c.request_id === requestId
    );
    return createQueryResult(comments);
  }

  // Get notifications by user_id
  if (sql.includes("select * from notifications where user_id =")) {
    const userId = params[0];
    const notifications = mockData.notifications.filter(
      (n) => n.user_id === userId
    );
    return createQueryResult(notifications);
  }

  // Get all inventory items
  if (sql.includes("select") && sql.includes("from inventory_items")) {
    // Check if there's a category filter
    if (
      sql.includes("where category_id =") ||
      sql.includes("WHERE category_id =")
    ) {
      const categoryId = params[0];
      const items = mockData.inventory_items.filter(
        (item) => item.category_id === categoryId
      );

      // Transform to match the expected format
      const transformedItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        categoryId: item.category_id,
        categoryName:
          mockData.categories.find((c) => c.id === item.category_id)?.name ||
          "",
        sku: item.sku,
        quantityAvailable: item.quantity_available,
        quantityReserved: item.quantity_reserved,
        unitPrice: item.unit_price,
        location: item.location,
        imageUrl: item.image_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return createQueryResult(transformedItems);
    }

    // No filter, return all items
    const transformedItems = mockData.inventory_items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.category_id,
      categoryName:
        mockData.categories.find((c) => c.id === item.category_id)?.name || "",
      sku: item.sku,
      quantityAvailable: item.quantity_available,
      quantityReserved: item.quantity_reserved,
      unitPrice: item.unit_price,
      location: item.location,
      imageUrl: item.image_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return createQueryResult(transformedItems);
  }

  // Get inventory item by id
  if (
    sql.includes("select") &&
    sql.includes("from inventory_items where id =")
  ) {
    const itemId = params[0];
    const item = mockData.inventory_items.find((i) => i.id === itemId);

    if (!item) {
      return createQueryResult([]);
    }

    // Transform to match the expected format
    const transformedItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      categoryId: item.category_id,
      categoryName:
        mockData.categories.find((c) => c.id === item.category_id)?.name || "",
      sku: item.sku,
      quantityAvailable: item.quantity_available,
      quantityReserved: item.quantity_reserved,
      unitPrice: item.unit_price,
      location: item.location,
      imageUrl: item.image_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };

    return createQueryResult([transformedItem]);
  }

  // Default: return empty result
  return createQueryResult([]);
}

// Handle INSERT queries
function handleInsert(sql, params) {
  // Insert into users
  if (sql.includes("insert into users")) {
    const newUser = {
      id: params[0] || uuidv4(),
      name: params[1],
      email: params[2],
      password: params[3],
      role: params[4],
      avatar_url: params[5],
      department: params[6],
      created_at:
        params[7] || new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    mockData.users.push(newUser);
    return createQueryResult({ insertId: newUser.id, affectedRows: 1 });
  }

  // Insert into categories
  if (sql.includes("insert into categories")) {
    const newCategory = {
      id: params[0] || uuidv4(),
      name: params[1],
      description: params[2],
      created_at:
        params[3] || new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    mockData.categories.push(newCategory);
    return createQueryResult({ insertId: newCategory.id, affectedRows: 1 });
  }

  // Insert into item_requests
  if (sql.includes("insert into item_requests")) {
    const newRequest = {
      id: params[0] || uuidv4(),
      title: params[1],
      description: params[2],
      category_id: params[3],
      priority: params[4],
      status: params[5],
      user_id: params[6],
      created_at:
        params[7] || new Date().toISOString().slice(0, 19).replace("T", " "),
      updated_at:
        params[8] || new Date().toISOString().slice(0, 19).replace("T", " "),
      approved_at: params[9],
      approved_by: params[10],
      rejected_at: params[11],
      rejected_by: params[12],
      rejection_reason: params[13],
      fulfillment_date: params[14],
      quantity: params[15] || 1,
    };

    mockData.item_requests.push(newRequest);
    return createQueryResult({ insertId: newRequest.id, affectedRows: 1 });
  }

  // Insert into comments
  if (sql.includes("insert into comments")) {
    const newComment = {
      id: params[0] || uuidv4(),
      request_id: params[1],
      user_id: params[2],
      content: params[3],
      created_at:
        params[4] || new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    mockData.comments.push(newComment);
    return createQueryResult({ insertId: newComment.id, affectedRows: 1 });
  }

  // Insert into notifications
  if (sql.includes("insert into notifications")) {
    const newNotification = {
      id: params[0] || uuidv4(),
      user_id: params[1],
      type: params[2],
      message: params[3],
      is_read: params[4] || 0,
      created_at:
        params[5] || new Date().toISOString().slice(0, 19).replace("T", " "),
      related_item_id: params[6],
    };

    mockData.notifications.push(newNotification);
    return createQueryResult({ insertId: newNotification.id, affectedRows: 1 });
  }

  // Insert into inventory_items
  if (sql.includes("insert into inventory_items")) {
    const newItem = {
      id: params[0] || uuidv4(),
      name: params[1],
      description: params[2],
      category_id: params[3],
      sku: params[4],
      quantity_available: params[5],
      quantity_reserved: params[6] || 0,
      unit_price: params[7] || null,
      location: params[8],
      image_url: params[9],
      created_at:
        params[10] || new Date().toISOString().slice(0, 19).replace("T", " "),
      updated_at:
        params[11] || new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    mockData.inventory_items.push(newItem);
    return createQueryResult({ insertId: newItem.id, affectedRows: 1 });
  }

  // Default: return empty result
  return createQueryResult({ insertId: null, affectedRows: 0 });
}

// Handle UPDATE queries
function handleUpdate(sql, params) {
  // Update user
  if (sql.includes("update users set")) {
    const userId = params[params.length - 1];
    const userIndex = mockData.users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
      // Extract field names and values from SQL
      const setClause = sql.split("set ")[1].split(" where")[0];
      const fields = setClause
        .split(",")
        .map((field) => field.trim().split("=")[0].trim());

      // Update fields
      fields.forEach((field, index) => {
        mockData.users[userIndex][field] = params[index];
      });

      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Update item request
  if (sql.includes("update item_requests set")) {
    const requestId = params[params.length - 1];
    const requestIndex = mockData.item_requests.findIndex(
      (r) => r.id === requestId
    );

    if (requestIndex !== -1) {
      // Extract field names and values from SQL
      const setClause = sql.split("set ")[1].split(" where")[0];
      const fields = setClause
        .split(",")
        .map((field) => field.trim().split("=")[0].trim());

      // Update fields
      fields.forEach((field, index) => {
        mockData.item_requests[requestIndex][field] = params[index];
      });

      // Always update updated_at
      mockData.item_requests[requestIndex].updated_at = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Update notification (mark as read)
  if (sql.includes("update notifications set")) {
    const notificationId = params[params.length - 1];
    const notificationIndex = mockData.notifications.findIndex(
      (n) => n.id === notificationId
    );

    if (notificationIndex !== -1) {
      // Extract field names and values from SQL
      const setClause = sql.split("set ")[1].split(" where")[0];
      const fields = setClause
        .split(",")
        .map((field) => field.trim().split("=")[0].trim());

      // Update fields
      fields.forEach((field, index) => {
        mockData.notifications[notificationIndex][field] = params[index];
      });

      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Update inventory item
  if (sql.includes("update inventory_items set")) {
    const itemId = params[params.length - 1];
    const itemIndex = mockData.inventory_items.findIndex(
      (item) => item.id === itemId
    );

    if (itemIndex !== -1) {
      // Extract field names and values from SQL
      const setClause = sql.split("set ")[1].split(" where")[0];
      const fields = setClause
        .split(",")
        .map((field) => field.trim().split("=")[0].trim());

      // Update fields
      fields.forEach((field, index) => {
        // Convert camelCase field names to snake_case for storage
        const snakeCaseField = field
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, "");

        mockData.inventory_items[itemIndex][snakeCaseField] = params[index];
      });

      // Always update updated_at
      mockData.inventory_items[itemIndex].updated_at = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Default: return empty result
  return createQueryResult({ affectedRows: 0 });
}

// Handle DELETE queries
function handleDelete(sql, params) {
  // Delete user
  if (sql.includes("delete from users where id =")) {
    const userId = params[0];
    const userIndex = mockData.users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
      mockData.users.splice(userIndex, 1);
      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Delete category
  if (sql.includes("delete from categories where id =")) {
    const categoryId = params[0];
    const categoryIndex = mockData.categories.findIndex(
      (c) => c.id === categoryId
    );

    if (categoryIndex !== -1) {
      mockData.categories.splice(categoryIndex, 1);
      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Delete item request
  if (sql.includes("delete from item_requests where id =")) {
    const requestId = params[0];
    const requestIndex = mockData.item_requests.findIndex(
      (r) => r.id === requestId
    );

    if (requestIndex !== -1) {
      mockData.item_requests.splice(requestIndex, 1);
      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Delete comment
  if (sql.includes("delete from comments where id =")) {
    const commentId = params[0];
    const commentIndex = mockData.comments.findIndex((c) => c.id === commentId);

    if (commentIndex !== -1) {
      mockData.comments.splice(commentIndex, 1);
      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Delete notification
  if (sql.includes("delete from notifications where id =")) {
    const notificationId = params[0];
    const notificationIndex = mockData.notifications.findIndex(
      (n) => n.id === notificationId
    );

    if (notificationIndex !== -1) {
      mockData.notifications.splice(notificationIndex, 1);
      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Delete inventory item
  if (sql.includes("delete from inventory_items where id =")) {
    const itemId = params[0];
    const itemIndex = mockData.inventory_items.findIndex(
      (item) => item.id === itemId
    );

    if (itemIndex !== -1) {
      mockData.inventory_items.splice(itemIndex, 1);
      return createQueryResult({ affectedRows: 1 });
    }

    return createQueryResult({ affectedRows: 0 });
  }

  // Default: return empty result
  return createQueryResult({ affectedRows: 0 });
}

export default mockPool;
