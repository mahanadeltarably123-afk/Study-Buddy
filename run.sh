#!/usr/bin/env bash
set -e

echo "========================================================"
echo "             STUDY BUDDY - AI STUDY ASSISTANT           "
echo "========================================================"

if [ ! -d ".venv" ]; then
    echo "[!] Creating virtual environment..."
    uv venv --python 3.12 .venv || python3 -m venv .venv
    echo "[*] Installing dependencies..."
    ./.venv/bin/pip install -r requirements.txt
fi

echo "[*] Launching Study Buddy at http://localhost:8000"
./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
