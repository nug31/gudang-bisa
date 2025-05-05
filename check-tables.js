import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkTables() {
  try {
    // Connect to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log(`Connected to database '${process.env.DB_NAME}'`);

    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    
    // Check each table structure
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\nTable: ${tableName}`);
      
      // Get table structure
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      console.log('Columns:');
      columns.forEach(column => {
        console.log(`- ${column.Field} (${column.Type})${column.Key === 'PRI' ? ' [PRIMARY KEY]' : ''}`);
      });
      
      // Get row count
      const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = countResult[0].count;
      console.log(`Row count: ${rowCount}`);
      
      // If there are rows, show a sample
      if (rowCount > 0) {
        const [sampleRows] = await connection.query(`SELECT * FROM ${tableName} LIMIT 1`);
        console.log('Sample row:');
        console.log(sampleRows[0]);
      }
    }

    // Close the connection
    await connection.end();
    console.log('\nConnection closed.');
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();
