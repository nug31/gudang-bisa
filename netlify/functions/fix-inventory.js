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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "text/html",
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "Preflight call successful",
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
        "SELECT id, name, description, category_id, quantity_available, quantity_reserved FROM inventory_items"
      );
      const items = itemsResult.rows;
      console.log(`Found ${items.length} inventory items`);

      // 3. Define category mapping based on item names/descriptions
      const categoryMapping = {
        "Office Supplies": ["pen", "paper", "notebook", "stapler", "folder", "binder", "printer"],
        "Cleaning Materials": ["cleaner", "wipe", "disinfectant", "soap", "sanitizer", "detergent", "brush", "mop", "vacuum", "towel"],
        "Hardware": ["hammer", "screwdriver", "tool", "drill", "saw", "nail", "screw", "wrench", "plier", "tape"],
        "Other": []
      };

      // Find category IDs
      const categoryIds = {};
      for (const category of categories) {
        categoryIds[category.name] = category.id;
      }

      // Ensure we have the basic categories
      const requiredCategories = ["Office Supplies", "Cleaning Materials", "Hardware", "Other"];
      for (const catName of requiredCategories) {
        if (!categoryIds[catName]) {
          // Create the category if it doesn't exist
          const newCatResult = await client.query(
            "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id",
            [catName, `${catName} and equipment`]
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
        if (itemName.includes("all-purpose cleaner")) {
          assignedCategory = "Cleaning Materials";
        } else if (itemName.includes("ballpoint pen")) {
          assignedCategory = "Office Supplies";
        } else if (itemName.includes("disinfectant wipe")) {
          assignedCategory = "Cleaning Materials";
        } else if (itemName.includes("first aid")) {
          assignedCategory = "Other";
        } else if (itemName.includes("hammer")) {
          assignedCategory = "Hardware";
        } else if (itemName.includes("paper towel")) {
          assignedCategory = "Cleaning Materials";
        } else if (itemName.includes("printer paper")) {
          assignedCategory = "Office Supplies";
        } else if (itemName.includes("screwdriver")) {
          assignedCategory = "Hardware";
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

      // Generate HTML response
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inventory Fix Results</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2563eb; }
          h2 { color: #4b5563; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background-color: #f9fafb; font-weight: 600; }
          tr:hover { background-color: #f3f4f6; }
          .success { color: #059669; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .button:hover { background-color: #1d4ed8; }
        </style>
      </head>
      <body>
        <h1>Inventory Fix Results</h1>
        <p class="success">✅ Successfully updated categories and fixed quantity values!</p>
        
        <h2>Category Assignments</h2>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            ${updates.map(update => `
              <tr>
                <td>${update.name}</td>
                <td>${update.categoryName}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h2>Available Categories</h2>
        <table>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(categoryIds).map(([name, id]) => `
              <tr>
                <td>${name}</td>
                <td>${id}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <a href="/inventory" class="button">Go to Inventory</a>
      </body>
      </html>
      `;

      return {
        statusCode: 200,
        headers,
        body: html,
      };
    } catch (error) {
      console.error("Error updating categories:", error);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          "Content-Type": "text/html",
        },
        body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            .error { color: #e11d48; }
          </style>
        </head>
        <body>
          <h1 class="error">Error updating categories</h1>
          <p>${error.message}</p>
          <pre>${error.stack}</pre>
        </body>
        </html>
        `,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error connecting to database:", error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        "Content-Type": "text/html",
      },
      body: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
          .error { color: #e11d48; }
        </style>
      </head>
      <body>
        <h1 class="error">Error connecting to database</h1>
        <p>${error.message}</p>
      </body>
      </html>
      `,
    };
  }
};
