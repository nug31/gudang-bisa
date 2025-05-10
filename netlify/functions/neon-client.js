const { Pool } = require("pg");

// Initialize Neon PostgreSQL client
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Add a timestamp to log when this module is loaded
console.log("neon-client.js loaded at:", new Date().toISOString());

// Log connection string details (safely)
console.log("Neon connection string available:", !!connectionString);
console.log(
  "Connection string length:",
  connectionString ? connectionString.length : 0
);
console.log(
  "Connection string first 10 chars:",
  connectionString ? connectionString.substring(0, 10) + "..." : "N/A"
);
console.log(
  "Connection string contains 'neon':",
  connectionString ? connectionString.includes("neon") : false
);
console.log(
  "Connection string contains 'postgresql':",
  connectionString ? connectionString.includes("postgresql") : false
);
console.log("Environment variable set:", !!process.env.NEON_CONNECTION_STRING);

// Create a connection pool only if connection string is available
let pool = null;
try {
  if (connectionString) {
    console.log("Attempting to create database pool with connection string");

    // Validate connection string format
    if (!connectionString.startsWith("postgresql://")) {
      console.error(
        "Invalid connection string format - must start with postgresql://"
      );
      throw new Error("Invalid connection string format");
    }

    // Create the pool with more detailed logging
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      // Add connection pool settings for better reliability
      max: 10, // Maximum number of clients in the pool (reduced to avoid overwhelming the connection)
      min: 1, // Minimum number of clients to keep in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 15000, // Increased timeout for connection
      allowExitOnIdle: true, // Allow the pool to exit when all clients are released
      keepAlive: true, // Keep connections alive with TCP keepalive
    });

    console.log("Neon database pool object created successfully");

    // Test the connection immediately to verify it works
    console.log("Testing initial connection...");
    pool.query("SELECT NOW()", (err, res) => {
      if (err) {
        console.error("Initial connection test failed:", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);

        // Check for common error types
        if (err.code === "ENOTFOUND") {
          console.error(
            "Host not found. Check the hostname in the connection string."
          );
        } else if (err.code === "ECONNREFUSED") {
          console.error(
            "Connection refused. Check if the database server is running and accessible."
          );
        } else if (err.code === "28P01") {
          console.error("Authentication failed. Check username and password.");
        } else if (err.code === "3D000") {
          console.error("Database does not exist. Check database name.");
        }
      } else {
        console.log("Initial connection test successful:", res.rows[0]);
        console.log("Database connection is working properly");
      }
    });
  } else {
    console.error(
      "No Neon connection string provided. Using mock data instead."
    );
  }
} catch (error) {
  console.error("Error creating Neon database pool:", error);
  console.error("Error code:", error.code || "N/A");
  console.error("Error message:", error.message);
  console.error("Stack trace:", error.stack);
  pool = null;
}

