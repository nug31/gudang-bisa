-- Create tables for Gudang Mitra application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  role ENUM('user', 'admin', 'manager') NOT NULL DEFAULT 'user',
  department VARCHAR(255),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id VARCHAR(36) NOT NULL,
  sku VARCHAR(255),
  quantity_available INT NOT NULL DEFAULT 0,
  quantity_reserved INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2),
  location VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Item requests table
CREATE TABLE IF NOT EXISTS item_requests (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id VARCHAR(36) NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('pending', 'approved', 'rejected', 'fulfilled') NOT NULL DEFAULT 'pending',
  user_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  inventory_item_id VARCHAR(36),
  fulfillment_date DATE,
  approved_at TIMESTAMP NULL,
  approved_by VARCHAR(36),
  rejected_at TIMESTAMP NULL,
  rejected_by VARCHAR(36),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES item_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  related_item_id VARCHAR(36),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert default categories
INSERT INTO categories (id, name, description) VALUES
('c1', 'Office Supplies', 'Paper, pens, staplers, and other office essentials'),
('c2', 'Cleaning Materials', 'Cleaning products and janitorial supplies'),
('c3', 'Hardware', 'Tools, equipment, and hardware items'),
('c4', 'Other', 'Miscellaneous items that don\'t fit other categories');

-- Insert default admin user (password: password)
INSERT INTO users (id, name, email, password, role, department) VALUES
('u1', 'Admin User', 'admin@example.com', '$2a$10$JsRjbBKhkiQP9Q4zl9QZyeB1.tL9LnT.1QY2QJNlQOK5AuA.3YDWW', 'admin', 'IT'),
('u2', 'Manager User', 'manager@example.com', '$2a$10$JsRjbBKhkiQP9Q4zl9QZyeB1.tL9LnT.1QY2QJNlQOK5AuA.3YDWW', 'manager', 'Operations'),
('u3', 'Regular User', 'user@example.com', '$2a$10$JsRjbBKhkiQP9Q4zl9QZyeB1.tL9LnT.1QY2QJNlQOK5AuA.3YDWW', 'user', 'Marketing');
