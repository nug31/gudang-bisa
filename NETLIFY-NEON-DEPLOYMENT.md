# Deploying Gudang Mitra to Netlify with Neon PostgreSQL

This guide explains how to deploy the Gudang Mitra application to Netlify using Neon PostgreSQL as the database.

## Prerequisites

1. A Netlify account
2. A Neon PostgreSQL database
3. Node.js and npm installed locally
4. Git installed locally

## Deployment Steps

### 1. Switch to Neon PostgreSQL Configuration

First, switch the application to use Neon PostgreSQL instead of Supabase:

```bash
npm run switch-to-neon
```

This will update the configuration to use Neon PostgreSQL.

### 2. Update Environment Variables

Create a `.env` file with your Neon PostgreSQL connection string:

```
NEON_CONNECTION_STRING=postgresql://neondb_owner:password@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require
```

Replace the connection string with your actual Neon PostgreSQL connection string.

### 3. Build and Deploy to Netlify

Run the deployment script:

```bash
npm run deploy-netlify-with-neon
```

This script will:

- Build the application
- Install Netlify CLI if needed
- **Automatically set the environment variables in Netlify** (using your .env file)
- Deploy the application to Netlify

The environment variables will be automatically set in Netlify using the values from your `.env` file. You don't need to manually configure them in the Netlify dashboard.

### 4. Verify the Deployment

1. Visit your Netlify site URL
2. Test the login functionality
3. Test the categories and inventory management

## Setting Environment Variables Manually (Alternative)

If you prefer to set the environment variables manually:

```bash
npm run set-netlify-env
```

This will set the environment variables in Netlify using the values from your `.env` file.

## Troubleshooting

### Connection Issues

If you experience connection issues:

1. Check that your Neon PostgreSQL connection string is correct
2. Ensure that your Neon database is accessible from Netlify (no IP restrictions)
3. Check the Netlify function logs for any errors

### Function Errors

If Netlify functions are not working:

1. Check the Netlify function logs
2. Verify that the functions are properly deployed
3. Make sure the redirects in `netlify.toml` are correct

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Neon PostgreSQL Documentation](https://neon.tech/docs/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
