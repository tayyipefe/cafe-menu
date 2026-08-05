@echo off
chcp 65001 >nul
title La'mondes - Site Sunucusu
cd /d "%~dp0"

echo.
echo   ================================================
echo     La'mondes Cafe ^& Bakery
echo   ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   HATA: Node.js kurulu degil.
  echo.
  echo   https://nodejs.org adresinden indirip kurun,
  echo   sonra bu dosyaya tekrar cift tiklayin.
  echo.
  pause
  exit /b 1
)

echo   Sunucu baslatiliyor...
echo.
echo   Site   : http://localhost:4000
echo   Panel  : http://localhost:4000/admin/login
echo.
echo   Bu pencereyi KAPATMAYIN - kapatirsaniz site de kapanir.
echo   Durdurmak icin: Ctrl+C
echo.
echo   ================================================
echo.

rem Tarayici 2 saniye sonra acilsin (sunucu ayaga kalksin diye)
start "" /b cmd /c "timeout /t 2 >nul && start http://localhost:4000"

node sunucu.js

echo.
echo   Sunucu durdu.
pause
