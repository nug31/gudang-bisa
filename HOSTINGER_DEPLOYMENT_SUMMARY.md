# Gudang Mitra Deployment to Hostinger

## Deployment Package

The deployment package for Hostinger is located in the `hostinger-deploy` directory. This package contains:

1. **Server Files**:
   - `server.js` - The main server file
   - `package.json` - Dependencies and scripts
   - `.env` - Environment variables with Hostinger database credentials
   - `deploy.js` - Script to copy built files to the public directory

2. **Database Setup**:
   - `setup-database.sql` - SQL script to create tables and initial data

3. **Frontend Files**:
   - `public/index.html` - A placeholder HTML file
   - The built React application should be copied to the `public` directory

4. **Documentation**:
   - `DEPLOY_INSTRUCTIONS.md` - Detailed deployment instructions
   - `README.md` - General information about the application

## Deployment Steps

1. **Database Setup**:
   - Create a MySQL database on Hostinger named `u343415529_itemtrack`
   - Create a user with the same name and password `Reddevils94_`
   - Import the `setup-database.sql` file to create tables and initial data

2. **Upload Files**:
   - Upload all files from the `hostinger-deploy` directory to your Hostinger hosting account
   - You can use FTP or the Hostinger File Manager

3. **Build and Copy Frontend**:
   - Run `npm run build` locally to build the React application
   - Copy the contents of the `dist` directory to the `public` directory on the server
   - Alternatively, run `node deploy.js` on the server after uploading the built files

4. **Install Dependencies**:
   - Connect to your Hostinger account using SSH
   - Navigate to the application directory
   - Run `npm install` to install dependencies

5. **Configure Node.js Application**:
   - Set up a Node.js application in the Hostinger control panel
   - Point it to your application directory
   - Set the startup file to `server.js`

6. **Start the Application**:
   - Start the Node.js application from the Hostinger control panel
   - Visit your domain to verify that the application is running

## Database Credentials

The application is configured to connect to the following database:
- Host: localhost
- Database: u343415529_itemtrack
- User: u343415529_itemtrack
- Password: Reddevils94_

## Default Login

After deployment, you can log in with the following credentials:
- Email: admin@example.com
- Password: password

Make sure to change this password after your first login for security reasons.
