-- This script sets up the necessary tables and RLS policies for the Gudang Mitra application
-- Run this in the Supabase SQL editor

-- Create the categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create the inventory_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  sku TEXT,
  quantity_available INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create the item_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS item_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access on categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated insert access on categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated update access on categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated delete access on categories" ON categories;

DROP POLICY IF EXISTS "Allow public read access on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated insert access on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated update access on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated delete access on inventory_items" ON inventory_items;

DROP POLICY IF EXISTS "Allow public read access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated update access on users" ON users;
DROP POLICY IF EXISTS "Allow authenticated delete access on users" ON users;

DROP POLICY IF EXISTS "Allow public read access on item_requests" ON item_requests;
DROP POLICY IF EXISTS "Allow authenticated insert access on item_requests" ON item_requests;
DROP POLICY IF EXISTS "Allow authenticated update access on item_requests" ON item_requests;
DROP POLICY IF EXISTS "Allow authenticated delete access on item_requests" ON item_requests;

-- Create RLS policies for categories
CREATE POLICY "Allow public read access on categories"
ON categories FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated insert access on categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update access on categories"
ON categories FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete access on categories"
ON categories FOR DELETE
TO authenticated
USING (true);

-- Create RLS policies for inventory_items
CREATE POLICY "Allow public read access on inventory_items"
ON inventory_items FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated insert access on inventory_items"
ON inventory_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update access on inventory_items"
ON inventory_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete access on inventory_items"
ON inventory_items FOR DELETE
TO authenticated
USING (true);

-- Create RLS policies for users
CREATE POLICY "Allow public read access on users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated insert access on users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update access on users"
ON users FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete access on users"
ON users FOR DELETE
TO authenticated
USING (true);

-- Create RLS policies for item_requests
CREATE POLICY "Allow public read access on item_requests"
ON item_requests FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated insert access on item_requests"
ON item_requests FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update access on item_requests"
ON item_requests FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete access on item_requests"
ON item_requests FOR DELETE
TO authenticated
USING (true);

-- Insert some sample data if the tables are empty
INSERT INTO categories (name, description)
SELECT 'Office', 'Office supplies'
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

INSERT INTO categories (name, description)
SELECT 'Cleaning', 'Cleaning supplies'
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

INSERT INTO categories (name, description)
SELECT 'Hardware', 'Hardware tools and supplies'
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

INSERT INTO categories (name, description)
SELECT 'Other', 'Miscellaneous items'
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Insert a sample admin user if the users table is empty
INSERT INTO users (name, email, password_hash, role, department)
SELECT 'Admin User', 'admin@gudangmitra.com', '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', 'admin', 'Management'
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);
