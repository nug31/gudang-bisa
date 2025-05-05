import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function checkDbTables() {
  console.log('Checking database tables...');
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });
    
    // Get all tables
    console.log('Getting all tables...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });
    
    // Check if essential tables exist
    const tableNames = tables.map(table => Object.values(table)[0]);
    const essentialTables = ['users', 'categories', 'item_requests', 'inventory_items', 'comments'];
    
    for (const tableName of essentialTables) {
      if (!tableNames.includes(tableName)) {
        console.log(`⚠️ Essential table '${tableName}' is missing!`);
      } else {
        console.log(`✅ Essential table '${tableName}' exists.`);
        
        // Get row count
        const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = countResult[0].count;
        console.log(`   - Contains ${rowCount} rows`);
        
        // Get sample data if table has rows
        if (rowCount > 0) {
          const [sampleData] = await connection.query(`SELECT * FROM ${tableName} LIMIT 1`);
          console.log(`   - Sample data:`, sampleData[0]);
        }
      }
    }
    
    // Close the connection
    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Error checking database tables:', error);
  }
}

checkDbTables();
