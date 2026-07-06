@echo off
setlocal
echo Tavern Notes online installer
echo Keep your SillyTavern console running while installing.
echo.
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=%windir%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" (
    echo Windows PowerShell was not found.
    echo Please download the full zip package and run Install-Tavern-Notes.bat from the extracted folder.
    echo.
    pause
    exit /b 1
)
"%PS%" -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-RestMethod 'https://raw.githubusercontent.com/kongkongmie/tavern-notes/main/install-online.ps1' | Invoke-Expression"
echo.
echo Press any key to close this window.
pause >nul
