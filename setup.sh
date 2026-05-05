#!/bin/bash

# Exit immediately if a command fails
set -e

echo "========================================"
echo " Setting up 3D Word Cloud (macOS)       "
echo "========================================"

# 1. Setup Backend
echo "--> Setting up Python Backend..."
cd backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "Created Python virtual environment."
fi
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# 2. Setup Frontend
echo "--> Setting up React Frontend..."
cd frontend
pnpm install
cd ..

echo "========================================"
echo " Dependencies installed. Starting apps! "
echo "========================================"

# 3. Start Backend in background
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 4. Start Frontend in background
cd frontend
pnpm run dev &
FRONTEND_PID=$!
cd ..

# 5. Clean shutdown on Ctrl+C   
trap "echo -e '\nShutting down servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" SIGINT SIGTERM

wait