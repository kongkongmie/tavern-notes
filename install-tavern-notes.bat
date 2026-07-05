@echo off
setlocal
chcp 65001 >nul
echo Tavern Notes online installer
echo Keep your SillyTavern console running while installing.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-RestMethod 'https://raw.githubusercontent.com/kongkongmie/tavern-notes/main/install-online.ps1' | Invoke-Expression"
echo.
echo Press any key to close this window.
pause >nul
