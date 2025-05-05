import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEPLOY_DIR = path.join(__dirname, 'hostinger-deploy');
const DIST_DIR = path.join(__dirname, 'dist');

async function prepareDeployment() {
  try {
    console.log('Preparing deployment for Hostinger...');
    
    // Create deployment directory
    console.log('Creating deployment directory...');
    await fs.mkdir(DEPLOY_DIR, { recursive: true });
    
    // Copy server.js
    console.log('Copying server.js...');
    await fs.copyFile(
      path.join(__dirname, 'server.js'),
      path.join(DEPLOY_DIR, 'server.js')
    );
    
    // Copy package.json
    console.log('Copying package.json...');
    const packageJson = JSON.parse(
      await fs.readFile(path.join(__dirname, 'package.json'), 'utf8')
    );
    
    // Create simplified package.json for production
    const prodPackage = {
      name: packageJson.name,
      version: packageJson.version,
      type: packageJson.type,
      scripts: {
        start: 'node server.js'
      },
      dependencies: {
        'bcryptjs': packageJson.dependencies['bcryptjs'],
        'body-parser': packageJson.dependencies['body-parser'],
        'cors': packageJson.dependencies['cors'],
        'dotenv': packageJson.dependencies['dotenv'],
        'express': packageJson.dependencies['express'],
        'mysql2': packageJson.dependencies['mysql2'],
        'uuid': packageJson.dependencies['uuid']
      }
    };
    
    await fs.writeFile(
      path.join(DEPLOY_DIR, 'package.json'),
      JSON.stringify(prodPackage, null, 2)
    );
    
    // Create .env file for Hostinger
    console.log('Creating .env file...');
    const envContent = `DB_HOST=localhost
DB_USER=u343415529_itemtrack
DB_PASSWORD=Reddevils94_
DB_NAME=u343415529_itemtrack
DB_PORT=3306
USE_MOCK_DB=false
PORT=3001`;
    
    await fs.writeFile(path.join(DEPLOY_DIR, '.env'), envContent);
    
    // Copy mock-db.js
    console.log('Copying mock-db.js...');
    const mockDbDir = path.join(DEPLOY_DIR, 'src', 'db');
    await fs.mkdir(mockDbDir, { recursive: true });
    
    try {
      await fs.copyFile(
        path.join(__dirname, 'src', 'db', 'mock-db.js'),
        path.join(mockDbDir, 'mock-db.js')
      );
    } catch (error) {
      console.error('Error copying mock-db.js:', error.message);
    }
    
    // Copy dist directory
    console.log('Copying dist directory...');
    const publicDir = path.join(DEPLOY_DIR, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    // Copy all files from dist to public
    const distFiles = await fs.readdir(DIST_DIR);
    for (const file of distFiles) {
      const srcPath = path.join(DIST_DIR, file);
      const destPath = path.join(publicDir, file);
      
      const stats = await fs.stat(srcPath);
      if (stats.isDirectory()) {
        // Copy directory recursively
        await copyDir(srcPath, destPath);
      } else {
        // Copy file
        await fs.copyFile(srcPath, destPath);
      }
    }
    
    // Create README with deployment instructions
    console.log('Creating README...');
    const readmeContent = `# Gudang Mitra Deployment for Hostinger

## Deployment Instructions

1. Upload all files in this directory to your Hostinger hosting account
2. Install Node.js dependencies: \`npm install\`
3. Start the server: \`npm start\`

## Database Setup

The application is configured to connect to the following database:
- Host: localhost
- Database: u343415529_itemtrack
- User: u343415529_itemtrack
- Password: Reddevils94_

Make sure this database exists on your Hostinger account.

## Troubleshooting

If you encounter any issues:
1. Check the server logs
2. Verify database connection settings in the .env file
3. Make sure all dependencies are installed correctly
`;
    
    await fs.writeFile(path.join(DEPLOY_DIR, 'README.md'), readmeContent);
    
    console.log('Deployment preparation complete!');
    console.log(`Files are ready in the '${DEPLOY_DIR}' directory.`);
    console.log('Upload these files to your Hostinger hosting account to complete the deployment.');
    
  } catch (error) {
    console.error('Error preparing deployment:', error);
  }
}

// Helper function to copy directories recursively
async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

prepareDeployment();
