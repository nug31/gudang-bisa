import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

async function checkNotificationsTable() {
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

    // Check if notifications table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
    `, [process.env.DB_NAME]);

    if (tables.length === 0) {
      console.log("Notifications table does not exist. Creating it...");
      
      // Create notifications table
      await connection.query(`
        CREATE TABLE notifications (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          type ENUM('request_submitted', 'request_approved', 'request_rejected', 'request_fulfilled', 'comment_added') NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          related_item_id VARCHAR(36),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (related_item_id) REFERENCES item_requests(id)
        )
      `);
      
      console.log("Notifications table created successfully!");
      
      // Get users
      const [users] = await connection.query('SELECT id FROM users');
      
      // Get requests
      const [requests] = await connection.query('SELECT id, title, user_id FROM item_requests LIMIT 3');
      
      if (users.length > 0 && requests.length > 0) {
        console.log("Creating sample notifications...");
        
        // Create sample notifications
        for (const request of requests) {
          // Notification for request owner
          await connection.query(`
            INSERT INTO notifications (id, user_id, type, message, is_read, created_at, related_item_id)
            VALUES (?, ?, ?, ?, ?, NOW(), ?)
          `, [
            uuidv4(),
            request.user_id,
            'request_submitted',
            `Your request for "${request.title}" has been submitted`,
            0,
            request.id
          ]);
          
          // Notification for admin
          const adminUser = users.find(user => user.id !== request.user_id);
          if (adminUser) {
            await connection.query(`
              INSERT INTO notifications (id, user_id, type, message, is_read, created_at, related_item_id)
              VALUES (?, ?, ?, ?, ?, NOW(), ?)
            `, [
              uuidv4(),
              adminUser.id,
              'request_submitted',
              `New request: "${request.title}" requires your review`,
              0,
              request.id
            ]);
          }
        }
        
        console.log("Sample notifications created successfully!");
      }
    } else {
      console.log("Notifications table already exists.");
      
      // Check notifications in the table
      const [notifications] = await connection.query('SELECT * FROM notifications');
      console.log(`Found ${notifications.length} notifications.`);
    }

    // Close the connection
    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error checking notifications table:', error);
  }
}

checkNotificationsTable();
