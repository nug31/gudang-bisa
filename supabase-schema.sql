-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Disable RLS temporarily
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS item_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- Drop existing tables in reverse order of creation to avoid foreign key constraint issues
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS item_requests;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('user', 'admin', 'manager')),
  department VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Add password column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE users ADD COLUMN password VARCHAR;
  END IF;
END $$;



-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  description VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  description VARCHAR,
  category_id UUID REFERENCES categories(id),
  sku VARCHAR,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2),
  location VARCHAR,
  image_url VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create item_requests table
CREATE TABLE IF NOT EXISTS item_requests (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description VARCHAR,
  category_id UUID REFERENCES categories(id),
  priority VARCHAR CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  user_id UUID REFERENCES users(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id),
  rejection_reason VARCHAR,
  fulfillment_date TIMESTAMPTZ
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY,
  item_request_id UUID REFERENCES item_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  message VARCHAR NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_item_id UUID
);

-- Insert default categories
INSERT INTO categories (id, name, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Office', 'Office supplies and equipment'),
  ('22222222-2222-2222-2222-222222222222', 'Cleaning', 'Cleaning supplies and equipment'),
  ('33333333-3333-3333-3333-333333333333', 'Hardware', 'Hardware tools and equipment'),
  ('44444444-4444-4444-4444-444444444444', 'Other', 'Other items')
ON CONFLICT (id) DO NOTHING;

-- Insert default users with simple insert statements
-- Admin user (password: "password")
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Admin User',
  'admin@gudangmitra.com',
  '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.',
  'admin',
  'Management',
  NOW()
);

-- Manager user (password: "password")
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'Manager User',
  'manager@gudangmitra.com',
  '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.',
  'manager',
  'Operations',
  NOW()
);

-- Regular user (password: "password")
INSERT INTO users (id, name, email, password, role, department, created_at)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'Regular User',
  'user@gudangmitra.com',
  '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.',
  'user',
  'Sales',
  NOW()
);

-- Insert sample inventory items
INSERT INTO inventory_items (id, name, description, category_id, sku, quantity_available, quantity_reserved, unit_price, location, image_url, created_at)
VALUES
  ('88888888-8888-8888-8888-888888888888', 'Ballpoint Pen', 'Blue ballpoint pen', '11111111-1111-1111-1111-111111111111', 'PEN-001', 100, 10, 1.99, 'Shelf A1', '/img/items/pen.jpg', NOW()),
  ('99999999-9999-9999-9999-999999999999', 'Notebook', 'A5 lined notebook', '11111111-1111-1111-1111-111111111111', 'NB-001', 50, 5, 4.99, 'Shelf A2', '/img/items/notebook.jpg', NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cleaning Spray', 'All-purpose cleaning spray', '22222222-2222-2222-2222-222222222222', 'CL-001', 30, 2, 3.49, 'Shelf B1', '/img/items/spray.jpg', NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Screwdriver Set', 'Set of 6 screwdrivers', '33333333-3333-3333-3333-333333333333', 'HW-001', 15, 1, 12.99, 'Shelf C1', '/img/items/screwdriver.jpg', NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'First Aid Kit', 'Basic first aid kit', '44444444-4444-4444-4444-444444444444', 'OT-001', 10, 0, 15.99, 'Shelf D1', '/img/items/firstaid.jpg', NOW())
ON CONFLICT (id) DO NOTHING;

-- Now enable RLS after data is inserted
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Commit all changes so far to ensure data is saved before applying policies
COMMIT;

-- Drop existing policies for users table if they exist
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS "Only admins and managers can insert users" ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS "Only admins and managers can update users" ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;
DROP POLICY IF EXISTS "Only admins and managers can delete users" ON users;

-- Create policies for users table
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (true);  -- Everyone can view users

CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');  -- Only authenticated users can create users

CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (
    auth.uid() = id OR  -- Users can update their own profile
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))  -- Admins and managers can update any user
  );

CREATE POLICY users_delete_policy ON users
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))  -- Only admins and managers can delete users
  );

-- Create policies for other tables with similar pattern
-- Categories policies
CREATE POLICY categories_select_policy ON categories
  FOR SELECT USING (true);  -- Everyone can view categories

CREATE POLICY categories_insert_policy ON categories
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY categories_update_policy ON categories
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY categories_delete_policy ON categories
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))
  );

-- Inventory items policies
CREATE POLICY inventory_items_select_policy ON inventory_items
  FOR SELECT USING (true);  -- Everyone can view inventory items

CREATE POLICY inventory_items_insert_policy ON inventory_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY inventory_items_update_policy ON inventory_items
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY inventory_items_delete_policy ON inventory_items
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))
  );

-- Item requests policies
CREATE POLICY item_requests_select_policy ON item_requests
  FOR SELECT USING (true);  -- Everyone can view item requests

CREATE POLICY item_requests_insert_policy ON item_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);  -- Users can only create their own requests

CREATE POLICY item_requests_update_policy ON item_requests
  FOR UPDATE USING (
    auth.uid() = user_id OR  -- Users can update their own requests
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))  -- Admins and managers can update any request
  );

CREATE POLICY item_requests_delete_policy ON item_requests
  FOR DELETE USING (
    auth.uid() = user_id OR  -- Users can delete their own requests
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))  -- Admins and managers can delete any request
  );

-- Comments policies
CREATE POLICY comments_select_policy ON comments
  FOR SELECT USING (true);  -- Everyone can view comments

CREATE POLICY comments_insert_policy ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);  -- Users can only create their own comments

CREATE POLICY comments_update_policy ON comments
  FOR UPDATE USING (auth.uid() = user_id);  -- Users can only update their own comments

CREATE POLICY comments_delete_policy ON comments
  FOR DELETE USING (
    auth.uid() = user_id OR  -- Users can delete their own comments
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'manager'))  -- Admins and managers can delete any comment
  );

-- Notifications policies
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT USING (user_id = auth.uid());  -- Users can only view their own notifications

CREATE POLICY notifications_insert_policy ON notifications
  FOR INSERT WITH CHECK (true);  -- Allow all inserts during setup

CREATE POLICY notifications_update_policy ON notifications
  FOR UPDATE USING (user_id = auth.uid());  -- Users can only update their own notifications

CREATE POLICY notifications_delete_policy ON notifications
  FOR DELETE USING (user_id = auth.uid());  -- Users can only delete their own notifications

