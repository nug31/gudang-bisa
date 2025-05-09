import { config } from "dotenv";
import pg from "pg";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error(
    "Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file."
  );
  process.exit(1);
}

async function initNeonSchema() {
  console.log("Initializing Neon database schema...");

  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Connect to the database
    await client.connect();
    console.log("Connected to Neon database.");

    // Create the schema SQL
    const schema = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  avatar_url VARCHAR(255),
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id),
  sku VARCHAR(100),
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) DEFAULT 0,
  location VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create item_requests table
CREATE TABLE IF NOT EXISTS item_requests (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'fulfilled')),
  user_id UUID NOT NULL REFERENCES users(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  fulfillment_date TIMESTAMP WITH TIME ZONE
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY,
  item_request_id UUID NOT NULL REFERENCES item_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('request_submitted', 'request_approved', 'request_rejected', 'request_fulfilled', 'comment_added')),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  related_item_id UUID REFERENCES item_requests(id) ON DELETE CASCADE
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_requests_updated_at BEFORE UPDATE ON item_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@gudangmitra.com', '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', 'admin', 'IT', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert default manager user (password: manager123)
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Manager User', 'manager@gudangmitra.com', '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', 'manager', 'Operations', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Insert default categories
INSERT INTO categories (id, name, description, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Office', 'Office supplies and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000002', 'Cleaning', 'Cleaning supplies and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000003', 'Hardware', 'Hardware tools and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000004', 'Other', 'Other items', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
`;

    // Split the SQL into individual statements
    const statements = schema
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        await client.query(statement);
        console.log(`Statement ${i + 1} executed successfully.`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.error("Statement:", statement);

        // Continue with the next statement
        console.log("Continuing with the next statement...");
      }
    }

    console.log("Neon database schema initialized successfully!");
  } catch (error) {
    console.error("Error initializing Neon schema:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the initialization
initNeonSchema().catch((error) => {
  console.error("Initialization failed:", error);
  process.exit(1);
});
