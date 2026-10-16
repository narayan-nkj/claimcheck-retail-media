@echo off
setlocal enabledelayedexpansion
title ClaimCheck - Retail Media Pre-Publication Claim Checker

:: Navigate to script directory
cd /d "%~dp0"

echo ===============================================================================
echo   CLAIMCHECK -- Retail Media Pre-Publication Claim Checker
echo   AMD Developer Hackathon ACT III (Reinvent Commerce Track)
echo ===============================================================================
echo.

:: 1. Verify Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH.
    echo Please install Node.js v20+ or v24+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [*] Detected Node.js: %NODE_VER%

:: 2. Check and install dependencies if missing
if not exist "node_modules\" (
    echo [*] Dependencies ('node_modules') not found. Installing packages...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 'npm install' failed.
        pause
        exit /b 1
    )
    echo [*] Dependencies installed successfully.
)

:: 3. Launch browser in background after 2 second delay for server spin-up
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

echo [*] Starting ClaimCheck HTTP server on http://localhost:3000 ...
echo [*] Opening default web browser automatically...
echo.
echo   - Operator Portal : http://localhost:3000
echo   - API Health Check: http://localhost:3000/api/health
echo   - Prometheus Met. : http://localhost:3000/metrics
echo.
echo Press Ctrl+C in this terminal window to stop the server.
echo ===============================================================================
echo.

:: 4. Start the server (foreground process)
call npm start

if %errorlevel% neq 0 (
    echo.
    echo [INFO] ClaimCheck server stopped with status code %errorlevel%.
    pause
)
