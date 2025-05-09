import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvrhtzjxdcahpceqkvbd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);
console.log('Supabase Service Role Key exists:', !!supabaseServiceRoleKey);

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Supabase client created with anon key');

// Create Supabase client with service role key (if available)
let supabaseAdmin = null;
if (supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  console.log('Supabase admin client created with service role key');
}

// Test function to check if we can read from Supabase
async function testRead() {
  try {
    console.log('\n--- Testing READ operation ---');
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error reading from categories table:', error);
    } else {
      console.log('Successfully read from categories table');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Exception during read operation:', err);
  }
}

// Test function to check if we can write to Supabase with anon key
async function testWriteWithAnonKey() {
  try {
    console.log('\n--- Testing WRITE operation with anon key ---');
    const testItem = {
      name: 'Test Item ' + new Date().toISOString(),
      description: 'This is a test item created by the test script',
      category_id: null // We'll update this if we find a category
    };
    
    // Try to get a category ID first
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (categories && categories.length > 0) {
      testItem.category_id = categories[0].id;
    }
    
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([testItem])
      .select();
    
    if (error) {
      console.error('Error inserting into inventory_items table with anon key:', error);
    } else {
      console.log('Successfully inserted into inventory_items table with anon key');
      console.log('Inserted data:', data);
    }
  } catch (err) {
    console.error('Exception during write operation with anon key:', err);
  }
}

// Test function to check if we can write to Supabase with service role key
async function testWriteWithServiceRoleKey() {
  if (!supabaseAdmin) {
    console.log('\n--- Skipping WRITE operation with service role key (key not available) ---');
    return;
  }
  
  try {
    console.log('\n--- Testing WRITE operation with service role key ---');
    const testItem = {
      name: 'Admin Test Item ' + new Date().toISOString(),
      description: 'This is a test item created by the test script using service role key',
      category_id: null // We'll update this if we find a category
    };
    
    // Try to get a category ID first
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id')
      .limit(1);
    
    if (categories && categories.length > 0) {
      testItem.category_id = categories[0].id;
    }
    
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .insert([testItem])
      .select();
    
    if (error) {
      console.error('Error inserting into inventory_items table with service role key:', error);
    } else {
      console.log('Successfully inserted into inventory_items table with service role key');
      console.log('Inserted data:', data);
    }
  } catch (err) {
    console.error('Exception during write operation with service role key:', err);
  }
}

// Run the tests
async function runTests() {
  await testRead();
  await testWriteWithAnonKey();
  await testWriteWithServiceRoleKey();
}

runTests().catch(console.error);
