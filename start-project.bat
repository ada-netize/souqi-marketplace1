@echo off
setlocal
cd /d "%~dp0"

echo [1/4] Installing root dependencies...
call npm install --ignore-scripts
if errorlevel 1 goto :fail

echo [2/4] Installing mobile dependencies...
call npm run install:mobile
if errorlevel 1 goto :fail

echo [3/4] Seeding local database...
call npm run seed
if errorlevel 1 goto :fail

echo [4/4] Starting API / Admin / Mobile in separate windows...
start "Souqi API" cmd /k "cd /d %~dp0 && npm run dev:api"
start "Souqi Admin" cmd /k "cd /d %~dp0 && npm run dev:admin"
start "Souqi Mobile" cmd /k "cd /d %~dp0mobile-app && npx expo start --clear"

echo.
echo Everything has been started.
echo - API:   http://localhost:5000
echo - Admin: http://localhost:3000
echo - Mobile: Expo / QR
pause
exit /b 0

:fail
echo.
echo Setup failed. Review the errors above.
pause
exit /b 1
