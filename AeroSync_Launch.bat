@echo off
title AeroSync Telemetry Launcher
color 0B
echo.
echo ===================================================
echo     Starting AeroSync Telemetry Platform...
echo ===================================================
echo.
cd /d "%~dp0"

echo 1. Starting MAVLink Listener (listen.py on MAVLink)...
start "AeroSync MAVLink Listener" cmd /c "python listen.py & pause"

echo 2. Starting Flask Backend Server (Port 8000)...
start "AeroSync Flask Backend" cmd /c "python server.py & pause"

echo 3. Starting Next.js Frontend Server (Port 5000)...
start "AeroSync Frontend" cmd /c "npm run dev"

echo 4. Waiting for servers to initialize...
timeout /t 8 /nobreak >nul

echo 5. Opening Dashboard in your default browser...
start http://localhost:5000

echo.
echo ===================================================
echo   AeroSync is running! 
echo   Ports: Flask Backend (8000) ^| Next.js Frontend (5000)
echo   (Close the cmd windows to stop the servers)
echo ===================================================
timeout /t 3
