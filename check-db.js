import mysql from "mysql2/promise";
import { config } from "dotenv";

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function checkInventoryItems() {
  console.log("Checking inventory items...");
  console.log(
    `Database connection details: ${DB_HOST}:${
      process.env.DB_PORT || "3306"
    } (${DB_NAME})`
  );

  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    // Check if inventory_items table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'inventory_items'"
    );
    if (tables.length === 0) {
      console.log("inventory_items table does not exist!");
      return;
    }

    // Get total count
    const [items] = await connection.query(
      "SELECT COUNT(*) as count FROM inventory_items"
    );
    console.log(`Total inventory items in database: ${items[0].count}`);

    // Get sample items
    const [rows] = await connection.query(
      "SELECT * FROM inventory_items LIMIT 5"
    );
    console.log("Sample items:");
    console.log(rows);

    // Check what's being displayed in the app
    const [appItems] = await connection.query(`
      SELECT i.*, c.name as category_name
      FROM inventory_items i
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY i.name
    `);
    console.log(`Items that should be displayed in app: ${appItems.length}`);

    // Check the query used in the server
    console.log("\nChecking server query results:");
    const [serverItems] = await connection.query(`
      SELECT
        i.id,
        i.name,
        i.description,
        i.category_id as categoryId,
        c.name as categoryName,
        i.sku,
        i.quantity_available as quantityAvailable,
        i.quantity_reserved as quantityReserved,
        i.unit_price as unitPrice,
        i.location,
        i.image_url as imageUrl,
        i.created_at as createdAt
      FROM inventory_items i
      JOIN categories c ON i.category_id = c.id
    `);
    console.log(`Server query returned ${serverItems.length} items`);

    // Check if there are any items with missing category references
    const [missingCategories] = await connection.query(`
      SELECT i.*
      FROM inventory_items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE c.id IS NULL
    `);

    if (missingCategories.length > 0) {
      console.log(
        `\nWARNING: Found ${missingCategories.length} items with invalid category references!`
      );
      console.log(missingCategories);
    }
  } catch (error) {
    console.error("Error checking inventory items:", error);
  } finally {
    await connection.end();
    console.log("Database connection closed");
  }
}

checkInventoryItems();
