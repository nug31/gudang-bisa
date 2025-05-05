#!/bin/bash

# CloudPanel SSH Deployment Script
# This script deploys your application to CloudPanel via SSH

# Configuration - Update these values with your CloudPanel information
SSH_HOST="145.79.11.48"
SSH_USER="gudangmitra"
SITE_DIRECTORY="/home/gudangmitra/htdocs/gudangmitra.nugjourney.com"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment to CloudPanel via SSH...${NC}"

# Step 1: Build the application
echo -e "\n${GREEN}📦 Building the application...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed. Aborting deployment.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Build completed successfully.${NC}"

# Step 2: Check if the deploy directory exists
if [ ! -d "./deploy" ]; then
  echo -e "${YELLOW}❌ Deploy directory not found. Creating deployment package...${NC}"
  node scripts/deploy-to-cloudpanel.js
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create deployment package. Aborting deployment.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Deployment package created successfully.${NC}"
fi

# Step 3: Create the remote directory if it doesn't exist
echo -e "\n${GREEN}📁 Creating remote directory...${NC}"
ssh ${SSH_USER}@${SSH_HOST} "mkdir -p ${SITE_DIRECTORY}" || {
  echo -e "${YELLOW}⚠️ Error creating remote directory. Continuing with deployment...${NC}"
}

# Step 4: Upload files using rsync
echo -e "\n${GREEN}📤 Uploading files to CloudPanel...${NC}"
echo -e "${YELLOW}This may take a few minutes depending on your connection speed...${NC}"

rsync -avz --progress ./deploy/ ${SSH_USER}@${SSH_HOST}:${SITE_DIRECTORY}/ || {
  echo -e "${RED}❌ Rsync failed. Trying scp instead...${NC}"
  scp -r ./deploy/* ${SSH_USER}@${SSH_HOST}:${SITE_DIRECTORY}/ || {
    echo -e "${RED}❌ Error uploading files. Please check your SSH credentials and try again.${NC}"
    exit 1
  }
}
echo -e "${GREEN}✅ Files uploaded successfully.${NC}"

# Step 5: Install dependencies on the remote server
echo -e "\n${GREEN}📦 Installing dependencies on the remote server...${NC}"
ssh ${SSH_USER}@${SSH_HOST} "cd ${SITE_DIRECTORY} && npm install --production" || {
  echo -e "${YELLOW}⚠️ Error installing dependencies. You may need to install dependencies manually on the server.${NC}"
}

# Step 6: Test the database connection
echo -e "\n${GREEN}🔍 Testing database connection on the remote server...${NC}"
ssh ${SSH_USER}@${SSH_HOST} "cd ${SITE_DIRECTORY} && node server-test.js" || {
  echo -e "${YELLOW}⚠️ Error testing database connection. You may need to check your database configuration.${NC}"
}

# Step 7: Start the application
echo -e "\n${GREEN}🚀 Starting the application...${NC}"
ssh ${SSH_USER}@${SSH_HOST} "cd ${SITE_DIRECTORY} && (pm2 start server.js --name gudang-mitra || node server.js &)" || {
  echo -e "${YELLOW}⚠️ Error starting the application. You may need to start the application manually on the server.${NC}"
}

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application should now be running at: http://gudangmitra.nugjourney.com${NC}"
echo -e "\nIf you encounter any issues:"
echo -e "1. Check the application logs on the server"
echo -e "2. Verify that the database connection is working"
echo -e "3. Make sure the Node.js application is running"
echo -e "4. Check the Nginx configuration in CloudPanel"
