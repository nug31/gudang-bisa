import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyDistToPublic() {
  try {
    console.log('Copying dist files to public directory...');
    
    // Create public directory if it doesn't exist
    const publicDir = path.join(__dirname, 'public');
    await fs.mkdir(publicDir, { recursive: true });
    
    // Copy all files from dist to public
    const distDir = path.join(__dirname, '..', 'dist');
    const distFiles = await fs.readdir(distDir);
    
    for (const file of distFiles) {
      const srcPath = path.join(distDir, file);
      const destPath = path.join(publicDir, file);
      
      const stats = await fs.stat(srcPath);
      if (stats.isDirectory()) {
        // Copy directory recursively
        await copyDir(srcPath, destPath);
      } else {
        // Copy file
        await fs.copyFile(srcPath, destPath);
      }
      
      console.log(`Copied ${file}`);
    }
    
    console.log('All files copied successfully!');
  } catch (error) {
    console.error('Error copying files:', error);
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

copyDistToPublic();
