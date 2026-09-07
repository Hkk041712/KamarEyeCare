@echo off
title Starting Kamare Eye Care Application...

:: 1. Start Django Backend
echo Starting Django Backend...
start "Django Backend" cmd /k "cd /d C:\Users\user\Documents\GitHub\KamarEyeCare\backend && call venv\Scripts\activate && python manage.py runserver"

:: 2. Start Frontend Server
echo Starting Frontend...
start "React Frontend" cmd /k "cd /d C:\Users\user\Documents\GitHub\KamarEyeCare\frontend && npm run dev"

:: 3. Open Application in Browser
echo Opening App...
timeout /t 3 >nul
start http://localhost:5173