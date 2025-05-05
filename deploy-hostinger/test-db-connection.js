
import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables from .env.production
config({ path: './.env.production' });

async function testConnection() {
  console.log('Testing database connection with settings:');
  console.log({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Database connected successfully!');
    
    // Test a simple query
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Test query result:', result);
    
    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

testConnection();
