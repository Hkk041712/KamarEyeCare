@echo off
setlocal
title Starting Kamar Eye Care

set "PROJECT_DIR=%~dp0"

echo Starting the Django API...
start "Kamar Eye Care API" powershell -NoExit -Command "Set-Location -LiteralPath '%PROJECT_DIR%backend'; .\venv\Scripts\python.exe manage.py runserver"

echo Starting the React frontend...
start "Kamar Eye Care Frontend" powershell -NoExit -Command "Set-Location -LiteralPath '%PROJECT_DIR%frontend'; $env:VITE_API_BASE_URL='http://127.0.0.1:8000/api'; npm run dev"

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
endlocal
