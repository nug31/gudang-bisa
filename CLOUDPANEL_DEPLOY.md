# Deploying Gudang Mitra to CloudPanel

This guide will walk you through the process of deploying the Gudang Mitra application to a CloudPanel hosting account with a MySQL database.

## Prerequisites

1. A CloudPanel hosting account with:
   - Node.js support
   - MySQL database access
   - SSH access (recommended but not required)

2. Your database credentials (you'll create these in CloudPanel)

## Step 1: Set Up the Database in CloudPanel

1. Log in to your CloudPanel account
2. Navigate to "Databases" in the left sidebar
3. Click "Add Database" to create a new database
   - Enter a name for your database (e.g., `gudang_mitra`)
   - Choose MySQL as the database type
   - Set a strong password
   - Click "Add Database"
4. Note down the database name, username, and password

## Step 2: Prepare Your Application for Deployment

1. Update the deployment script with your CloudPanel information:
   - Open `scripts/deploy-to-cloudpanel.js`
   - Update the `CLOUDPANEL_USERNAME`, `CLOUDPANEL_DOMAIN`, and `DEPLOY_PATH` variables
   - Save the file

2. Run the deployment preparation script:
   ```bash
   node scripts/deploy-to-cloudpanel.js
   ```
   This will create a `deploy` directory with all the files needed for deployment.

3. Update the `.env` file in the `deploy` directory with your CloudPanel database credentials:
   ```
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   DB_PORT=3306
   USE_MOCK_DB=false
   PORT=8080
   ```

## Step 3: Initialize the Database Schema

1. In CloudPanel, go to the "Databases" section
2. Find your database and click on "phpMyAdmin" to access it
3. In phpMyAdmin, select your database from the left sidebar
4. Go to the "SQL" tab
5. Copy the contents of the `supabase/migrations/20250501074543_vercel_deployment.sql` file
6. Paste it into the SQL query box and click "Go" to execute

## Step 4: Upload Files to CloudPanel

### Option 1: Using SFTP

1. Use an SFTP client (like FileZilla) to connect to your CloudPanel server
2. Navigate to your site's directory (typically in `/home/cloudpanel/htdocs/your-domain.com`)
3. Upload all files from the `deploy` directory to this location

### Option 2: Using CloudPanel File Manager

1. In CloudPanel, go to "Sites" > Your Site > "Files"
2. Use the file manager to upload all files from the `deploy` directory

## Step 5: Set Up Node.js Application in CloudPanel

1. In CloudPanel, go to "Sites" > Your Site > "Node.js"
2. Click "Add Application"
3. Fill in the following details:
   - Name: Gudang Mitra
   - Domain: Your domain
   - Path: / (or the path where you uploaded the files)
   - Port: 8080 (or the port specified in your .env file)
   - Node.js Version: 18.x or higher
   - Start Command: `node server.js`
   - Environment Variables: (These should already be in your .env file)
4. Click "Add" to set up the Node.js application

## Step 6: Install Dependencies and Start the Application

1. Connect to your server via SSH:
   ```bash
   ssh username@your-server-ip
   ```

2. Navigate to your application directory:
   ```bash
   cd /home/cloudpanel/htdocs/your-domain.com
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the application (if not already started by CloudPanel):
   ```bash
   npm start
   ```

## Step 7: Configure Nginx Proxy

CloudPanel uses Nginx as its web server. You'll need to configure it to proxy requests to your Node.js application.

1. In CloudPanel, go to "Sites" > Your Site > "Vhost"
2. Add the following configuration to the Nginx vhost file:

```nginx
location /api/ {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location /db/ {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

3. Save the configuration and restart Nginx:
   ```bash
   sudo service nginx restart
   ```

## Step 8: Test Your Deployment

1. Visit your domain in a web browser
2. Try logging in with the default admin credentials:
   - Email: admin@gudangmitra.com
   - Password: admin123

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check that your database credentials are correct in the `.env` file
2. Verify that the database exists in CloudPanel
3. Make sure the database user has the necessary privileges
4. Check the Node.js application logs for any errors

### Node.js Application Issues

If the Node.js application doesn't start:

1. Check the application logs in CloudPanel
2. Make sure the Node.js version is compatible (18.x or higher)
3. Verify that all dependencies are installed correctly
4. Check that the `server.js` file exists in the correct location

### Nginx Configuration Issues

If you're having issues with the Nginx configuration:

1. Check the Nginx error logs in CloudPanel
2. Make sure the proxy settings are correct
3. Verify that the Node.js application is running on the specified port

## Additional Resources

- [CloudPanel Documentation](https://www.cloudpanel.io/docs/v2/)
- [Node.js on CloudPanel](https://www.cloudpanel.io/docs/v2/frontend-area/nodejs-apps/)
- [MySQL Database Management in CloudPanel](https://www.cloudpanel.io/docs/v2/frontend-area/databases/)