// Test the connection
async function testConnection() {
  if (!pool) {
    console.error("Cannot test connection: database pool is null");
    return {
      connected: false,
      error: "Database pool is not initialized",
      connectionString: connectionString
        ? "Available (length: " + connectionString.length + ")"
        : "Not available",
      connectionStringValid: connectionString
        ? connectionString.startsWith("postgresql://")
        : false,
      environmentVariableSet: !!process.env.NEON_CONNECTION_STRING,
    };
  }

  try {
    console.log("Attempting to connect to Neon database...");

    // Set a timeout for the connection attempt - increased to 10 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Connection timeout after 10 seconds")),
        10000
      )
    );

    // Try to connect with a timeout
    const clientPromise = pool.connect();

    // Add more detailed logging
    console.log("Attempting to connect to database with timeout...");

    // Use try/catch to handle timeout more gracefully
    let client;
    try {
      client = await Promise.race([clientPromise, timeoutPromise]);
      console.log("Database connection established successfully");
    } catch (timeoutError) {
      console.error("Connection attempt timed out:", timeoutError.message);
      throw timeoutError;
    }

    console.log("Connected to Neon database successfully!");

    // Check if tables exist
    console.log("Checking for tables in the database...");
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((row) => row.table_name);
    console.log(`Found ${tables.length} tables:`, tables);

    // Get inventory items count
    let inventoryCount = 0;
    let categoriesCount = 0;
    let usersCount = 0;
    let requestsCount = 0;
    let sampleItem = null;

    if (tables.includes("inventory_items")) {
      console.log("Counting inventory items...");
      const inventoryResult = await client.query(
        "SELECT COUNT(*) FROM inventory_items"
      );
      inventoryCount = parseInt(inventoryResult.rows[0].count, 10);
      console.log(`Found ${inventoryCount} inventory items`);

      // If there are inventory items, get a sample
      if (inventoryCount > 0) {
        const sampleResult = await client.query(
          "SELECT * FROM inventory_items LIMIT 1"
        );
        if (sampleResult.rows.length > 0) {
          sampleItem = sampleResult.rows[0];
          console.log("Sample inventory item:", sampleItem);
        }
      }
    } else {
      console.log("inventory_items table not found");
    }

    if (tables.includes("categories")) {
      console.log("Counting categories...");
      const categoriesResult = await client.query(
        "SELECT COUNT(*) FROM categories"
      );
      categoriesCount = parseInt(categoriesResult.rows[0].count, 10);
      console.log(`Found ${categoriesCount} categories`);
    } else {
      console.log("categories table not found");
    }

    if (tables.includes("users")) {
      console.log("Counting users...");
      const usersResult = await client.query("SELECT COUNT(*) FROM users");
      usersCount = parseInt(usersResult.rows[0].count, 10);
      console.log(`Found ${usersCount} users`);
    } else {
      console.log("users table not found");
    }

    if (tables.includes("item_requests")) {
      console.log("Counting item requests...");
      const requestsResult = await client.query(
        "SELECT COUNT(*) FROM item_requests"
      );
      requestsCount = parseInt(requestsResult.rows[0].count, 10);
      console.log(`Found ${requestsCount} item requests`);
    } else {
      console.log("item_requests table not found");
    }

    // Get database server version
    const versionResult = await client.query("SELECT version()");
    const dbVersion = versionResult.rows[0].version;
    console.log("Database version:", dbVersion);

    client.release();
    console.log("Database client released");

    return {
      connected: true,
      tables,
      counts: {
        tables: tables.length,
        inventoryItems: inventoryCount,
        categories: categoriesCount,
        users: usersCount,
        requests: requestsCount,
      },
      sampleItem: sampleItem,
      dbVersion: dbVersion,
      connectionString: "Available (length: " + connectionString.length + ")",
      connectionStringValid: connectionString.startsWith("postgresql://"),
      environmentVariableSet: !!process.env.NEON_CONNECTION_STRING,
    };
  } catch (error) {
    console.error("Error connecting to Neon database:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    // Check for common error types
    let errorType = "unknown";
    if (error.message.includes("timeout")) {
      errorType = "timeout";
    } else if (error.code === "ENOTFOUND") {
      errorType = "host_not_found";
    } else if (error.code === "ECONNREFUSED") {
      errorType = "connection_refused";
    } else if (error.code === "28P01") {
      errorType = "authentication_failed";
    } else if (error.code === "3D000") {
      errorType = "database_not_found";
    }

    return {
      connected: false,
      error: error.message,
      errorCode: error.code,
      errorType: errorType,
      connectionString: connectionString
        ? "Available (length: " + connectionString.length + ")"
        : "Not available",
      connectionStringValid: connectionString
        ? connectionString.startsWith("postgresql://")
        : false,
      environmentVariableSet: !!process.env.NEON_CONNECTION_STRING,
    };
  }
}

