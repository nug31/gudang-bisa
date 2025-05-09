import { config } from "dotenv";
import pg from "pg";

// Load environment variables
config();

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error(
    "Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file."
  );
  process.exit(1);
}

async function fixInventoryTable() {
  console.log("Fixing inventory table...");

  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Connect to the database
    await client.connect();
    console.log("Connected to Neon database.");

    // Check if inventory table exists
    const inventoryExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'inventory'
      );
    `);

    if (inventoryExists.rows[0].exists) {
      console.log("Inventory table already exists. Dropping it to recreate...");
      await client.query(`DROP TABLE IF EXISTS inventory CASCADE;`);
      console.log("Inventory table dropped.");
    }

    // Create the inventory table with VARCHAR for category_id to match categories table
    console.log("Creating inventory table with correct column types...");
    await client.query(`
      CREATE TABLE inventory (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id VARCHAR(255) NOT NULL REFERENCES categories(id),
        sku VARCHAR(100),
        quantity_available INTEGER NOT NULL DEFAULT 0,
        quantity_reserved INTEGER NOT NULL DEFAULT 0,
        unit_price DECIMAL(10,2) DEFAULT 0,
        location VARCHAR(255),
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Inventory table created successfully.");

    // Create function for updating timestamps if it doesn't exist
    console.log("Creating updated_at function...");
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
           NEW.updated_at = CURRENT_TIMESTAMP;
           RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log("Updated_at function created successfully.");
    } catch (error) {
      console.error("Error creating updated_at function:", error);
    }

    // Create trigger for inventory table
    console.log("Creating trigger for inventory table...");
    try {
      await client.query(`
        CREATE TRIGGER update_inventory_updated_at
        BEFORE UPDATE ON inventory
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log("Trigger created successfully.");
    } catch (error) {
      console.error("Error creating trigger:", error);
    }

    console.log("Inventory table fixed successfully!");
  } catch (error) {
    console.error("Error fixing inventory table:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the fix
fixInventoryTable().catch((error) => {
  console.error("Fix failed:", error);
  process.exit(1);
});
