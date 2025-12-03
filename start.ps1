Write-Host "Starting Email Notifier App..." -ForegroundColor Green

# Start backend server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m venv .venv; .venv\Scripts\activate; pip install -r ..\requirements.txt; uvicorn api:app --reload --port 8000"

# Wait a bit for backend to start
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm install; npm run dev"

Write-Host "Both servers started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan

# Open the app in browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173" 