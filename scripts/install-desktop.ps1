# FluxIDE - Windows Desktop & Start Menu Registration
# Registers FluxIDE so users can launch it from Start Menu or Desktop.

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Split-Path -Parent $ScriptDir
$TargetBat = Join-Path $AppDir "FluxIDE-Desktop.bat"

Write-Host "`nRegistering FluxIDE Desktop Application in Windows..." -ForegroundColor Cyan

# 1. Start Menu Shortcut
$StartMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\FluxIDE"
if (-not (Test-Path $StartMenuDir)) {
    New-Item -ItemType Directory -Path $StartMenuDir -Force | Out-Null
}

$WshShell = New-Object -ComObject WScript.Shell

$StartMenuLnk = Join-Path $StartMenuDir "FluxIDE.lnk"
$Shortcut = $WshShell.CreateShortcut($StartMenuLnk)
$Shortcut.TargetPath = $TargetBat
$Shortcut.WorkingDirectory = $AppDir
$Shortcut.Description = "FluxIDE - AI Software Engineering IDE"
$Shortcut.WindowStyle = 7
$Shortcut.Save()

Write-Host "Created Start Menu shortcut: $StartMenuLnk" -ForegroundColor Green

# 2. Desktop Shortcut
$DesktopDir = [Environment]::GetFolderPath("Desktop")
$DesktopLnk = Join-Path $DesktopDir "FluxIDE.lnk"
$ShortcutDesk = $WshShell.CreateShortcut($DesktopLnk)
$ShortcutDesk.TargetPath = $TargetBat
$ShortcutDesk.WorkingDirectory = $AppDir
$ShortcutDesk.Description = "FluxIDE - AI Software Engineering IDE"
$ShortcutDesk.WindowStyle = 7
$ShortcutDesk.Save()

Write-Host "Created Desktop shortcut: $DesktopLnk" -ForegroundColor Green
Write-Host "`nFluxIDE registration complete! You can now press Windows key and type 'FluxIDE' to launch.`n" -ForegroundColor Cyan
