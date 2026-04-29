#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ">>> Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
pip install -q -r requirements.txt

echo ">>> Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install --silent

echo ">>> Starting backend (port 8080)..."
cd "$SCRIPT_DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8080 &
BACKEND_PID=$!

echo ">>> Starting frontend dev server (port 5173)..."
cd "$SCRIPT_DIR/frontend"
NODE_ENV=development node_modules/.bin/vite --host 0.0.0.0 --port 5173

wait $BACKEND_PID
