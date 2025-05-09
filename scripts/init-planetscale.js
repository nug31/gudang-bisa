import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PlanetScale connection details
const host = process.env.PLANETSCALE_HOST;
const username = process.env.PLANETSCALE_USERNAME;
const password = process.env.PLANETSCALE_PASSWORD;
const database = process.env.PLANETSCALE_DATABASE;

if (!host || !username || !password || !database) {
  console.error('Missing PlanetScale environment variables. Please set PLANETSCALE_HOST, PLANETSCALE_USERNAME, PLANETSCALE_PASSWORD, and PLANETSCALE_DATABASE in your .env file.');
  process.exit(1);
}

async function initPlanetScaleSchema() {
  console.log('Initializing PlanetScale database schema...');
  
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host,
      user: username,
      password,
      database,
      ssl: {
        rejectUnauthorized: true
      }
    });
    
    console.log('Connected to PlanetScale database.');
    
    // Create the schema SQL
    const schema = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url VARCHAR(255),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id CHAR(36) NOT NULL,
  sku VARCHAR(100),
  quantity_available INT NOT NULL DEFAULT 0,
  quantity_reserved INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) DEFAULT 0,
  location VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create item_requests table
CREATE TABLE IF NOT EXISTS item_requests (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id CHAR(36) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  user_id CHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  approved_by CHAR(36),
  rejected_at TIMESTAMP NULL,
  rejected_by CHAR(36),
  rejection_reason TEXT,
  fulfillment_date TIMESTAMP NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id CHAR(36) PRIMARY KEY,
  item_request_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_request_id) REFERENCES item_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  related_item_id CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (related_item_id) REFERENCES item_requests(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@gudangmitra.com', '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', 'admin', 'IT', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE id = id;

-- Insert default manager user (password: manager123)
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'Manager User', 'manager@gudangmitra.com', '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', 'manager', 'Operations', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE id = id;

-- Insert default categories
INSERT INTO categories (id, name, description, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Office', 'Office supplies and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000002', 'Cleaning', 'Cleaning supplies and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000003', 'Hardware', 'Hardware tools and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000004', 'Other', 'Other items', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE id = id;
`;
    
    // Split the SQL into individual statements
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await connection.query(statement);
        console.log(`Statement ${i + 1} executed successfully.`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        
        // Continue with the next statement
        console.log('Continuing with the next statement...');
      }
    }
    
    console.log('PlanetScale database schema initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing PlanetScale schema:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the initialization
initPlanetScaleSchema().catch(error => {
  console.error('Initialization failed:', error);
  process.exit(1);
});
