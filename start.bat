@echo off
echo Starting Email Notifier App...

:: Start backend server
start cmd /k "cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r ..\requirements.txt && uvicorn api:app --reload --port 8000"

:: Wait a bit for backend to start
timeout /t 5

:: Start frontend server
start cmd /k "cd frontend && npm install && npm run dev"

echo Both servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173

:: Open the app in browser
timeout /t 3
start http://localhost:5173 