@echo off
echo ========================================
echo   INICIANDO BACKEND SERVER
echo ========================================
echo.
cd /d "%~dp0"
echo Directorio: %CD%
echo.
echo Iniciando servidor en puerto 3001...
echo NO CERRAR ESTA VENTANA
echo.
node src/server.js
pause

