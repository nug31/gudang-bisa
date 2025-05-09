-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Managers can update any user" ON users;
DROP POLICY IF EXISTS "Managers can insert users" ON users;
DROP POLICY IF EXISTS "Managers can delete users" ON users;

DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Only admins and managers can insert categories" ON categories;
DROP POLICY IF EXISTS "Only admins and managers can update categories" ON categories;
DROP POLICY IF EXISTS "Only admins and managers can delete categories" ON categories;

DROP POLICY IF EXISTS "Anyone can view inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Only admins and managers can insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Only admins and managers can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Only admins and managers can delete inventory items" ON inventory_items;

DROP POLICY IF EXISTS "Users can view their own requests" ON item_requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON item_requests;
DROP POLICY IF EXISTS "Users can update their own pending requests" ON item_requests;
DROP POLICY IF EXISTS "Admins and managers can update any request" ON item_requests;
DROP POLICY IF EXISTS "Users can delete their own pending requests" ON item_requests;
DROP POLICY IF EXISTS "Admins and managers can delete any request" ON item_requests;

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
DROP POLICY IF EXISTS "Admins and managers can delete any comment" ON comments;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create policies for users table
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Managers can update any user" ON users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'manager'
    )
  );

CREATE POLICY "Managers can insert users" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'manager'
    )
  );

CREATE POLICY "Managers can delete users" ON users
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'manager'
    )
  );

-- Create policies for categories table
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

-- Create policies for inventory_items table
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

-- Create policies for item_requests table
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
    (auth.uid() = user_id AND status = 'pending') OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update any request" ON item_requests
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can delete their own pending requests" ON item_requests
  FOR DELETE USING (
    auth.uid() = user_id AND status = 'pending'
  );

CREATE POLICY "Admins and managers can delete any request" ON item_requests
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Create policies for comments table
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can delete any comment" ON comments
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'manager')
    )
  );

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
