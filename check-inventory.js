import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function checkInventory() {
  console.log('Checking inventory items...');
  
  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    // Get all inventory items with category names
    const [items] = await connection.query(`
      SELECT 
        i.id,
        i.name,
        i.description,
        c.name as category_name,
        i.sku,
        i.quantity_available,
        i.quantity_reserved,
        i.unit_price,
        i.location
      FROM 
        inventory_items i
      JOIN
        categories c ON i.category_id = c.id
      ORDER BY
        c.name, i.name
    `);
    
    console.log(`Found ${items.length} inventory items:`);
    
    let currentCategory = '';
    
    items.forEach(item => {
      if (item.category_name !== currentCategory) {
        currentCategory = item.category_name;
        console.log(`\n${currentCategory}:`);
      }
      
      console.log(`- ${item.name} (SKU: ${item.sku})`);
      console.log(`  Available: ${item.quantity_available}, Reserved: ${item.quantity_reserved}, Price: $${item.unit_price}`);
      console.log(`  Location: ${item.location}`);
    });
    
  } catch (error) {
    console.error('Error checking inventory:', error);
  } finally {
    await connection.end();
  }
}

checkInventory();
