@echo off
echo ==========================================
echo      Starting Football Stats App...
echo ==========================================

:: ── Step 0: Check if Node.js is installed ──
echo.
echo [0/5] Checking for Node.js...
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo     Node.js is installed.
    for /f "tokens=*" %%v in ('node -v') do echo     Version: %%v
    for /f "tokens=*" %%n in ('npm -v') do echo     npm:     %%n
    echo.
    goto :pull_code
)

:: ── Node.js NOT found ──
echo     [!] Node.js is NOT installed.
echo     Attempting automatic installation...
echo.

:: Try winget (Windows Package Manager)
where winget >nul 2>nul
if %errorlevel% equ 0 (
    echo     Installing Node.js LTS via winget...
    echo     (You may see a permission prompt - click Yes)
    echo.
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    if %errorlevel% equ 0 (
        echo.
        echo     ==========================================
        echo     Node.js installed successfully!
        echo.
        echo     IMPORTANT: You must CLOSE this window
        echo     and double-click start.bat AGAIN.
        echo     (Windows needs to refresh the PATH)
        echo     ==========================================
        pause
        exit /b 0
    ) else (
        goto :manual_install
    )
) else (
    goto :manual_install
)

:: ── Manual install fallback ──
:manual_install
echo.
echo     ==========================================
echo     [!] Automatic installation failed.
echo.
echo     Please install Node.js manually:
echo       1. Open your browser
echo       2. Go to: https://nodejs.org
echo       3. Download the LTS version
echo       4. Run the installer
echo       5. Come back and double-click start.bat
echo     ==========================================
echo.
start https://nodejs.org
pause
exit /b 1

:: ── Step 1: Pull latest code ──
:pull_code
echo [1/5] Pulling latest code from GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo.
    echo     [!] Git pull failed! Possible merge conflict.
    echo     Please resolve it manually, then re-run this script.
    pause
    exit /b 1
)
echo     Done.

:: ── Step 2: Check and Install Dependencies ──
echo.
echo [2/5] Checking dependencies...
if not exist "node_modules\" (
    echo     First time setup detected! Installing all packages...
    call npm install
) else (
    echo     Verifying and updating packages...
    call npm install
)

if %errorlevel% neq 0 (
    echo.
    echo     [!] Dependency installation failed!
    pause
    exit /b 1
)
echo     Done.

:: ── Step 3: Check if Git is installed ──
echo.
echo [3/5] Checking for Git...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo     [!] Git is NOT installed.
    echo     Attempting to install Git via winget...
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        winget install Git.Git --accept-package-agreements --accept-source-agreements
        echo.
        echo     Git installed! Please CLOSE this window
        echo     and double-click start.bat AGAIN.
        pause
        exit /b 0
    ) else (
        echo     Please install Git from: https://git-scm.com
        start https://git-scm.com
        pause
        exit /b 1
    )
)
echo     Git is installed.

:: ── Step 4: Start Backend (Port 5000) ──
echo.
echo [4/5] Starting Backend Server...
start "Backend Server" cmd /k node server.js

timeout /t 2 /nobreak >nul

:: ── Step 5: Start Frontend (Port 3000) ──
echo.
echo [5/5] Starting Frontend App...
start "Frontend App" cmd /k npm start

echo.
echo ==========================================
echo   App is running!
echo   Close the terminal windows to stop.
echo ==========================================