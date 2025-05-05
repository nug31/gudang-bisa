import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function checkRequests() {
  console.log('Checking item requests...');
  
  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    // Get all requests
    const [requests] = await connection.query('SELECT * FROM item_requests');
    console.log(`Found ${requests.length} requests:`);
    
    if (requests.length === 0) {
      console.log('No requests found!');
    } else {
      requests.forEach(req => {
        console.log(`- ${req.id}: ${req.title} (${req.status})`);
      });
    }
  } catch (error) {
    console.error('Error checking requests:', error);
  } finally {
    await connection.end();
  }
}

checkRequests();
