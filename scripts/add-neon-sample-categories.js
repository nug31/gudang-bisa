// Script to add sample categories to the Neon database
import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

// Initialize Neon PostgreSQL client
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error(
    "Error: NEON_CONNECTION_STRING environment variable is not set"
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Sample categories
const sampleCategories = [
  {
    name: "Office",
    description: "Office supplies and stationery",
    icon: "file-text",
    color: "#4f46e5",
  },
  {
    name: "Cleaning",
    description: "Cleaning supplies and materials",
    icon: "spray-can",
    color: "#10b981",
  },
  {
    name: "Hardware",
    description: "Tools and hardware items",
    icon: "tool",
    color: "#f59e0b",
  },
  {
    name: "Other",
    description: "Miscellaneous items",
    icon: "package",
    color: "#6b7280",
  },
  {
    name: "Kitchen Supplies",
    description: "Kitchen and pantry items",
    icon: "coffee",
    color: "#ef4444",
  },
  {
    name: "Office Supplies",
    description: "General office supplies",
    icon: "paperclip",
    color: "#3b82f6",
  },
  {
    name: "Packaging Materials",
    description: "Boxes, tape, and packaging materials",
    icon: "box",
    color: "#8b5cf6",
  },
  {
    name: "Printing Supplies",
    description: "Ink, toner, and printing materials",
    icon: "printer",
    color: "#ec4899",
  },
  {
    name: "Electronics",
    description: "Electronic devices and accessories",
    icon: "cpu",
    color: "#0ea5e9",
  },
  {
    name: "Furniture",
    description: "Office furniture and fixtures",
    icon: "chair",
    color: "#d97706",
  },
  {
    name: "Test Category",
    description: "For testing purposes",
    icon: "beaker",
    color: "#9333ea",
  },
];

async function addSampleCategories() {
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query("BEGIN");

    console.log("Adding sample categories...");

    // Check if categories table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'categories'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("Creating categories table...");
      await client.query(`
        CREATE TABLE categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          icon VARCHAR(50),
          color VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Check if inventory_items table exists and has data
    const inventoryCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'inventory_items'
      );
    `);

    if (inventoryCheck.rows[0].exists) {
      // Clear existing inventory items first to avoid foreign key constraint issues
      console.log(
        "Clearing inventory items to avoid foreign key constraints..."
      );
      await client.query("DELETE FROM inventory_items");
    }

    // Now clear existing categories
    console.log("Clearing existing categories...");
    await client.query("DELETE FROM categories");

    // Reset the sequence
    await client.query("ALTER SEQUENCE categories_id_seq RESTART WITH 1");

    // Insert sample categories
    for (const category of sampleCategories) {
      await client.query(
        `
        INSERT INTO categories (name, description, icon, color)
        VALUES ($1, $2, $3, $4)
      `,
        [category.name, category.description, category.icon, category.color]
      );

      console.log(`Added category: ${category.name}`);
    }

    // Commit the transaction
    await client.query("COMMIT");

    console.log("Successfully added sample categories!");

    // Count the categories
    const countResult = await client.query("SELECT COUNT(*) FROM categories");
    console.log(`Total categories in database: ${countResult.rows[0].count}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error adding sample categories:", error);
  } finally {
    client.release();
    pool.end();
  }
}

addSampleCategories();
