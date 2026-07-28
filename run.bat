@echo off
title InSight - AI Vision Software Bootstrapper
echo =================================================================
echo             InSight AI Vision Software Bootstrapper
echo =================================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.12+ is required but not found in PATH.
    echo Please install Python and ensure it is added to your environment variables.
    pause
    exit /b 1
)

:: Check for Node
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required but not found in PATH.
    echo Please install Node.js before running this application.
    pause
    exit /b 1
)

echo [INFO] Python and Node.js detected.
echo.

:: Setup Backend Virtual Env
echo [INFO] Setting up Python virtual environment...
if not exist "backend\venv" (
    python -m venv backend\venv
    echo [INFO] Virtual environment created.
) else (
    echo [INFO] Virtual environment already exists.
)

echo [INFO] Installing backend dependencies...
call backend\venv\Scripts\pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install python packages.
    pause
    exit /b 1
)
echo [INFO] Backend dependencies ready.
echo.

:: Setup Frontend Packages
echo [INFO] Setting up frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm packages.
    pause
    exit /b 1
)
cd ..
echo [INFO] Frontend dependencies ready.
echo.

echo =================================================================
echo [SUCCESS] Everything is configured successfully!
echo [INFO] Starting servers in separate windows...
echo =================================================================
echo.

:: Launch Backend
start "InSight Backend (FastAPI)" cmd /k "cd backend && venv\Scripts\python run.py"

:: Launch Frontend
start "InSight Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo [INFO] Servers are launching. You can close this bootstrap window.
timeout /t 5
exit
