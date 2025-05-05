require('dotenv').config();
const mysql = require('mysql2');

console.log('Testing database connection with the following settings:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);
console.log('Password: [HIDDEN]');

// Create a connection with explicit timeout
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 20000, // 20 seconds
  timeout: 20000 // 20 seconds for queries
});

console.log('Attempting to connect to database...');

// Set a timeout for the entire operation
const connectionTimeout = setTimeout(() => {
  console.error('❌ Connection attempt timed out after 20 seconds');
  connection.destroy();
  process.exit(1);
}, 20000);

// Connect to the database
connection.connect((err) => {
  if (err) {
    clearTimeout(connectionTimeout);
    console.error('❌ Error connecting to database:', err);
    
    if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused. Possible reasons:');
      console.error('- Database server is not running');
      console.error('- Firewall is blocking the connection');
      console.error('- Incorrect host or port');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Possible reasons:');
      console.error('- Incorrect username or password');
      console.error('- User does not have permission to access the database');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('Database does not exist. Possible reasons:');
      console.error('- Incorrect database name');
      console.error('- Database has not been created');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Possible reasons:');
      console.error('- Database server is not reachable');
      console.error('- Network issues');
      console.error('- IP address not whitelisted in cPanel');
    }
    
    process.exit(1);
  }
  
  clearTimeout(connectionTimeout);
  console.log('✅ Database connected successfully!');
  
  // Test a simple query
  console.log('Testing a simple query...');
  connection.query('SELECT 1 as test', (err, results) => {
    if (err) {
      console.error('❌ Error executing query:', err);
    } else {
      console.log('Query result:', results);
    }
    
    // Close the connection
    connection.end((err) => {
      if (err) {
        console.error('Error closing connection:', err);
      } else {
        console.log('Connection closed.');
      }
    });
  });
});
