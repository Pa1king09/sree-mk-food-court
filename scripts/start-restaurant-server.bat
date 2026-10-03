@echo off
TITLE Sree MK Food Court - Offline Server Launcher
COLOR 0A
cls
echo =============================================================
echo   SREE MK FOOD COURT - OFFLINE QR MENU SERVER
echo   Restaurant Digital Menu System (No Internet Required)
echo =============================================================
echo.

cd /d "%~dp0\.."

echo Checking Node.js runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Starting production server on local network...
npm start

pause
