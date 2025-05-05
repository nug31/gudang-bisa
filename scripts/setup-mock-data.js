import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run a command and return a promise
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function setupMockData() {
  try {
    console.log('Setting up mock data...');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'src', 'data');
    try {
      await fs.mkdir(dataDir, { recursive: true });
      console.log(`Created directory: ${dataDir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
    
    // Run the mock data generation script
    await runCommand('node scripts/generate-mock-data.js');
    
    // Check if the .env file exists and update it
    const envPath = path.join(__dirname, '..', '.env');
    try {
      let envContent = await fs.readFile(envPath, 'utf8');
      
      // Check if USE_MOCK_DB is already in the .env file
      if (envContent.includes('USE_MOCK_DB=')) {
        // Replace the existing value
        envContent = envContent.replace(/USE_MOCK_DB=(true|false)/, 'USE_MOCK_DB=true');
      } else {
        // Add the variable if it doesn't exist
        envContent += '\nUSE_MOCK_DB=true\n';
      }
      
      // Write the updated content back to the .env file
      await fs.writeFile(envPath, envContent);
      console.log('Updated .env file to use mock database');
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Create a new .env file if it doesn't exist
        await fs.writeFile(envPath, 'USE_MOCK_DB=true\n');
        console.log('Created new .env file with USE_MOCK_DB=true');
      } else {
        throw err;
      }
    }
    
    console.log('\n✅ Mock data setup complete!');
    console.log('You can now run your application with mock data.');
    console.log('To switch back to the real database, set USE_MOCK_DB=false in your .env file.');
  } catch (error) {
    console.error('Error setting up mock data:', error);
    process.exit(1);
  }
}

setupMockData();
