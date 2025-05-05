# Gudang Mitra Deployment Package for Hostinger

## Deployment Instructions

1. Upload all files in this directory to your Hostinger hosting account
2. Set up a MySQL database on Hostinger
3. Update the .env.production file with your Hostinger database credentials
4. Install Node.js dependencies: `npm install --production`
5. Start the server: `node hostinger-server.js`

## Important Notes

- Make sure Node.js is supported on your Hostinger plan
- Configure your domain to point to this application
- Set up proper file permissions on the server
- For security, make sure your .env.production file is not publicly accessible

## Troubleshooting

If you encounter any issues:
1. Check the server logs
2. Verify database connection settings
3. Make sure all dependencies are installed correctly
4. Contact Hostinger support if Node.js applications are supported on your plan
