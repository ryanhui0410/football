#!/bin/bash
#!/bin/bash

# --- ADD THESE LINES TO FIX "COMMAND NOT FOUND" ---
# 1. Check common Mac installation paths (Homebrew Intel & Apple Silicon)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# 2. If you use NVM (Node Version Manager), load it:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# --------------------------------------------------


echo "=========================================="
# ... (rest of your script stays exactly the same) ...
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

# ── Step 1: Pull latest code from GitHub ──
echo ""
echo "[1/4] 🔄 Pulling latest code from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Git pull failed! Possible merge conflict."
    echo "    Please resolve it manually, then re-run this script."
    exit 1
fi

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