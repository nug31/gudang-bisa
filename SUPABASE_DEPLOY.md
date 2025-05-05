# Deploying Gudang Mitra with Supabase

This guide will walk you through the process of deploying the Gudang Mitra application using Supabase as the database backend.

## Prerequisites

1. A [Supabase](https://supabase.com) account and project
2. Node.js and npm installed on your local machine
3. Your local MySQL database is running and accessible (for data migration)

## Step 1: Set Up Environment Variables

Ensure your `.env` file contains both your MySQL and Supabase credentials:

```
# MySQL Configuration (for migration)
DB_HOST=localhost
DB_USER=u343415529_itemtrack
DB_PASSWORD=Reddevils94_
DB_NAME=u343415529_itemtrack
DB_PORT=3306

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jwrhtzjxdcahpceqkvbd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cmh0emp4ZGNhaHBjZXFrdmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTQ3NzcsImV4cCI6MjA2MjAzMDc3N30.3ihqV2D7BlJhBtL5BPwgf_8CzAN19w604mBwRGPihsQ

# Application Configuration
PORT=3001
USE_MOCK_DB=false
```

## Step 2: Test Supabase Connection

Before proceeding with the deployment, test your connection to Supabase:

```bash
npm run test-supabase
```

This script will verify that your Supabase credentials are correct and that you can connect to your Supabase project.

## Step 3: Initialize Supabase Schema

Set up the database schema in your Supabase project:

```bash
npm run init-supabase
```

This script will create all the necessary tables in your Supabase project and set up Row Level Security (RLS) policies to control access to your data.

## Step 4: Migrate Data from MySQL to Supabase

Transfer your existing data from MySQL to Supabase:

```bash
npm run migrate-to-supabase
```

This script will:
1. Connect to your local MySQL database
2. Extract all data from the relevant tables
3. Transform the data to match Supabase's PostgreSQL format
4. Insert the data into your Supabase project
5. Create backup files of all migrated data in a `backup` directory

## Step 5: Test the Application with Supabase

Run the application using Supabase as the database backend:

```bash
npm run start:supabase
```

This will start the application with the Supabase-enabled server. Test all functionality to ensure everything works correctly with Supabase.

## Step 6: Deploy the Application

Prepare the application for deployment:

```bash
npm run deploy-with-supabase
```

This script will:
1. Test the Supabase connection
2. Initialize the Supabase schema (if not already done)
3. Migrate data from MySQL to Supabase (if not already done)
4. Build the application
5. Create a deployment directory with all necessary files
6. Configure the application to use Supabase in production

After running this script, you'll have a `deploy` directory containing everything needed to deploy your application.

## Step 7: Upload to Your Hosting Provider

Upload the contents of the `deploy` directory to your hosting provider. If you're using Hostinger:

1. Connect to your Hostinger account via SSH or FTP
2. Upload the contents of the `deploy` directory to your desired location
3. Install dependencies with `npm install`
4. Start the server with `npm start`

## Step 8: Configure Domain and SSL

1. In your Hostinger control panel, go to "Domains" and select your domain (gudangmitra.nugjourney.com)
2. Set up DNS records to point to your server
3. Enable SSL for your domain

## Troubleshooting

### Database Connection Issues

If you encounter issues connecting to Supabase:

1. Verify your Supabase URL and anon key in the `.env` file
2. Check that your Supabase project is active
3. Ensure your IP address is not blocked by Supabase

### Data Migration Issues

If you encounter issues during data migration:

1. Check the error messages in the console
2. Verify that your MySQL database schema matches what the migration script expects
3. Check the backup files in the `backup` directory to see what data was extracted

### Deployment Issues

If you encounter issues during deployment:

1. Check the server logs for error messages
2. Verify that all environment variables are correctly set
3. Ensure that the server has the necessary permissions to run the application

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Hostinger Documentation](https://www.hostinger.com/tutorials)
- [Node.js Deployment Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
