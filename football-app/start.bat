@echo off
echo ==========================================
echo      Starting Football Stats App...
echo ==========================================

:: ── Step 1: Pull latest code from GitHub ──
echo.
echo [1/4] Pulling latest code from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo.
    echo [!] Git pull failed! Possible merge conflict.
    echo     Please resolve it manually, then re-run this script.
    pause
    exit /b 1
)

:: ── Step 2: Check and Install Dependencies ──
echo.
echo [2/4] Checking dependencies...
if not exist "node_modules\" (
    echo     -^> First time setup detected! Installing all packages...
    call npm install
) else (
    echo     -^> Verifying and updating packages...
    call npm install
)

if %errorlevel% neq 0 (
    echo.
    echo [!] Dependency installation failed!
    pause
    exit /b 1
)

:: ── Step 3: Start Backend (Port 5000) ──
echo.
echo [3/4] Starting Backend Server...
start "Backend Server" cmd /k node server.js

timeout /t 2 /nobreak >nul

:: ── Step 4: Start Frontend (Port 3000) ──
echo.
echo [4/4] Starting Frontend App...
start "Frontend App" cmd /k npm start

echo.
echo ==========================================
echo   App is running!
echo   Close the new terminal windows to stop.
echo ==========================================