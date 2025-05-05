import { config } from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables
config();

async function testCloudPanelDbConnection() {
  console.log('Testing CloudPanel database connection with the following settings:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT || 3306}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log('Password: [HIDDEN]');
  
  try {
    // Create connection
    console.log('Attempting to connect to CloudPanel database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });
    
    console.log('✅ CloudPanel database connected successfully!');
    
    // Test a simple query
    console.log('Testing a simple query...');
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Query result:', result);
    
    // Close the connection
    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('❌ Error connecting to CloudPanel database:', error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied error. Possible solutions:');
      console.error('1. Verify that the username and password are correct');
      console.error('2. Check if the user has the necessary permissions');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\nHost not found error. Possible solutions:');
      console.error('1. Verify that the hostname is correct');
      console.error('2. Check if the domain is properly configured');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\nConnection timeout error. Possible solutions:');
      console.error('1. Check if the server is reachable');
      console.error('2. Verify that the port is correct and open');
    }
  }
}

testCloudPanelDbConnection();
