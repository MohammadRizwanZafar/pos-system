@echo off
setlocal EnableExtensions
title ShopPOS - Start

cd /d "%~dp0"
set "ROOT=%cd%"

echo.
echo  ========================================
echo   ShopPOS - Starting Backend + Frontend
echo  ========================================
echo.

if not exist "%ROOT%\backend\artisan" (
    echo [ERROR] backend folder missing. Run this from the project folder.
    goto :fail
)
if not exist "%ROOT%\frontend\package.json" (
    echo [ERROR] frontend folder missing.
    goto :fail
)
if not exist "%ROOT%\backend\.env" (
    echo [ERROR] backend\.env missing. Run SETUP.bat first.
    goto :fail
)
if not exist "%ROOT%\backend\vendor" (
    echo [ERROR] Backend not installed. Run SETUP.bat first.
    goto :fail
)
if not exist "%ROOT%\frontend\node_modules" (
    echo [ERROR] Frontend not installed. Run SETUP.bat first.
    goto :fail
)

where php >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PHP not in PATH. Start Laragon and Add Laragon to Path.
    goto :fail
)
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not in PATH.
    goto :fail
)

if not exist "%ROOT%\frontend\.env.local" (
    echo NEXT_PUBLIC_API_URL=http://localhost:9051/api/v1> "%ROOT%\frontend\.env.local"
)

if not exist "%ROOT%\frontend\.next" (
    echo Frontend not built yet. Building...
    cd /d "%ROOT%\frontend"
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Frontend build failed.
        goto :fail
    )
    cd /d "%ROOT%"
)

REM Free ports if old process still running
for %%P in (9050 9051) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
        echo Port %%P busy - stopping PID %%A
        taskkill /PID %%A /F >nul 2>&1
    )
)

echo.
echo Starting BACKEND API on port 9051 ...
start "ShopPOS Backend API :9051" cmd /k "cd /d "%ROOT%\backend" && php artisan serve --host=127.0.0.1 --port=9051"

timeout /t 3 /nobreak >nul

echo Starting FRONTEND POS on port 9050 ...
REM Important: package.json defaults to 3100 for Docker — force 9050 here
start "ShopPOS Frontend :9050" cmd /k "cd /d "%ROOT%\frontend" && npx --no-install next start --hostname 127.0.0.1 --port 9050"

echo.
echo  ========================================
echo   ShopPOS STARTED
echo  ========================================
echo.
echo   OPEN THIS IN BROWSER ^(Frontend / POS^):
echo   http://localhost:9050
echo.
echo   BACKEND API:
echo   http://localhost:9051
echo   http://localhost:9051/api/v1
echo.
echo   Keep the two black windows open while using POS.
echo   To stop: run STOP.bat
echo.
echo   Logins:
echo   superadmin@pos.com / admin0101
echo   admin@pos.com / password
echo  ========================================
echo.

timeout /t 6 /nobreak >nul
start "" "http://localhost:9050"
exit /b 0

:fail
echo.
pause
exit /b 1
