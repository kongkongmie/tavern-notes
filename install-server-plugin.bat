@echo off
chcp 65001 >nul
cd /d "%~dp0"
node "%~dp0install-server-plugin.js"
echo.
echo If the installer says it completed, restart SillyTavern and refresh the browser page.
echo.
pause
