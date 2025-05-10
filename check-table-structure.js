// Script to check the structure of the inventory_items table
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the Neon PostgreSQL connection string
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error('Error: NEON_CONNECTION_STRING environment variable is not set.');
  process.exit(1);
}

// Create a client
const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkTableStructure() {
  try {
    console.log('Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected to Neon database successfully!');
    
    // Check the structure of the inventory_items table
    console.log('Checking structure of inventory_items table...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'inventory_items'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in inventory_items table:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Check the structure of the item_requests table
    console.log('\nChecking structure of item_requests table...');
    const requestColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'item_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in item_requests table:');
    requestColumnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Connection closed');
  }
}

// Run the check
checkTableStructure();
