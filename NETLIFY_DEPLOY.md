# Deploying Gudang Mitra to Netlify with Supabase

This guide will walk you through the process of deploying the Gudang Mitra application to Netlify with Supabase as the database backend.

## Prerequisites

1. A [Netlify](https://netlify.com) account
2. A [Supabase](https://supabase.com) account
3. Git installed on your local machine

## Step 1: Set up Supabase

1. Create a new Supabase project from the [Supabase dashboard](https://app.supabase.com)
2. Note your project URL and anon key (you'll need these later)
3. Run the SQL migration script in the Supabase SQL editor:

   - Navigate to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/migrations/20250501074543_vercel_deployment.sql`
   - Paste it into the SQL editor and run it

   Alternatively, you can use the provided script to initialize the Supabase schema:

   ```bash
   npm run init-supabase
   ```

4. If you have existing data in your MySQL database, you can migrate it to Supabase:
   ```bash
   npm run migrate-to-supabase
   ```

## Step 2: Create an Admin User in Supabase

1. Go to the Authentication section in your Supabase dashboard
2. Click on "Users" and then "Add User"
3. Create a user with the following details:
   - Email: admin@example.com
   - Password: password
4. Go to the SQL Editor and run the following query to make this user an admin:
   ```sql
   INSERT INTO users (id, name, email, role, department)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
     'Admin',
     'admin@example.com',
     'admin',
     'Management'
   );
   ```

## Step 3: Deploy to Netlify

### Option 1: Deploy from the Netlify Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to the [Netlify dashboard](https://app.netlify.com/start)
3. Click "Import from Git" and select your repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy site"

### Option 2: Deploy using Netlify CLI

1. Install the Netlify CLI:

   ```
   npm install -g netlify-cli
   ```

2. Log in to Netlify:

   ```
   netlify login
   ```

3. Initialize your site:

   ```
   netlify init
   ```

4. Set up environment variables:

   ```
   netlify env:set NEXT_PUBLIC_SUPABASE_URL your-supabase-url
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY your-supabase-anon-key
   ```

5. Deploy your site:
   ```
   netlify deploy --prod
   ```

## Step 4: Update Frontend API Calls

Make sure your frontend code is using the correct API endpoints:

```javascript
// Old Node.js endpoint
fetch("http://localhost:3001/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

// New Netlify Functions endpoint
fetch("/.netlify/functions/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

With the redirects in the `netlify.toml` file, you can also use:

```javascript
fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

## Step 5: Test Your Deployment

1. Visit your Netlify site URL
2. Try logging in with the admin account:
   - Email: admin@example.com
   - Password: password
3. Test creating and managing inventory requests
4. Test user management functionality

## Troubleshooting

### Function Errors

If your functions are not working:

1. Check the Netlify function logs in the Netlify dashboard
2. Verify that your Supabase URL and anon key are correctly set as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Make sure the Supabase database is set up correctly
4. Test the Supabase connection by visiting `/.netlify/functions/test-supabase`

### CORS Issues

If you're experiencing CORS issues:

1. Check that the CORS headers are correctly set in the functions
2. Make sure your frontend is making requests to the correct URL

### Authentication Issues

If you're having trouble with authentication:

1. Check that the user exists in both Supabase Auth and the users table
2. Verify that the user has the correct role assigned
3. Try resetting the password in the Supabase dashboard
