
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { config } from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables from .env.production
config({ path: './.env.production' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('Testing database connection with settings:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const connection = await pool.getConnection();
    console.log('Database connected successfully');

    // Test a simple query
    try {
      const [result] = await connection.query('SELECT 1 as test');
      console.log('Test query result:', result);
    } catch (queryError) {
      console.error('Error executing test query:', queryError);
    }

    connection.release();
    res.json({ success: true, message: 'Database connected successfully' });
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting to database',
      error: error.message,
      stack: error.stack,
    });
  }
});

// Import your API routes
// ... (copy your API routes from server.js)

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
