import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get connection string from environment variables
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("Connecting to Neon database to add sample items...");
console.log("Connection string available:", !!connectionString);

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Sample items by category
const sampleItems = {
  // Office Supplies
  1: [
    {
      name: "Ballpoint Pens (Box of 12)",
      description: "Blue ink ballpoint pens, medium point",
      sku: "OFF-PEN-001",
      quantity_available: 50,
      quantity_reserved: 5,
      unit_price: 3.99,
      location: "Shelf A1",
      image_url:
        "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format",
    },
    {
      name: "Sticky Notes (Pack of 5)",
      description: "Assorted colors, 3x3 inches",
      sku: "OFF-NOTE-001",
      quantity_available: 30,
      quantity_reserved: 2,
      unit_price: 4.5,
      location: "Shelf A2",
      image_url:
        "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&auto=format",
    },
    {
      name: "Printer Paper (500 sheets)",
      description: "Standard white A4 printer paper",
      sku: "OFF-PAPER-001",
      quantity_available: 25,
      quantity_reserved: 0,
      unit_price: 5.99,
      location: "Shelf A3",
      image_url:
        "https://images.unsplash.com/photo-1589552203841-c2e482e8e215?w=500&auto=format",
    },
    {
      name: "Stapler with Staples",
      description: "Standard desktop stapler with 1000 staples",
      sku: "OFF-STAP-001",
      quantity_available: 15,
      quantity_reserved: 0,
      unit_price: 8.99,
      location: "Shelf A4",
      image_url:
        "https://images.unsplash.com/photo-1612255109699-825c876f4e45?w=500&auto=format",
    },
    {
      name: "File Folders (Pack of 25)",
      description: "Letter size manila file folders",
      sku: "OFF-FOLD-001",
      quantity_available: 20,
      quantity_reserved: 0,
      unit_price: 7.5,
      location: "Shelf A5",
      image_url:
        "https://images.unsplash.com/photo-1586282391344-ea8e86f80352?w=500&auto=format",
    },
  ],

  // Cleaning Materials
  2: [
    {
      name: "Disinfectant Wipes (Pack of 75)",
      description: "Multi-surface cleaning and disinfecting wipes",
      sku: "CLEAN-WIPE-001",
      quantity_available: 40,
      quantity_reserved: 10,
      unit_price: 6.99,
      location: "Shelf B1",
      image_url:
        "https://images.unsplash.com/photo-1584515933487-779824d29309?w=500&auto=format",
    },
    {
      name: "Hand Sanitizer (500ml)",
      description: "Alcohol-based hand sanitizer",
      sku: "CLEAN-SAN-001",
      quantity_available: 15,
      quantity_reserved: 3,
      unit_price: 8.99,
      location: "Shelf B2",
      image_url:
        "https://images.unsplash.com/photo-1584483720412-ce931f4aefa8?w=500&auto=format",
    },
    {
      name: "All-Purpose Cleaner (1L)",
      description: "Multi-surface cleaning solution",
      sku: "CLEAN-APC-001",
      quantity_available: 12,
      quantity_reserved: 0,
      unit_price: 4.99,
      location: "Shelf B3",
      image_url:
        "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format",
    },
    {
      name: "Microfiber Cleaning Cloths (Pack of 10)",
      description: "Reusable microfiber cleaning cloths",
      sku: "CLEAN-CLOTH-001",
      quantity_available: 25,
      quantity_reserved: 0,
      unit_price: 9.99,
      location: "Shelf B4",
      image_url:
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format",
    },
    {
      name: "Trash Bags (Box of 30)",
      description: "Heavy-duty 13-gallon trash bags",
      sku: "CLEAN-TRASH-001",
      quantity_available: 18,
      quantity_reserved: 0,
      unit_price: 7.5,
      location: "Shelf B5",
      image_url:
        "https://images.unsplash.com/photo-1610500796385-3ffc1ae2fccb?w=500&auto=format",
    },
  ],

  // Hardware
  3: [
    {
      name: "Screwdriver Set",
      description: "10-piece precision screwdriver set",
      sku: "HW-SCRW-001",
      quantity_available: 8,
      quantity_reserved: 1,
      unit_price: 15.99,
      location: "Shelf C1",
      image_url:
        "https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=500&auto=format",
    },
    {
      name: "Hammer",
      description: "16oz claw hammer with rubber grip",
      sku: "HW-HAMM-001",
      quantity_available: 5,
      quantity_reserved: 0,
      unit_price: 12.99,
      location: "Shelf C2",
      image_url:
        "https://images.unsplash.com/photo-1586864387789-628af9feed72?w=500&auto=format",
    },
    {
      name: "Measuring Tape (5m)",
      description: "Retractable measuring tape with metric and imperial units",
      sku: "HW-TAPE-001",
      quantity_available: 10,
      quantity_reserved: 0,
      unit_price: 8.99,
      location: "Shelf C3",
      image_url:
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format",
    },
    {
      name: "Pliers Set",
      description:
        "3-piece pliers set including needle nose, slip joint, and diagonal cutters",
      sku: "HW-PLIER-001",
      quantity_available: 6,
      quantity_reserved: 0,
      unit_price: 19.99,
      location: "Shelf C4",
      image_url:
        "https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=500&auto=format",
    },
    {
      name: "Utility Knife",
      description: "Retractable utility knife with replacement blades",
      sku: "HW-KNIFE-001",
      quantity_available: 12,
      quantity_reserved: 0,
      unit_price: 6.99,
      location: "Shelf C5",
      image_url:
        "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=500&auto=format",
    },
  ],

  // Other
  4: [
    {
      name: "First Aid Kit",
      description: "Comprehensive first aid kit for office emergencies",
      sku: "OTHER-AID-001",
      quantity_available: 10,
      quantity_reserved: 0,
      unit_price: 29.99,
      location: "Shelf D1",
      image_url:
        "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format",
    },
    {
      name: "Safety Glasses",
      description: "Clear safety glasses with side shields",
      sku: "OTHER-GLASS-001",
      quantity_available: 15,
      quantity_reserved: 0,
      unit_price: 5.99,
      location: "Shelf D2",
      image_url:
        "https://images.unsplash.com/photo-1585554530123-a41e0a2a3d0e?w=500&auto=format",
    },
    {
      name: "Flashlight",
      description: "LED flashlight with rechargeable battery",
      sku: "OTHER-LIGHT-001",
      quantity_available: 8,
      quantity_reserved: 0,
      unit_price: 14.99,
      location: "Shelf D3",
      image_url:
        "https://images.unsplash.com/photo-1590534247854-e97ab10c2a3c?w=500&auto=format",
    },
    {
      name: "Extension Cord (5m)",
      description: "3-outlet extension cord with surge protection",
      sku: "OTHER-CORD-001",
      quantity_available: 6,
      quantity_reserved: 0,
      unit_price: 12.99,
      location: "Shelf D4",
      image_url:
        "https://images.unsplash.com/photo-1544441893-675973e31985?w=500&auto=format",
    },
    {
      name: "Batteries (AA, Pack of 12)",
      description: "Alkaline AA batteries",
      sku: "OTHER-BATT-001",
      quantity_available: 20,
      quantity_reserved: 0,
      unit_price: 9.99,
      location: "Shelf D5",
      image_url:
        "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=500&auto=format",
    },
  ],

  // Electronics
  5: [
    {
      name: "USB Flash Drive (32GB)",
      description: "32GB USB 3.0 flash drive",
      sku: "ELEC-USB-001",
      quantity_available: 15,
      quantity_reserved: 0,
      unit_price: 12.99,
      location: "Shelf E1",
      image_url:
        "https://images.unsplash.com/photo-1617142108319-66c7ab45c711?w=500&auto=format",
    },
    {
      name: "Wireless Mouse",
      description: "Ergonomic wireless mouse with USB receiver",
      sku: "ELEC-MOUSE-001",
      quantity_available: 8,
      quantity_reserved: 0,
      unit_price: 19.99,
      location: "Shelf E2",
      image_url:
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format",
    },
    {
      name: "HDMI Cable (2m)",
      description: "High-speed HDMI cable",
      sku: "ELEC-HDMI-001",
      quantity_available: 10,
      quantity_reserved: 0,
      unit_price: 8.99,
      location: "Shelf E3",
      image_url:
        "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500&auto=format",
    },
    {
      name: "Webcam",
      description: "1080p HD webcam with microphone",
      sku: "ELEC-CAM-001",
      quantity_available: 5,
      quantity_reserved: 0,
      unit_price: 39.99,
      location: "Shelf E4",
      image_url:
        "https://images.unsplash.com/photo-1596566267081-7e152bb76942?w=500&auto=format",
    },
    {
      name: "Power Bank (10000mAh)",
      description: "Portable power bank with dual USB ports",
      sku: "ELEC-POWER-001",
      quantity_available: 7,
      quantity_reserved: 0,
      unit_price: 24.99,
      location: "Shelf E5",
      image_url:
        "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&auto=format",
    },
  ],

  // Furniture
  6: [
    {
      name: "Office Chair",
      description: "Ergonomic office chair with adjustable height",
      sku: "FURN-CHAIR-001",
      quantity_available: 3,
      quantity_reserved: 0,
      unit_price: 129.99,
      location: "Warehouse Section F1",
      image_url:
        "https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=500&auto=format",
    },
    {
      name: "Desk Lamp",
      description: "LED desk lamp with adjustable brightness",
      sku: "FURN-LAMP-001",
      quantity_available: 8,
      quantity_reserved: 0,
      unit_price: 34.99,
      location: "Shelf F2",
      image_url:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format",
    },
    {
      name: "Bookshelf (3-Tier)",
      description: "3-tier bookshelf with metal frame",
      sku: "FURN-SHELF-001",
      quantity_available: 2,
      quantity_reserved: 0,
      unit_price: 79.99,
      location: "Warehouse Section F3",
      image_url:
        "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=500&auto=format",
    },
    {
      name: "Filing Cabinet",
      description: "2-drawer metal filing cabinet",
      sku: "FURN-CAB-001",
      quantity_available: 4,
      quantity_reserved: 0,
      unit_price: 89.99,
      location: "Warehouse Section F4",
      image_url:
        "https://images.unsplash.com/photo-1551645120-d70bfe84c826?w=500&auto=format",
    },
    {
      name: "Desk Organizer",
      description: "Multi-compartment desk organizer",
      sku: "FURN-ORG-001",
      quantity_available: 12,
      quantity_reserved: 0,
      unit_price: 19.99,
      location: "Shelf F5",
      image_url:
        "https://images.unsplash.com/photo-1544247341-d3cb894a2a09?w=500&auto=format",
    },
  ],

  // Kitchen Supplies
  7: [
    {
      name: "Coffee Maker",
      description: "12-cup programmable coffee maker",
      sku: "KITCH-COF-001",
      quantity_available: 2,
      quantity_reserved: 0,
      unit_price: 49.99,
      location: "Kitchen Storage K1",
      image_url:
        "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&auto=format",
    },
    {
      name: "Paper Cups (Pack of 100)",
      description: "Disposable paper cups for hot beverages",
      sku: "KITCH-CUP-001",
      quantity_available: 15,
      quantity_reserved: 0,
      unit_price: 8.99,
      location: "Kitchen Storage K2",
      image_url:
        "https://images.unsplash.com/photo-1577648875829-3b6fab3d147c?w=500&auto=format",
    },
    {
      name: "Microwave Oven",
      description: "Countertop microwave oven, 1.1 cu. ft.",
      sku: "KITCH-MIC-001",
      quantity_available: 1,
      quantity_reserved: 0,
      unit_price: 89.99,
      location: "Kitchen Storage K3",
      image_url:
        "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&auto=format",
    },
    {
      name: "Cutlery Set (Pack of 24)",
      description: "Disposable plastic cutlery set",
      sku: "KITCH-CUT-001",
      quantity_available: 20,
      quantity_reserved: 0,
      unit_price: 5.99,
      location: "Kitchen Storage K4",
      image_url:
        "https://images.unsplash.com/photo-1589282169427-71c0d08a9908?w=500&auto=format",
    },
    {
      name: "Paper Towels (Pack of 6)",
      description: "2-ply paper towel rolls",
      sku: "KITCH-TOW-001",
      quantity_available: 25,
      quantity_reserved: 0,
      unit_price: 9.99,
      location: "Kitchen Storage K5",
      image_url:
        "https://images.unsplash.com/photo-1583251633146-d0c6c036187d?w=500&auto=format",
    },
  ],

  // Printing Supplies
  8: [
    {
      name: "Printer Toner (Black)",
      description: "Black toner cartridge for laser printers",
      sku: "PRINT-TNR-001",
      quantity_available: 10,
      quantity_reserved: 0,
      unit_price: 59.99,
      location: "Shelf P1",
      image_url:
        "https://images.unsplash.com/photo-1612815292258-f4354f7f5ae5?w=500&auto=format",
    },
    {
      name: "Printer Ink Set (Color)",
      description: "4-color ink cartridge set for inkjet printers",
      sku: "PRINT-INK-001",
      quantity_available: 8,
      quantity_reserved: 0,
      unit_price: 49.99,
      location: "Shelf P2",
      image_url:
        "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=500&auto=format",
    },
    {
      name: "Photo Paper (Pack of 50)",
      description: "Glossy photo paper, 4x6 inches",
      sku: "PRINT-PHOTO-001",
      quantity_available: 15,
      quantity_reserved: 0,
      unit_price: 12.99,
      location: "Shelf P3",
      image_url:
        "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format",
    },
    {
      name: "Printer Maintenance Kit",
      description: "Maintenance kit for laser printers",
      sku: "PRINT-MAINT-001",
      quantity_available: 3,
      quantity_reserved: 0,
      unit_price: 79.99,
      location: "Shelf P4",
      image_url:
        "https://images.unsplash.com/photo-1563770557593-bda2fda29831?w=500&auto=format",
    },
    {
      name: "Label Printer",
      description: "Thermal label printer for shipping labels",
      sku: "PRINT-LBL-001",
      quantity_available: 2,
      quantity_reserved: 0,
      unit_price: 129.99,
      location: "Shelf P5",
      image_url:
        "https://images.unsplash.com/photo-1586219770747-f27ef507b653?w=500&auto=format",
    },
  ],
};

