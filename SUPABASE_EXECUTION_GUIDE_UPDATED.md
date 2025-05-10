# Updated Guide for Executing the SQL Schema in Supabase

This guide provides step-by-step instructions on how to execute the updated SQL schema in your Supabase project, which now handles existing policies.

## Step 1: Access the SQL Editor

1. Log in to your Supabase account
2. Select your project from the dashboard
3. In the left sidebar, click on "SQL Editor"

## Step 2: Create a New Query

1. Click on the "New Query" button in the top right corner
2. Give your query a name, such as "Gudang Mitra Schema Setup"

## Step 3: Copy and Paste the SQL Schema

1. Open the `supabase-schema.sql` file from your project
2. Copy all the contents of the file
3. Paste the SQL into the query editor in Supabase

## Step 4: Review the SQL Script

Before executing the script, review it to understand what it does:

1. The script first enables the UUID extension if it's not already enabled
2. It has commented-out DROP TABLE statements that you can uncomment if you want to start fresh
3. It creates all the necessary tables with IF NOT EXISTS clauses
4. It inserts default data (categories, users, and sample inventory items)
5. It enables Row Level Security (RLS) on all tables
6. It drops any existing policies to avoid conflicts
7. It creates new policies for each table

## Step 5: Decide Whether to Start Fresh

If you want to start with a clean database:

1. Uncomment the DROP TABLE statements at the beginning of the script:
   ```sql
   DROP TABLE IF EXISTS notifications;
   DROP TABLE IF EXISTS comments;
   DROP TABLE IF EXISTS item_requests;
   DROP TABLE IF EXISTS inventory_items;
   DROP TABLE IF EXISTS categories;
   DROP TABLE IF EXISTS users;
   ```

2. Be aware that this will delete all existing data in these tables

If you want to keep your existing data:

1. Leave the DROP TABLE statements commented out
2. The script will only create tables that don't already exist
3. It will drop and recreate all policies to ensure they are up to date

## Step 6: Execute the SQL

1. Click the "Run" button to execute the SQL
2. Wait for the query to complete
3. Check for any error messages in the output

## Step 7: Verify the Schema

After executing the SQL, verify that the schema was created correctly:

1. Go to the "Table Editor" in the left sidebar
2. You should see the following tables:
   - users
   - categories
   - inventory_items
   - item_requests
   - comments
   - notifications

3. Click on each table to verify that the columns were created correctly
4. Check that the default data was inserted correctly

## Step 8: Verify the Policies

1. Go to the "Authentication" section in the left sidebar
2. Click on "Policies"
3. You should see policies for each table:
   - users: 4 policies (select, insert, update, delete)
   - categories: 4 policies (select, insert, update, delete)
   - inventory_items: 4 policies (select, insert, update, delete)
   - item_requests: 4 policies (select, insert, update, delete)
   - comments: 4 policies (select, insert, update, delete)
   - notifications: 4 policies (select, insert, update, delete)

## Step 9: Test the Authentication

1. Go to the "Authentication" section in the left sidebar
2. Click on "Users"
3. You should see the default users that were created:
   - admin@gudangmitra.com (Admin User)
   - manager@gudangmitra.com (Manager User)
   - user@gudangmitra.com (Regular User)

## Troubleshooting

### Error: Relation Already Exists

This error should not occur with the updated script, as it uses IF NOT EXISTS clauses for all table creations.

### Error: Policy Already Exists

This error should not occur with the updated script, as it drops all existing policies before creating new ones.

### Error: Permission Denied

If you see a permission error, make sure you're using the correct Supabase credentials and that your user has the necessary permissions.

### Error: Foreign Key Constraint

If you see a foreign key constraint error, make sure you're creating the tables in the correct order. The provided schema creates the tables in the correct order.

## Next Steps

After successfully setting up the schema, you can:

1. Test your application with the new database
2. Add more data to the tables
3. Customize the schema to fit your specific needs

Remember to update your application's environment variables to use the new Supabase project.
