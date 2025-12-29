@echo off
echo Starting the Realtime Multi-Assistant Application...
echo.
echo Main Application will run on: http://localhost:5173
echo Customer Window will be available at: http://localhost:5173/customer.html
echo.
echo Press Ctrl+C to stop both applications
echo.

start /b npm run dev

echo Applications started!
echo.
echo To open the Customer Window:
echo 1. Click the "Open Customer Window" button in the main application, OR
echo 2. Manually navigate to: http://localhost:5173/customer.html
echo.

pause
