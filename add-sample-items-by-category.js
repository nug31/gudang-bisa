// Script to add sample inventory items organized by categories
import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Sample inventory items by category
const sampleItemsByCategory = {
  // Office Supplies
  "Office Supplies": [
    {
      name: "Ballpoint Pens (Box of 12)",
      description: "Blue ink ballpoint pens, medium point",
      sku: "OFF-PEN-001",
      quantityAvailable: 50,
      quantityReserved: 5,
      unitPrice: 3.99,
      location: "Shelf A1",
      imageUrl:
        "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format",
    },
    {
      name: "Sticky Notes (Pack of 5)",
      description: "Assorted colors, 3x3 inches",
      sku: "OFF-NOTE-001",
      quantityAvailable: 30,
      quantityReserved: 2,
      unitPrice: 4.5,
      location: "Shelf A2",
      imageUrl:
        "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&auto=format",
    },
    {
      name: "Stapler",
      description: "Standard desktop stapler, black",
      sku: "OFF-STAP-001",
      quantityAvailable: 20,
      quantityReserved: 0,
      unitPrice: 8.99,
      location: "Shelf A3",
      imageUrl:
        "https://images.unsplash.com/photo-1612613900450-d196c2582a2d?w=500&auto=format",
    },
    {
      name: "Paper Clips (Box of 100)",
      description: "Standard size paper clips, silver",
      sku: "OFF-CLIP-001",
      quantityAvailable: 40,
      quantityReserved: 0,
      unitPrice: 2.49,
      location: "Shelf A4",
      imageUrl:
        "https://images.unsplash.com/photo-1602177558603-6bfb71ee0721?w=500&auto=format",
    },
  ],

  // Office
  Office: [
    {
      name: "Desk Organizer",
      description: "5-compartment mesh desk organizer",
      sku: "OFF-ORG-001",
      quantityAvailable: 15,
      quantityReserved: 2,
      unitPrice: 12.99,
      location: "Shelf B1",
      imageUrl:
        "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format",
    },
    {
      name: "Desk Lamp",
      description: "LED desk lamp with adjustable brightness",
      sku: "OFF-LAMP-001",
      quantityAvailable: 10,
      quantityReserved: 1,
      unitPrice: 24.99,
      location: "Shelf B2",
      imageUrl:
        "https://images.unsplash.com/photo-1534281305182-8708ce0a5f55?w=500&auto=format",
    },
    {
      name: "Whiteboard",
      description: "24x36 inch magnetic whiteboard",
      sku: "OFF-WB-001",
      quantityAvailable: 8,
      quantityReserved: 0,
      unitPrice: 29.99,
      location: "Shelf B3",
      imageUrl:
        "https://images.unsplash.com/photo-1544033527-b611bb87cfed?w=500&auto=format",
    },
  ],

  // Cleaning Supplies
  "Cleaning Supplies": [
    {
      name: "All-Purpose Cleaner",
      description: "32 oz bottle of all-purpose cleaning solution",
      sku: "CLEAN-APC-001",
      quantityAvailable: 25,
      quantityReserved: 3,
      unitPrice: 5.99,
      location: "Shelf C1",
      imageUrl:
        "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format",
    },
    {
      name: "Microfiber Cloths (Pack of 10)",
      description: "Reusable microfiber cleaning cloths",
      sku: "CLEAN-MFC-001",
      quantityAvailable: 20,
      quantityReserved: 0,
      unitPrice: 9.99,
      location: "Shelf C2",
      imageUrl:
        "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format",
    },
    {
      name: "Hand Sanitizer (8 oz)",
      description: "Alcohol-based hand sanitizer gel",
      sku: "CLEAN-HS-001",
      quantityAvailable: 40,
      quantityReserved: 5,
      unitPrice: 3.99,
      location: "Shelf C3",
      imageUrl:
        "https://images.unsplash.com/photo-1584483720412-ce931f4aefa8?w=500&auto=format",
    },
  ],

  // Hardware
  Hardware: [
    {
      name: "Screwdriver Set",
      description: "10-piece precision screwdriver set",
      sku: "HW-SD-001",
      quantityAvailable: 12,
      quantityReserved: 1,
      unitPrice: 15.99,
      location: "Shelf D1",
      imageUrl:
        "https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=500&auto=format",
    },
    {
      name: "Hammer",
      description: "16 oz claw hammer with fiberglass handle",
      sku: "HW-HAM-001",
      quantityAvailable: 8,
      quantityReserved: 0,
      unitPrice: 12.99,
      location: "Shelf D2",
      imageUrl:
        "https://images.unsplash.com/photo-1586864387789-628af9feed72?w=500&auto=format",
    },
    {
      name: "Measuring Tape",
      description: "25 ft retractable measuring tape",
      sku: "HW-MT-001",
      quantityAvailable: 15,
      quantityReserved: 2,
      unitPrice: 8.99,
      location: "Shelf D3",
      imageUrl:
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format",
    },
  ],

  // Electronics
  Electronics: [
    {
      name: "USB Flash Drive (32GB)",
      description: "32GB USB 3.0 flash drive",
      sku: "ELEC-USB-001",
      quantityAvailable: 20,
      quantityReserved: 3,
      unitPrice: 14.99,
      location: "Shelf E1",
      imageUrl:
        "https://images.unsplash.com/photo-1617471346061-5d329ab9c574?w=500&auto=format",
    },
    {
      name: "HDMI Cable (6ft)",
      description: "6ft HDMI 2.0 cable",
      sku: "ELEC-HDMI-001",
      quantityAvailable: 15,
      quantityReserved: 0,
      unitPrice: 9.99,
      location: "Shelf E2",
      imageUrl:
        "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500&auto=format",
    },
    {
      name: "Wireless Mouse",
      description: "Ergonomic wireless optical mouse",
      sku: "ELEC-MOUSE-001",
      quantityAvailable: 10,
      quantityReserved: 1,
      unitPrice: 19.99,
      location: "Shelf E3",
      imageUrl:
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format",
    },
  ],

  // Other categories
  Other: [
    {
      name: "First Aid Kit",
      description: "Comprehensive first aid kit with 100+ items",
      sku: "OTHER-FA-001",
      quantityAvailable: 5,
      quantityReserved: 0,
      unitPrice: 29.99,
      location: "Shelf F1",
      imageUrl:
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format",
    },
    {
      name: "Safety Glasses",
      description: "Clear safety glasses with side shields",
      sku: "OTHER-SG-001",
      quantityAvailable: 20,
      quantityReserved: 0,
      unitPrice: 6.99,
      location: "Shelf F2",
      imageUrl:
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format",
    },
  ],
};

