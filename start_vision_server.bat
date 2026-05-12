@echo off
echo.
echo ============================================
echo   AutoCashier Vision Server (YOLO + DINOv2)
echo ============================================
echo.
echo Starting Python vision server on port 5002...
echo.
cd /d "%~dp0"
.venv\Scripts\python.exe vision_server.py
pause