// Get all inventory items
async function getAllInventoryItems(categoryId = null) {
  console.log(`getAllInventoryItems called with categoryId: ${categoryId}`);

  // If pool is null or connection issues, return mock data immediately
  if (!pool) {
    console.log("No database pool available, returning mock data");
    return getMockInventoryItems(categoryId);
  }

  let client = null;
  try {
    console.log(
      "Attempting to connect to Neon database to fetch inventory items..."
    );

    // Try to get a client from the pool with a timeout
    try {
      console.log("Attempting to get a client from the connection pool...");

      // Increased timeout to 10 seconds
      const clientPromise = pool.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Connection timeout after 10 seconds")),
          10000
        )
      );

      // Add a retry mechanism
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          console.log(
            `Connection attempt ${retryCount + 1}/${maxRetries + 1}...`
          );
          client = await Promise.race([clientPromise, timeoutPromise]);
          console.log("Connected to Neon database successfully");
          break; // Exit the loop if connection is successful
        } catch (retryError) {
          retryCount++;
          console.error(
            `Connection attempt ${retryCount} failed:`,
            retryError.message
          );

          if (retryCount > maxRetries) {
            throw retryError; // Re-throw the error if we've exhausted all retries
          }

          // Wait before retrying
          console.log(`Waiting 1 second before retry ${retryCount}...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    } catch (connectionError) {
      console.error(
        "Failed to connect to database after all retries:",
        connectionError
      );
      console.error("Connection error code:", connectionError.code || "N/A");
      console.error("Connection error message:", connectionError.message);

      // Check for common connection errors
      if (connectionError.message.includes("timeout")) {
        console.error(
          "Connection timed out. The database server might be overloaded or unreachable."
        );
      } else if (connectionError.code === "ENOTFOUND") {
        console.error(
          "Host not found. Check the hostname in the connection string."
        );
      } else if (connectionError.code === "ECONNREFUSED") {
        console.error(
          "Connection refused. Check if the database server is running and accessible."
        );
      }

      // Return mock data as fallback
      console.log("Returning mock data due to connection failure");
      return getMockInventoryItems(categoryId);
    }

    try {
      // First check if the inventory_items table exists
      console.log("Checking if inventory_items table exists...");
      const tableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'inventory_items'
        );
      `);

      const tableExists = tableCheckResult.rows[0].exists;
      if (!tableExists) {
        console.error("inventory_items table does not exist in the database");
        return getMockInventoryItems(categoryId);
      }
      console.log("inventory_items table exists");

      // Check if the categories table exists
      console.log("Checking if categories table exists...");
      const categoryTableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'categories'
        );
      `);

      const categoryTableExists = categoryTableCheckResult.rows[0].exists;
      if (!categoryTableExists) {
        console.error("categories table does not exist in the database");
      } else {
        console.log("categories table exists");
      }

      // Get the column names for inventory_items table
      console.log("Getting column names for inventory_items table...");
      const columnsResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'inventory_items';
      `);

      const columns = columnsResult.rows.map((row) => row.column_name);
      console.log("Available columns in inventory_items table:", columns);

      // Count total items in the table
      console.log("Counting total items in inventory_items table...");
      const countResult = await client.query(
        "SELECT COUNT(*) FROM inventory_items"
      );
      const totalItems = parseInt(countResult.rows[0].count, 10);
      console.log(`Total items in inventory_items table: ${totalItems}`);

      if (totalItems === 0) {
        console.warn("No inventory items found in the database (count = 0)");
        return getMockInventoryItems(categoryId);
      }

      // Build the query based on available columns
      let query = `
        SELECT i.*, c.name as category_name
        FROM inventory_items i
        LEFT JOIN categories c ON i.category_id = c.id
      `;

      const params = [];
      if (categoryId) {
        query += " WHERE i.category_id = $1";
        params.push(categoryId);
      }

      query += " ORDER BY i.name";

      console.log("Executing query:", query.replace(/\s+/g, " ").trim());
      console.log("Query parameters:", params);

      const result = await client.query(query, params);

      console.log(
        `Query successful, retrieved ${result.rows.length} inventory items`
      );

      if (result.rows.length === 0) {
        console.log("Warning: No inventory items found in the database");
        // Return mock data if no items found
        return getMockInventoryItems(categoryId);
      } else {
        console.log("First item retrieved:", result.rows[0].name);
        console.log(
          "Last item retrieved:",
          result.rows[result.rows.length - 1].name
        );
        console.log("Sample item data:", JSON.stringify(result.rows[0]));
      }

      // Transform data to match the expected format
      const formattedData = result.rows
        .map((item) => {
          // Ensure we have valid data for each item
          if (!item || !item.id || !item.name) {
            console.warn("Invalid item data:", item);
            return null;
          }

          return {
            id: item.id,
            name: item.name,
            description: item.description || "",
            categoryId: item.category_id,
            categoryName: item.category_name || "Unknown",
            sku: item.sku || "",
            // Handle different column names for quantity
            quantityAvailable: item.quantity_available || item.quantity || 0,
            quantityReserved: item.quantity_reserved || 0,
            unitPrice: item.unit_price || 0,
            location: item.location || "Shelf A1",
            imageUrl: item.image_url || "",
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };
        })
        .filter(Boolean); // Remove any null items

      console.log(`Formatted ${formattedData.length} items`);
      if (formattedData.length > 0) {
        console.log("First formatted item:", JSON.stringify(formattedData[0]));
      } else {
        console.warn("No valid items after formatting, returning mock data");
        return getMockInventoryItems(categoryId);
      }

      return formattedData;
    } catch (queryError) {
      console.error("Error executing inventory query:", queryError);
      console.error("Query error details:", {
        code: queryError.code,
        message: queryError.message,
        stack: queryError.stack,
      });

      // Check for specific query errors
      if (queryError.code === "42P01") {
        console.error(
          "Relation does not exist. The table might have been dropped or renamed."
        );
      } else if (queryError.code === "42703") {
        console.error(
          "Column does not exist. The table schema might have changed."
        );
      }

      // Return mock data on error
      return getMockInventoryItems(categoryId);
    } finally {
      if (client) {
        try {
          // Check if client is still active before releasing
          if (!client._ending && !client._ended) {
            client.release(true); // Force release to ensure it's properly released
            console.log("Database client released successfully");
          } else {
            console.log("Client already ended, no need to release");
          }
        } catch (releaseError) {
          console.error("Error releasing client:", releaseError);
          console.error("Release error details:", {
            message: releaseError.message,
            code: releaseError.code || "N/A",
            stack: releaseError.stack,
          });

          // Try to force a new pool if we're having client release issues
          try {
            console.log(
              "Attempting to recreate the connection pool due to client release issues"
            );
            pool.end();

            // Create a new pool with the same settings
            pool = new Pool({
              connectionString,
              ssl: {
                rejectUnauthorized: false,
              },
              max: 10,
              min: 1,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 15000,
              allowExitOnIdle: true,
              keepAlive: true,
            });

            console.log("Connection pool recreated successfully");
          } catch (poolError) {
            console.error(
              "Failed to recreate connection pool:",
              poolError.message
            );
          }
        }
      }
    }
  } catch (connectionError) {
    console.error("Error connecting to Neon database:", connectionError);
    console.error("Connection error details:", {
      code: connectionError.code,
      message: connectionError.message,
      stack: connectionError.stack,
    });

    // Return mock data on connection error
    return getMockInventoryItems(categoryId);
  }
}

