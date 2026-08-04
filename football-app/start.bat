@echo off
echo ==========================================
echo      Starting Football Stats App...
echo ==========================================

:: 1. Pull latest code from GitHub
echo.
echo [1/4] Pulling latest code from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo.
    echo [!] Git pull failed! Please resolve it manually.
    pause
    exit /b 1
)

:: 2. Install / update dependencies
echo.
echo [2/4] Checking dependencies...
call npm install

:: 3. Start Backend Server (Port 5000)
echo.
echo [3/4] Starting Backend Server...
start "Backend Server" cmd /k node server.js

timeout /t 2 /nobreak >nul

:: 4. Start Frontend App (Port 3000)
echo.
echo [4/4] Starting Frontend App...
start "Frontend App" cmd /k npm start

echo.
echo ==========================================
echo   App is running!
echo   Close the terminal windows to stop.
echo ==========================================