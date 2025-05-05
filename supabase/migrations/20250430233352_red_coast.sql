-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  department TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create item_requests table
CREATE TABLE IF NOT EXISTS item_requests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'fulfilled')),
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  approved_by TEXT,
  rejected_at DATETIME,
  rejected_by TEXT,
  rejection_reason TEXT,
  fulfillment_date DATETIME,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cost DECIMAL(10,2),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES item_requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('request_submitted', 'request_approved', 'request_rejected', 'request_fulfilled', 'comment_added')),
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  related_item_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (related_item_id) REFERENCES item_requests(id)
);