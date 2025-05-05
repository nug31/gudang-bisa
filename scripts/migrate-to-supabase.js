import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
config();

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateToSupabase() {
  console.log('Starting migration from MySQL to Supabase...');
  console.log('MySQL connection details:');
  console.log(`Host: ${mysqlConfig.host}`);
  console.log(`User: ${mysqlConfig.user}`);
  console.log(`Database: ${mysqlConfig.database}`);
  console.log(`Port: ${mysqlConfig.port}`);
  console.log('Password: [HIDDEN]');
  
  let mysqlConnection;
  
  try {
    // Connect to MySQL
    console.log('\nConnecting to MySQL database...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL database successfully.');
    
    // Create a backup directory
    const backupDir = path.join(process.cwd(), 'backup');
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`Created backup directory at ${backupDir}`);
    
    // Migrate users
    await migrateUsers(mysqlConnection, backupDir);
    
    // Migrate categories
    await migrateCategories(mysqlConnection, backupDir);
    
    // Migrate inventory items
    await migrateInventoryItems(mysqlConnection, backupDir);
    
    // Migrate item requests
    await migrateItemRequests(mysqlConnection, backupDir);
    
    // Migrate comments
    await migrateComments(mysqlConnection, backupDir);
    
    // Migrate notifications
    await migrateNotifications(mysqlConnection, backupDir);
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`Backup files are available in the ${backupDir} directory.`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('MySQL connection closed.');
    }
  }
}

// Helper function to migrate users
async function migrateUsers(mysqlConnection, backupDir) {
  console.log('\nMigrating users...');
  
  try {
    // Get users from MySQL
    const [users] = await mysqlConnection.query('SELECT * FROM users');
    console.log(`Found ${users.length} users in MySQL.`);
    
    // Save backup
    await fs.writeFile(
      path.join(backupDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    
    // Skip if no users
    if (users.length === 0) {
      console.log('No users to migrate.');
      return;
    }
    
    // Transform users for Supabase
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password || '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', // Default password if none exists
      role: user.role,
      avatar_url: user.avatar_url,
      department: user.department,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at
    }));
    
    // Insert users into Supabase
    const { data, error } = await supabase
      .from('users')
      .upsert(transformedUsers, { onConflict: 'id' });
    
    if (error) {
      console.error('Error inserting users into Supabase:', error);
      throw error;
    }
    
    console.log(`✅ Migrated ${transformedUsers.length} users to Supabase.`);
  } catch (error) {
    console.error('Error migrating users:', error);
    throw error;
  }
}

// Helper function to migrate categories
async function migrateCategories(mysqlConnection, backupDir) {
  console.log('\nMigrating categories...');
  
  try {
    // Get categories from MySQL
    const [categories] = await mysqlConnection.query('SELECT * FROM categories');
    console.log(`Found ${categories.length} categories in MySQL.`);
    
    // Save backup
    await fs.writeFile(
      path.join(backupDir, 'categories.json'),
      JSON.stringify(categories, null, 2)
    );
    
    // Skip if no categories
    if (categories.length === 0) {
      console.log('No categories to migrate.');
      return;
    }
    
    // Transform categories for Supabase
    const transformedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      created_at: category.created_at,
      updated_at: category.updated_at || category.created_at
    }));
    
    // Insert categories into Supabase
    const { data, error } = await supabase
      .from('categories')
      .upsert(transformedCategories, { onConflict: 'id' });
    
    if (error) {
      console.error('Error inserting categories into Supabase:', error);
      throw error;
    }
    
    console.log(`✅ Migrated ${transformedCategories.length} categories to Supabase.`);
  } catch (error) {
    console.error('Error migrating categories:', error);
    throw error;
  }
}

