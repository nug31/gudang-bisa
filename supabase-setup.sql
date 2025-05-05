-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  department VARCHAR(255),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id),
  sku VARCHAR(255),
  quantity_available INT NOT NULL DEFAULT 0,
  quantity_reserved INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2),
  location VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create item_requests table
CREATE TABLE IF NOT EXISTS item_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  user_id UUID NOT NULL REFERENCES users(id),
  quantity INT NOT NULL DEFAULT 1,
  inventory_item_id UUID REFERENCES inventory_items(id),
  fulfillment_date DATE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES item_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_item_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Office', 'Office supplies and equipment'),
  ('00000000-0000-0000-0000-000000000002', 'Cleaning', 'Cleaning supplies and equipment'),
  ('00000000-0000-0000-0000-000000000003', 'Hardware', 'Hardware tools and equipment'),
  ('00000000-0000-0000-0000-000000000004', 'Other', 'Other items')
ON CONFLICT (id) DO NOTHING;

-- Create Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
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

-- Create policies for item_requests table
CREATE POLICY "Users can view all requests" ON item_requests
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own requests" ON item_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" ON item_requests
  FOR UPDATE USING (
    auth.uid() = user_id AND status = 'pending'
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

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
