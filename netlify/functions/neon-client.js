const { Pool } = require("pg");

// Initialize Neon PostgreSQL client
const connectionString = process.env.NEON_CONNECTION_STRING;

console.log("Neon connection string available:", !!connectionString);

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  // Add connection pool settings for better reliability
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection to become available
});

// Test the connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Connected to Neon database!");

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((row) => row.table_name);
    console.log("Tables found:", tables);

    // Get inventory items count
    let inventoryCount = 0;
    let categoriesCount = 0;

    if (tables.includes("inventory_items")) {
      const inventoryResult = await client.query(
        "SELECT COUNT(*) FROM inventory_items"
      );
      inventoryCount = parseInt(inventoryResult.rows[0].count, 10);
      console.log(`Found ${inventoryCount} inventory items`);
    }

    if (tables.includes("categories")) {
      const categoriesResult = await client.query(
        "SELECT COUNT(*) FROM categories"
      );
      categoriesCount = parseInt(categoriesResult.rows[0].count, 10);
      console.log(`Found ${categoriesCount} categories`);
    }

    client.release();
    return {
      connected: true,
      tables,
      counts: {
        tables: tables.length,
        inventoryItems: inventoryCount,
        categories: categoriesCount,
      },
    };
  } catch (error) {
    console.error("Error connecting to Neon database:", error);
    return {
      connected: false,
      error: error.message,
    };
  }
}

// Get all inventory items
async function getAllInventoryItems(categoryId = null) {
  try {
    console.log(
      "Attempting to connect to Neon database to fetch inventory items..."
    );
    const client = await pool.connect();
    console.log("Connected to Neon database successfully");

    try {
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
      } else {
        console.log("First item retrieved:", result.rows[0].name);
        console.log(
          "Last item retrieved:",
          result.rows[result.rows.length - 1].name
        );
      }

      // Transform data to match the expected format
      const formattedData = result.rows.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        categoryId: item.category_id || "",
        categoryName: item.category_name || "Uncategorized",
        category: {
          id: item.category_id || "",
          name: item.category_name || "Uncategorized",
        },
        sku: item.sku,
        quantityAvailable: Number(item.quantity_available || 0),
        quantityReserved: Number(item.quantity_reserved || 0),
        unitPrice: item.unit_price,
        location: item.location,
        imageUrl: item.image_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return formattedData;
    } catch (queryError) {
      console.error("Error executing inventory query:", queryError);
      throw queryError;
    } finally {
      client.release();
      console.log("Database client released");
    }
  } catch (connectionError) {
    console.error("Error connecting to Neon database:", connectionError);
    console.error("Connection error details:", {
      code: connectionError.code,
      message: connectionError.message,
      stack: connectionError.stack,
    });
    throw connectionError;
  }
}

// Export the pool and functions
module.exports = {
  pool,
  testConnection,
  getAllInventoryItems,
};
