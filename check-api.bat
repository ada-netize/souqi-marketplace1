@echo off
cd /d "%~dp0"
curl http://localhost:5000/api/public/health
pause
