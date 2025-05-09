import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config();

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '******' : 'not set');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('USE_MOCK_DB:', process.env.USE_MOCK_DB);
console.log('NEON_CONNECTION_STRING:', process.env.NEON_CONNECTION_STRING ? 'set (hidden)' : 'not set');

async function checkConnections() {
  // Try MySQL connection
  try {
    console.log('\nTrying MySQL connection...');
    const mysqlConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      connectTimeout: 10000
    });
    
    console.log('MySQL connection successful!');
    
    // Check inventory_items table
    try {
      const [tables] = await mysqlConnection.query("SHOW TABLES LIKE 'inventory_items'");
      if (tables.length === 0) {
        console.log('inventory_items table does not exist in MySQL database');
      } else {
        const [count] = await mysqlConnection.query('SELECT COUNT(*) as count FROM inventory_items');
        console.log(`Found ${count[0].count} items in inventory_items table`);
        
        if (count[0].count > 0) {
          const [sample] = await mysqlConnection.query('SELECT * FROM inventory_items LIMIT 1');
          console.log('Sample item:', sample[0]);
        }
      }
    } catch (tableError) {
      console.error('Error checking inventory_items table:', tableError);
    }
    
    await mysqlConnection.end();
  } catch (mysqlError) {
    console.error('MySQL connection failed:', mysqlError);
  }
  
  // Try PostgreSQL connection (Neon)
  if (process.env.NEON_CONNECTION_STRING) {
    try {
      console.log('\nTrying PostgreSQL (Neon) connection...');
      const pgPool = new pg.Pool({
        connectionString: process.env.NEON_CONNECTION_STRING
      });
      
      const client = await pgPool.connect();
      console.log('PostgreSQL connection successful!');
      
      // Check inventory_items table
      try {
        const tableCheck = await client.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_items')"
        );
        
        if (!tableCheck.rows[0].exists) {
          console.log('inventory_items table does not exist in PostgreSQL database');
        } else {
          const countResult = await client.query('SELECT COUNT(*) as count FROM inventory_items');
          console.log(`Found ${countResult.rows[0].count} items in inventory_items table`);
          
          if (parseInt(countResult.rows[0].count) > 0) {
            const sampleResult = await client.query('SELECT * FROM inventory_items LIMIT 1');
            console.log('Sample item:', sampleResult.rows[0]);
          }
        }
      } catch (tableError) {
        console.error('Error checking inventory_items table in PostgreSQL:', tableError);
      }
      
      client.release();
      await pgPool.end();
    } catch (pgError) {
      console.error('PostgreSQL connection failed:', pgError);
    }
  } else {
    console.log('\nSkipping PostgreSQL check - no connection string provided');
  }
}

checkConnections();
