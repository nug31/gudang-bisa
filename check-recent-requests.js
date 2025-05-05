import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkRecentRequests() {
  try {
    // Connect to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log(`Connected to database '${process.env.DB_NAME}'`);

    // Get all requests with user information
    const [requests] = await connection.query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM item_requests r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${requests.length} recent requests:`);
    
    if (requests.length === 0) {
      console.log('No requests found!');
    } else {
      requests.forEach(req => {
        console.log(`- ${req.id}: ${req.title} (${req.status})`);
        console.log(`  Created: ${req.created_at}`);
        console.log(`  User ID: ${req.user_id}`);
        console.log(`  User Name: ${req.user_name || 'Unknown'}`);
        console.log(`  Email: ${req.user_email || 'Unknown'}`);
        console.log(`  Description: ${req.description}`);
        console.log('');
      });
    }

    // Check if the new requests are being saved
    console.log('\nChecking for very recent requests (last 10 minutes):');
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    const [recentRequests] = await connection.query(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM item_requests r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.created_at > ?
      ORDER BY r.created_at DESC
    `, [tenMinutesAgo]);
    
    console.log(`Found ${recentRequests.length} very recent requests:`);
    
    if (recentRequests.length === 0) {
      console.log('No very recent requests found!');
    } else {
      recentRequests.forEach(req => {
        console.log(`- ${req.id}: ${req.title} (${req.status})`);
        console.log(`  Created: ${req.created_at}`);
        console.log(`  User ID: ${req.user_id}`);
        console.log(`  User Name: ${req.user_name || 'Unknown'}`);
        console.log(`  Email: ${req.user_email || 'Unknown'}`);
        console.log(`  Description: ${req.description}`);
        console.log('');
      });
    }

    // Close the connection
    await connection.end();
    console.log('\nConnection closed.');
  } catch (error) {
    console.error('Error checking recent requests:', error);
  }
}

checkRecentRequests();
