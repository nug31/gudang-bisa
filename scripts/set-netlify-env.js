import { execSync } from 'child_process';
import { config } from 'dotenv';
import readline from 'readline';
import { stdin as input, stdout as output } from 'process';

// Load environment variables
config();

const rl = readline.createInterface({ input, output });

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setNetlifyEnv() {
  try {
    console.log('Setting Netlify environment variables...');
    
    // Check if Netlify CLI is installed
    try {
      execSync('netlify --version', { stdio: 'pipe' });
      console.log('✅ Netlify CLI is installed');
    } catch (error) {
      console.log('❌ Netlify CLI is not installed');
      console.log('Installing Netlify CLI...');
      try {
        execSync('npm install -g netlify-cli', { stdio: 'inherit' });
        console.log('✅ Netlify CLI installed successfully');
      } catch (installError) {
        console.error('❌ Failed to install Netlify CLI');
        console.log('Please install Netlify CLI manually: npm install -g netlify-cli');
        process.exit(1);
      }
    }
    
    // Check if user is logged in to Netlify
    try {
      execSync('netlify status', { stdio: 'pipe' });
      console.log('✅ Logged in to Netlify');
    } catch (error) {
      console.log('❌ Not logged in to Netlify');
      console.log('Please log in to Netlify:');
      execSync('netlify login', { stdio: 'inherit' });
    }
    
    // Get site ID
    let siteId;
    try {
      const siteData = execSync('netlify sites:current --json', { encoding: 'utf8' });
      const site = JSON.parse(siteData);
      siteId = site.id;
      console.log(`✅ Current site: ${site.name} (${siteId})`);
    } catch (error) {
      console.log('❌ Could not determine current site');
      const answer = await question('Do you want to select a site? (y/n): ');
      if (answer.toLowerCase() === 'y') {
        execSync('netlify sites:list', { stdio: 'inherit' });
        const siteIdInput = await question('Enter the site ID: ');
        siteId = siteIdInput.trim();
      } else {
        console.log('Exiting...');
        process.exit(0);
      }
    }
    
    // Get Neon connection string
    let neonConnectionString = process.env.NEON_CONNECTION_STRING;
    if (!neonConnectionString) {
      console.log('❌ NEON_CONNECTION_STRING not found in environment variables');
      neonConnectionString = await question('Enter your Neon connection string: ');
    } else {
      console.log('✅ NEON_CONNECTION_STRING found in environment variables');
      const confirm = await question('Use this connection string? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        neonConnectionString = await question('Enter your Neon connection string: ');
      }
    }
    
    // Set environment variables
    console.log('Setting environment variables in Netlify...');
    
    try {
      // Set NEON_CONNECTION_STRING
      execSync(`netlify env:set NEON_CONNECTION_STRING "${neonConnectionString}" --site-id ${siteId}`, { stdio: 'inherit' });
      console.log('✅ NEON_CONNECTION_STRING set successfully');
      
      // Set NODE_ENV
      execSync(`netlify env:set NODE_ENV "production" --site-id ${siteId}`, { stdio: 'inherit' });
      console.log('✅ NODE_ENV set to production');
      
      // Set USE_MOCK_DB
      execSync(`netlify env:set USE_MOCK_DB "false" --site-id ${siteId}`, { stdio: 'inherit' });
      console.log('✅ USE_MOCK_DB set to false');
      
      console.log('\n✅ All environment variables set successfully!');
      
      // Ask if user wants to trigger a new deployment
      const deployAnswer = await question('Do you want to trigger a new deployment? (y/n): ');
      if (deployAnswer.toLowerCase() === 'y') {
        console.log('Triggering new deployment...');
        execSync(`netlify deploy --prod --site-id ${siteId}`, { stdio: 'inherit' });
        console.log('✅ Deployment triggered successfully');
      }
    } catch (error) {
      console.error('❌ Failed to set environment variables:', error.message);
      console.log('Please set the following environment variables manually in the Netlify dashboard:');
      console.log('- NEON_CONNECTION_STRING');
      console.log('- NODE_ENV=production');
      console.log('- USE_MOCK_DB=false');
    }
  } catch (error) {
    console.error('Error setting Netlify environment variables:', error);
  } finally {
    rl.close();
  }
}

// Run the script
setNetlifyEnv().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
