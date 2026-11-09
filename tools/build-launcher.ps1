param(
  [string]$Version = ''
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $Version) {
  $Version = (Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
}

$installer = Join-Path $root "release\TAS Widget Setup $Version.exe"
$portable = Join-Path $root "release\TAS Widget $Version Portable.exe"
$output = Join-Path $root "release\TAS Widget $Version.exe"
$icon = Join-Path $root 'resources\icon.ico'

if (-not (Test-Path $installer)) { throw "Не найден установщик: $installer" }
if (-not (Test-Path $portable)) { throw "Не найдена портативная версия: $portable" }

$makensis = Get-ChildItem (Join-Path $env:LOCALAPPDATA 'electron-builder\Cache') -Recurse -Filter makensis.exe -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName
if (-not $makensis) { throw 'Не найден makensis.exe в кэше electron-builder' }

function NsisPath([string]$path) {
  return $path.Replace('\', '\\')
}

$nsi = @"
Unicode true

Name "TAS Widget $Version"
OutFile "$(NsisPath $output)"
InstallDir "`$TEMP\TASWidgetLauncher"
RequestExecutionLevel user
SilentInstall silent
SetCompressor /SOLID lzma
BrandingText "TAS Widget $Version"
Icon "$(NsisPath $icon)"

Section
  InitPluginsDir
  SetOutPath "`$PLUGINSDIR"
  File "/oname=installer.exe" "$(NsisPath $installer)"
  File "/oname=portable.exe" "$(NsisPath $portable)"

  MessageBox MB_YESNOCANCEL|MB_ICONQUESTION "TAS Widget $Version`$\r`$\n`$\r`$\nДа — установить в систему (ярлыки, удаление через «Программы и компоненты»).`$\r`$\nНет — запустить портативную версию без установки.`$\r`$\nОтмена — выйти." IDYES doInstall IDNO doPortable
  Goto done

  doInstall:
    ExecWait '"`$PLUGINSDIR\installer.exe"'
    Goto done

  doPortable:
    ExecWait '"`$PLUGINSDIR\portable.exe"'
    Goto done

  done:
SectionEnd
"@

$tmp = Join-Path $env:TEMP "tas-launcher-$Version.nsi"
Set-Content -Path $tmp -Value $nsi -Encoding UTF8
& $makensis $tmp
if ($LASTEXITCODE -ne 0) { throw "makensis завершился с кодом $LASTEXITCODE" }
Write-Host "Готово: $output"
