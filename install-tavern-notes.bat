@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 酒馆笔记一键安装器
echo.
node "%~dp0install-tavern-notes.js"
echo.
echo 如果上面显示“安装完成”，请重启 SillyTavern，然后刷新浏览器页面。
echo.
pause
