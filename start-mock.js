import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startMockServer() {
  console.log('Starting mock server...');
  
  // Start the mock server
  const serverProcess = spawn('node', ['mock-server.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error('Failed to start mock server:', error);
  });
  
  // Start the Vite dev server
  console.log('Starting Vite dev server...');
  const vite = await createServer({
    // Vite server options
    configFile: './vite.config.ts',
    server: {
      port: 5173
    }
  });
  
  await vite.listen();
  
  const viteInfo = vite.config.server;
  console.log(`Vite dev server running at: http://localhost:${viteInfo.port}`);
  
  // Handle process termination
  const cleanup = () => {
    console.log('Shutting down servers...');
    serverProcess.kill();
    vite.close();
    process.exit();
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startMockServer().catch(error => {
  console.error('Error starting servers:', error);
  process.exit(1);
});
