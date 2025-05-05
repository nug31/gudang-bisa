import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function verifyData() {
  console.log('Starting data verification...');
  
  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    console.log('Connected to database.');
    
    // Check users table
    console.log('\nVerifying users table:');
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}), Role: ${user.role}`);
    });
    
    // Check categories table
    console.log('\nVerifying categories table:');
    const [categories] = await connection.query('SELECT id, name, description FROM categories');
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`- ${category.name}: ${category.description}`);
    });
    
    // Check item_requests table
    console.log('\nVerifying item_requests table:');
    const [requests] = await connection.query(`
      SELECT r.id, r.title, r.description, r.priority, r.status, 
             u.name as requester_name, c.name as category_name
      FROM item_requests r
      JOIN users u ON r.user_id = u.id
      JOIN categories c ON r.category_id = c.id
    `);
    console.log(`Found ${requests.length} item requests:`);
    requests.forEach(request => {
      console.log(`- ${request.title} (${request.priority} priority, ${request.status})`);
      console.log(`  Requested by: ${request.requester_name}, Category: ${request.category_name}`);
      console.log(`  Description: ${request.description}`);
    });
    
    // Check comments table
    console.log('\nVerifying comments table:');
    const [comments] = await connection.query(`
      SELECT c.id, c.content, u.name as commenter_name, r.title as request_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN item_requests r ON c.request_id = r.id
    `);
    console.log(`Found ${comments.length} comments:`);
    comments.forEach(comment => {
      console.log(`- Comment by ${comment.commenter_name} on "${comment.request_title}":`);
      console.log(`  "${comment.content}"`);
    });
    
    // Check notifications table
    console.log('\nVerifying notifications table:');
    const [notifications] = await connection.query(`
      SELECT n.id, n.type, n.message, u.name as user_name
      FROM notifications n
      JOIN users u ON n.user_id = u.id
    `);
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach(notification => {
      console.log(`- Notification for ${notification.user_name} (${notification.type}):`);
      console.log(`  "${notification.message}"`);
    });
    
    console.log('\nData verification completed successfully!');
    
  } catch (error) {
    console.error('Error verifying data:', error);
  } finally {
    await connection.end();
  }
}

verifyData();
