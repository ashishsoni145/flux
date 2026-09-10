@echo off
setlocal enabledelayedexpansion

:: Resolve portable paths
set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
for %%I in ("%APP_DIR%\..") do set "FLUX_ROOT=%%~fI"
set "FLUX_TOOLS=%FLUX_ROOT%\tools"

:: Configure environment for portable execution
set "PATH=%FLUX_TOOLS%\nodejs;%FLUX_TOOLS%\node_modules\.bin;%FLUX_TOOLS%\git\cmd;%FLUX_TOOLS%\bin;%FLUX_TOOLS%\graphify-env\Scripts;%PATH%"
set "FLUX_PORT=48100"

echo.
echo ====================================================
echo   ⚡ Starting FluxIDE Desktop IDE...
echo ====================================================
echo.

:: 1. Launch daemon supervisor in background if not already active
cd /d "%APP_DIR%"
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:48100/health' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FluxIDE] Starting fluxd platform daemon in background...
    start /b "" node packages/engine/dist/index.js > nul 2>&1
    timeout /t 2 /nobreak > nul
) else (
    echo [FluxIDE] fluxd daemon is already active.
)

:: 2. Launch Desktop IDE in native standalone app mode
set "EDGE_EXE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "!EDGE_EXE!" set "EDGE_EXE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

set "CHROME_EXE=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "!CHROME_EXE!" set "CHROME_EXE=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

set "PROFILE_DIR=%APP_DIR%\.desktop-profile"

if exist "!EDGE_EXE!" (
    echo [FluxIDE] Launching standalone window via Edge app mode...
    start "" "!EDGE_EXE!" --app="http://127.0.0.1:48100/desktop" --window-size=1440,900 --user-data-dir="!PROFILE_DIR!"
) else if exist "!CHROME_EXE!" (
    echo [FluxIDE] Launching standalone window via Chrome app mode...
    start "" "!CHROME_EXE!" --app="http://127.0.0.1:48100/desktop" --window-size=1440,900 --user-data-dir="!PROFILE_DIR!"
) else (
    echo [FluxIDE] Launching Desktop IDE in default browser...
    start "" "http://127.0.0.1:48100/desktop"
)

echo ⚡ FluxIDE Desktop IDE launched!
echo.
exit /b 0
