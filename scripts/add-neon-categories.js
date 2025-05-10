/**
 * Script to add categories to the Neon database
 * Run with: node scripts/add-neon-categories.js
 */

import pg from "pg";
const { Pool } = pg;
import "dotenv/config";

// Load environment variables

// Get the Neon connection string from environment variables
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("Connecting to Neon database...");
console.log("Connection string available:", !!connectionString);
console.log(
  "Connection string length:",
  connectionString ? connectionString.length : 0
);

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Sample categories with IDs to match existing ones
const categories = [
  { id: 1, name: "Office Supplies" },
  { id: 2, name: "Cleaning Supplies" },
  { id: 3, name: "Hardware" },
  { id: 4, name: "Other" },
  { id: 5, name: "Electronics" },
  { id: 6, name: "Furniture" },
];

// Function to add categories
async function addCategories() {
  console.log("Adding categories...");

  try {
    // Check if categories table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'categories'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("Creating categories table...");
      await pool.query(`
        CREATE TABLE categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    }

    // Update or insert categories
    console.log("Updating or inserting categories...");

    for (const category of categories) {
      // Check if category exists
      const existingCategory = await pool.query(
        "SELECT * FROM categories WHERE id = $1",
        [category.id]
      );

      if (existingCategory.rows.length > 0) {
        // Update existing category
        await pool.query(
          "UPDATE categories SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
          [category.name, category.id]
        );
        console.log(`Updated category: ${category.name} (ID: ${category.id})`);
      } else {
        // Insert new category with specific ID
        await pool.query(
          "INSERT INTO categories (id, name) VALUES ($1, $2) RETURNING *",
          [category.id, category.name]
        );
        console.log(`Added category: ${category.name} (ID: ${category.id})`);
      }
    }

    console.log("Categories added successfully!");

    // List all categories
    const result = await pool.query("SELECT * FROM categories ORDER BY id");
    console.log("Current categories in database:");
    result.rows.forEach((row) => {
      console.log(`ID: ${row.id}, Name: ${row.name}`);
    });
  } catch (error) {
    console.error("Error adding categories:", error);
  }
}

// Main function
async function main() {
  try {
    // Test connection
    console.log("Testing database connection...");
    const testResult = await pool.query("SELECT NOW()");
    console.log("Database connection successful:", testResult.rows[0].now);

    // Add categories
    await addCategories();

    // Count categories
    const countResult = await pool.query("SELECT COUNT(*) FROM categories");
    console.log(`Total categories in database: ${countResult.rows[0].count}`);

    console.log("Sample data added successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the pool
    await pool.end();
    console.log("Database connection closed");
  }
}

// Run the main function
main().catch(console.error);
