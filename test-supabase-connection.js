import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config();

// Set global fetch for Node.js environment
global.fetch = fetch;

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection with:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? '[HIDDEN]' : 'undefined'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: fetch
  }
});

async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Try to fetch users as a simple test
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Data retrieved:', data);
  } catch (err) {
    console.error('Exception when connecting to Supabase:', err);
  }
}

testConnection();
