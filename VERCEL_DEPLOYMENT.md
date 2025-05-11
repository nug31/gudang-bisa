# Deploying Gudang Mitra to Vercel

This guide explains how to deploy the Gudang Mitra application to Vercel while continuing to use your existing Neon PostgreSQL database.

## Prerequisites

- A GitHub account
- A Vercel account (you can sign up at [vercel.com](https://vercel.com) using your GitHub account)
- Your existing Neon PostgreSQL database

## Deployment Steps

### 1. Push Your Code to GitHub

Make sure your latest code is pushed to your GitHub repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import Your Project to Vercel

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Select your GitHub repository (gudang-bisa)
4. Vercel will automatically detect that it's a Vite project

### 3. Configure Environment Variables

1. In the Vercel project settings, go to the "Environment Variables" section
2. Add the following environment variable:
   - Name: `NEON_CONNECTION_STRING`
   - Value: `postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

### 4. Deploy Your Project

1. Click "Deploy"
2. Vercel will build and deploy your application
3. Once deployment is complete, you'll receive a URL for your application (e.g., gudang-mitra.vercel.app)

## Verifying the Deployment

1. Visit your deployed application URL
2. Log in to the application
3. Go to the Database Test page to verify the connection to your Neon database
4. Check the Item Requests Test page to verify that item requests are being retrieved correctly

## Troubleshooting

If you encounter any issues with the deployment:

1. Check the Vercel deployment logs for errors
2. Verify that the environment variables are set correctly
3. Test the database connection using the Database Test page
4. Check the browser console for any JavaScript errors

## Benefits of Vercel Deployment

- **Better Database Connection Handling**: Vercel's serverless functions have better connection pooling
- **Faster Cold Starts**: Vercel functions typically have faster cold start times
- **Edge Network**: Your application is served from Vercel's global edge network
- **Automatic HTTPS**: Vercel provides automatic HTTPS certificates
- **Preview Deployments**: Each pull request gets its own preview deployment

## Switching Back to Netlify

If you need to switch back to Netlify for any reason:

1. Make sure your Netlify site is still configured
2. Push any changes to your GitHub repository
3. Netlify will automatically deploy the changes

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
