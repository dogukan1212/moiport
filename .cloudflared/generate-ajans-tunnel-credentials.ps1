param(
  [string]$TunnelName = "ajans-tunnel"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$cfDir = $scriptDir

if (-not (Test-Path $cfDir)) {
  New-Item -ItemType Directory -Path $cfDir | Out-Null
}

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Error "cloudflared CLI bulunamadı. Lütfen 'cloudflared' komutunun çalıştığından emin olun."
}

Write-Host "Tünel token alınıyor: $TunnelName..."
$token = cloudflared tunnel token $TunnelName

Write-Host "Token decode ediliyor..."
$bytes   = [Convert]::FromBase64String($token)
$jsonStr = [Text.Encoding]::UTF8.GetString($bytes)
$jsonObj = $jsonStr | ConvertFrom-Json

$cred = [PSCustomObject]@{
  AccountTag   = $jsonObj.a
  TunnelSecret = $jsonObj.s
  TunnelID     = $jsonObj.t
  Endpoint     = ""
}

$credPath = Join-Path $cfDir "$TunnelName.json"
$credJson = $cred | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText(
  $credPath,
  $credJson,
  New-Object System.Text.UTF8Encoding($false)
)

Write-Host "Credentials yazıldı:" $credPath
