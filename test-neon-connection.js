import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('Testing Neon PostgreSQL connection...');
console.log('Connection string:', process.env.NEON_CONNECTION_STRING ? 'Set (hidden for security)' : 'Not set');

async function testNeonConnection() {
  try {
    // Create a connection pool
    const pool = new pg.Pool({
      connectionString: process.env.NEON_CONNECTION_STRING
    });
    
    console.log('Connection pool created');
    
    // Test the connection
    const client = await pool.connect();
    console.log('Successfully connected to Neon PostgreSQL!');
    
    // Check if inventory_items table exists
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_items')"
    );
    
    if (tableCheck.rows[0].exists) {
      console.log('inventory_items table exists');
      
      // Count items
      const countResult = await client.query('SELECT COUNT(*) FROM inventory_items');
      console.log(`Found ${countResult.rows[0].count} items in inventory_items table`);
      
      // Get sample items
      const sampleResult = await client.query('SELECT * FROM inventory_items LIMIT 5');
      console.log('Sample items:');
      sampleResult.rows.forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.name} (ID: ${item.id})`);
      });
      
      // Check categories
      const categoryCheck = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories')"
      );
      
      if (categoryCheck.rows[0].exists) {
        console.log('categories table exists');
        
        // Count categories
        const catCountResult = await client.query('SELECT COUNT(*) FROM categories');
        console.log(`Found ${catCountResult.rows[0].count} categories in categories table`);
        
        // Get sample categories
        const catSampleResult = await client.query('SELECT * FROM categories LIMIT 5');
        console.log('Sample categories:');
        catSampleResult.rows.forEach((cat, index) => {
          console.log(`Category ${index + 1}: ${cat.name} (ID: ${cat.id})`);
        });
      } else {
        console.log('categories table does not exist');
      }
    } else {
      console.log('inventory_items table does not exist');
    }
    
    // Release the client back to the pool
    client.release();
    
    // Close the pool
    await pool.end();
    console.log('Connection pool closed');
  } catch (error) {
    console.error('Error connecting to Neon PostgreSQL:', error);
  }
}

testNeonConnection();
