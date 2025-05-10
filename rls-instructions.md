# How to Fix RLS Policies in Supabase

Follow these step-by-step instructions to fix the Row Level Security (RLS) policies in your Supabase database.

## Step 1: Log in to Supabase

1. Go to https://app.supabase.io/
2. Sign in with your credentials
3. Select your project with the URL: https://hvrhtzjxdcahpceqkvbd.supabase.co

## Step 2: Navigate to the Table Editor

1. In the left sidebar, click on "Table Editor"
2. You should see a list of tables in your database

## Step 3: Update RLS Policies for inventory_items Table

1. Click on the "inventory_items" table in the list
2. Click on the "Policies" tab (it should be near the top of the page)
3. You'll see a list of existing policies (if any)

### Step 3.1: Enable RLS (if not already enabled)

1. If you see a message saying "RLS is not enabled for this table", click the "Enable RLS" button
2. Confirm the action if prompted

### Step 3.2: Create SELECT Policy

1. Click on "New Policy" or "Add Policy" button
2. Select "SELECT" as the operation
3. For the policy name, enter: "Allow public read access on inventory_items"
4. For the policy definition, select "Using expression" and enter: `true`
5. Click "Save" or "Create Policy"

### Step 3.3: Create INSERT Policy

1. Click on "New Policy" or "Add Policy" button
2. Select "INSERT" as the operation
3. For the policy name, enter: "Allow authenticated insert access on inventory_items"
4. For the policy definition, select "With check expression" and enter: `true`
5. Click "Save" or "Create Policy"

### Step 3.4: Create UPDATE Policy

1. Click on "New Policy" or "Add Policy" button
2. Select "UPDATE" as the operation
3. For the policy name, enter: "Allow authenticated update access on inventory_items"
4. For the policy definition, select "Using expression" and enter: `true`
5. Click "Save" or "Create Policy"

### Step 3.5: Create DELETE Policy

1. Click on "New Policy" or "Add Policy" button
2. Select "DELETE" as the operation
3. For the policy name, enter: "Allow authenticated delete access on inventory_items"
4. For the policy definition, select "Using expression" and enter: `true`
5. Click "Save" or "Create Policy"

## Step 4: Repeat for Other Tables (if needed)

Repeat Step 3 for these tables if they exist in your database:
- categories
- item_requests
- users

## Step 5: Test the Application

1. Go back to your application
2. Try to add a new inventory item
3. Try to update an existing item
4. Try to delete an item
5. Refresh the page to verify that the changes persist

## Alternative: Using SQL Editor

If you prefer to use SQL commands, you can also use the SQL Editor in Supabase:

1. In the left sidebar, click on "SQL Editor"
2. Create a new query
3. Paste the following SQL code:

```sql
-- Enable RLS on inventory_items table
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated insert access on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated update access on inventory_items" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated delete access on inventory_items" ON inventory_items;

-- Create new policies
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
```

4. Click "Run" to execute the SQL commands

## Troubleshooting

If you're still having issues after updating the RLS policies, try these steps:

1. **Check for errors in the browser console**: Open your browser's developer tools (F12) and check the console for any error messages.

2. **Check the server logs**: Look for any error messages in your server logs.

3. **Verify the Supabase connection**: Make sure your application is correctly connecting to Supabase.

4. **Try using the service role key**: If all else fails, you can try using the service role key instead of the anon key. This will bypass RLS policies entirely, but it's not recommended for production use as it reduces security.

   To use the service role key:
   - Go to Project Settings > API in the Supabase dashboard
   - Copy the service role key
   - Update your .env file with the service role key
   - Restart your server
