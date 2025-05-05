-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'user') NOT NULL,
  avatar_url VARCHAR(255),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create item_requests table
CREATE TABLE IF NOT EXISTS item_requests (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  status ENUM('draft', 'pending', 'approved', 'rejected', 'fulfilled') NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  approved_by VARCHAR(36),
  rejected_at TIMESTAMP NULL,
  rejected_by VARCHAR(36),
  rejection_reason TEXT,
  fulfillment_date TIMESTAMP NULL,
  quantity INT NOT NULL DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES item_requests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('request_submitted', 'request_approved', 'request_rejected', 'request_fulfilled', 'comment_added') NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  related_item_id VARCHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (related_item_id) REFERENCES item_requests(id)
);