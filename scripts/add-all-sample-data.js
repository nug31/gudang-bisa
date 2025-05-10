import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
config();

const execPromise = promisify(exec);

async function runScript(scriptName) {
  console.log(`Running ${scriptName}...`);
  try {
    const { stdout, stderr } = await execPromise(`node scripts/${scriptName}.js`);
    if (stderr) {
      console.error(`Error in ${scriptName}:`, stderr);
    }
    console.log(stdout);
    console.log(`${scriptName} completed successfully.`);
    return true;
  } catch (error) {
    console.error(`Error running ${scriptName}:`, error);
    return false;
  }
}

async function addAllSampleData() {
  console.log('Adding all sample data to Neon database...');
  
  // Run scripts in order
  const scripts = [
    'add-sample-categories',
    'add-sample-inventory',
    'add-sample-requests'
  ];
  
  for (const script of scripts) {
    const success = await runScript(script);
    if (!success) {
      console.error(`Failed to run ${script}. Stopping.`);
      process.exit(1);
    }
  }
  
  console.log('All sample data added successfully!');
}

// Run the function
addAllSampleData().catch(error => {
  console.error('Failed to add all sample data:', error);
  process.exit(1);
});
