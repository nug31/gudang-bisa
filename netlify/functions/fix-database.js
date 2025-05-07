const { pool, query } = require("./neon-client");

// Define categories
const categories = [
  {
    name: "Cleaning Supplies",
    description:
      "Cleaning products, paper towels, and other janitorial supplies",
  },
  {
    name: "Electronics",
    description: "Computers, phones, cables, and other electronic devices",
  },
  {
    name: "Furniture",
    description: "Desks, chairs, cabinets, and other office furniture",
  },
  { name: "Hardware", description: "Hardware tools and equipment" },
  {
    name: "Kitchen Supplies",
    description: "Coffee, tea, snacks, and kitchen equipment",
  },
  { name: "Office", description: "Office supplies and equipment" },
  {
    name: "Office Supplies",
    description: "Pens, paper, staplers, and other office essentials",
  },
  { name: "Other", description: "Other items" },
  {
    name: "Packaging Materials",
    description: "Boxes, tape, bubble wrap, and other packaging supplies",
  },
  {
    name: "Printing Supplies",
    description: "Ink, toner, paper, and other printing supplies",
  },
];

// Sample inventory items for each category
const sampleItems = [
  // Cleaning Supplies
  {
    name: "Paper Towels",
    description: "Pack of 6 rolls, absorbent paper towels",
    category_name: "Cleaning Supplies",
    sku: "CL-001",
    quantity_available: 50,
    quantity_reserved: 0,
    unit_price: 12.99,
    location: "Shelf A1",
    image_url: null,
  },
  {
    name: "All-Purpose Cleaner",
    description: "Multi-surface cleaning solution, 32oz bottle",
    category_name: "Cleaning Supplies",
    sku: "CL-002",
    quantity_available: 30,
    quantity_reserved: 2,
    unit_price: 5.99,
    location: "Shelf A2",
    image_url: null,
  },
  {
    name: "Disinfectant Wipes",
    description: "Container of 75 disinfecting wipes",
    category_name: "Cleaning Supplies",
    sku: "CL-003",
    quantity_available: 25,
    quantity_reserved: 0,
    unit_price: 7.49,
    location: "Shelf A3",
    image_url: null,
  },

  // Electronics
  {
    name: "HDMI Cable",
    description: "6ft HDMI cable, 4K compatible",
    category_name: "Electronics",
    sku: "EL-001",
    quantity_available: 15,
    quantity_reserved: 1,
    unit_price: 9.99,
    location: "Shelf B1",
    image_url: null,
  },
  {
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with USB receiver",
    category_name: "Electronics",
    sku: "EL-002",
    quantity_available: 10,
    quantity_reserved: 0,
    unit_price: 19.99,
    location: "Shelf B2",
    image_url: null,
  },
  {
    name: "USB Flash Drive",
    description: "32GB USB 3.0 flash drive",
    category_name: "Electronics",
    sku: "EL-003",
    quantity_available: 20,
    quantity_reserved: 0,
    unit_price: 14.99,
    location: "Shelf B3",
    image_url: null,
  },

  // Furniture
  {
    name: "Office Chair",
    description: "Adjustable ergonomic office chair with lumbar support",
    category_name: "Furniture",
    sku: "FN-001",
    quantity_available: 5,
    quantity_reserved: 1,
    unit_price: 129.99,
    location: "Section C1",
    image_url: null,
  },
  {
    name: "Desk Lamp",
    description: "LED desk lamp with adjustable brightness",
    category_name: "Furniture",
    sku: "FN-002",
    quantity_available: 8,
    quantity_reserved: 0,
    unit_price: 34.99,
    location: "Section C2",
    image_url: null,
  },
  {
    name: "Bookshelf",
    description: "5-tier bookshelf, wooden construction",
    category_name: "Furniture",
    sku: "FN-003",
    quantity_available: 3,
    quantity_reserved: 0,
    unit_price: 89.99,
    location: "Section C3",
    image_url: null,
  },

  // Hardware
  {
    name: "Screwdriver Set",
    description: "10-piece screwdriver set with various sizes",
    category_name: "Hardware",
    sku: "HW-001",
    quantity_available: 12,
    quantity_reserved: 0,
    unit_price: 24.99,
    location: "Shelf D1",
    image_url: null,
  },
  {
    name: "Hammer",
    description: "16oz claw hammer with rubber grip",
    category_name: "Hardware",
    sku: "HW-002",
    quantity_available: 8,
    quantity_reserved: 1,
    unit_price: 15.99,
    location: "Shelf D2",
    image_url: null,
  },
  {
    name: "Measuring Tape",
    description: "25ft retractable measuring tape",
    category_name: "Hardware",
    sku: "HW-003",
    quantity_available: 15,
    quantity_reserved: 0,
    unit_price: 9.99,
    location: "Shelf D3",
    image_url: null,
  },

  // Kitchen Supplies
  {
    name: "Coffee Maker",
    description: "12-cup programmable coffee maker",
    category_name: "Kitchen Supplies",
    sku: "KS-001",
    quantity_available: 6,
    quantity_reserved: 1,
    unit_price: 49.99,
    location: "Shelf E1",
    image_url: null,
  },
  {
    name: "Paper Cups",
    description: "Pack of 100 disposable paper cups, 12oz",
    category_name: "Kitchen Supplies",
    sku: "KS-002",
    quantity_available: 30,
    quantity_reserved: 0,
    unit_price: 8.99,
    location: "Shelf E2",
    image_url: null,
  },
  {
    name: "Tea Bags",
    description: "Box of 50 assorted tea bags",
    category_name: "Kitchen Supplies",
    sku: "KS-003",
    quantity_available: 20,
    quantity_reserved: 0,
    unit_price: 12.99,
    location: "Shelf E3",
    image_url: null,
  },

  // Office
  {
    name: "Desk Organizer",
    description: "Multi-compartment desk organizer for office supplies",
    category_name: "Office",
    sku: "OF-001",
    quantity_available: 10,
    quantity_reserved: 0,
    unit_price: 19.99,
    location: "Shelf F1",
    image_url: null,
  },
  {
    name: "Whiteboard",
    description: "36x24 inch magnetic whiteboard with aluminum frame",
    category_name: "Office",
    sku: "OF-002",
    quantity_available: 5,
    quantity_reserved: 0,
    unit_price: 39.99,
    location: "Shelf F2",
    image_url: null,
  },

  // Office Supplies
  {
    name: "Ballpoint Pens",
    description: "Box of 12 black ballpoint pens",
    category_name: "Office Supplies",
    sku: "OS-001",
    quantity_available: 40,
    quantity_reserved: 0,
    unit_price: 4.99,
    location: "Shelf G1",
    image_url: null,
  },
  {
    name: "Sticky Notes",
    description: "Pack of 5 sticky note pads, assorted colors",
    category_name: "Office Supplies",
    sku: "OS-002",
    quantity_available: 25,
    quantity_reserved: 0,
    unit_price: 7.99,
    location: "Shelf G2",
    image_url: null,
  },

  // Other
  {
    name: "First Aid Kit",
    description: "Comprehensive first aid kit with 100+ items",
    category_name: "Other",
    sku: "OT-001",
    quantity_available: 8,
    quantity_reserved: 0,
    unit_price: 29.99,
    location: "Shelf H1",
    image_url: null,
  },

  // Packaging Materials
  {
    name: "Shipping Boxes",
    description: "Pack of 10 medium-sized shipping boxes",
    category_name: "Packaging Materials",
    sku: "PM-001",
    quantity_available: 20,
    quantity_reserved: 0,
    unit_price: 15.99,
    location: "Shelf I1",
    image_url: null,
  },
  {
    name: "Packing Tape",
    description: "3-pack of clear packing tape with dispenser",
    category_name: "Packaging Materials",
    sku: "PM-002",
    quantity_available: 15,
    quantity_reserved: 0,
    unit_price: 9.99,
    location: "Shelf I2",
    image_url: null,
  },

  // Printing Supplies
  {
    name: "Printer Paper",
    description: "Ream of 500 sheets, 8.5x11 inch, 20lb weight",
    category_name: "Printing Supplies",
    sku: "PS-001",
    quantity_available: 30,
    quantity_reserved: 0,
    unit_price: 6.99,
    location: "Shelf J1",
    image_url: null,
  },
  {
    name: "Ink Cartridges",
    description: "Black ink cartridge for HP printers",
    category_name: "Printing Supplies",
    sku: "PS-002",
    quantity_available: 12,
    quantity_reserved: 0,
    unit_price: 24.99,
    location: "Shelf J2",
    image_url: null,
  },
];

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    // Check if we should reset the database
    const resetDatabase = event.queryStringParameters?.reset === "true";

    if (resetDatabase) {
      // Drop tables if they exist
      await query("DROP TABLE IF EXISTS inventory_items CASCADE");
      await query("DROP TABLE IF EXISTS categories CASCADE");

      // Create categories table
      await query(`
        CREATE TABLE categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create inventory_items table
      await query(`
        CREATE TABLE inventory_items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category_id INTEGER REFERENCES categories(id),
          sku VARCHAR(50),
          quantity_available INTEGER DEFAULT 0,
          quantity_reserved INTEGER DEFAULT 0,
          unit_price DECIMAL(10, 2),
          location VARCHAR(255),
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Insert categories
    const categoryMap = {};

    for (const category of categories) {
      // Check if category already exists
      const existingCategoryResult = await query(
        "SELECT id FROM categories WHERE name = $1",
        [category.name]
      );

      if (existingCategoryResult.rows.length > 0) {
        categoryMap[category.name] = existingCategoryResult.rows[0].id;
      } else {
        // Insert new category
        const result = await query(
          "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id",
          [category.name, category.description]
        );

        categoryMap[category.name] = result.rows[0].id;
      }
    }

    // If resetting the database, delete all items first
    if (resetDatabase) {
      await query("DELETE FROM inventory_items");
    }

    // Insert sample items
    let itemsAdded = 0;

    // Process items in batches to avoid timeouts
    const batchSize = 5;
    for (let i = 0; i < sampleItems.length; i += batchSize) {
      const batch = sampleItems.slice(i, i + batchSize);

      for (const item of batch) {
        try {
          // Check if item already exists
          const existingItemResult = await query(
            "SELECT id FROM inventory_items WHERE sku = $1",
            [item.sku]
          );

          if (existingItemResult.rows.length > 0) {
            // Update existing item
            await query(
              `UPDATE inventory_items SET
                name = $1,
                description = $2,
                category_id = $3,
                quantity_available = $4,
                quantity_reserved = $5,
                unit_price = $6,
                location = $7,
                image_url = $8
              WHERE sku = $9`,
              [
                item.name,
                item.description,
                categoryMap[item.category_name],
                item.quantity_available,
                item.quantity_reserved,
                item.unit_price,
                item.location,
                item.image_url,
                item.sku,
              ]
            );
          } else {
            // Insert new item
            await query(
              `INSERT INTO inventory_items (
                name,
                description,
                category_id,
                sku,
                quantity_available,
                quantity_reserved,
                unit_price,
                location,
                image_url
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                item.name,
                item.description,
                categoryMap[item.category_name],
                item.sku,
                item.quantity_available,
                item.quantity_reserved,
                item.unit_price,
                item.location,
                item.image_url,
              ]
            );

            itemsAdded++;
          }
        } catch (error) {
          console.error(`Error processing item ${item.name}:`, error);
        }
      }
    }

    // Get counts
    const categoriesCountResult = await query(
      "SELECT COUNT(*) FROM categories"
    );
    const itemsCountResult = await query(
      "SELECT COUNT(*) FROM inventory_items"
    );

    const categoriesCount = parseInt(categoriesCountResult.rows[0].count);
    const itemsCount = parseInt(itemsCountResult.rows[0].count);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: resetDatabase
          ? "Database reset and populated successfully"
          : "Database updated successfully",
        categoriesCount,
        itemsCount,
        itemsAdded,
        categoryMap,
      }),
    };
  } catch (error) {
    console.error("Error fixing database:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error fixing database",
        error: error.message,
      }),
    };
  }
};
