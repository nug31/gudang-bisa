#!/bin/bash

# This script uploads the necessary files to your server
# Usage: ./upload-to-server.sh [server_ip] [username]

SERVER_IP=${1:-"145.79.11.48"}
USERNAME=${2:-"gudangmitra"}
REMOTE_DIR="/htdocs/gudangmitra.nugjourney.com"

echo "Uploading files to ${USERNAME}@${SERVER_IP}:${REMOTE_DIR}..."

# Upload server files
scp server-with-static.js ${USERNAME}@${SERVER_IP}:${REMOTE_DIR}/
scp start-server.sh ${USERNAME}@${SERVER_IP}:${REMOTE_DIR}/
scp .env ${USERNAME}@${SERVER_IP}:${REMOTE_DIR}/

# Make the start script executable
ssh ${USERNAME}@${SERVER_IP} "chmod +x ${REMOTE_DIR}/start-server.sh"

echo "Files uploaded successfully!"
echo "To start the server, run:"
echo "  ssh ${USERNAME}@${SERVER_IP}"
echo "  cd ${REMOTE_DIR}"
echo "  ./start-server.sh"
