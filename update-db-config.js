import fs from 'fs/promises';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function updateDbConfig() {
  console.log('Database Configuration Update Utility');
  console.log('====================================');
  console.log('This utility will help you update your database configuration after migration to cPanel.');
  console.log('');
  
  try {
    // Read current .env file
    const envContent = await fs.readFile('.env', 'utf8');
    const envLines = envContent.split('\n');
    const currentConfig = {};
    
    // Parse current config
    envLines.forEach(line => {
      if (line.trim() && line.includes('=')) {
        const [key, value] = line.split('=');
        currentConfig[key.trim()] = value.trim();
      }
    });
    
    console.log('Current Database Configuration:');
    console.log(`Host: ${currentConfig.DB_HOST || 'Not set'}`);
    console.log(`User: ${currentConfig.DB_USER || 'Not set'}`);
    console.log(`Database: ${currentConfig.DB_NAME || 'Not set'}`);
    console.log('');
    
    // Prompt for new configuration
    console.log('Enter your cPanel database configuration:');
    
    const newConfig = await promptForConfig();
    
    // Update .env file
    let newEnvContent = '';
    let updated = false;
    
    for (const line of envLines) {
      if (line.startsWith('DB_HOST=')) {
        newEnvContent += `DB_HOST=${newConfig.host}\n`;
        updated = true;
      } else if (line.startsWith('DB_USER=')) {
        newEnvContent += `DB_USER=${newConfig.user}\n`;
        updated = true;
      } else if (line.startsWith('DB_PASSWORD=')) {
        newEnvContent += `DB_PASSWORD=${newConfig.password}\n`;
        updated = true;
      } else if (line.startsWith('DB_NAME=')) {
        newEnvContent += `DB_NAME=${newConfig.database}\n`;
        updated = true;
      } else {
        newEnvContent += `${line}\n`;
      }
    }
    
    // If any config wasn't in the original file, add it
    if (!updated) {
      newEnvContent += `DB_HOST=${newConfig.host}\n`;
      newEnvContent += `DB_USER=${newConfig.user}\n`;
      newEnvContent += `DB_PASSWORD=${newConfig.password}\n`;
      newEnvContent += `DB_NAME=${newConfig.database}\n`;
    }
    
    // Create backup of original .env file
    await fs.writeFile('.env.backup', envContent);
    console.log('Created backup of original .env file as .env.backup');
    
    // Write new .env file
    await fs.writeFile('.env', newEnvContent.trim());
    console.log('Updated .env file with new database configuration');
    
    console.log('');
    console.log('Database configuration updated successfully!');
    
  } catch (error) {
    console.error('Error updating database configuration:', error);
  } finally {
    rl.close();
  }
}

function promptForConfig() {
  return new Promise((resolve) => {
    const config = {};
    
    rl.question('cPanel MySQL Host: ', (host) => {
      config.host = host;
      
      rl.question('cPanel MySQL Username: ', (user) => {
        config.user = user;
        
        rl.question('cPanel MySQL Password: ', (password) => {
          config.password = password;
          
          rl.question('cPanel MySQL Database Name: ', (database) => {
            config.database = database;
            resolve(config);
          });
        });
      });
    });
  });
}

updateDbConfig();
