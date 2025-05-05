import { spawn } from 'child_process';

// Start the server
const serverProcess = spawn('node', ['verbose-server.js'], {
  stdio: 'inherit',
  shell: true
});

console.log('Server process started with PID:', serverProcess.pid);

// Handle process termination
serverProcess.on('exit', (code, signal) => {
  console.log(`Server process exited with code ${code} and signal ${signal}`);
});

// Keep the script running
process.stdin.resume();
