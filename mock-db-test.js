import { config } from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables
config();

console.log('Testing database connection with the following settings:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log(`Mock DB Mode: ${process.env.USE_MOCK_DB}`);

async function testConnection() {
  // Check if we should use mock database
  const useMockDb = process.env.USE_MOCK_DB === 'true';
  
  if (useMockDb) {
    console.log('\nUsing mock database mode. No actual database connection will be made.');
    console.log('This is useful for development and testing without a real database.');
    console.log('The application will use in-memory data structures instead of a real database.');
    return;
  }
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000 // 10 seconds
    });
    
    console.log('Connected to database successfully!');
    
    // Test a simple query
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Query result:', result);
    
    // Close the connection
    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

testConnection();
