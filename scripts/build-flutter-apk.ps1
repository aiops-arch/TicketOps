$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$mobile = Join-Path $root "mobile_flutter"
$flutterRoot = "C:\Users\SPC1\.puro\envs\stable\flutter"
$dart = "C:\Users\SPC1\.puro\shared\caches\59aa584fdf100e6c78c785d8a5b565d1de4b48ab\dart-sdk\bin\dart.exe"
$apiBase = if ($env:TICKETOPS_API_BASE) { $env:TICKETOPS_API_BASE } else { "https://ticketops-api.onrender.com" }

if (!(Test-Path $dart)) {
  throw "Dart executable not found. Install Flutter first."
}

$env:FLUTTER_ROOT = $flutterRoot
$env:PATH = "C:\Users\SPC1\.puro\shared\caches\59aa584fdf100e6c78c785d8a5b565d1de4b48ab\dart-sdk\bin;$env:PATH"

$cache = Join-Path $flutterRoot "bin\cache"
$engine = (Get-Content -Raw (Join-Path $flutterRoot "bin\internal\engine.version")).Trim()
New-Item -ItemType Directory -Force -Path $cache | Out-Null
if (!(Test-Path (Join-Path $cache "engine.stamp"))) {
  Set-Content -Path (Join-Path $cache "engine.stamp") -Value $engine -NoNewline
}
if (!(Test-Path (Join-Path $cache "engine.realm"))) {
  Set-Content -Path (Join-Path $cache "engine.realm") -Value "" -NoNewline
}
if (!(Test-Path (Join-Path $cache "dart-sdk"))) {
  New-Item -ItemType Junction -Path (Join-Path $cache "dart-sdk") -Target "C:\Users\SPC1\.puro\shared\caches\59aa584fdf100e6c78c785d8a5b565d1de4b48ab\dart-sdk" | Out-Null
}

Push-Location $mobile
try {
  & $dart "$flutterRoot\packages\flutter_tools\bin\flutter_tools.dart" pub get
  & $dart "$flutterRoot\packages\flutter_tools\bin\flutter_tools.dart" build apk --release --dart-define="TICKETOPS_API_BASE=$apiBase"
} finally {
  Pop-Location
}

$apk = Join-Path $mobile "build\app\outputs\flutter-apk\app-release.apk"
if (Test-Path $apk) {
  Copy-Item -LiteralPath $apk -Destination (Join-Path $root "TicketOps-Flutter-release.apk") -Force
  Write-Host "APK ready: $root\TicketOps-Flutter-release.apk"
} else {
  throw "APK was not created."
}
