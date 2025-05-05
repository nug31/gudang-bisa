import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function connectToCPanel() {
  console.log('Connecting to cPanel database with the following settings:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT || 3306}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log('Password: [HIDDEN]');

  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 60000, // 60 seconds timeout
    });

    console.log('Successfully connected to the cPanel database!');

    // Test a simple query
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Query result:', result);

    // Check if tables exist
    console.log('\nChecking database tables:');
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
    console.log('\nConnection closed.');
  } catch (error) {
    console.error('Error connecting to cPanel database:', error);
    console.error('\nThis could be because:');
    console.error('1. The database credentials are incorrect');
    console.error('2. Your IP address is not whitelisted in cPanel');
    console.error('3. The database server is not accessible from your location');
    console.error('4. The database server is down or not accepting connections');
    
    console.error('\nTo whitelist your IP address:');
    console.error('1. Log in to cPanel');
    console.error('2. Go to MySQL Databases');
    console.error('3. Find the "Remote MySQL" section');
    console.error('4. Add your current IP address to the whitelist');
  }
}

connectToCPanel();
