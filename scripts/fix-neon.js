import { config } from "dotenv";
import pg from "pg";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error(
    "Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file."
  );
  process.exit(1);
}

async function fixNeonSchema() {
  console.log("Fixing Neon database schema...");

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

    // Create the inventory_items table
    const createInventoryTable = `
    CREATE TABLE IF NOT EXISTS inventory_items (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category_id UUID NOT NULL REFERENCES categories(id),
      sku VARCHAR(100),
      quantity_available INTEGER NOT NULL DEFAULT 0,
      quantity_reserved INTEGER NOT NULL DEFAULT 0,
      unit_price DECIMAL(10,2) DEFAULT 0,
      location VARCHAR(255),
      image_url VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    `;

    console.log("Creating inventory_items table...");
    try {
      await client.query(createInventoryTable);
      console.log("inventory_items table created successfully.");
    } catch (error) {
      console.error("Error creating inventory_items table:", error);
    }

    // Create trigger for inventory_items
    const createTrigger = `
    CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON inventory_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log("Creating trigger for inventory_items...");
    try {
      await client.query(createTrigger);
      console.log("Trigger created successfully.");
    } catch (error) {
      console.error("Error creating trigger:", error);
    }

    console.log("Neon database schema fixed successfully!");
  } catch (error) {
    console.error("Error fixing Neon schema:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the fix
fixNeonSchema().catch((error) => {
  console.error("Fix failed:", error);
  process.exit(1);
});
