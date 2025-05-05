import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function checkDbConnection() {
  console.log('Checking database connection with the following settings:');
  console.log(`Host: ${DB_HOST}`);
  console.log(`Port: ${DB_PORT || 3306}`);
  console.log(`User: ${DB_USER}`);
  console.log(`Database: ${DB_NAME}`);
  console.log('Password: [HIDDEN]');
  
  try {
    // Create connection
    console.log('Attempting to connect to database...');
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });
    
    console.log('✅ Database connected successfully!');
    
    // Test a simple query
    console.log('Testing a simple query...');
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Query result:', result);
    
    // Close the connection
    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
  }
}

checkDbConnection();
