$source = Split-Path -Parent $PSScriptRoot
$zip = Join-Path (Split-Path -Parent $source) "souqi_marketplace_final_ready.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "$source\*" -DestinationPath $zip -Force
Write-Host "Created ZIP:" $zip
