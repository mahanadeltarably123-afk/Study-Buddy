@echo off
echo ========================================================
echo               STUDY BUDDY - AI STUDY ASSISTANT
echo ========================================================
echo.

IF NOT EXIST ".venv\Scripts\python.exe" (
    echo [!] Virtual environment not found. Setting up with uv or python...
    uv venv --python 3.12 .venv || python -m venv .venv
    echo [*] Installing dependencies...
    .venv\Scripts\pip install -r requirements.txt
)

echo [*] Starting Study Buddy Web Server at http://localhost:8000
echo [*] Press Ctrl+C to terminate.
echo.
.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
pause
