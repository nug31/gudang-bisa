import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

async function createCustomUser() {
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

    // Check if user already exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      ['admin@gudangmitra.com']
    );

    if (existingUsers.length > 0) {
      console.log('User admin@gudangmitra.com already exists:');
      console.log(existingUsers[0]);
    } else {
      // Create custom user
      const userId = uuidv4();
      await connection.query(`
        INSERT INTO users (id, name, email, password, role, department, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [userId, 'Gudang Mitra Admin', 'admin@gudangmitra.com', 'password', 'admin', 'IT']);
      
      console.log(`User admin@gudangmitra.com created with ID: ${userId}`);
    }

    // List all users
    const [allUsers] = await connection.query('SELECT * FROM users');
    console.log('\nAll users in the database:');
    allUsers.forEach(user => {
      console.log(`- ${user.id}: ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Close the connection
    await connection.end();
    console.log('\nConnection closed.');
  } catch (error) {
    console.error('Error creating custom user:', error);
  }
}

createCustomUser();
