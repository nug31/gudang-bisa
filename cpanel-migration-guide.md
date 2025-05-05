# Database Migration Guide for cPanel

This guide will help you migrate your database to cPanel.

## Prerequisites

1. cPanel access credentials
2. MySQL database created in cPanel
3. MySQL user created in cPanel with appropriate permissions

## Step 1: Download the Database Backup

The database schema has been exported to `database_backup.sql`. Download this file to your local computer.

## Step 2: Import the Database into cPanel

1. Log in to your cPanel account
2. Navigate to the "MySQL Databases" section
3. Scroll down to the "Current Databases" section
4. Find your database and click on "phpMyAdmin"
5. In phpMyAdmin, select your database from the left sidebar
6. Click on the "Import" tab at the top
7. Click "Choose File" and select the `database_backup.sql` file you downloaded
8. Click "Go" to start the import process

## Step 3: Update Your Application Configuration

After successfully importing the database, update your application's `.env` file with the new database connection details:

```
DB_HOST=your-cpanel-mysql-host
DB_USER=your-cpanel-mysql-username
DB_PASSWORD=your-cpanel-mysql-password
DB_NAME=your-cpanel-mysql-database-name
```

Replace the placeholders with your actual cPanel MySQL credentials.

## Step 4: Test Your Application

After updating the configuration, test your application to ensure it can connect to the database and function properly.

## Troubleshooting

If you encounter any issues during the migration process:

1. Check that your cPanel MySQL user has all necessary permissions
2. Verify that your database connection details are correct
3. Check the cPanel error logs for any database-related errors
4. Ensure that your application's IP address is allowed to connect to the cPanel MySQL server

## Additional Notes

- The database schema includes tables for users, categories, item_requests, comments, and notifications
- The schema uses InnoDB engine and includes foreign key constraints
- Make sure your cPanel MySQL server supports these features
