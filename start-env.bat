@echo off
setlocal enabledelayedexpansion
title FluxIDE USB Portable Environment

:: Determine the directory where this script is located
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: If placed in 'fluxIDE APP', tools is at '..\tools'
if exist "%SCRIPT_DIR%\..\tools" (
    set "FLUX_ROOT=%SCRIPT_DIR%\.."
) else (
    set "FLUX_ROOT=%SCRIPT_DIR%"
)

pushd "%FLUX_ROOT%"
set "FLUX_ROOT=%CD%"
popd

set "FLUX_TOOLS=%FLUX_ROOT%\tools"
set "FLUX_APP=%FLUX_ROOT%\fluxIDE APP"

:: Prepend USB tools to PATH
set "PATH=%FLUX_TOOLS%\nodejs;%FLUX_TOOLS%\node_modules\.bin;%FLUX_TOOLS%\git\cmd;%FLUX_TOOLS%\bin;%FLUX_TOOLS%\graphify-env\Scripts;%PATH%"

:: Configure package manager caches on USB
set "PNPM_HOME=%FLUX_TOOLS%\node_modules\.bin"
set "pnpm_config_store_dir=%FLUX_TOOLS%\pnpm-store"
set "npm_config_cache=%FLUX_TOOLS%\npm-cache"

cd /d "%FLUX_APP%"

echo =======================================================
echo    FluxIDE USB Portable Development Environment
echo =======================================================
echo USB Root : %FLUX_ROOT%
echo Tools    : %FLUX_TOOLS%
echo Node     : %FLUX_TOOLS%\nodejs\node.exe
echo Git      : %FLUX_TOOLS%\git\cmd\git.exe
echo pnpm     : %FLUX_TOOLS%\node_modules\.bin\pnpm.cmd
echo Python   : %FLUX_TOOLS%\graphify-env\Scripts\python.exe
echo =======================================================
echo.
cmd /k
