const { Pool } = require("pg");

// Initialize Neon PostgreSQL client
const connectionString = process.env.NEON_CONNECTION_STRING;

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  // Only handle POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const client = await pool.connect();
    console.log("Connected to Neon database successfully");

    try {
      // 1. Get all categories
      const categoriesResult = await client.query(
        "SELECT id, name FROM categories ORDER BY name"
      );
      const categories = categoriesResult.rows;
      console.log(`Found ${categories.length} categories`);

      // 2. Get all inventory items
      const itemsResult = await client.query(
        "SELECT id, name, description, category_id FROM inventory_items"
      );
      const items = itemsResult.rows;
      console.log(`Found ${items.length} inventory items`);

      // 3. Define category mapping based on item names/descriptions
      const categoryMapping = {
        "Office": ["pen", "paper", "notebook", "stapler", "folder", "binder", "desk", "chair", "cabinet", "file"],
        "Cleaning": ["cleaner", "wipe", "disinfectant", "soap", "sanitizer", "detergent", "brush", "mop", "vacuum", "towel"],
        "Hardware": ["hammer", "screwdriver", "tool", "drill", "saw", "nail", "screw", "wrench", "plier", "tape"],
        "Other": []
      };

      // Find category IDs
      const categoryIds = {};
      for (const category of categories) {
        categoryIds[category.name] = category.id;
      }

      // Ensure we have the basic categories
      const requiredCategories = ["Office", "Cleaning", "Hardware", "Other"];
      for (const catName of requiredCategories) {
        if (!categoryIds[catName]) {
          // Create the category if it doesn't exist
          const newCatResult = await client.query(
            "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id",
            [catName, `${catName} supplies and equipment`]
          );
          categoryIds[catName] = newCatResult.rows[0].id;
          console.log(`Created missing category: ${catName} with ID ${categoryIds[catName]}`);
        }
      }

      // 4. Update each item's category based on its name/description
      const updates = [];
      for (const item of items) {
        let assignedCategory = "Other"; // Default category
        
        // Convert to lowercase for case-insensitive matching
        const itemName = (item.name || "").toLowerCase();
        const itemDesc = (item.description || "").toLowerCase();
        
        // Check each category's keywords
        for (const [category, keywords] of Object.entries(categoryMapping)) {
          for (const keyword of keywords) {
            if (itemName.includes(keyword) || itemDesc.includes(keyword)) {
              assignedCategory = category;
              break;
            }
          }
          if (assignedCategory !== "Other") break;
        }
        
        // Special case handling for specific items
        if (itemName.includes("first aid")) {
          assignedCategory = "Other";
        }
        
        // Only update if the category is different
        if (item.category_id !== categoryIds[assignedCategory]) {
          updates.push({
            id: item.id,
            name: item.name,
            oldCategory: item.category_id,
            newCategory: categoryIds[assignedCategory],
            categoryName: assignedCategory
          });
          
          await client.query(
            "UPDATE inventory_items SET category_id = $1 WHERE id = $2",
            [categoryIds[assignedCategory], item.id]
          );
        }
      }

      // 5. Fix any NaN values in quantity fields
      await client.query(`
        UPDATE inventory_items 
        SET quantity_available = 0 
        WHERE quantity_available IS NULL OR quantity_available::text = 'NaN'
      `);
      
      await client.query(`
        UPDATE inventory_items 
        SET quantity_reserved = 0 
        WHERE quantity_reserved IS NULL OR quantity_reserved::text = 'NaN'
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Categories updated successfully",
          updates,
          categories: Object.entries(categoryIds).map(([name, id]) => ({ name, id }))
        }),
      };
    } catch (error) {
      console.error("Error updating categories:", error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          message: "Error updating categories",
          error: error.message,
        }),
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error connecting to database:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error connecting to database",
        error: error.message,
      }),
    };
  }
};
