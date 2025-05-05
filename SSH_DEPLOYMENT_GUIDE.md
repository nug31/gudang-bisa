# Deploying to CloudPanel via SSH

This guide will walk you through the process of deploying your Gudang Mitra application to CloudPanel using SSH.

## Prerequisites

1. SSH access to your CloudPanel server
2. Node.js and npm installed on your local machine
3. The deployment package created using `npm run deploy-to-cloudpanel`

## Option 1: Automated Deployment (Recommended)

We've created an automated deployment script that will handle the entire process for you.

### Step 1: Run the Deployment Script

```bash
npm run deploy-ssh
```

This script will:

1. Build your application
2. Create a deployment package if it doesn't exist
3. Upload the files to your CloudPanel server via SSH
4. Install dependencies on the server
5. Test the database connection
6. Start the application

### Step 2: Enter Your SSH Password

When prompted, enter your SSH password. If you're using SSH keys, you can press Enter to skip this step.

### Step 3: Verify the Deployment

Once the deployment is complete, visit your domain (gudangmitra.nugjourney.com) in a web browser to verify that the application is running correctly.

## Option 2: Manual Deployment (Alternative)

If the automated script doesn't work for any reason, you can use the shell script or follow these manual steps.

### Using the Shell Script

```bash
chmod +x deploy-ssh.sh
./deploy-ssh.sh
```

### Manual Steps

1. **Build your application**:

   ```bash
   npm run build
   ```

2. **Create a deployment package**:

   ```bash
   npm run deploy-to-cloudpanel
   ```

3. **Create the remote directory** (if it doesn't exist):

   ```bash
   ssh gudangmitra@145.79.11.48 "mkdir -p /home/gudangmitra/htdocs/gudangmitra.nugjourney.com"
   ```

4. **Upload the files** using rsync or scp:

   ```bash
   # Using rsync (recommended)
   rsync -avz --progress ./deploy/ gudangmitra@145.79.11.48:/home/gudangmitra/htdocs/gudangmitra.nugjourney.com/

   # Or using scp
   scp -r ./deploy/* gudangmitra@145.79.11.48:/home/gudangmitra/htdocs/gudangmitra.nugjourney.com/
   ```

5. **Install dependencies** on the remote server:

   ```bash
   ssh gudangmitra@145.79.11.48 "cd /home/gudangmitra/htdocs/gudangmitra.nugjourney.com && npm install --production"
   ```

6. **Test the database connection**:

   ```bash
   ssh gudangmitra@145.79.11.48 "cd /home/gudangmitra/htdocs/gudangmitra.nugjourney.com && node server-test.js"
   ```

7. **Start the application**:
   ```bash
   ssh gudangmitra@145.79.11.48 "cd /home/gudangmitra/htdocs/gudangmitra.nugjourney.com && pm2 start server.js --name gudang-mitra"
   ```

## CloudPanel Configuration

After deploying your application, you need to configure CloudPanel to proxy requests to your Node.js application.

### Step 1: Configure Nginx in CloudPanel

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

### Step 2: Set Up Process Management (Optional)

For better reliability, you can use PM2 to manage your Node.js application:

```bash
# Install PM2 globally
ssh gudangmitra@145.79.11.48 "npm install -g pm2"

# Start your application with PM2
ssh gudangmitra@145.79.11.48 "cd /home/gudangmitra/htdocs/gudangmitra.nugjourney.com && pm2 start server.js --name gudang-mitra"

# Set PM2 to start on system boot
ssh gudangmitra@145.79.11.48 "pm2 startup && pm2 save"
```

## Troubleshooting

If you encounter any issues during deployment:

1. **SSH Connection Issues**:

   - Verify that you can connect to the server: `ssh gudangmitra@145.79.11.48`
   - Check that your SSH credentials are correct

2. **File Upload Issues**:

   - Make sure you have the necessary permissions to write to the destination directory
   - Try using scp instead of rsync: `scp -r ./deploy/* gudangmitra@145.79.11.48:/home/gudangmitra/htdocs/gudangmitra.nugjourney.com/`

3. **Database Connection Issues**:

   - Verify that your database credentials are correct in the `.env` file
   - Check that the database user has the necessary permissions
   - Run the database test script on the server: `node server-test.js`

4. **Application Startup Issues**:

   - Check the application logs: `pm2 logs gudang-mitra` or look in the CloudPanel logs
   - Verify that all dependencies are installed correctly
   - Make sure the server.js file exists and is executable

5. **Nginx Configuration Issues**:
   - Check the Nginx error logs in CloudPanel
   - Verify that the proxy settings are correct
   - Make sure the Node.js application is running on the specified port

## Updating Your Application

To update your application after making changes:

1. Make your changes locally
2. Run the deployment script again: `npm run deploy-ssh`
3. The script will handle building, uploading, and restarting your application
