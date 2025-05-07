const { pool, query } = require("./neon-client");

// Define categories
const categories = [
  { id: 1, name: "Cleaning Supplies" },
  { id: 2, name: "Electronics" },
  { id: 3, name: "Furniture" },
  { id: 4, name: "Hardware" },
  { id: 5, name: "Kitchen Supplies" },
  { id: 6, name: "Office" },
  { id: 7, name: "Office Supplies" },
  { id: 8, name: "Other" },
  { id: 9, name: "Packaging Materials" },
  { id: 10, name: "Printing Supplies" },
];

// Sample items for Hardware category
const hardwareItems = [
  {
    name: "Screwdriver Set",
    description: "10-piece screwdriver set with various sizes",
    category_id: 4,
    sku: "HW-001",
    quantity_available: 12,
    quantity_reserved: 0,
    unit_price: 24.99,
    location: "Shelf D1",
  },
  {
    name: "Hammer",
    description: "16oz claw hammer with rubber grip",
    category_id: 4,
    sku: "HW-002",
    quantity_available: 8,
    quantity_reserved: 1,
    unit_price: 15.99,
    location: "Shelf D2",
  },
  {
    name: "Measuring Tape",
    description: "25ft retractable measuring tape",
    category_id: 4,
    sku: "HW-003",
    quantity_available: 15,
    quantity_reserved: 0,
    unit_price: 9.99,
    location: "Shelf D3",
  },
];

// Sample items for Kitchen Supplies category
const kitchenItems = [
  {
    name: "Coffee Maker",
    description: "12-cup programmable coffee maker",
    category_id: 5,
    sku: "KS-001",
    quantity_available: 6,
    quantity_reserved: 1,
    unit_price: 49.99,
    location: "Shelf E1",
  },
  {
    name: "Paper Cups",
    description: "Pack of 100 disposable paper cups, 12oz",
    category_id: 5,
    sku: "KS-002",
    quantity_available: 30,
    quantity_reserved: 0,
    unit_price: 8.99,
    location: "Shelf E2",
  },
];

// Sample items for Office category
const officeItems = [
  {
    name: "Desk Organizer",
    description: "Multi-compartment desk organizer for office supplies",
    category_id: 6,
    sku: "OF-001",
    quantity_available: 10,
    quantity_reserved: 0,
    unit_price: 19.99,
    location: "Shelf F1",
  },
  {
    name: "Whiteboard",
    description: "36x24 inch magnetic whiteboard with aluminum frame",
    category_id: 6,
    sku: "OF-002",
    quantity_available: 5,
    quantity_reserved: 0,
    unit_price: 39.99,
    location: "Shelf F2",
  },
];

// Sample items for Office Supplies category
const officeSuppliesItems = [
  {
    name: "Ballpoint Pens",
    description: "Box of 12 black ballpoint pens",
    category_id: 7,
    sku: "OS-001",
    quantity_available: 40,
    quantity_reserved: 0,
    unit_price: 4.99,
    location: "Shelf G1",
  },
  {
    name: "Sticky Notes",
    description: "Pack of 5 sticky note pads, assorted colors",
    category_id: 7,
    sku: "OS-002",
    quantity_available: 25,
    quantity_reserved: 0,
    unit_price: 7.99,
    location: "Shelf G2",
  },
];

// Sample items for Other category
const otherItems = [
  {
    name: "First Aid Kit",
    description: "Comprehensive first aid kit with 100+ items",
    category_id: 8,
    sku: "OT-001",
    quantity_available: 8,
    quantity_reserved: 0,
    unit_price: 29.99,
    location: "Shelf H1",
  },
];

// Sample items for Packaging Materials category
const packagingItems = [
  {
    name: "Shipping Boxes",
    description: "Pack of 10 medium-sized shipping boxes",
    category_id: 9,
    sku: "PM-001",
    quantity_available: 20,
    quantity_reserved: 0,
    unit_price: 15.99,
    location: "Shelf I1",
  },
  {
    name: "Packing Tape",
    description: "3-pack of clear packing tape with dispenser",
    category_id: 9,
    sku: "PM-002",
    quantity_available: 15,
    quantity_reserved: 0,
    unit_price: 9.99,
    location: "Shelf I2",
  },
];

// Sample items for Printing Supplies category
const printingItems = [
  {
    name: "Printer Paper",
    description: "Ream of 500 sheets, 8.5x11 inch, 20lb weight",
    category_id: 10,
    sku: "PS-001",
    quantity_available: 30,
    quantity_reserved: 0,
    unit_price: 6.99,
    location: "Shelf J1",
  },
  {
    name: "Ink Cartridges",
    description: "Black ink cartridge for HP printers",
    category_id: 10,
    sku: "PS-002",
    quantity_available: 12,
    quantity_reserved: 0,
    unit_price: 24.99,
    location: "Shelf J2",
  },
];

// Combine all items
const allItems = [
  ...hardwareItems,
  ...kitchenItems,
  ...officeItems,
  ...officeSuppliesItems,
  ...otherItems,
  ...packagingItems,
  ...printingItems,
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
    let itemsAdded = 0;
    let itemsUpdated = 0;

    // Process items one by one
    for (const item of allItems) {
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
              location = $7
            WHERE sku = $8`,
            [
              item.name,
              item.description,
              item.category_id,
              item.quantity_available,
              item.quantity_reserved,
              item.unit_price,
              item.location,
              item.sku,
            ]
          );

          itemsUpdated++;
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
              location
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              item.name,
              item.description,
              item.category_id,
              item.sku,
              item.quantity_available,
              item.quantity_reserved,
              item.unit_price,
              item.location,
            ]
          );

          itemsAdded++;
        }
      } catch (error) {
        console.error(`Error processing item ${item.name}:`, error);
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

    // Get category counts
    const categoryCountsResult = await query(`
      SELECT
        c.id,
        c.name,
        COUNT(i.id) as item_count
      FROM
        categories c
      LEFT JOIN
        inventory_items i ON c.id = i.category_id
      GROUP BY
        c.id, c.name
      ORDER BY
        c.id
    `);

    const categoryCounts = categoryCountsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      itemCount: parseInt(row.item_count),
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Items added/updated successfully",
        categoriesCount,
        itemsCount,
        itemsAdded,
        itemsUpdated,
        categoryCounts,
      }),
    };
  } catch (error) {
    console.error("Error adding items:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error adding items",
        error: error.message,
      }),
    };
  }
};
