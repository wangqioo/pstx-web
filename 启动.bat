@echo off
title PSTX Analyzer

echo ============================================
echo   PSTX Schematic Analyzer - Web Edition
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.8+
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python found

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Install backend deps
echo.
echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
pip install -q -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo [OK] Backend dependencies ready

:: Install frontend deps
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install --silent
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies ready

:: Start backend
echo [3/4] Starting backend on port 8080...
cd /d "%~dp0backend"
start "PSTX-Backend" /min python -m uvicorn main:app --host 0.0.0.0 --port 8080

timeout /t 3 /nobreak >nul

:: Start frontend
echo [4/4] Starting frontend on port 5173...
cd /d "%~dp0frontend"
start "PSTX-Frontend" /min cmd /c "npm run dev"

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak >nul

:: Open browser
start http://localhost:5173

echo.
echo ============================================
echo   Ready! Open: http://localhost:5173
echo   Press any key to STOP all services
echo ============================================
echo.
pause >nul

:: Stop services
echo Stopping services...
taskkill /f /fi "WINDOWTITLE eq PSTX-Backend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq PSTX-Frontend*" >nul 2>&1
taskkill /f /im uvicorn.exe >nul 2>&1
echo Done.
timeout /t 2 /nobreak >nul
