import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
config();

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployWithNeon() {
  console.log('Starting deployment with Neon...');
  
  try {
    // 1. Build the application
    console.log('Building the application...');
    await execPromise('npm run build');
    console.log('Application built successfully.');
    
    // 2. Create a deployment directory
    const deployDir = path.resolve(__dirname, '..', 'deploy');
    try {
      await fs.mkdir(deployDir, { recursive: true });
    } catch (error) {
      console.log('Deploy directory already exists.');
    }
    
    // 3. Copy necessary files to the deployment directory
    console.log('Copying files to deployment directory...');
    
    // Copy dist folder
    await execPromise(`cp -r ${path.resolve(__dirname, '..', 'dist')} ${deployDir}`);
    
    // Copy server file
    await fs.copyFile(
      path.resolve(__dirname, '..', 'neon-server.js'),
      path.resolve(deployDir, 'server.js')
    );
    
    // Copy package.json and modify it
    const packageJson = JSON.parse(
      await fs.readFile(path.resolve(__dirname, '..', 'package.json'), 'utf8')
    );
    
    // Simplify package.json for deployment
    const deployPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      type: packageJson.type,
      scripts: {
        start: 'node server.js'
      },
      dependencies: {
        express: packageJson.dependencies.express,
        pg: packageJson.dependencies.pg,
        bcryptjs: packageJson.dependencies.bcryptjs,
        cors: packageJson.dependencies.cors,
        'body-parser': packageJson.dependencies['body-parser'],
        dotenv: packageJson.dependencies.dotenv,
        uuid: packageJson.dependencies.uuid
      }
    };
    
    await fs.writeFile(
      path.resolve(deployDir, 'package.json'),
      JSON.stringify(deployPackageJson, null, 2)
    );
    
    // Create a sample .env file for deployment
    const envContent = `
# Neon Configuration
NEON_CONNECTION_STRING=postgres://your-username:your-password@your-endpoint/neondb
PORT=3001
    `.trim();
    
    await fs.writeFile(path.resolve(deployDir, '.env.example'), envContent);
    
    // Create a README file with deployment instructions
    const readmeContent = `
# Gudang Mitra Deployment

This is a deployment package for the Gudang Mitra application with Neon.

## Deployment Instructions

1. Upload all files to your server
2. Install dependencies: \`npm install\`
3. Copy \`.env.example\` to \`.env\` and update with your Neon connection string
4. Start the server: \`npm start\`

## Environment Variables

Make sure to set the following environment variables in your .env file:

- NEON_CONNECTION_STRING: Your Neon connection string (format: postgres://username:password@endpoint/neondb)
- PORT: The port to run the server on (default: 3001)

## Database Setup

Before running the application, make sure to initialize your Neon database by running:

\`\`\`
node scripts/init-neon.js
\`\`\`

This will create all the necessary tables and default data.

## Deploying to Vercel, Netlify, or Railway

For serverless platforms like Vercel, Netlify, or Railway:

1. Connect your repository to the platform
2. Set the build command to \`npm run build\`
3. Set the output directory to \`dist\`
4. Set the environment variables (NEON_CONNECTION_STRING)
5. Deploy!

## Neon Database Features

Neon offers several unique features that can benefit your application:

1. **Serverless Architecture**: Scales to zero when not in use, saving costs
2. **Branching**: Create database branches for development and testing
3. **Auto-scaling**: Automatically scales with your application's needs
4. **Point-in-time Recovery**: Restore your database to any point in time
5. **PostgreSQL Compatibility**: Full compatibility with PostgreSQL

For more information, visit [Neon's documentation](https://neon.tech/docs).
    `.trim();
    
    await fs.writeFile(path.resolve(deployDir, 'README.md'), readmeContent);
    
    // Copy the initialization script
    await fs.mkdir(path.resolve(deployDir, 'scripts'), { recursive: true });
    await fs.copyFile(
      path.resolve(__dirname, 'init-neon.js'),
      path.resolve(deployDir, 'scripts', 'init-neon.js')
    );
    
    console.log('Deployment package created successfully!');
    console.log(`Deployment files are available in: ${deployDir}`);
    console.log('You can now upload these files to your hosting provider.');
    
  } catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
  }
}

// Run the deployment
deployWithNeon().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
