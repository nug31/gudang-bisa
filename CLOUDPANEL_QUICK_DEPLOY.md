# Quick Deployment Guide for CloudPanel

This guide will help you deploy your Gudang Mitra application to CloudPanel using the deployment package that was just created.

## Step 1: Upload Files to CloudPanel

1. Connect to your CloudPanel server using SFTP or SSH
2. Navigate to your site's directory (typically `/home/cloudpanel/htdocs/gudang.nugjourney.com`)
3. Upload all files from the `deploy` directory to this location

## Step 2: Install Dependencies and Start the Application

1. Connect to your CloudPanel server using SSH:
   ```bash
   ssh gudang@145.79.11.48
   ```

2. Navigate to your site's directory:
   ```bash
   cd /home/cloudpanel/htdocs/gudang.nugjourney.com
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the application:
   ```bash
   node server.js
   ```

## Step 3: Set Up Node.js Application in CloudPanel

1. In CloudPanel, go to "Sites" > Your Site > "Node.js"
2. Click "Add Application"
3. Fill in the following details:
   - Name: Gudang Mitra
   - Domain: gudang.nugjourney.com
   - Path: / (or the path where you uploaded the files)
   - Port: 8080 (or the port specified in your .env file)
   - Node.js Version: 18.x or higher
   - Start Command: `node server.js`
4. Click "Add" to set up the Node.js application

## Step 4: Configure Nginx Proxy

CloudPanel uses Nginx as its web server. You'll need to configure it to proxy requests to your Node.js application.

1. In CloudPanel, go to "Sites" > Your Site > "Vhost"
2. Add the following configuration to the Nginx vhost file:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location /db/ {
    proxy_pass http://127.0.0.1:8080;
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

3. Save the configuration and restart Nginx

## Step 5: Test Your Deployment

1. Visit your domain (gudang.nugjourney.com) in a web browser
2. Try logging in with your credentials
3. Verify that the application is working correctly with the CloudPanel database

## Troubleshooting

If you encounter any issues:

1. Check the Node.js application logs in CloudPanel
2. Verify that the database connection is working
3. Make sure the Nginx configuration is correct
4. Check that all dependencies are installed correctly

For more detailed instructions, refer to the `CLOUDPANEL_DEPLOY.md` file.
