#!/bin/bash

# --- FIX "COMMAND NOT FOUND" (Homebrew & NVM paths) ---
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# ------------------------------------------------------

cd "$(dirname "$0")"

echo "=========================================="
echo "     Starting Football Stats App..."
echo "=========================================="

# Cleanup: kill backend when script exits (Ctrl+C)
cleanup() {
    if [ -n "$BACKEND_PID" ]; then
        echo ""
        echo "🛑 Stopping Backend Server..."
        kill "$BACKEND_PID" 2>/dev/null
    fi
}
trap cleanup EXIT

# ── Step 0: Check if Node.js is installed ──
echo ""
echo "[0/4] Checking for Node.js..."
if command -v node &> /dev/null; then
    echo "    Node.js is installed."
    echo "    Version: $(node -v)"
    echo "    npm:     $(npm -v)"
else
    echo "    [!] Node.js is NOT installed."
    echo "    Attempting automatic installation..."
    
    # Check if Homebrew is installed
    if command -v brew &> /dev/null; then
        echo "    Installing Node.js via Homebrew..."
        brew install node
        if [ $? -eq 0 ]; then
            echo ""
            echo "    =========================================="
            echo "    Node.js installed successfully!"
            echo ""
            echo "    IMPORTANT: Please close this terminal window"
            echo "    and run './start.sh' AGAIN."
            echo "    (macOS needs to refresh the PATH)"
            echo "    =========================================="
            exit 0
        else
            echo "    [!] Homebrew installation failed."
        fi
    fi
    
    # Manual install fallback
    echo ""
    echo "    =========================================="
    echo "    [!] Automatic installation failed or Homebrew is missing."
    echo ""
    echo "    Please install Node.js manually:"
    echo "      1. Your browser will open to nodejs.org"
    echo "      2. Download the macOS LTS installer"
    echo "      3. Run the installer"
    echo "      4. Come back and run './start.sh' again"
    echo "    =========================================="
    open https://nodejs.org
    exit 1
fi

# ── Step 1: Check Git & Pull latest code ──
echo ""
echo "[1/4] Checking for Git & Pulling code..."
if ! command -v git &> /dev/null; then
    echo "    [!] Git is NOT installed."
    echo "    Attempting automatic installation..."
    
    if command -v brew &> /dev/null; then
        brew install git
        echo "    Git installed! Please close this terminal and run './start.sh' AGAIN."
        exit 0
    else
        echo "    Please install Git from: https://git-scm.com"
        open https://git-scm.com
        exit 1
    fi
fi

echo "    🔄 Pulling latest code from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Git pull failed! Possible merge conflict."
    echo "    Please resolve it manually, then re-run this script."
    exit 1
fi
echo "    Done."

# ── Step 2: Check & Install Dependencies ──
echo ""
echo "[2/4] 📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   -> First time setup detected! Installing all packages..."
    npm install
else
    echo "   -> Verifying and updating packages..."
    npm install --silent
fi

if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed!"
    exit 1
fi
echo "    Done."

# ── Step 3: Start Backend (Port 5000) ──
echo ""
echo "[3/4] 🚀 Starting Backend Server..."
node server.js &
BACKEND_PID=$!

sleep 2

# ── Step 4: Start Frontend (Port 3000) ──
echo ""
echo "[4/4] 🎨 Starting Frontend App..."
npm start