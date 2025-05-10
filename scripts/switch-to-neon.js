import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function switchToNeon() {
  try {
    console.log('Switching configuration to use Neon PostgreSQL...');
    
    // Copy the Neon configuration to the main config file
    const neonConfigPath = path.join(__dirname, '..', 'src', 'config.neon.js');
    const mainConfigPath = path.join(__dirname, '..', 'src', 'config.js');
    
    // Read the Neon config
    const neonConfig = await fs.readFile(neonConfigPath, 'utf8');
    
    // Backup the current config
    const currentConfig = await fs.readFile(mainConfigPath, 'utf8');
    await fs.writeFile(path.join(__dirname, '..', 'src', 'config.backup.js'), currentConfig);
    
    // Write the Neon config to the main config file
    await fs.writeFile(mainConfigPath, neonConfig);
    
    console.log('✅ Successfully switched to Neon PostgreSQL configuration.');
    console.log('The original configuration has been backed up to src/config.backup.js');
    
  } catch (error) {
    console.error('Error switching to Neon PostgreSQL:', error);
    process.exit(1);
  }
}

// Run the function
switchToNeon().catch(error => {
  console.error('Failed to switch to Neon PostgreSQL:', error);
  process.exit(1);
});
