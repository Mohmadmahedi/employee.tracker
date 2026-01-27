@echo off
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend-server && npm run dev"

echo Starting Admin Dashboard (Frontend)...
start "Admin Dashboard" cmd /k "cd desktop-app && npm run dev"

echo Done! You can minimize these windows, but DO NOT close them.
pause
