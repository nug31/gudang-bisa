/**
 * Gudang Mitra Deployment Helper Script
 * 
 * This script helps prepare the application for deployment to Netlify.
 * It checks for required files and dependencies, and provides guidance on deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Gudang Mitra Deployment Helper');
console.log('==============================\n');

// Check if netlify.toml exists
console.log('Checking for netlify.toml...');
if (fs.existsSync('netlify.toml')) {
  console.log('✅ netlify.toml found');
} else {
  console.error('❌ netlify.toml not found. Please create this file for Netlify configuration.');
  process.exit(1);
}

// Check if netlify/functions directory exists
console.log('\nChecking for netlify/functions directory...');
if (fs.existsSync('netlify/functions')) {
  console.log('✅ netlify/functions directory found');
} else {
  console.error('❌ netlify/functions directory not found. Please create this directory for Netlify functions.');
  process.exit(1);
}

// Check for required Netlify functions
console.log('\nChecking for required Netlify functions...');
const requiredFunctions = [
  'neon-auth.js',
  'neon-users.js',
  'neon-inventory.js',
  'neon-categories.js',
  'neon-requests.js',
  'init-neon-db.js',
];

const missingFunctions = [];
for (const func of requiredFunctions) {
  const funcPath = path.join('netlify/functions', func);
  if (fs.existsSync(funcPath)) {
    console.log(`✅ ${func} found`);
  } else {
    console.error(`❌ ${func} not found`);
    missingFunctions.push(func);
  }
}

if (missingFunctions.length > 0) {
  console.error('\n❌ Some required functions are missing. Please create these files before deployment.');
  process.exit(1);
}

// Check for required dependencies in netlify/functions/package.json
console.log('\nChecking for required dependencies in netlify/functions/package.json...');
let functionsPackageJson;
try {
  functionsPackageJson = JSON.parse(fs.readFileSync('netlify/functions/package.json', 'utf8'));
  console.log('✅ netlify/functions/package.json found');
} catch (error) {
  console.error('❌ netlify/functions/package.json not found or invalid. Please create this file.');
  process.exit(1);
}

const requiredDependencies = ['pg', 'bcryptjs', 'uuid'];
const missingDependencies = [];

for (const dep of requiredDependencies) {
  if (functionsPackageJson.dependencies && functionsPackageJson.dependencies[dep]) {
    console.log(`✅ ${dep} dependency found`);
  } else {
    console.error(`❌ ${dep} dependency not found`);
    missingDependencies.push(dep);
  }
}

if (missingDependencies.length > 0) {
  console.error('\n❌ Some required dependencies are missing in netlify/functions/package.json.');
  console.log('\nPlease add the following dependencies:');
  for (const dep of missingDependencies) {
    console.log(`  - ${dep}`);
  }
  console.log('\nYou can add them by running:');
  console.log(`cd netlify/functions && npm install ${missingDependencies.join(' ')} --save`);
  process.exit(1);
}

// Check for .env file with NEON_CONNECTION_STRING
console.log('\nChecking for .env file with NEON_CONNECTION_STRING...');
let hasNeonConnectionString = false;
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('NEON_CONNECTION_STRING=')) {
    console.log('✅ NEON_CONNECTION_STRING found in .env file');
    hasNeonConnectionString = true;
  } else {
    console.warn('⚠️ NEON_CONNECTION_STRING not found in .env file');
  }
} catch (error) {
  console.warn('⚠️ .env file not found');
}

if (!hasNeonConnectionString) {
  console.log('\n⚠️ NEON_CONNECTION_STRING not found in .env file.');
  console.log('You will need to add this environment variable in the Netlify dashboard.');
  console.log('Format: postgresql://username:password@hostname/database?sslmode=require');
}

// Check for build script in package.json
console.log('\nChecking for build script in package.json...');
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ build script found in package.json');
  } else {
    console.error('❌ build script not found in package.json');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ package.json not found or invalid');
  process.exit(1);
}

// Check for GitHub repository
console.log('\nChecking for GitHub repository...');
try {
  const gitConfig = fs.readFileSync('.git/config', 'utf8');
  if (gitConfig.includes('github.com')) {
    console.log('✅ GitHub repository found');
  } else {
    console.warn('⚠️ GitHub repository not found or not using GitHub');
  }
} catch (error) {
  console.warn('⚠️ Git repository not found');
}

// Check if there are uncommitted changes
console.log('\nChecking for uncommitted changes...');
try {
  const status = execSync('git status --porcelain').toString();
  if (status.trim() === '') {
    console.log('✅ No uncommitted changes');
  } else {
    console.warn('⚠️ There are uncommitted changes:');
    console.log(status);
  }
} catch (error) {
  console.warn('⚠️ Unable to check git status');
}

// Final instructions
console.log('\n==============================');
console.log('Deployment Checklist Complete!');
console.log('==============================\n');

console.log('To deploy to Netlify:');
console.log('1. Commit and push your changes to GitHub');
console.log('2. Log in to your Netlify account');
console.log('3. Click "Add new site" > "Import an existing project"');
console.log('4. Connect to your GitHub repository');
console.log('5. Configure the build settings:');
console.log('   - Build command: npm run build');
console.log('   - Publish directory: dist');
console.log('6. Add the following environment variables:');
console.log('   - NEON_CONNECTION_STRING: Your Neon PostgreSQL connection string');
console.log('7. Click "Deploy site"');
console.log('\nAfter deployment:');
console.log('1. Initialize the database by visiting your-site-url/neon/init-db');
console.log('2. Test the application by logging in with:');
console.log('   - Email: admin@gudangmitra.com');
console.log('   - Password: admin123');
console.log('\nFor more detailed instructions, see the DEPLOY.md file.');

console.log('\nGood luck with your deployment! 🚀');
