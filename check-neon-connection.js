// Script to check the Neon database connection
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

console.log('Neon connection string available:', !!connectionString);
console.log('Connection string length:', connectionString.length);
console.log('Connection string first 20 chars:', connectionString.substring(0, 20) + '...');

// Create a client
const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkConnection() {
  try {
    console.log('Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected to Neon database successfully!');
    
    // Test a simple query
    console.log('Testing a simple query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current time from database:', result.rows[0].current_time);
    
    // Check if the item_requests table exists
    console.log('Checking if item_requests table exists...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    const hasItemRequestsTable = tablesResult.rows.some(row => row.table_name === 'item_requests');
    
    if (hasItemRequestsTable) {
      console.log('✅ item_requests table exists');
      
      // Check the structure of the item_requests table
      console.log('Checking structure of item_requests table...');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'item_requests'
        ORDER BY ordinal_position
      `);
      
      console.log('Columns in item_requests table:');
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
      
      // Count the number of requests
      console.log('Counting item requests...');
      const countResult = await client.query('SELECT COUNT(*) FROM item_requests');
      console.log(`Total item requests: ${countResult.rows[0].count}`);
      
      // Get the most recent requests
      console.log('Getting most recent item requests...');
      const requestsResult = await client.query(`
        SELECT id, title, status, user_id, created_at
        FROM item_requests
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log('Most recent item requests:');
      requestsResult.rows.forEach(row => {
        console.log(`- ${row.id}: ${row.title} (${row.status}) by ${row.user_id} at ${row.created_at}`);
      });
    } else {
      console.error('❌ item_requests table does not exist!');
    }
  } catch (error) {
    console.error('❌ Error connecting to Neon database:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Connection closed');
  }
}

// Run the check
checkConnection();
