$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "www"

if (Test-Path $out) {
  Remove-Item -LiteralPath $out -Recurse -Force
}

New-Item -ItemType Directory -Path $out | Out-Null
New-Item -ItemType Directory -Path (Join-Path $out "assets") | Out-Null

Copy-Item -LiteralPath (Join-Path $root "index.html") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "customer.html") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "styles.css") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "customer.css") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "app.js") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "customer.js") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "manifest.webmanifest") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "sw.js") -Destination $out
Copy-Item -LiteralPath (Join-Path $root "assets\icon.svg") -Destination (Join-Path $out "assets\icon.svg")

$apiBase = if ($env:TICKETOPS_API_BASE) { $env:TICKETOPS_API_BASE } else { "" }
$configJson = @{ apiBase = $apiBase } | ConvertTo-Json -Compress
Set-Content -LiteralPath (Join-Path $out "frontend-config.js") -Value "window.TICKETOPS_CONFIG = $configJson;" -Encoding utf8

Write-Output "Web assets copied to $out"
