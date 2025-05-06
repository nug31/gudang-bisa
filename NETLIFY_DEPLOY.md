# Deploying Gudang Mitra to Netlify with Neon Database

This guide will walk you through the process of deploying the Gudang Mitra application to Netlify with Neon as the PostgreSQL database backend.

## Prerequisites

1. A [Netlify](https://netlify.com) account
2. A [Neon](https://neon.tech) account
3. Git installed on your local machine

## Step 1: Set up Neon Database

1. Create a new Neon project from the [Neon dashboard](https://console.neon.tech)
2. Create a new database or use the default `neondb`
3. Note your connection string (you'll need this later)
4. Run the SQL migration script in the Neon SQL editor:

   - Navigate to the SQL Editor in your Neon dashboard
   - Copy the contents of `scripts/init-neon.js` or use the provided script to initialize the Neon schema:

   ```bash
   npm run init:neon
   ```

5. If you have existing data in another database, you can migrate it to Neon:
   ```bash
   # For MySQL data
   npm run migrate-to-neon
   ```

## Step 2: Create an Admin User in Neon

1. Connect to your Neon database using the SQL Editor
2. Run the following query to create an admin user:
   ```sql
   INSERT INTO users (id, name, email, password, role, department)
   VALUES (
     gen_random_uuid(),
     'Admin',
     'admin@example.com',
     '$2a$10$JwRH.hMRVBRgFjD1Vl/w3OQjgvoGsUo1JaHXRpVJQQpEpszMJSJTK', -- password: 'password'
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
   - `NEON_CONNECTION_STRING`: Your Neon database connection string
   - `JWT_SECRET`: A secure random string for JWT token generation
   - `VITE_API_URL`: Your Netlify site URL (e.g., `https://your-site-name.netlify.app`)
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
   netlify env:set NEON_CONNECTION_STRING your-neon-connection-string
   netlify env:set JWT_SECRET your-jwt-secret
   netlify env:set VITE_API_URL https://your-site-name.netlify.app
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
2. Verify that your Neon connection string is correctly set as `NEON_CONNECTION_STRING`
3. Make sure the Neon database is set up correctly and accessible
4. Test the database connection by visiting `/.netlify/functions/db/test`

### CORS Issues

If you're experiencing CORS issues:

1. Check that the CORS headers are correctly set in the functions
2. Make sure your frontend is making requests to the correct URL

### Authentication Issues

If you're having trouble with authentication:

1. Check that the user exists in the users table in your Neon database
2. Verify that the user has the correct role assigned
3. Try resetting the password by updating the password hash in the database
4. Make sure the JWT_SECRET environment variable is correctly set
