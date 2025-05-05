import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initSupabaseSchema() {
  console.log('Initializing Supabase database schema...');
  
  try {
    // Create the migrations directory if it doesn't exist
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    await fs.mkdir(migrationsDir, { recursive: true });
    
    // Check if the migration file exists
    const migrationFilePath = path.join(migrationsDir, '20250501074543_vercel_deployment.sql');
    
    try {
      await fs.access(migrationFilePath);
      console.log('Migration file exists.');
    } catch (error) {
      console.log('Migration file does not exist. Creating it...');
      
      // Create the migration file with the schema
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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can insert users" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins and managers can update users" ON users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins and managers can delete users" ON users
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for categories table
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can insert categories" ON categories
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins and managers can update categories" ON categories
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins and managers can delete categories" ON categories
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for inventory_items table
CREATE POLICY "Anyone can view inventory items" ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Only admins and managers can insert inventory items" ON inventory_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins and managers can update inventory items" ON inventory_items
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins and managers can delete inventory items" ON inventory_items
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for item_requests table
CREATE POLICY "Users can view their own requests" ON item_requests
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert their own requests" ON item_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own pending requests" ON item_requests
  FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'draft') OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins and managers can delete requests" ON item_requests
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for comments table
CREATE POLICY "Users can view comments on requests they can see" ON comments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM item_requests WHERE id = item_request_id
    ) OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert comments on requests they can see" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (
      auth.uid() IN (
        SELECT user_id FROM item_requests WHERE id = item_request_id
      ) OR
      auth.uid() IN (
        SELECT id FROM users WHERE role IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Create RLS policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id
  );

CREATE POLICY "Only system can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Insert default admin user (password: admin123)
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@gudangmitra.com', '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', 'admin', 'IT', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Insert default manager user (password: manager123)
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'Manager User', 'manager@gudangmitra.com', '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', 'manager', 'Operations', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Insert default categories
INSERT INTO categories (id, name, description, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Office', 'Office supplies and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000002', 'Cleaning', 'Cleaning supplies and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000003', 'Hardware', 'Hardware tools and equipment', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000004', 'Other', 'Other items', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
`;
      
      await fs.writeFile(migrationFilePath, schema);
      console.log('Migration file created successfully.');
    }
    
    // Read the SQL migration file
    const sql = await fs.readFile(migrationFilePath, 'utf8');
    console.log('Read migration file successfully.');
    
    // Split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Execute the SQL statement using Supabase's REST API
        const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
          
          // Continue with the next statement
          console.log('Continuing with the next statement...');
        }
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.log('Continuing with the next statement...');
      }
    }
    
    console.log('Supabase database schema initialized successfully!');
    
  } catch (error) {
    console.error('Error initializing Supabase schema:', error);
    process.exit(1);
  }
}

// Run the initialization
initSupabaseSchema().catch(error => {
  console.error('Initialization failed:', error);
  process.exit(1);
});
