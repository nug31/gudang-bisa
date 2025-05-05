import { config } from 'dotenv';
import mysql from 'mysql';

// Load environment variables
config();

console.log('Testing MySQL connection with the following settings:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log('Password: [HIDDEN]');

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000 // 10 seconds
});

// Connect to the database
console.log('Attempting to connect to database...');
connection.connect(function(err) {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nAccess denied error. Possible solutions:');
      console.error('1. Verify that the username and password are correct');
      console.error('2. Check if the user has the necessary permissions');
    } else if (err.code === 'ENOTFOUND') {
      console.error('\nHost not found error. Possible solutions:');
      console.error('1. Verify that the hostname is correct');
      console.error('2. Check if the domain is properly configured');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('\nConnection timeout error. Possible solutions:');
      console.error('1. Check if the server is reachable');
      console.error('2. Verify that the port is correct and open');
    }
    
    process.exit(1);
  }
  
  console.log('✅ Connected to database successfully!');
  
  // Test a simple query
  connection.query('SELECT 1 as test', function(err, results) {
    if (err) {
      console.error('❌ Error executing query:', err);
    } else {
      console.log('✅ Query executed successfully:', results);
    }
    
    // Close the connection
    connection.end(function(err) {
      if (err) {
        console.error('Error closing connection:', err);
      } else {
        console.log('Connection closed.');
      }
    });
  });
});
