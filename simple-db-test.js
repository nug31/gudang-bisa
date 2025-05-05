require('dotenv').config();
const mysql = require('mysql2');

console.log('Testing database connection with the following settings:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);

// Create a connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000 // 10 seconds
});

// Connect to the database
connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  
  console.log('Connected to database successfully!');
  
  // Close the connection
  connection.end(function(err) {
    if (err) {
      console.error('Error closing connection:', err);
    } else {
      console.log('Connection closed.');
    }
  });
});
