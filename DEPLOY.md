# Gudang Mitra Deployment Guide

This guide will help you deploy the Gudang Mitra application to Netlify with a Neon PostgreSQL database.

## Prerequisites

1. A GitHub account
2. A Netlify account
3. A Neon PostgreSQL database

## Step 1: Prepare Your Repository

1. Make sure your code is committed to a GitHub repository
2. Ensure your repository includes the following files:
   - `netlify.toml` (for Netlify configuration)
   - `netlify/functions/` directory with all the serverless functions

## Step 2: Set Up Neon PostgreSQL Database

1. Log in to your Neon account at https://console.neon.tech/
2. Create a new project if you don't have one already
3. Get your connection string from the Neon dashboard
   - It should look like: `postgresql://neondb_owner:password@ep-example-id.region.aws.neon.tech/neondb?sslmode=require`
4. Make sure your database has the necessary tables:
   - `users`
   - `inventory_items`
   - `categories`
   - `requests`

If you need to initialize your database, you can use the `/neon/init-db` endpoint after deployment.

## Step 3: Deploy to Netlify

1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Connect to your GitHub repository
4. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add the following environment variables:
   - `NEON_CONNECTION_STRING`: Your Neon PostgreSQL connection string
6. Click "Deploy site"

## Step 4: Configure Domain (Optional)

1. In your Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Enter your domain name (e.g., gudangmitra.nugjourney.com)
4. Follow the instructions to configure your DNS settings

## Step 5: Initialize the Database

After deployment, you need to initialize the database with the necessary tables and sample data:

1. Visit your deployed site's URL with the path `/neon/init-db`
   - For example: `https://your-netlify-site.netlify.app/neon/init-db`
2. This will create the necessary tables and add sample data

## Step 6: Test the Deployment

1. Visit your deployed site's URL
2. Try logging in with the following credentials:
   - Email: admin@gudangmitra.com
   - Password: admin123
3. Test the following features:
   - User management
   - Inventory management
   - Request management

## Troubleshooting

If you encounter any issues during deployment, check the following:

1. Netlify function logs:
   - Go to your Netlify dashboard > Functions
   - Click on a function to view its logs

2. Environment variables:
   - Make sure the `NEON_CONNECTION_STRING` is correctly set

3. Database connection:
   - Test the database connection by visiting `/neon/test`
   - This will show if the connection to the Neon database is working

4. Database initialization:
   - If you're having issues with missing tables, try visiting `/neon/init-db` again

## Updating the Deployment

When you make changes to your code:

1. Commit and push your changes to GitHub
2. Netlify will automatically detect the changes and redeploy your site

If you need to update environment variables:

1. Go to your Netlify dashboard > Site settings > Environment variables
2. Update the variables as needed

## Monitoring

To monitor your application:

1. Check the Netlify dashboard for site status and function invocations
2. Check the Neon dashboard for database performance and usage

## Backup and Recovery

To backup your Neon database:

1. Log in to your Neon account
2. Go to your project
3. Use the backup feature to create a backup of your database

To restore from a backup:

1. Log in to your Neon account
2. Go to your project
3. Use the restore feature to restore from a backup

## Security Considerations

1. Keep your Neon connection string secure
2. Use environment variables for sensitive information
3. Consider adding authentication to your Netlify functions
4. Regularly update dependencies to fix security vulnerabilities

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Neon Documentation](https://neon.tech/docs/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Neon PostgreSQL](https://neon.tech/docs/connect/connect-from-any-app)
