# Gudang Mitra Deployment Guide for Hostinger

This guide will walk you through the process of deploying the Gudang Mitra application to Hostinger.

## Prerequisites

- A Hostinger account with Node.js support (Premium or Business plan recommended)
- Access to Hostinger's MySQL database service
- FTP client (like FileZilla) or SSH access to upload files

## Step 1: Prepare Your Application

1. Build the application:
   ```
   npm run build
   ```

2. Create a deployment package:
   ```
   node scripts/deploy-to-hostinger.js
   ```
   This will create a `deploy-hostinger` directory with all the necessary files.

## Step 2: Set Up Database on Hostinger

1. Log in to your Hostinger control panel
2. Navigate to the MySQL Databases section
3. Create a new database (e.g., `gudang_mitra`)
4. Create a database user and assign it to the database
5. Note down the database credentials:
   - Database Host (usually localhost)
   - Database Name
   - Database Username
   - Database Password

6. Import the database schema:
   - Download phpMyAdmin from Hostinger control panel
   - Import the `scripts/hostinger-db-setup.sql` file

## Step 3: Configure Environment Variables

1. Open the `.env.production` file in the `deploy-hostinger` directory
2. Update the database connection details:
   ```
   DB_HOST=your_hostinger_db_host
   DB_USER=your_hostinger_db_username
   DB_PASSWORD=your_hostinger_db_password
   DB_NAME=your_hostinger_db_name
   DB_PORT=3306
   USE_MOCK_DB=false
   PORT=3001
   ```

## Step 4: Upload Files to Hostinger

### Using FTP:
1. Connect to your Hostinger account using an FTP client
2. Navigate to the public_html directory (or a subdirectory if you want to deploy to a specific path)
3. Upload all files from the `deploy-hostinger` directory

### Using SSH (if available):
1. Connect to your Hostinger account using SSH
2. Navigate to the public_html directory
3. Upload files using SCP or rsync:
   ```
   scp -r ./deploy-hostinger/* your_username@your_hostinger_server:/path/to/public_html/
   ```

## Step 5: Install Dependencies on Hostinger

1. Connect to your Hostinger account using SSH (if available)
2. Navigate to your application directory
3. Install production dependencies:
   ```
   npm install --production
   ```

## Step 6: Configure Node.js Application

1. In Hostinger control panel, navigate to the Node.js section
2. Set up a new Node.js application:
   - Application path: path to your uploaded files
   - Entry point: `hostinger-server.js`
   - Node.js version: Select the latest stable version

## Step 7: Set Up Domain and SSL

1. In Hostinger control panel, set up your domain to point to the Node.js application
2. Enable SSL for secure HTTPS connections

## Step 8: Test the Deployment

1. Visit your domain in a web browser
2. Test the application functionality
3. Check the database connection by logging in with the default admin credentials:
   - Email: admin@example.com
   - Password: password

## Troubleshooting

If you encounter issues:

1. Check the Node.js application logs in Hostinger control panel
2. Test the database connection:
   ```
   node test-db-connection.js
   ```
3. Make sure all file permissions are set correctly
4. Verify that your Hostinger plan supports Node.js applications
5. Contact Hostinger support if you continue to experience issues

## Security Considerations

1. Change the default admin password immediately after deployment
2. Protect your `.env.production` file from public access
3. Consider setting up a firewall and other security measures
4. Regularly update your application dependencies

## Maintenance

1. To update your application, repeat the build and deployment process
2. Consider setting up a CI/CD pipeline for automated deployments
3. Regularly back up your database

For additional help, refer to Hostinger's documentation or contact their support team.
