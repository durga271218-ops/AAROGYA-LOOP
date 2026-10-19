@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "PORT=5173"
title Aarogya Loop

:menu
cls
echo ========================================
echo   Aarogya Loop
echo ========================================
echo.
call :status
echo.
echo   1  Start
echo   2  Stop
echo   3  Install node modules
echo   4  Exit
echo.
set "CHOICE="
set /p CHOICE=Choose 1-4: 
if "%CHOICE%"=="1" goto start
if "%CHOICE%"=="2" goto stop
if "%CHOICE%"=="3" goto install
if "%CHOICE%"=="4" exit /b 0
echo.
echo Choose 1, 2, 3, or 4.
pause
goto menu

:status
set "RUNNING=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do set "RUNNING=1"
if "!RUNNING!"=="1" (
  echo Status: running at http://localhost:%PORT%/
) else (
  echo Status: stopped
)
exit /b 0

:node
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Install Node.js, then run this file again.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo npm was not found. Install Node.js, then run this file again.
  pause
  exit /b 1
)
exit /b 0

:ensure
if exist "node_modules\" exit /b 0
echo.
echo node_modules is missing. Installing...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed.
  pause
  exit /b 1
)
exit /b 0

:start
call :node
if errorlevel 1 goto menu
call :status
if "!RUNNING!"=="1" (
  echo.
  echo The project is already running.
  pause
  goto menu
)
call :ensure
if errorlevel 1 goto menu
echo.
echo Starting at http://localhost:%PORT%/
start "Aarogya Loop server" /D "%~dp0" cmd /k npm run dev -- --port %PORT% --strictPort
echo Opened in a new window.
pause
goto menu

:stop
echo.
set "STOPPED=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
  echo Stopping process %%P
  taskkill /PID %%P /T /F
  set "STOPPED=1"
)
if "!STOPPED!"=="0" echo Nothing is listening on port %PORT%.
echo.
pause
goto menu

:install
call :node
if errorlevel 1 goto menu
echo.
echo Installing node modules...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed.
) else (
  echo.
  echo Node modules are installed.
)
pause
goto menu
