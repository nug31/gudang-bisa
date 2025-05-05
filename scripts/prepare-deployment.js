import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

async function prepareDeployment() {
  try {
    console.log('Preparing deployment package...');
    
    // Step 1: Build the application
    console.log('\n🔨 Step 1: Building the application...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Application built successfully.');
    } catch (error) {
      console.error('❌ Application build failed.');
      process.exit(1);
    }
    
    // Step 2: Create deployment directory
    console.log('\n📁 Step 2: Creating deployment directory...');
    const deployDir = path.join(process.cwd(), 'deploy');
    try {
      await fs.mkdir(deployDir, { recursive: true });
      console.log(`✅ Deployment directory created at ${deployDir}`);
    } catch (error) {
      console.error('❌ Failed to create deployment directory:', error);
      process.exit(1);
    }
    
    // Step 3: Copy build files to deployment directory
    console.log('\n📋 Step 3: Copying build files to deployment directory...');
    try {
      // Copy dist folder
      await copyDirectory(path.join(process.cwd(), 'dist'), path.join(deployDir, 'dist'));
      
      // Copy server files
      await fs.copyFile(path.join(process.cwd(), 'supabase-server.js'), path.join(deployDir, 'server.js'));
      
      // Copy package.json and create a simplified version
      const packageJson = JSON.parse(await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8'));
      const deployPackageJson = {
        name: packageJson.name,
        version: packageJson.version,
        type: packageJson.type,
        scripts: {
          start: 'node server.js'
        },
        dependencies: {
          '@supabase/supabase-js': packageJson.dependencies['@supabase/supabase-js'],
          'bcryptjs': packageJson.dependencies.bcryptjs,
          'cors': packageJson.dependencies.cors,
          'dotenv': packageJson.dependencies.dotenv,
          'express': packageJson.dependencies.express,
          'uuid': packageJson.dependencies.uuid
        }
      };
      
      await fs.writeFile(
        path.join(deployDir, 'package.json'),
        JSON.stringify(deployPackageJson, null, 2)
      );
      
      // Create .env file for deployment
      const envContent = `
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Application Configuration
PORT=3001
NODE_ENV=production
`;
      
      await fs.writeFile(path.join(deployDir, '.env'), envContent);
      
      // Copy src/db/supabase.js
      await fs.mkdir(path.join(deployDir, 'src', 'db'), { recursive: true });
      await fs.copyFile(
        path.join(process.cwd(), 'src', 'db', 'supabase.js'),
        path.join(deployDir, 'src', 'db', 'supabase.js')
      );
      
      // Create README.md with deployment instructions
      const readmeContent = `# Gudang Mitra Deployment

This package contains the Gudang Mitra application ready for deployment.

## Deployment Instructions

1. Upload all files to your hosting provider
2. Install dependencies with \`npm install\`
3. Start the server with \`npm start\`

## Environment Variables

The following environment variables are required:

- \`NEXT_PUBLIC_SUPABASE_URL\`: The URL of your Supabase project
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: The anonymous key for your Supabase project
- \`PORT\`: The port to run the server on (default: 3001)

## Troubleshooting

If you encounter any issues, please check the server logs for error messages.
`;
      
      await fs.writeFile(path.join(deployDir, 'README.md'), readmeContent);
      
      console.log('✅ Files copied to deployment directory successfully.');
    } catch (error) {
      console.error('❌ Failed to copy files to deployment directory:', error);
      process.exit(1);
    }
    
    console.log('\n🎉 Deployment preparation completed successfully!');
    console.log(`\nYour application is ready for deployment in the '${deployDir}' directory.`);
    console.log('\nTo deploy to your hosting provider:');
    console.log('1. Upload the contents of the deploy directory to your server');
    console.log('2. Install dependencies with: npm install');
    console.log('3. Start the server with: npm start');
    
  } catch (error) {
    console.error('Deployment preparation failed:', error);
    process.exit(1);
  }
}

// Helper function to copy a directory recursively
async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Run the deployment preparation
prepareDeployment().catch(error => {
  console.error('Deployment preparation failed:', error);
  process.exit(1);
});
