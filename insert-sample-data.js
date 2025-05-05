import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function insertSampleData() {
  console.log('Starting sample data insertion...');
  
  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('Connected to database.');
    
    // Generate UUIDs for our entities
    const adminUserId = uuidv4();
    const regularUserId = uuidv4();
    const category1Id = uuidv4();
    const category2Id = uuidv4();
    const requestId = uuidv4();
    const commentId = uuidv4();
    const notificationId = uuidv4();
    
    // Insert users
    console.log('Inserting users...');
    await connection.query(`
      INSERT INTO users (id, name, email, role, avatar_url, department) VALUES
      (?, 'Admin User', 'admin@example.com', 'admin', 'https://example.com/avatar1.jpg', 'IT'),
      (?, 'Regular User', 'user@example.com', 'user', 'https://example.com/avatar2.jpg', 'Marketing')
    `, [adminUserId, regularUserId]);
    
    // Insert categories
    console.log('Inserting categories...');
    await connection.query(`
      INSERT INTO categories (id, name, description) VALUES
      (?, 'Hardware', 'Computer hardware and peripherals'),
      (?, 'Software', 'Software applications and licenses')
    `, [category1Id, category2Id]);
    
    // Insert item request
    console.log('Inserting item request...');
    await connection.query(`
      INSERT INTO item_requests (
        id, title, description, category_id, priority, status, 
        user_id, approved_at, approved_by, quantity
      ) VALUES (
        ?, 'New Laptop Request', 'Need a new laptop for development work', 
        ?, 'high', 'approved', ?, NOW(), ?, 1
      )
    `, [requestId, category1Id, regularUserId, adminUserId]);
    
    // Insert comment
    console.log('Inserting comment...');
    await connection.query(`
      INSERT INTO comments (id, request_id, user_id, content) VALUES
      (?, ?, ?, 'Approved. New laptop will be ordered soon.')
    `, [commentId, requestId, adminUserId]);
    
    // Insert notification
    console.log('Inserting notification...');
    await connection.query(`
      INSERT INTO notifications (id, user_id, type, message, related_item_id) VALUES
      (?, ?, 'request_approved', 'Your request for a new laptop has been approved', ?)
    `, [notificationId, regularUserId, requestId]);
    
    console.log('Sample data inserted successfully!');
    console.log('');
    console.log('Summary of inserted data:');
    console.log('- 2 users (admin and regular user)');
    console.log('- 2 categories (Hardware and Software)');
    console.log('- 1 item request (New Laptop Request)');
    console.log('- 1 comment on the request');
    console.log('- 1 notification for the request approval');
    
  } catch (error) {
    console.error('Error inserting sample data:', error);
  } finally {
    await connection.end();
  }
}

insertSampleData();
