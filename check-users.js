import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function checkUsers() {
  console.log('Checking users...');
  
  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    // Get all users
    const [users] = await connection.query('SELECT id, name, email, role, department FROM users');
    console.log(`Found ${users.length} users:`);
    
    if (users.length === 0) {
      console.log('No users found!');
    } else {
      users.forEach(user => {
        console.log(`- ${user.id}: ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Get all requests with user information
    console.log('\nChecking requests with user information:');
    const [requests] = await connection.query(`
      SELECT r.id, r.title, r.status, r.user_id, u.name as user_name, u.email as user_email
      FROM item_requests r
      LEFT JOIN users u ON r.user_id = u.id
    `);

    if (requests.length === 0) {
      console.log('No requests found!');
    } else {
      requests.forEach(req => {
        console.log(`- ${req.id}: ${req.title} (${req.status}) - User: ${req.user_name} (${req.user_email})`);
      });
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await connection.end();
  }
}

checkUsers();
