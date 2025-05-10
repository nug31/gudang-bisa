// Script to add sample inventory items to the Neon database
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

// Sample inventory items
const sampleItems = [
  {
    name: "Ballpoint Pens (Box of 12)",
    description: "Blue ink ballpoint pens, medium point",
    categoryId: 1, // Office
    sku: "PEN-001",
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
    categoryId: 1, // Office
    sku: "NOTE-002",
    quantityAvailable: 30,
    quantityReserved: 2,
    unitPrice: 4.5,
    location: "Shelf A2",
    imageUrl:
      "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&auto=format",
  },
  {
    name: "Disinfectant Wipes (Pack of 75)",
    description: "Multi-surface cleaning and disinfecting wipes",
    categoryId: 2, // Cleaning
    sku: "CLEAN-001",
    quantityAvailable: 40,
    quantityReserved: 10,
    unitPrice: 6.99,
    location: "Shelf E1",
    imageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=500&auto=format",
  },
  {
    name: "Screwdriver Set",
    description: "10-piece precision screwdriver set",
    categoryId: 3, // Hardware
    sku: "TOOL-001",
    quantityAvailable: 8,
    quantityReserved: 1,
    unitPrice: 15.99,
    location: "Shelf G1",
    imageUrl:
      "https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=500&auto=format",
  },
  {
    name: "First Aid Kit",
    description: "Comprehensive first aid kit for office emergencies",
    categoryId: 4, // Other
    sku: "SAFE-001",
    quantityAvailable: 10,
    quantityReserved: 0,
    unitPrice: 29.99,
    location: "Shelf F1",
    imageUrl:
      "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format",
  },
  {
    name: "Printer Paper (500 sheets)",
    description: "Standard 8.5x11 printer paper, 20lb weight",
    categoryId: 1, // Office
    sku: "PAPER-001",
    quantityAvailable: 25,
    quantityReserved: 0,
    unitPrice: 5.99,
    location: "Shelf A3",
    imageUrl:
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format",
  },
  {
    name: "Stapler",
    description: "Standard desktop stapler with 5000 staples",
    categoryId: 1, // Office
    sku: "STAPLE-001",
    quantityAvailable: 15,
    quantityReserved: 0,
    unitPrice: 8.99,
    location: "Shelf A4",
    imageUrl:
      "https://images.unsplash.com/photo-1612613900450-d196c2a7b1e9?w=500&auto=format",
  },
  {
    name: "All-Purpose Cleaner",
    description: "Multi-surface cleaning solution, 32oz bottle",
    categoryId: 2, // Cleaning
    sku: "CLEAN-002",
    quantityAvailable: 20,
    quantityReserved: 0,
    unitPrice: 4.99,
    location: "Shelf E2",
    imageUrl:
      "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format",
  },
  {
    name: "Paper Towels (6 rolls)",
    description: "Absorbent paper towels for cleaning spills",
    categoryId: 2, // Cleaning
    sku: "CLEAN-003",
    quantityAvailable: 30,
    quantityReserved: 0,
    unitPrice: 7.99,
    location: "Shelf E3",
    imageUrl:
      "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500&auto=format",
  },
  {
    name: "Hammer",
    description: "16oz claw hammer with fiberglass handle",
    categoryId: 3, // Hardware
    sku: "TOOL-002",
    quantityAvailable: 5,
    quantityReserved: 0,
    unitPrice: 12.99,
    location: "Shelf G2",
    imageUrl:
      "https://images.unsplash.com/photo-1586864387789-628af9feed72?w=500&auto=format",
  },
];

async function addSampleInventory() {
  const client = await pool.connect();

  try {
    // Start a transaction
    await client.query("BEGIN");

    console.log("Adding sample inventory items...");

    // Check if inventory_items table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'inventory_items'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("Creating inventory_items table...");
      await client.query(`
        CREATE TABLE inventory_items (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category_id INTEGER REFERENCES categories(id),
          sku VARCHAR(50),
          quantity_available INTEGER DEFAULT 0,
          quantity_reserved INTEGER DEFAULT 0,
          unit_price DECIMAL(10, 2),
          location VARCHAR(100),
          image_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Clear existing inventory items
    await client.query("DELETE FROM inventory_items");

    // Reset the sequence
    await client.query("ALTER SEQUENCE inventory_items_id_seq RESTART WITH 1");

    // Insert sample items
    for (const item of sampleItems) {
      await client.query(
        `
        INSERT INTO inventory_items (
          name,
          description,
          category_id,
          sku,
          quantity_available,
          quantity_reserved,
          unit_price,
          location,
          image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          item.name,
          item.description,
          item.categoryId,
          item.sku,
          item.quantityAvailable,
          item.quantityReserved,
          item.unitPrice,
          item.location,
          item.imageUrl,
        ]
      );

      console.log(`Added item: ${item.name}`);
    }

    // Commit the transaction
    await client.query("COMMIT");

    console.log("Successfully added sample inventory items!");

    // Count the items
    const countResult = await client.query(
      "SELECT COUNT(*) FROM inventory_items"
    );
    console.log(
      `Total inventory items in database: ${countResult.rows[0].count}`
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error adding sample inventory items:", error);
  } finally {
    client.release();
    pool.end();
  }
}

addSampleInventory();
