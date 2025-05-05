import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

async function testRequestInsert() {
  console.log('Testing request insert and retrieval...');
  
  try {
    // Create connection
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT || 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      connectTimeout: 10000, // 10 seconds
    });
    
    console.log('Connected to database');
    
    // Generate a unique ID for the request
    const requestId = uuidv4();
    const userId = '733dce62-3971-4448-8fc7-2d5e77928b00'; // Admin user ID
    const categoryId = '1f34fae5-830b-4c6c-9092-7ea7c1f11433'; // Hardware category ID
    
    // Insert the request
    console.log('Inserting request with ID:', requestId);
    await connection.query(
      `
      INSERT INTO item_requests (
        id,
        title,
        description,
        category_id,
        priority,
        status,
        user_id,
        quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        requestId,
        'Request Insert Test',
        'This is a test request inserted directly into the database',
        categoryId,
        'medium',
        'pending',
        userId,
        1
      ]
    );
    
    console.log('Request inserted successfully');
    
    // Verify the request was inserted
    console.log('Verifying request...');
    const [requests] = await connection.query(
      `
      SELECT
        ir.id,
        ir.title,
        ir.description,
        c.id as category,
        c.name as categoryName,
        ir.priority,
        ir.status,
        ir.user_id as userId,
        ir.created_at as createdAt,
        ir.updated_at as updatedAt,
        ir.quantity
      FROM item_requests ir
      JOIN categories c ON ir.category_id = c.id
      WHERE ir.id = ?
      `,
      [requestId]
    );
    
    if (requests.length === 0) {
      console.log('Request not found in database!');
    } else {
      console.log('Request found in database:', requests[0]);
    }
    
    // Close the connection
    await connection.end();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

testRequestInsert();
