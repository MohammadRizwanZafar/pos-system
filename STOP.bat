@echo off
setlocal EnableExtensions
title ShopPOS - Stop

echo.
echo Stopping ShopPOS ^(ports 9050 and 9051^)...
echo.

for %%P in (9050 9051) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
        echo Killing PID %%A on port %%P
        taskkill /PID %%A /F >nul 2>&1
    )
)

echo.
echo Done. Backend and Frontend stopped.
echo.
pause
exit /b 0
