const { pool, testConnection } = require("./neon-client");

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

  // Allow both GET and POST requests
  // GET: Check database status
  // POST: Initialize database
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  console.log(`Processing ${event.httpMethod} request to init-neon-db`);

  try {
    // Test the connection to Neon
    console.log("Testing connection to Neon database...");
    const connectionResult = await testConnection();

    if (!connectionResult.connected) {
      console.error(
        "Failed to connect to Neon database:",
        connectionResult.error
      );
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          status: "error",
          message: "Failed to connect to Neon PostgreSQL database",
          error: connectionResult.error,
          connectionString: connectionResult.connectionString,
        }),
      };
    }

    console.log("Connected to Neon database successfully");
    console.log("Database tables:", connectionResult.tables);
    console.log("Table counts:", connectionResult.counts);

    // Create tables
    const client = await pool.connect();

    try {
      // Start a transaction
      await client.query("BEGIN");

      // Create users table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          department VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create categories table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create inventory_items table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          quantity INTEGER NOT NULL DEFAULT 0,
          category_id UUID REFERENCES categories(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create item_requests table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS item_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          item_id UUID REFERENCES inventory_items(id),
          category_id UUID REFERENCES categories(id),
          quantity INTEGER NOT NULL DEFAULT 1,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create notifications table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if admin user exists
      const adminResult = await client.query(
        "SELECT * FROM users WHERE email = 'admin@gudangmitra.com'"
      );

      // Create admin user if it doesn't exist
      if (adminResult.rows.length === 0) {
        // Create admin user with bcrypt hashed password
        await client.query(`
          CREATE EXTENSION IF NOT EXISTS pgcrypto;

          INSERT INTO users (name, email, password, role)
          VALUES ('Admin', 'admin@gudangmitra.com', crypt('admin123', gen_salt('bf')), 'admin')
        `);
      }

      // Check if default categories exist
      const categoriesResult = await client.query(
        "SELECT * FROM categories LIMIT 1"
      );

      // Create default categories if they don't exist
      if (categoriesResult.rows.length === 0) {
        await client.query(`
          INSERT INTO categories (name, description)
          VALUES
            ('Office', 'Office supplies'),
            ('Cleaning', 'Cleaning supplies'),
            ('Hardware', 'Hardware tools and supplies'),
            ('Other', 'Miscellaneous items')
        `);
      }

      // Check if inventory items exist
      const itemsResult = await client.query(
        "SELECT * FROM inventory_items LIMIT 1"
      );

      // Create sample inventory items if they don't exist
      if (itemsResult.rows.length === 0) {
        // Get category IDs
        const categoryIds = await client.query(
          "SELECT id, name FROM categories"
        );

        const categoryMap = {};
        categoryIds.rows.forEach((row) => {
          categoryMap[row.name] = row.id;
        });

        // Insert sample items
        if (categoryMap["Office"]) {
          await client.query(
            `
            INSERT INTO inventory_items (name, description, category_id, quantity, sku, location)
            VALUES
              ('Ballpoint Pen', 'Blue ballpoint pen', $1, 100, 'PEN-001', 'Shelf A1'),
              ('Notebook', 'A5 lined notebook', $1, 50, 'NB-001', 'Shelf A2')
          `,
            [categoryMap["Office"]]
          );
        }

        if (categoryMap["Cleaning"]) {
          await client.query(
            `
            INSERT INTO inventory_items (name, description, category_id, quantity, sku, location)
            VALUES
              ('Cleaning Spray', 'All-purpose cleaning spray', $1, 30, 'CL-001', 'Shelf B1')
          `,
            [categoryMap["Cleaning"]]
          );
        }

        if (categoryMap["Hardware"]) {
          await client.query(
            `
            INSERT INTO inventory_items (name, description, category_id, quantity, sku, location)
            VALUES
              ('Screwdriver Set', 'Set of 6 screwdrivers', $1, 20, 'HW-001', 'Shelf C1')
          `,
            [categoryMap["Hardware"]]
          );
        }

        if (categoryMap["Other"]) {
          await client.query(
            `
            INSERT INTO inventory_items (name, description, category_id, quantity, sku, location)
            VALUES
              ('First Aid Kit', 'Basic first aid kit', $1, 10, 'OT-001', 'Shelf D1')
          `,
            [categoryMap["Other"]]
          );
        }
      }

      // Commit the transaction
      await client.query("COMMIT");

      // Test connection again to get updated table information
      console.log("Testing connection after initialization...");
      const updatedConnectionResult = await testConnection();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "success",
          message: "Database initialized successfully",
          before: connectionResult,
          after: updatedConnectionResult,
        }),
      };
    } catch (error) {
      // Rollback the transaction in case of error
      await client.query("ROLLBACK");
      console.error("Error initializing database:", error);

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          status: "error",
          message: "Failed to initialize database",
          error: error.message,
          errorCode: error.code,
          errorStack: error.stack,
          connectionInfo: connectionResult,
        }),
      };
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error("Server error:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: "error",
        message: "Server error",
        error: error.message,
        errorCode: error.code,
        errorStack: error.stack,
      }),
    };
  }
};
