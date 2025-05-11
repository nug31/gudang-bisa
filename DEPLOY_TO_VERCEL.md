# Deploying Gudang Mitra to Vercel

This guide provides step-by-step instructions for deploying the Gudang Mitra application to Vercel while using your existing Neon PostgreSQL database.

## Prerequisites

- Your GitHub repository (https://github.com/nug31/gudang-bisa.git)
- A Vercel account (free tier is sufficient)
- Your Neon database connection string

## Step 1: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and choose to sign up with GitHub
3. Complete the authentication process

## Step 2: Import Your GitHub Repository

1. Once logged in to Vercel, click "Add New" > "Project"
2. Connect your GitHub account if not already connected
3. Find and select your repository: `nug31/gudang-bisa`
4. Vercel will automatically detect that it's a Vite project

## Step 3: Configure Project Settings

1. **Framework Preset**: Verify that Vercel has detected "Vite" as the framework
2. **Project Name**: You can keep the default name or change it (e.g., "gudang-mitra")
3. **Root Directory**: Keep as `.` (the project root)
4. **Build and Output Settings**: These should be automatically configured based on your vercel.json file

## Step 4: Configure Environment Variables

1. Expand the "Environment Variables" section
2. Add the following environment variable:
   - **Name**: `NEON_CONNECTION_STRING`
   - **Value**: `postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
   - **Environments**: Select all environments (Production, Preview, Development)

## Step 5: Deploy

1. Click "Deploy"
2. Vercel will start the deployment process, which includes:
   - Cloning your repository
   - Installing dependencies
   - Building your application
   - Deploying to Vercel's global network

3. Once deployment is complete, you'll see a success message and a link to your deployed application

## Step 6: Verify the Deployment

1. Click on the deployment URL to open your application
2. Log in to your application
3. Navigate to the Database Test page to verify the connection to your Neon database
4. Check the Item Requests Test page to verify that item requests are being retrieved correctly

## Step 7: Set Up Custom Domain (Optional)

1. In your Vercel project dashboard, go to "Settings" > "Domains"
2. Add your custom domain (e.g., gudangmitra.nugjourney.com)
3. Follow the instructions to configure DNS settings

## Troubleshooting

If you encounter any issues with the deployment:

### Database Connection Issues

1. Check the Vercel environment variables to ensure the NEON_CONNECTION_STRING is set correctly
2. Use the Database Test page in your application to verify the connection
3. Check the Vercel deployment logs for any database-related errors

### API Route Issues

1. Check the Vercel Function Logs in your project dashboard
2. Verify that the API routes are correctly configured in your vercel.json file
3. Test the API routes locally using the test script (scripts/test-vercel-api.js)

### Build Errors

1. Check the Vercel build logs for any errors
2. Verify that your package.json has the correct build commands
3. Test the build process locally with `npm run build`

## Continuous Deployment

Vercel automatically deploys your application whenever you push changes to your GitHub repository. To deploy updates:

1. Make changes to your code
2. Commit and push to GitHub
3. Vercel will automatically detect the changes and deploy a new version

## Monitoring and Analytics

Vercel provides built-in analytics and monitoring tools:

1. Go to your project dashboard
2. Click on "Analytics" to view performance metrics
3. Click on "Logs" to view application logs

## Conclusion

Your Gudang Mitra application should now be successfully deployed on Vercel, connected to your Neon PostgreSQL database. The application should be faster and more reliable than the previous Netlify deployment, especially when it comes to database connections.

If you need to make any changes to the deployment configuration, you can update the vercel.json file in your repository and push the changes to GitHub.
