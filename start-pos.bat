@echo off
setlocal EnableExtensions
title ShopPOS

cd /d "%~dp0"

echo.
echo  ========================================
echo   ShopPOS - Starting Backend + Frontend
echo  ========================================
echo.

if not exist "backend\artisan" (
    echo [ERROR] backend folder not found. Run this file from pos-system folder.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo [ERROR] frontend folder not found.
    pause
    exit /b 1
)

if not exist "backend\.env" (
    echo [ERROR] backend\.env missing.
    echo Run scripts\setup-native.bat first for first-time setup.
    pause
    exit /b 1
)

if not exist "backend\vendor" (
    echo [ERROR] Backend not installed. Run scripts\setup-native.bat first.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo [ERROR] Frontend not installed. Run scripts\setup-native.bat first.
    pause
    exit /b 1
)

if not exist "frontend\.next" (
    echo [WARN] Frontend not built yet. Building now...
    pushd frontend
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Frontend build failed.
        popd
        pause
        exit /b 1
    )
    popd
    echo.
)

echo Starting API on  http://localhost:9051
start "ShopPOS API" cmd /k "cd /d "%~dp0backend" && php artisan serve --host=127.0.0.1 --port=9051"

echo Waiting for API...
timeout /t 3 /nobreak >nul

echo Starting POS on http://localhost:9050
start "ShopPOS Frontend" cmd /k "cd /d "%~dp0frontend" && set PORT=9050 && npm run start"

echo.
echo  ========================================
echo   ShopPOS is starting...
echo  ========================================
echo.
echo   COPY THIS URL IN BROWSER:
echo.
echo   http://localhost:9050
echo.
echo   API port: 9051  ^(auto - no need to open^)
echo.
echo   Platform Admin: superadmin@pos.com / admin0101
echo   Shop Owner:     admin@pos.com / password
echo.
echo   Keep both black windows open while using POS.
echo   To stop: close both windows or run stop-pos.bat
echo  ========================================
echo.

timeout /t 5 /nobreak >nul
start "" "http://localhost:9050"

endlocal
