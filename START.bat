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

timeout /t 2 /nobreak >nul

echo Starting FRONTEND POS on port 9050 ...
REM Use next dev so latest code loads ^(avoids blank/stale production build^)
start "ShopPOS Frontend :9050" cmd /k "cd /d "%ROOT%\frontend" && npx --no-install next dev --hostname 127.0.0.1 --port 9050"

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
echo   First open can take 10-20 sec while Next.js compiles.
echo   Keep the two black windows open while using POS.
echo   To stop: run STOP.bat  ^(or pos stop^)
echo  ========================================
echo.

timeout /t 8 /nobreak >nul
start "" "http://localhost:9050"
exit /b 0

:fail
echo.
pause
exit /b 1
