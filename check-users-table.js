import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

async function checkUsersTable() {
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

    // Check if users table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [process.env.DB_NAME]);

    if (tables.length === 0) {
      console.log("Users table does not exist. Creating it...");
      
      // Create users table
      await connection.query(`
        CREATE TABLE users (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
          department VARCHAR(100),
          avatar_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log("Users table created successfully!");
      
      // Create admin user
      const adminId = uuidv4();
      await connection.query(`
        INSERT INTO users (id, name, email, password, role, department, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [adminId, 'Admin User', 'admin@example.com', 'password', 'admin', 'IT']);
      
      // Create regular user
      const userId = uuidv4();
      await connection.query(`
        INSERT INTO users (id, name, email, password, role, department, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [userId, 'Regular User', 'user@example.com', 'password', 'user', 'General']);
      
      console.log("Default users created successfully!");
    } else {
      console.log("Users table already exists.");
      
      // Check users in the table
      const [users] = await connection.query('SELECT * FROM users');
      console.log(`Found ${users.length} users:`);
      
      users.forEach(user => {
        console.log(`- ${user.id}: ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Close the connection
    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error checking users table:', error);
  }
}

checkUsersTable();
