@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if "%~1"=="" goto :help
if /I "%~1"=="setup" goto :setup
if /I "%~1"=="start" goto :start
if /I "%~1"=="stop"  goto :stop
if /I "%~1"=="help"  goto :help
if /I "%~1"=="-h"    goto :help
if /I "%~1"=="--help" goto :help

echo Unknown command: %~1
echo.
goto :help

:setup
call "%~dp0SETUP.bat"
exit /b %ERRORLEVEL%

:start
call "%~dp0START.bat"
exit /b %ERRORLEVEL%

:stop
call "%~dp0STOP.bat"
exit /b %ERRORLEVEL%

:help
echo.
echo ShopPOS terminal commands
echo =========================
echo.
echo   pos setup     First-time install ^(env, migrate, seed, build^)
echo   pos start     Start Backend :9051 + Frontend :9050
echo   pos stop      Stop both
echo.
echo Examples:
echo   cd pos-system
echo   pos setup
echo   pos start
echo.
echo URLs after start:
echo   Frontend  http://localhost:9050
echo   Backend   http://localhost:9051
echo.
exit /b 0
