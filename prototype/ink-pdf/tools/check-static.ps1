$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$requiredFiles = @(
  "index.html",
  "styles.css",
  "app.js",
  "sw.js",
  "manifest.webmanifest",
  "assets\icon.svg",
  "vendor\pdf.mjs",
  "vendor\pdf.worker.mjs",
  "vendor\PDFJS-LICENSE.txt"
)

$failures = [System.Collections.Generic.List[string]]::new()
foreach ($relativePath in $requiredFiles) {
  $candidate = Join-Path $root $relativePath
  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
    $failures.Add("Missing required file: $relativePath")
  }
}

$html = Get-Content -Raw -LiteralPath (Join-Path $root "index.html")
$app = Get-Content -Raw -LiteralPath (Join-Path $root "app.js")
$serviceWorker = Get-Content -Raw -LiteralPath (Join-Path $root "sw.js")

$referencedIds = [regex]::Matches($app, 'querySelector\("#([^"]+)"\)') |
  ForEach-Object { $_.Groups[1].Value } |
  Sort-Object -Unique

foreach ($id in $referencedIds) {
  if ($html -notmatch ('id="' + [regex]::Escape($id) + '"')) {
    $failures.Add("app.js references missing HTML id: $id")
  }
}

foreach ($shellFile in @("index.html", "styles.css", "app.js", "manifest.webmanifest")) {
  if ($serviceWorker -notmatch [regex]::Escape("./$shellFile")) {
    $failures.Add("Service worker does not cache: $shellFile")
  }
}

try {
  $null = Get-Content -Raw -LiteralPath (Join-Path $root "manifest.webmanifest") |
    ConvertFrom-Json
}
catch {
  $failures.Add("manifest.webmanifest is not valid JSON: $($_.Exception.Message)")
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Output "Static checks passed."
Write-Output "Verified $($requiredFiles.Count) required files."
Write-Output "Verified $($referencedIds.Count) DOM references."
