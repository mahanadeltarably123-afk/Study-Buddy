# Study Buddy PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "             STUDY BUDDY - AI STUDY ASSISTANT           " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "[!] Setting up Python environment..." -ForegroundColor Yellow
    uv venv --python 3.12 .venv
    & .\.venv\Scripts\pip.exe install -r requirements.txt
}

Write-Host "[*] Launching Study Buddy at http://localhost:8000" -ForegroundColor Green
& .\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