// Function to add sample items to the database
async function addSampleItems() {
  const client = await pool.connect();

  try {
    console.log("Connected to database successfully!");

    // Check if categories exist
    const categoriesResult = await client.query(
      "SELECT * FROM categories ORDER BY id"
    );
    const categories = categoriesResult.rows;

    console.log(`Found ${categories.length} categories:`);
    categories.forEach((cat) => {
      console.log(`- ${cat.id}: ${cat.name}`);
    });

    // Add sample items for each category
    let totalItemsAdded = 0;

    for (const category of categories) {
      const categoryId = category.id.toString();

      // Check if this category has sample items defined
      if (sampleItems[categoryId]) {
        console.log(
          `\nAdding sample items for category: ${category.name} (ID: ${categoryId})`
        );

        for (const item of sampleItems[categoryId]) {
          // Check if item already exists
          const existingItem = await client.query(
            "SELECT * FROM inventory_items WHERE name = $1 AND category_id = $2",
            [item.name, categoryId]
          );

          if (existingItem.rows.length === 0) {
            // Insert new item
            const result = await client.query(
              `
              INSERT INTO inventory_items (
                name, description, category_id, sku,
                quantity_available, quantity_reserved, unit_price,
                location, image_url, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
              RETURNING id
            `,
              [
                item.name,
                item.description,
                categoryId,
                item.sku,
                item.quantity_available,
                item.quantity_reserved,
                item.unit_price,
                item.location,
                item.image_url,
              ]
            );

            console.log(`  ✅ Added: ${item.name} (ID: ${result.rows[0].id})`);
            totalItemsAdded++;
          } else {
            console.log(`  ⚠️ Skipped: ${item.name} (already exists)`);
          }
        }
      } else {
        console.log(
          `\nNo sample items defined for category: ${category.name} (ID: ${categoryId})`
        );
      }
    }

    console.log(
      `\n✅ Successfully added ${totalItemsAdded} sample items to the database!`
    );
  } catch (error) {
    console.error("Error adding sample items:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addSampleItems().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
