@echo off
echo Running Excel Import Debug Tool...
echo.

REM Set environment variables for Neon database connection
set NEON_CONNECTION_STRING=postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

REM Run the debug script
node debug-excel-import.js

echo.
echo Debug complete. Press any key to exit.
pause > nul
