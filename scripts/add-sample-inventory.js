import { config } from 'dotenv';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error('Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file.');
  process.exit(1);
}

async function addSampleInventory() {
  console.log('Adding sample inventory items to Neon database...');
  
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to Neon database.');
    
    // Get all categories
    const categoriesResult = await client.query('SELECT id, name FROM categories');
    const categories = categoriesResult.rows;
    
    if (categories.length === 0) {
      console.error('No categories found. Please add categories first.');
      process.exit(1);
    }
    
    console.log(`Found ${categories.length} categories.`);
    
    // Create a map of category names to IDs for easier lookup
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name.toLowerCase()] = category.id;
    });
    
    // Sample inventory items data
    const sampleInventoryItems = [
      // Office Supplies
      {
        name: 'Ballpoint Pens (Box of 12)',
        description: 'Blue ink ballpoint pens, medium point',
        categoryName: 'Office Supplies',
        sku: 'PEN-001',
        quantityAvailable: 50,
        quantityReserved: 5,
        unitPrice: 3.99,
        location: 'Shelf A1',
        imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format'
      },
      {
        name: 'Sticky Notes (Pack of 5)',
        description: 'Assorted colors, 3x3 inches',
        categoryName: 'Office Supplies',
        sku: 'NOTE-002',
        quantityAvailable: 30,
        quantityReserved: 2,
        unitPrice: 4.50,
        location: 'Shelf A2',
        imageUrl: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&auto=format'
      },
      
      // Electronics
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver',
        categoryName: 'Electronics',
        sku: 'ELEC-001',
        quantityAvailable: 15,
        quantityReserved: 3,
        unitPrice: 19.99,
        location: 'Shelf B1',
        imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format'
      },
      {
        name: 'USB-C Cable (6ft)',
        description: 'Fast charging USB-C to USB-A cable',
        categoryName: 'Electronics',
        sku: 'ELEC-002',
        quantityAvailable: 25,
        quantityReserved: 0,
        unitPrice: 12.99,
        location: 'Shelf B2',
        imageUrl: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=500&auto=format'
      },
      
      // Furniture
      {
        name: 'Ergonomic Office Chair',
        description: 'Adjustable height and lumbar support',
        categoryName: 'Furniture',
        sku: 'FURN-001',
        quantityAvailable: 5,
        quantityReserved: 1,
        unitPrice: 149.99,
        location: 'Warehouse Section C',
        imageUrl: 'https://images.unsplash.com/photo-1505843490701-5be5d1b31f8f?w=500&auto=format'
      },
      
      // Kitchen Supplies
      {
        name: 'Coffee Pods (Box of 30)',
        description: 'Medium roast coffee pods compatible with most machines',
        categoryName: 'Kitchen Supplies',
        sku: 'KITC-001',
        quantityAvailable: 20,
        quantityReserved: 5,
        unitPrice: 24.99,
        location: 'Shelf D1',
        imageUrl: 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=500&auto=format'
      },
      
      // Cleaning Supplies
      {
        name: 'Disinfectant Wipes (Pack of 75)',
        description: 'Multi-surface cleaning and disinfecting wipes',
        categoryName: 'Cleaning Supplies',
        sku: 'CLEAN-001',
        quantityAvailable: 40,
        quantityReserved: 10,
        unitPrice: 6.99,
        location: 'Shelf E1',
        imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=500&auto=format'
      },
      
      // Safety Equipment
      {
        name: 'First Aid Kit',
        description: 'Comprehensive first aid kit for office emergencies',
        categoryName: 'Safety Equipment',
        sku: 'SAFE-001',
        quantityAvailable: 10,
        quantityReserved: 0,
        unitPrice: 29.99,
        location: 'Shelf F1',
        imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=500&auto=format'
      },
      
      // Tools
      {
        name: 'Screwdriver Set',
        description: '10-piece precision screwdriver set',
        categoryName: 'Tools',
        sku: 'TOOL-001',
        quantityAvailable: 8,
        quantityReserved: 1,
        unitPrice: 15.99,
        location: 'Shelf G1',
        imageUrl: 'https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=500&auto=format'
      },
      
      // Stationery
      {
        name: 'Notebook (Pack of 3)',
        description: 'College-ruled notebooks, 70 sheets each',
        categoryName: 'Stationery',
        sku: 'STAT-001',
        quantityAvailable: 35,
        quantityReserved: 5,
        unitPrice: 7.99,
        location: 'Shelf H1',
        imageUrl: 'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?w=500&auto=format'
      },
      
      // Printing Supplies
      {
        name: 'Printer Paper (500 sheets)',
        description: 'Letter size, 20lb weight, bright white',
        categoryName: 'Printing Supplies',
        sku: 'PRINT-001',
        quantityAvailable: 25,
        quantityReserved: 3,
        unitPrice: 9.99,
        location: 'Shelf I1',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format'
      },
      
      // Packaging Materials
      {
        name: 'Shipping Boxes (Pack of 10)',
        description: 'Medium size corrugated boxes, 12x10x8 inches',
        categoryName: 'Packaging Materials',
        sku: 'PACK-001',
        quantityAvailable: 15,
        quantityReserved: 2,
        unitPrice: 14.99,
        location: 'Warehouse Section J',
        imageUrl: 'https://images.unsplash.com/photo-1607166452427-7e968af87d89?w=500&auto=format'
      }
    ];
    
    // Check existing inventory items
    const existingResult = await client.query('SELECT name FROM inventory_items');
    const existingItems = existingResult.rows.map(row => row.name.toLowerCase());
    
    console.log(`Found ${existingItems.length} existing inventory items.`);
    
    // Add inventory items that don't already exist
    let addedCount = 0;
    
    for (const item of sampleInventoryItems) {
      if (!existingItems.includes(item.name.toLowerCase())) {
        const categoryId = categoryMap[item.categoryName.toLowerCase()];
        
        if (!categoryId) {
          console.log(`Category not found for item: ${item.name}. Skipping.`);
          continue;
        }
        
        const itemId = uuidv4();
        
        await client.query(
          `INSERT INTO inventory_items 
          (id, name, description, category_id, sku, quantity_available, quantity_reserved, unit_price, location, image_url) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            itemId,
            item.name,
            item.description,
            categoryId,
            item.sku,
            item.quantityAvailable,
            item.quantityReserved,
            item.unitPrice,
            item.location,
            item.imageUrl
          ]
        );
        
        console.log(`Added inventory item: ${item.name}`);
        addedCount++;
      } else {
        console.log(`Inventory item already exists: ${item.name}`);
      }
    }
    
    console.log(`Added ${addedCount} new inventory items.`);
    console.log('Sample inventory items added successfully!');
    
  } catch (error) {
    console.error('Error adding sample inventory items:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the function
addSampleInventory().catch(error => {
  console.error('Failed to add sample inventory items:', error);
  process.exit(1);
});
