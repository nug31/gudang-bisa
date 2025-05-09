# Connecting Gudang Mitra to Supabase

This guide will help you connect your Gudang Mitra application to Supabase.

## Prerequisites

1. A Supabase account with a project set up
2. The Gudang Mitra application code
3. The database schema set up in Supabase (see SUPABASE_SETUP.md)

## Step 1: Verify Your Supabase Credentials

1. Check your `.env` file to make sure it contains the correct Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. You can find these values in the Supabase dashboard under "Settings" > "API"

## Step 2: Configure the Application to Use Supabase

1. Open the `supabase-server.js` file
2. Make sure the Supabase client is properly initialized:

```javascript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

3. Set `USE_MOCK_DB=false` in your `.env` file to use the real database

## Step 3: Test the Connection

1. Start the server:

```
npm run server:supabase
```

2. Start the frontend:

```
npm run dev
```

3. Open the application in your browser at http://localhost:5173
4. Try to log in with one of the default users:
   - Email: admin@gudangmitra.com
   - Password: password

## Step 4: Verify Database Operations

1. Try to perform various operations in the application:
   - Create a new user
   - Create a new inventory request
   - Approve or reject a request
   - Add a comment to a request

2. Check the Supabase dashboard to verify that the data is being stored correctly:
   - Go to the "Table Editor" in the Supabase dashboard
   - Select the relevant table
   - Verify that the data appears as expected

## Troubleshooting

### Connection Issues

If you're having trouble connecting to Supabase:

1. Check that your Supabase project is active
2. Verify that your credentials in the `.env` file are correct
3. Check the browser console and server logs for error messages
4. Make sure your IP address is not blocked by Supabase

### Authentication Issues

If you're having trouble with authentication:

1. Make sure the users table is set up correctly
2. Check that the password hashing is working correctly
3. Verify that the login route is using the correct Supabase client

### Data Issues

If you're having trouble with data operations:

1. Check the SQL schema to make sure the tables are set up correctly
2. Verify that the Row Level Security (RLS) policies are set up correctly
3. Check the server logs for error messages
4. Try running the queries directly in the Supabase SQL editor to see if they work

## Advanced Configuration

### Custom Claims and Roles

To set up custom claims and roles for your users:

1. Go to the "Authentication" > "Policies" section in the Supabase dashboard
2. Create a new policy for each role
3. Update the application code to check for these roles

### Storage for Images

To set up storage for user avatars and inventory item images:

1. Go to the "Storage" section in the Supabase dashboard
2. Create buckets for "avatars" and "items"
3. Set the appropriate permissions for each bucket
4. Update the application code to use the Supabase storage client

## Next Steps

After successfully connecting to Supabase, you can:

1. Add more features to the application
2. Customize the database schema to fit your specific needs
3. Set up additional security measures
4. Deploy the application to production

Remember to update your environment variables when deploying to production!
