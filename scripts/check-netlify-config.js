import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkNetlifyConfig() {
  console.log('Checking Netlify configuration...');
  
  // Check netlify.toml
  try {
    const netlifyTomlPath = path.resolve(__dirname, '..', 'netlify.toml');
    const netlifyToml = await fs.readFile(netlifyTomlPath, 'utf8');
    console.log('✅ netlify.toml exists');
    
    // Check for functions directory
    if (netlifyToml.includes('functions = "netlify/functions"')) {
      console.log('✅ Functions directory correctly configured in netlify.toml');
    } else {
      console.log('❌ Functions directory not correctly configured in netlify.toml');
      console.log('Add the following to netlify.toml:');
      console.log('[functions]');
      console.log('  directory = "netlify/functions"');
    }
    
    // Check for redirects
    if (netlifyToml.includes('[[redirects]]') && 
        netlifyToml.includes('from = "/db/inventory"') && 
        netlifyToml.includes('to = "/.netlify/functions/neon-inventory"')) {
      console.log('✅ Redirects for database functions correctly configured');
    } else {
      console.log('❌ Redirects for database functions not correctly configured');
      console.log('Make sure you have the following redirects in netlify.toml:');
      console.log('[[redirects]]');
      console.log('  from = "/db/inventory"');
      console.log('  to = "/.netlify/functions/neon-inventory"');
      console.log('  status = 200');
    }
  } catch (error) {
    console.error('❌ netlify.toml not found or cannot be read:', error.message);
  }
  
  // Check Netlify functions
  try {
    const functionsDir = path.resolve(__dirname, '..', 'netlify', 'functions');
    const files = await fs.readdir(functionsDir);
    
    console.log(`✅ Netlify functions directory exists with ${files.length} files`);
    
    // Check for neon-inventory.js
    if (files.includes('neon-inventory.js')) {
      console.log('✅ neon-inventory.js function exists');
      
      // Check content of neon-inventory.js
      const neonInventoryPath = path.resolve(functionsDir, 'neon-inventory.js');
      const neonInventory = await fs.readFile(neonInventoryPath, 'utf8');
      
      if (neonInventory.includes('process.env.NEON_CONNECTION_STRING')) {
        console.log('✅ neon-inventory.js uses environment variable for connection string');
      } else {
        console.log('❌ neon-inventory.js does not use environment variable for connection string');
      }
    } else {
      console.log('❌ neon-inventory.js function does not exist');
    }
    
    // Check for neon-client.js
    if (files.includes('neon-client.js')) {
      console.log('✅ neon-client.js exists');
      
      // Check content of neon-client.js
      const neonClientPath = path.resolve(functionsDir, 'neon-client.js');
      const neonClient = await fs.readFile(neonClientPath, 'utf8');
      
      if (neonClient.includes('process.env.NEON_CONNECTION_STRING')) {
        console.log('✅ neon-client.js uses environment variable for connection string');
      } else {
        console.log('❌ neon-client.js does not use environment variable for connection string');
      }
      
      // Check for fallback mechanism
      if (neonClient.includes('getMockInventoryItems')) {
        console.log('✅ neon-client.js has fallback mechanism for database connection issues');
      } else {
        console.log('❌ neon-client.js does not have fallback mechanism for database connection issues');
      }
    } else {
      console.log('❌ neon-client.js does not exist');
    }
  } catch (error) {
    console.error('❌ Netlify functions directory not found or cannot be read:', error.message);
  }
  
  console.log('\nRecommendations:');
  console.log('1. Make sure NEON_CONNECTION_STRING is set in Netlify environment variables');
  console.log('2. Ensure all redirects are properly configured in netlify.toml');
  console.log('3. Verify that neon-client.js and neon-inventory.js use process.env.NEON_CONNECTION_STRING');
  console.log('4. After making changes, redeploy your site to Netlify');
}

// Run the check
checkNetlifyConfig().catch(error => {
  console.error('Error checking Netlify configuration:', error);
});
