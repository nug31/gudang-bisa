# Executing the SQL Schema in Supabase

This guide provides step-by-step instructions on how to execute the SQL schema in your Supabase project.

## Step 1: Access the SQL Editor

1. Log in to your Supabase account
2. Select your project from the dashboard
3. In the left sidebar, click on "SQL Editor"

![SQL Editor in Supabase](https://supabase.com/docs/img/guides/sql-editor.png)

## Step 2: Create a New Query

1. Click on the "New Query" button in the top right corner
2. Give your query a name, such as "Gudang Mitra Schema Setup"

## Step 3: Copy and Paste the SQL Schema

1. Open the `supabase-schema.sql` file from your project
2. Copy all the contents of the file
3. Paste the SQL into the query editor in Supabase

## Step 4: Execute the SQL

1. Click the "Run" button to execute the SQL
2. Wait for the query to complete
3. Check for any error messages in the output

## Step 5: Verify the Schema

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

## Step 6: Test the Authentication

1. Go to the "Authentication" section in the left sidebar
2. Click on "Users"
3. You should see the default users that were created:
   - admin@gudangmitra.com (Admin User)
   - manager@gudangmitra.com (Manager User)
   - user@gudangmitra.com (Regular User)

## Step 7: Update Your Application's Environment Variables

1. Go to the "Settings" section in the left sidebar
2. Click on "API"
3. Copy the "Project URL" and "anon/public" key
4. Update your application's `.env` file with these values:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Error: Relation Already Exists

If you see an error like "relation already exists", it means that the table already exists in your database. You can either:

1. Drop the existing tables first (be careful, this will delete all data):
   ```sql
   DROP TABLE IF EXISTS notifications;
   DROP TABLE IF EXISTS comments;
   DROP TABLE IF EXISTS item_requests;
   DROP TABLE IF EXISTS inventory_items;
   DROP TABLE IF EXISTS categories;
   DROP TABLE IF EXISTS users;
   ```

2. Or modify the SQL to use `IF NOT EXISTS` (which is already included in the provided schema)

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
