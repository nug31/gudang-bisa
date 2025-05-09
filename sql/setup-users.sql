-- Enable pgcrypto for password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Sample admin user (password: 'admin123')
INSERT INTO users (name, email, password, role)
VALUES (
  'Admin User', 
  'admin@example.com', 
  crypt('admin123', gen_salt('bf')), 
  'admin'
)
ON CONFLICT (email) DO NOTHING;
