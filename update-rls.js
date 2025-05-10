import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvrhtzjxdcahpceqkvbd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Supabase client created');

// Function to execute SQL to update RLS policies
async function updateRLSPolicies() {
  try {
    console.log('\n--- Updating RLS policies ---');
    
    // Enable RLS on inventory_items table
    const { data: enableRLS, error: enableRLSError } = await supabase.rpc('execute_sql', {
      sql_query: 'ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableRLSError) {
      console.error('Error enabling RLS on inventory_items table:', enableRLSError);
    } else {
      console.log('Successfully enabled RLS on inventory_items table');
    }
    
    // Drop existing policies to avoid conflicts
    const { data: dropPolicies, error: dropPoliciesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        DROP POLICY IF EXISTS "Allow public read access on inventory_items" ON inventory_items;
        DROP POLICY IF EXISTS "Allow authenticated insert access on inventory_items" ON inventory_items;
        DROP POLICY IF EXISTS "Allow authenticated update access on inventory_items" ON inventory_items;
        DROP POLICY IF EXISTS "Allow authenticated delete access on inventory_items" ON inventory_items;
      `
    });
    
    if (dropPoliciesError) {
      console.error('Error dropping existing policies:', dropPoliciesError);
    } else {
      console.log('Successfully dropped existing policies');
    }
    
    // Create new policies
    const { data: createPolicies, error: createPoliciesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE POLICY "Allow public read access on inventory_items"
        ON inventory_items FOR SELECT
        USING (true);
        
        CREATE POLICY "Allow authenticated insert access on inventory_items"
        ON inventory_items FOR INSERT
        TO authenticated
        WITH CHECK (true);
        
        CREATE POLICY "Allow authenticated update access on inventory_items"
        ON inventory_items FOR UPDATE
        TO authenticated
        USING (true);
        
        CREATE POLICY "Allow authenticated delete access on inventory_items"
        ON inventory_items FOR DELETE
        TO authenticated
        USING (true);
      `
    });
    
    if (createPoliciesError) {
      console.error('Error creating new policies:', createPoliciesError);
    } else {
      console.log('Successfully created new policies');
    }
    
  } catch (err) {
    console.error('Exception during RLS policy update:', err);
  }
}

// Run the update
updateRLSPolicies().catch(console.error);