// Function to provide mock inventory data when database is unavailable
function getMockInventoryItems(categoryId = null) {
  console.log(`Providing mock inventory data for categoryId: ${categoryId}`);

  // Create a timestamp for all items to share
  const now = new Date().toISOString();

  // Extended mock items list with more items
  const mockItems = [
    {
      id: "1",
      name: "All-Purpose Cleaner",
      description: "Multi-surface cleaning solution, 32oz bottle",
      categoryId: "2",
      categoryName: "Cleaning Supplies",
      sku: "CL-001",
      quantityAvailable: 20,
      quantityReserved: 0,
      unitPrice: 4.99,
      location: "Shelf B1",
      imageUrl: "/img/items/cleaner.jpg",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "2",
      name: "Ballpoint Pens (Box of 12)",
      description: "Blue ink ballpoint pens, medium point",
      categoryId: "1",
      categoryName: "Office Supplies",
      sku: "OS-001",
      quantityAvailable: 50,
      quantityReserved: 0,
      unitPrice: 3.99,
      location: "Shelf A1",
      imageUrl: "/img/items/pens.jpg",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "3",
      name: "Disinfectant Wipes (Pack of 75)",
      description: "Multi-surface cleaning and disinfecting wipes",
      categoryId: "2",
      categoryName: "Cleaning Supplies",
      sku: "CL-002",
      quantityAvailable: 40,
      quantityReserved: 0,
      unitPrice: 5.99,
      location: "Shelf B2",
      imageUrl: "/img/items/wipes.jpg",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "4",
      name: "First Aid Kit",
      description: "Comprehensive first aid kit for office emergencies",
      categoryId: "4",
      categoryName: "Other",
      sku: "OT-001",
      quantityAvailable: 15,
      quantityReserved: 0,
      unitPrice: 24.99,
      location: "Shelf D1",
      imageUrl: "/img/items/firstaid.jpg",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "5",
      name: "Hammer",
      description: "16oz claw hammer with fiberglass handle",
      categoryId: "3",
      categoryName: "Hardware",
      sku: "HW-001",
      quantityAvailable: 10,
      quantityReserved: 0,
      unitPrice: 12.99,
      location: "Shelf C1",
      imageUrl: "/img/items/hammer.jpg",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "6",
      name: "Paper Towels (6 rolls)",
      description: "Absorbent paper towels for cleaning spills",
      categoryId: "2",
      categoryName: "Cleaning Supplies",
      sku: "CL-003",
      quantityAvailable: 30,
      quantityReserved: 0,
      unitPrice: 8.99,
      location: "Shelf B3",
      imageUrl: "/img/items/papertowels.jpg",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "7",
      name: "Stapler",
      description: "Desktop stapler with 5000 staples included",
      categoryId: "1",
      categoryName: "Office Supplies",
      sku: "OS-002",
      quantityAvailable: 25,
      quantityReserved: 0,
      unitPrice: 7.99,
      location: "Shelf A2",
      imageUrl: "/img/items/stapler.jpg",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "8",
      name: "Wireless Mouse",
      description: "Ergonomic wireless mouse with USB receiver",
      categoryId: "5",
      categoryName: "Electronics",
      sku: "EL-001",
      quantityAvailable: 12,
      quantityReserved: 0,
      unitPrice: 14.99,
      location: "Shelf E1",
      imageUrl: "/img/items/mouse.jpg",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "9",
      name: "Office Chair",
      description: "Adjustable ergonomic office chair with lumbar support",
      categoryId: "6",
      categoryName: "Furniture",
      sku: "FN-001",
      quantityAvailable: 5,
      quantityReserved: 0,
      unitPrice: 129.99,
      location: "Warehouse Section F",
      imageUrl: "/img/items/chair.jpg",
      createdAt: now,
      updatedAt: now,
    },
  ];

  try {
    // Filter by category if needed
    if (categoryId) {
      const filtered = mockItems.filter(
        (item) => item.categoryId === categoryId
      );
      console.log(
        `Filtered mock items by category ${categoryId}: ${filtered.length} items`
      );
      return filtered;
    }

    console.log(`Returning all mock items: ${mockItems.length} items`);
    return mockItems;
  } catch (error) {
    console.error("Error in getMockInventoryItems:", error);
    // Return at least the first 5 items in case of any error
    return mockItems.slice(0, 5);
  }
}

// Export the pool and functions
module.exports = {
  pool,
  testConnection,
  getAllInventoryItems,
  getMockInventoryItems,
};
