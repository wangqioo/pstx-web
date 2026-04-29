@echo off
chcp 65001 >nul
title PSTX 原理图分析工具

echo ============================================
echo   PSTX 原理图分析工具 Web 版
echo ============================================
echo.

:: ── 检查 Python ──────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python 已就绪

:: ── 检查 Node.js ─────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js 已就绪

:: ── 安装后端依赖 ──────────────────────────────
echo.
echo [1/4] 安装后端依赖...
cd /d "%~dp0backend"
pip install -q -r requirements.txt
if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)
echo [OK] 后端依赖安装完成

:: ── 安装前端依赖 ──────────────────────────────
echo [2/4] 安装前端依赖...
cd /d "%~dp0frontend"
call npm install --silent
if errorlevel 1 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
)
echo [OK] 前端依赖安装完成

:: ── 启动后端 ──────────────────────────────────
echo [3/4] 启动后端服务 (端口 8080)...
cd /d "%~dp0backend"
start "PSTX 后端" /min python -m uvicorn main:app --host 0.0.0.0 --port 8080

:: 等待后端就绪
timeout /t 3 /nobreak >nul

:: ── 启动前端 ──────────────────────────────────
echo [4/4] 启动前端服务 (端口 5173)...
cd /d "%~dp0frontend"
start "PSTX 前端" /min cmd /c "npm run dev"

:: 等待前端就绪
echo.
echo 正在等待服务启动...
timeout /t 5 /nobreak >nul

:: ── 打开浏览器 ────────────────────────────────
echo 正在打开浏览器...
start http://localhost:5173

echo.
echo ============================================
echo   服务已启动！
echo   浏览器地址: http://localhost:5173
echo   关闭此窗口将停止所有服务
echo ============================================
echo.
echo 按任意键停止所有服务并退出...
pause >nul

:: ── 停止服务 ──────────────────────────────────
echo 正在停止服务...
taskkill /f /fi "WINDOWTITLE eq PSTX 后端*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq PSTX 前端*" >nul 2>&1
taskkill /f /im uvicorn.exe >nul 2>&1

echo 已停止。
timeout /t 2 /nobreak >nul
