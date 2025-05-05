import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function testLocalDatabase() {
  console.log('Testing connection to local database with the following settings:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT || 3306}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log('Password: [HIDDEN]');

  try {
    // First try to connect to MySQL server without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('Successfully connected to MySQL server!');

    // Check if the database exists
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [process.env.DB_NAME]
    );

    if (rows.length === 0) {
      console.log(`Database '${process.env.DB_NAME}' does not exist. Creating it...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
      console.log(`Database '${process.env.DB_NAME}' created successfully!`);
    } else {
      console.log(`Database '${process.env.DB_NAME}' already exists.`);
    }

    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`Using database '${process.env.DB_NAME}'`);

    // Check if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('No tables found in the database.');
    } else {
      console.log(`Found ${tables.length} tables:`);
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`- ${tableName}`);
      });
    }

    // Close the connection
    await connection.end();
    console.log('Connection closed.');
    
    return true;
  } catch (error) {
    console.error('Error connecting to local database:', error);
    return false;
  }
}

testLocalDatabase();
