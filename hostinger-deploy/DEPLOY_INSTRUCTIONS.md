# Gudang Mitra Deployment Instructions for Hostinger

This guide will walk you through the process of deploying the Gudang Mitra application to Hostinger.

## Prerequisites

1. A Hostinger hosting account with:
   - Node.js support
   - MySQL database
   - SSH access (recommended)

2. Your database credentials:
   - Database name: `u343415529_itemtrack`
   - Database user: `u343415529_itemtrack`
   - Database password: `Reddevils94_`

## Step 1: Set Up the Database

1. Log in to your Hostinger control panel
2. Navigate to the MySQL Databases section
3. Create a new database named `u343415529_itemtrack` if it doesn't already exist
4. Create a new user named `u343415529_itemtrack` with password `Reddevils94_` if it doesn't already exist
5. Assign all privileges to the user for the database
6. Import the `setup-database.sql` file to create the necessary tables and initial data

## Step 2: Upload the Application Files

### Option 1: Using FTP

1. Connect to your Hostinger account using an FTP client (like FileZilla)
2. Navigate to the directory where you want to deploy the application (e.g., `public_html/gudang-mitra`)
3. Upload all files from this directory to the server

### Option 2: Using the Hostinger File Manager

1. Log in to your Hostinger control panel
2. Navigate to the File Manager
3. Go to the directory where you want to deploy the application
4. Upload all files from this directory

## Step 3: Install Dependencies

1. Connect to your Hostinger account using SSH:
   ```
   ssh u343415529@your-hostinger-domain.com
   ```

2. Navigate to your application directory:
   ```
   cd public_html/gudang-mitra
   ```

3. Install the required Node.js dependencies:
   ```
   npm install
   ```

## Step 4: Run the Deployment Script

1. Run the deployment script to copy the built files to the public directory:
   ```
   node deploy.js
   ```

## Step 5: Configure Node.js Application

1. In your Hostinger control panel, navigate to the Node.js section
2. Create a new Node.js application with the following settings:
   - Application name: Gudang Mitra
   - Node.js version: 18.x or higher
   - Application root: The directory where you uploaded the files
   - Application URL: Your domain or subdomain
   - Application startup file: server.js
   - Environment: Production

## Step 6: Start the Application

1. Start the Node.js application from the Hostinger control panel
2. Visit your domain to verify that the application is running correctly

## Troubleshooting

If you encounter any issues:

1. Check the Node.js application logs in the Hostinger control panel
2. Verify that the database connection is working by checking the server logs
3. Make sure all the required files were uploaded correctly
4. Ensure that the .env file has the correct database credentials

## Default Login

After deployment, you can log in with the following credentials:
- Email: admin@example.com
- Password: password

Make sure to change this password after your first login for security reasons.
