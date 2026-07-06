@echo off
setlocal
cd /d "%~dp0"
echo Tavern Notes local installer
echo.
node "%~dp0install-tavern-notes.js"
echo.
echo If the installer says it completed, restart SillyTavern and refresh the browser page.
echo.
pause
