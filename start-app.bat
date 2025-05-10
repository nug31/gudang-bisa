@echo off
echo Starting Gudang Mitra application with Neon database...

REM Set environment variables
set PORT=3003
set NODE_ENV=development

REM Start the server
start cmd /k "node neon-server.js"

REM Wait for server to start
timeout /t 3

REM Start the client
start cmd /k "npm run dev"

echo Application started!
echo Server: http://localhost:3003
echo Client: http://localhost:5173
