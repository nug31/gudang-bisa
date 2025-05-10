// Script to test the Neon database connection
const { Pool } = require('pg');
require('dotenv').config();

// Neon database connection string
const connectionString = process.env.NEON_CONNECTION_STRING || 
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

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

// Function to test the database connection
async function testConnection() {
  console.log('Testing Neon database connection...');
  console.log(`Connection string available: ${!!connectionString}`);
  console.log(`Connection string length: ${connectionString ? connectionString.length : 0}`);
  
  let client;
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('Successfully connected to the Neon database!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`Current database time: ${result.rows[0].current_time}`);
    
    // Check if tables exist
    console.log('\nChecking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log(`Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    // Check item_requests table
    if (tablesResult.rows.some(row => row.table_name === 'item_requests')) {
      console.log('\nChecking item_requests table...');
      const requestsResult = await client.query('SELECT COUNT(*) FROM item_requests');
      console.log(`Found ${requestsResult.rows[0].count} item requests in the database.`);
      
      // Get a sample request
      if (parseInt(requestsResult.rows[0].count) > 0) {
        const sampleResult = await client.query('SELECT * FROM item_requests LIMIT 1');
        console.log('Sample item request:');
        console.log(sampleResult.rows[0]);
      }
    }
    
    // Check inventory_items table
    if (tablesResult.rows.some(row => row.table_name === 'inventory_items')) {
      console.log('\nChecking inventory_items table...');
      const itemsResult = await client.query('SELECT COUNT(*) FROM inventory_items');
      console.log(`Found ${itemsResult.rows[0].count} inventory items in the database.`);
      
      // Get a sample item
      if (parseInt(itemsResult.rows[0].count) > 0) {
        const sampleResult = await client.query('SELECT * FROM inventory_items LIMIT 1');
        console.log('Sample inventory item:');
        console.log(sampleResult.rows[0]);
      }
    }
    
    console.log('\nDatabase connection test completed successfully!');
    return true;
  } catch (error) {
    console.error('Error connecting to the Neon database:', error.message);
    console.error('Error details:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('Database connection test passed!');
      process.exit(0);
    } else {
      console.error('Database connection test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during database connection test:', error);
    process.exit(1);
  });
