#!/bin/bash

cd "$(dirname "$0")"

echo "=========================================="
echo "     Starting Football Stats App..."
echo "=========================================="

# Cleanup: kill backend when script exits
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
echo "[1/4] Pulling latest code from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Git pull failed! Possible merge conflict."
    echo "    Please resolve it manually, then re-run this script."
    exit 1
fi

# ── Step 2: Install / update dependencies ──
echo ""
echo "[2/4] Checking dependencies..."
npm install

# ── Step 3: Start Backend (Port 5000) ──
echo ""
echo "[3/4] Starting Backend Server..."
node server.js &
BACKEND_PID=$!

sleep 2

# ── Step 4: Start Frontend (Port 3000) ──
echo ""
echo "[4/4] Starting Frontend App..."
npm start