// Helper function to migrate inventory items
async function migrateInventoryItems(mysqlConnection, backupDir) {
  console.log('\nMigrating inventory items...');
  
  try {
    // Check if inventory_items table exists
    const [tables] = await mysqlConnection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'inventory_items'
    `, [process.env.DB_NAME]);
    
    if (tables.length === 0) {
      console.log('Inventory items table does not exist in MySQL. Skipping migration.');
      return;
    }
    
    // Get inventory items from MySQL
    const [items] = await mysqlConnection.query('SELECT * FROM inventory_items');
    console.log(`Found ${items.length} inventory items in MySQL.`);
    
    // Save backup
    await fs.writeFile(
      path.join(backupDir, 'inventory_items.json'),
      JSON.stringify(items, null, 2)
    );
    
    // Skip if no items
    if (items.length === 0) {
      console.log('No inventory items to migrate.');
      return;
    }
    
    // Transform inventory items for Supabase
    const transformedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      category_id: item.category_id,
      sku: item.sku,
      quantity_available: item.quantity_available,
      quantity_reserved: item.quantity_reserved,
      unit_price: item.unit_price,
      location: item.location,
      image_url: item.image_url,
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at
    }));
    
    // Insert inventory items into Supabase
    const { data, error } = await supabase
      .from('inventory_items')
      .upsert(transformedItems, { onConflict: 'id' });
    
    if (error) {
      console.error('Error inserting inventory items into Supabase:', error);
      throw error;
    }
    
    console.log(`✅ Migrated ${transformedItems.length} inventory items to Supabase.`);
  } catch (error) {
    console.error('Error migrating inventory items:', error);
    throw error;
  }
}

// Helper function to migrate item requests
async function migrateItemRequests(mysqlConnection, backupDir) {
  console.log('\nMigrating item requests...');
  
  try {
    // Get item requests from MySQL
    const [requests] = await mysqlConnection.query('SELECT * FROM item_requests');
    console.log(`Found ${requests.length} item requests in MySQL.`);
    
    // Save backup
    await fs.writeFile(
      path.join(backupDir, 'item_requests.json'),
      JSON.stringify(requests, null, 2)
    );
    
    // Skip if no requests
    if (requests.length === 0) {
      console.log('No item requests to migrate.');
      return;
    }
    
    // Transform item requests for Supabase
    const transformedRequests = requests.map(request => ({
      id: request.id,
      title: request.title,
      description: request.description,
      category_id: request.category_id,
      priority: request.priority,
      status: request.status,
      user_id: request.user_id,
      quantity: request.quantity || 1,
      total_cost: request.total_cost,
      created_at: request.created_at,
      updated_at: request.updated_at || request.created_at,
      approved_at: request.approved_at,
      approved_by: request.approved_by,
      rejected_at: request.rejected_at,
      rejected_by: request.rejected_by,
      rejection_reason: request.rejection_reason,
      fulfillment_date: request.fulfillment_date
    }));
    
    // Insert item requests into Supabase
    const { data, error } = await supabase
      .from('item_requests')
      .upsert(transformedRequests, { onConflict: 'id' });
    
    if (error) {
      console.error('Error inserting item requests into Supabase:', error);
      throw error;
    }
    
    console.log(`✅ Migrated ${transformedRequests.length} item requests to Supabase.`);
  } catch (error) {
    console.error('Error migrating item requests:', error);
    throw error;
  }
}

// Helper function to migrate comments
async function migrateComments(mysqlConnection, backupDir) {
  console.log('\nMigrating comments...');
  
  try {
    // Check if comments table exists
    const [tables] = await mysqlConnection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'comments'
    `, [process.env.DB_NAME]);
    
    if (tables.length === 0) {
      console.log('Comments table does not exist in MySQL. Skipping migration.');
      return;
    }
    
    // Get comments from MySQL
    const [comments] = await mysqlConnection.query('SELECT * FROM comments');
    console.log(`Found ${comments.length} comments in MySQL.`);
    
    // Save backup
    await fs.writeFile(
      path.join(backupDir, 'comments.json'),
      JSON.stringify(comments, null, 2)
    );
    
    // Skip if no comments
    if (comments.length === 0) {
      console.log('No comments to migrate.');
      return;
    }
    
    // Transform comments for Supabase
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      item_request_id: comment.item_request_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at
    }));
    
    // Insert comments into Supabase
    const { data, error } = await supabase
      .from('comments')
      .upsert(transformedComments, { onConflict: 'id' });
    
    if (error) {
      console.error('Error inserting comments into Supabase:', error);
      throw error;
    }
    
    console.log(`✅ Migrated ${transformedComments.length} comments to Supabase.`);
  } catch (error) {
    console.error('Error migrating comments:', error);
    throw error;
  }
}

// Helper function to migrate notifications
async function migrateNotifications(mysqlConnection, backupDir) {
  console.log('\nMigrating notifications...');
  
  try {
    // Check if notifications table exists
    const [tables] = await mysqlConnection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
    `, [process.env.DB_NAME]);
    
    if (tables.length === 0) {
      console.log('Notifications table does not exist in MySQL. Skipping migration.');
      return;
    }
    
    // Get notifications from MySQL
    const [notifications] = await mysqlConnection.query('SELECT * FROM notifications');
    console.log(`Found ${notifications.length} notifications in MySQL.`);
    
    // Save backup
    await fs.writeFile(
      path.join(backupDir, 'notifications.json'),
      JSON.stringify(notifications, null, 2)
    );
    
    // Skip if no notifications
    if (notifications.length === 0) {
      console.log('No notifications to migrate.');
      return;
    }
    
    // Transform notifications for Supabase
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      user_id: notification.user_id,
      type: notification.type,
      message: notification.message,
      is_read: notification.is_read || notification.read || false,
      created_at: notification.created_at,
      related_item_id: notification.related_item_id
    }));
    
    // Insert notifications into Supabase
    const { data, error } = await supabase
      .from('notifications')
      .upsert(transformedNotifications, { onConflict: 'id' });
    
    if (error) {
      console.error('Error inserting notifications into Supabase:', error);
      throw error;
    }
    
    console.log(`✅ Migrated ${transformedNotifications.length} notifications to Supabase.`);
  } catch (error) {
    console.error('Error migrating notifications:', error);
    throw error;
  }
}

// Run the migration
migrateToSupabase().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
