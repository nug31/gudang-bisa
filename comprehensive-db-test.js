import { config } from 'dotenv';
import mysql from 'mysql2';

// Load environment variables
config();

// Get the current IP address from the error message
let currentIP = '180.244.167.242'; // This is the IP shown in previous error messages

// Define different connection configurations to try
const configurations = [
  {
    name: 'Default Configuration',
    config: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    }
  },
  {
    name: 'Domain Name as Host',
    config: {
      host: 'gudang.nugjo.com',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    }
  },
  {
    name: 'IP Address as Host',
    config: {
      host: '109.110.188.204',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    }
  },
  {
    name: 'Alternative Port',
    config: {
      host: process.env.DB_HOST,
      port: 3307, // Some cPanel servers use alternative ports
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    }
  },
  {
    name: 'localhost as Host',
    config: {
      host: 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    }
  }
];

console.log('Comprehensive Database Connection Test');
console.log('======================================');
console.log(`Current IP Address: ${currentIP}`);
console.log('');
console.log('This script will try multiple connection configurations to help diagnose the issue.');
console.log('');

// Try each configuration
async function tryConfigurations() {
  for (const [index, { name, config }] of configurations.entries()) {
    console.log(`[${index + 1}/${configurations.length}] Trying ${name}:`);
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`User: ${config.user}`);
    console.log(`Database: ${config.database}`);
    
    // Create a connection
    const connection = mysql.createConnection(config);
    
    // Try to connect
    try {
      await new Promise((resolve, reject) => {
        connection.connect((err) => {
          if (err) {
            console.log(`❌ Connection failed: ${err.message}`);
            if (err.code) {
              console.log(`Error code: ${err.code}`);
            }
            connection.end();
            resolve();
          } else {
            console.log('✅ Connection successful!');
            
            // Test a simple query
            connection.query('SELECT 1 as test', (err, results) => {
              if (err) {
                console.log(`❌ Query failed: ${err.message}`);
              } else {
                console.log('✅ Query successful:', results);
              }
              
              connection.end();
              resolve();
            });
          }
        });
      });
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(''); // Add a blank line between configurations
  }
  
  console.log('All configurations tested.');
  console.log('');
  console.log('If all configurations failed, please check the following:');
  console.log('1. Verify that your IP address is whitelisted in cPanel');
  console.log('2. Check if the database user has the correct permissions');
  console.log('3. Verify that the database exists and is accessible');
  console.log('4. Check if there are any firewall rules blocking the connection');
  console.log('5. Contact your hosting provider for assistance');
}

tryConfigurations();
