<#
.SYNOPSIS
    FluxIDE USB Portable Environment Launcher (PowerShell)
#>

$ScriptDir = $PSScriptRoot
if (Test-Path "$ScriptDir\..\tools") {
    $FluxRoot = (Resolve-Path "$ScriptDir\..").Path
} else {
    $FluxRoot = (Resolve-Path "$ScriptDir").Path
}

$FluxTools = Join-Path $FluxRoot "tools"
$FluxApp = Join-Path $FluxRoot "fluxIDE APP"

# Prepend USB tools to session PATH
$env:PATH = "$FluxTools\nodejs;$FluxTools\node_modules\.bin;$FluxTools\git\cmd;$FluxTools\bin;$FluxTools\graphify-env\Scripts;$env:PATH"

# Configure package manager stores/caches on USB
$env:PNPM_HOME = "$FluxTools\node_modules\.bin"
$env:pnpm_config_store_dir = "$FluxTools\pnpm-store"
$env:npm_config_cache = "$FluxTools\npm-cache"

Set-Location $FluxApp

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   ⚡ FluxIDE USB Portable Environment (PowerShell) ⚡" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "USB Root : $FluxRoot"
Write-Host "Tools    : $FluxTools"
Write-Host "Node     : $FluxTools\nodejs\node.exe"
Write-Host "Git      : $FluxTools\git\cmd\git.exe"
Write-Host "pnpm     : $FluxTools\node_modules\.bin\pnpm.cmd"
Write-Host "Python   : $FluxTools\graphify-env\Scripts\python.exe"
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