async function addSampleItems() {
  const client = await pool.connect();
  try {
    console.log("Connected to database");

    // Get all categories
    const categoriesResult = await client.query(
      "SELECT id, name FROM categories"
    );
    const categories = categoriesResult.rows;
    console.log(`Found ${categories.length} categories`);

    // Create a map of category names to IDs
    const categoryMap = {};
    categories.forEach((category) => {
      categoryMap[category.name] = category.id;
    });

    // Clear existing inventory items
    await client.query("DELETE FROM inventory_items");
    console.log("Cleared existing inventory items");

    // Reset the sequence if it exists
    try {
      await client.query(
        "ALTER SEQUENCE inventory_items_id_seq RESTART WITH 1"
      );
      console.log("Reset inventory_items_id_seq");
    } catch (error) {
      console.log("No sequence to reset or error resetting sequence");
    }

    // Add sample items for each category
    let totalItemsAdded = 0;

    for (const categoryName in sampleItemsByCategory) {
      const categoryId = categoryMap[categoryName];

      if (!categoryId) {
        console.log(
          `Category "${categoryName}" not found in database. Skipping.`
        );
        continue;
      }

      console.log(
        `Adding items for category: ${categoryName} (ID: ${categoryId})`
      );

      const items = sampleItemsByCategory[categoryName];
      for (const item of items) {
        await client.query(
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
            categoryId,
            item.sku,
            item.quantityAvailable,
            item.quantityReserved,
            item.unitPrice,
            item.location,
            item.imageUrl,
          ]
        );

        console.log(`Added item: ${item.name}`);
        totalItemsAdded++;
      }
    }

    console.log(`Successfully added ${totalItemsAdded} inventory items`);
  } catch (error) {
    console.error("Error adding sample items:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addSampleItems().catch(console.error);
