@echo off
setlocal EnableExtensions EnableDelayedExpansion
title ShopPOS - Windows Setup (Laragon)

cd /d "%~dp0"
set "ROOT=%cd%"

echo.
echo  ========================================
echo   ShopPOS - First Time Setup
echo  ========================================
echo.
echo  Project: %ROOT%
echo  Make sure Laragon is running ^(MySQL ON^).
echo.

where php >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PHP not found in PATH.
    echo Laragon -^> Menu -^> Tools -^> Path -^> Add Laragon to Path
    echo Then close this window and run SETUP.bat again.
    goto :fail
)

where composer >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Composer not found in PATH.
    echo Install Composer or enable it from Laragon.
    goto :fail
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found in PATH.
    echo Install Laragon Full ^(includes Node^) or install Node 22+.
    goto :fail
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found in PATH.
    goto :fail
)

echo PHP:
php -v
echo.
echo Node:
node -v
echo.

echo [1/8] Backend .env
if not exist "%ROOT%\backend\.env" (
    copy "%ROOT%\backend\.env.native.example" "%ROOT%\backend\.env" >nul
    if errorlevel 1 (
        echo [ERROR] Could not create backend\.env
        goto :fail
    )
    echo Created backend\.env
) else (
    echo backend\.env already exists - keeping it
)

echo [2/8] Frontend .env.local
if not exist "%ROOT%\frontend\.env.local" (
    copy "%ROOT%\frontend\.env.example" "%ROOT%\frontend\.env.local" >nul
    if errorlevel 1 (
        echo [ERROR] Could not create frontend\.env.local
        goto :fail
    )
    echo Created frontend\.env.local
) else (
    echo frontend\.env.local already exists - keeping it
)

REM Force correct local ports / API URL for Windows native run
powershell -NoProfile -Command ^
  "$envFile='%ROOT%\backend\.env';" ^
  "$c=Get-Content $envFile -Raw;" ^
  "$c=$c -replace '(?m)^APP_URL=.*$','APP_URL=http://localhost:9051';" ^
  "$c=$c -replace '(?m)^FRONTEND_URL=.*$','FRONTEND_URL=http://localhost:9050';" ^
  "$c=$c -replace '(?m)^SANCTUM_STATEFUL_DOMAINS=.*$','SANCTUM_STATEFUL_DOMAINS=localhost:9050,127.0.0.1:9050';" ^
  "if ($c -notmatch '(?m)^FRONTEND_URL=') { $c += \"`r`nFRONTEND_URL=http://localhost:9050\" };" ^
  "if ($c -notmatch '(?m)^SANCTUM_STATEFUL_DOMAINS=') { $c += \"`r`nSANCTUM_STATEFUL_DOMAINS=localhost:9050,127.0.0.1:9050\" };" ^
  "Set-Content -Path $envFile -Value $c -NoNewline"

powershell -NoProfile -Command ^
  "Set-Content -Path '%ROOT%\frontend\.env.local' -Value 'NEXT_PUBLIC_API_URL=http://localhost:9051/api/v1'"

echo Ports written: Frontend 9050 / API 9051

echo [3/8] Composer install
cd /d "%ROOT%\backend"
call composer install --no-interaction --prefer-dist
if errorlevel 1 (
    echo [ERROR] composer install failed
    goto :fail
)

echo [4/8] APP_KEY + storage
php artisan key:generate --force
if errorlevel 1 (
    echo [ERROR] key:generate failed
    goto :fail
)
if not exist "%ROOT%\backend\storage\app\public" mkdir "%ROOT%\backend\storage\app\public"
php artisan storage:link
php artisan config:clear

echo [5/8] Create MySQL database: pos_system
set "DB_OK=0"
where mysql >nul 2>&1
if not errorlevel 1 (
    mysql -uroot -e "CREATE DATABASE IF NOT EXISTS pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
    if not errorlevel 1 set "DB_OK=1"
)

if "!DB_OK!"=="0" (
    for /d %%D in ("C:\laragon\bin\mysql\mysql-*") do (
        if exist "%%D\bin\mysql.exe" (
            "%%D\bin\mysql.exe" -uroot -e "CREATE DATABASE IF NOT EXISTS pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
            if not errorlevel 1 set "DB_OK=1"
        )
    )
)

if "!DB_OK!"=="1" (
    echo Database pos_system ready.
) else (
    echo [WARN] Could not auto-create DB.
    echo Create database manually in Laragon phpMyAdmin: pos_system
    echo Then press any key to continue migrate...
    pause >nul
)

echo [6/8] Migrate + seed
cd /d "%ROOT%\backend"
php artisan migrate --force
if errorlevel 1 (
    echo [ERROR] migrate failed. Is MySQL running in Laragon? DB name pos_system?
    goto :fail
)
php artisan db:seed --force
if errorlevel 1 (
    echo [ERROR] db:seed failed
    goto :fail
)
echo Migrate + seed OK.

echo [7/8] npm install
cd /d "%ROOT%\frontend"
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    goto :fail
)

echo [8/8] Frontend build ^(port 9050^)
cd /d "%ROOT%\frontend"
call npm run build
if errorlevel 1 (
    echo [ERROR] npm run build failed
    goto :fail
)

cd /d "%ROOT%"

(
echo ShopPOS - Install Info
echo ======================
echo.
echo FRONTEND ^(open in browser^):
echo http://localhost:9050
echo.
echo BACKEND API:
echo http://localhost:9051
echo http://localhost:9051/api/v1
echo.
echo HOW TO START EVERY DAY:
echo 1. Laragon -^> Start All
echo 2. Double-click START.bat
echo 3. Open http://localhost:9050
echo.
echo HOW TO STOP:
echo Double-click STOP.bat
echo.
echo LOGINS:
echo Platform Admin: superadmin@pos.com / admin0101
echo Shop Owner:     admin@pos.com / password
echo Cashier:        cashier@pos.com / password
) > "%ROOT%\SHOPPOS-INFO.txt"

echo.
echo  ========================================
echo   SETUP COMPLETE
echo  ========================================
echo.
echo   FRONTEND ^(POS UI^):  http://localhost:9050
echo   BACKEND  ^(API^):     http://localhost:9051
echo   API base:           http://localhost:9051/api/v1
echo.
echo   NEXT: Double-click START.bat
echo   ^(Laragon MySQL must be running^)
echo.
echo   LOGINS:
echo   superadmin@pos.com / admin0101
echo   admin@pos.com / password
echo   cashier@pos.com / password
echo.
echo   Saved also in SHOPPOS-INFO.txt
echo  ========================================
echo.
pause
exit /b 0

:fail
echo.
echo [FAILED] Setup stopped. Fix the error above, then run SETUP.bat again.
echo.
cd /d "%ROOT%" 2>nul
pause
exit /b 1
