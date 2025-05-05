import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

async function testSupabaseConnection() {
  console.log('Testing Supabase connection with the following settings:');
  console.log(`URL: ${supabaseUrl}`);
  console.log('Key: [HIDDEN]');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection with a simple query
    console.log('Attempting to connect to Supabase...');
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact' });
    
    if (error) {
      console.error('❌ Error connecting to Supabase:', error);
      process.exit(1);
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('Connection test passed.');
    
    // Test RLS policies
    console.log('\nTesting Row Level Security policies...');
    
    // Try to select users (should work with anon key if RLS is set up correctly)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      console.log('This might indicate an issue with RLS policies.');
    } else {
      console.log('✅ Successfully fetched users with anon key.');
      console.log(`Found ${users.length} users.`);
    }
    
    // Try to select categories (should work with anon key)
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(5);
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      console.log('This might indicate an issue with RLS policies.');
    } else {
      console.log('✅ Successfully fetched categories with anon key.');
      console.log(`Found ${categories.length} categories.`);
    }
    
    console.log('\nSupabase connection and RLS policy tests completed.');
    
  } catch (error) {
    console.error('❌ Unexpected error testing Supabase connection:', error);
    process.exit(1);
  }
}

testSupabaseConnection();
