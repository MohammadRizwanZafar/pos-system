@echo off
setlocal EnableExtensions
title ShopPOS - First Time Setup

cd /d "%~dp0.."

echo.
echo  ========================================
echo   ShopPOS - Native Setup (Laragon/Windows)
echo  ========================================
echo.
echo Make sure Laragon is running and MySQL is started.
echo.

where php >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PHP not found. Install Laragon Full and add to PATH.
    echo Laragon -^> Menu -^> Tools -^> Path -^> Add Laragon to Path
    pause
    exit /b 1
)

where composer >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Composer not found. Install via Laragon or getcomposer.org
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install via Laragon Full.
    pause
    exit /b 1
)

echo [1/7] Backend .env
if not exist "backend\.env" (
    copy "backend\.env.native.example" "backend\.env" >nul
    echo Created backend\.env from native template.
) else (
    echo backend\.env already exists - skipped.
)

echo [2/7] Frontend .env.local
if not exist "frontend\.env.local" (
    copy "frontend\.env.example" "frontend\.env.local" >nul
    echo Created frontend\.env.local
) else (
    echo frontend\.env.local already exists - skipped.
)

echo [3/7] Composer install
pushd backend
call composer install --no-interaction
if errorlevel 1 goto :fail
if not findstr /C:"APP_KEY=base64:" .env >nul 2>&1 (
    php artisan key:generate --force
)
popd

echo [4/7] Create database (if MySQL available)
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if errorlevel 1 (
    echo Could not auto-create DB. In Laragon/phpMyAdmin create database: pos_system
) else (
    echo Database pos_system ready.
)

echo [5/7] Database migrate + seed
pushd backend
php artisan migrate --force
if errorlevel 1 goto :fail
php artisan db:seed --force
if errorlevel 1 goto :fail
popd

echo [6/7] npm install
pushd frontend
call npm install
if errorlevel 1 goto :fail
popd

echo [7/7] Frontend build
pushd frontend
call npm run build
if errorlevel 1 goto :fail
popd

echo.
echo  ========================================
echo   Setup complete!
echo  ========================================
echo.
echo   COPY THESE URLS:
echo.
echo   POS (browser):  http://localhost:9050
echo   API (backend):  http://localhost:9051/api/v1
echo.
echo   NEXT STEP: Double-click start-pos.bat
echo.
echo   LOGINS:
echo   Platform Admin: superadmin@pos.com / password
echo   Shop Owner:     admin@pos.com / password
echo   Cashier:        cashier@pos.com / password
echo.
echo   Saved to: SHOPPOS-INFO.txt  (copy from there anytime)
echo  ========================================
echo.

(
echo ShopPOS - Install Info
echo ======================
echo.
echo POS URL ^(open in browser^):
echo http://localhost:9050
echo.
echo API URL:
echo http://localhost:9051/api/v1
echo.
echo HOW TO START:
echo 1. Laragon - Start All
echo 2. Double-click start-pos.bat
echo 3. Open http://localhost:9050
echo.
echo LOGINS:
echo Platform Admin: superadmin@pos.com / password
echo Shop Owner:     admin@pos.com / password
echo Cashier:        cashier@pos.com / password
echo.
echo TO STOP: run stop-pos.bat
) > SHOPPOS-INFO.txt

pause
exit /b 0

:fail
echo.
echo [ERROR] Setup failed. Check errors above.
popd 2>nul
pause
exit /b 1
