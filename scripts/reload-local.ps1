$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "TicketOps local reload" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Building web assets..."
npm.cmd run build:web

$listeners = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
  $processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  Write-Host ""
  Write-Host "Port 3000 is currently used by process id(s): $($processIds -join ', ')" -ForegroundColor Yellow
  $confirm = Read-Host "Type STOP to stop these process(es) and reload TicketOps"
  if ($confirm -ne "STOP") {
    Write-Host "Cancelled. Existing server was not changed."
    exit 0
  }

  foreach ($processId in $processIds) {
    Stop-Process -Id $processId -Force
  }
}

Write-Host ""
Write-Host "Starting TicketOps server..."
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $root -WindowStyle Hidden

Start-Sleep -Seconds 2

try {
  $health = Invoke-RestMethod "http://localhost:3000/api/health"
  Write-Host ""
  Write-Host "Server is running." -ForegroundColor Green
  Write-Host "Storage: $($health.storage)"
} catch {
  Write-Host ""
  Write-Host "Server started, but health check did not respond yet." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Open these URLs:"
Write-Host "  Main app:        http://localhost:3000/"
Write-Host "  Customer portal: http://localhost:3000/customer.html"
Write-Host ""
