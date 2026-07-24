param(
  [int]$Port = 4173,
  [string]$BindAddress = "127.0.0.1"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$prefix = "http://127.0.0.1:$Port/"
$ipAddress = if ($BindAddress -eq "0.0.0.0") {
  [System.Net.IPAddress]::Any
}
else {
  [System.Net.IPAddress]::Parse($BindAddress)
}

$listener = [System.Net.Sockets.TcpListener]::new($ipAddress, $Port)
$listener.Start()

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".mjs" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".svg" = "image/svg+xml"
  ".pdf" = "application/pdf"
}

Write-Output "Studio5 prototype: $prefix"
Write-Output "Serving: $root"
if ($BindAddress -eq "0.0.0.0") {
  $lanAddresses = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces() |
    Where-Object {
      $_.OperationalStatus -eq [System.Net.NetworkInformation.OperationalStatus]::Up -and
      $_.NetworkInterfaceType -ne [System.Net.NetworkInformation.NetworkInterfaceType]::Loopback
    } |
    ForEach-Object { $_.GetIPProperties().UnicastAddresses } |
    ForEach-Object { $_.Address } |
    Where-Object {
      $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
      -not [System.Net.IPAddress]::IsLoopback($_) -and
      -not $_.ToString().StartsWith("169.254.")
    } |
    Select-Object -Unique

  Write-Output ""
  Write-Output "Open one of these addresses on a device using the same Wi-Fi:"
  foreach ($lanAddress in $lanAddresses) {
    Write-Output "  http://$($lanAddress):$Port/"
  }
  if (-not $lanAddresses) {
    Write-Output "  No Wi-Fi address was found automatically. Run ipconfig and use the IPv4 Address."
  }
  Write-Output ""
  Write-Output "This local test address is not public and works while this window stays open."
}
Write-Output "Press Ctrl+C to stop."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new(
        $stream,
        [System.Text.Encoding]::ASCII,
        $false,
        1024,
        $true
      )
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        continue
      }

      while (($headerLine = $reader.ReadLine()) -ne "") {
        if ($null -eq $headerLine) {
          break
        }
      }

      $requestParts = $requestLine.Split(" ")
      $method = $requestParts[0]
      $requestUri = [System.Uri]::new("http://127.0.0.1" + $requestParts[1])
      $relativePath = [System.Uri]::UnescapeDataString(
        $requestUri.AbsolutePath.TrimStart("/")
      )

      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $relativePath = "index.html"
      }

      $candidate = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
      $status = "200 OK"
      $contentType = "application/octet-stream"
      $bytes = [byte[]]::new(0)

      if (-not $candidate.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $status = "403 Forbidden"
      }
      elseif (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        $status = "404 Not Found"
      }
      else {
        $extension = [System.IO.Path]::GetExtension($candidate).ToLowerInvariant()
        if ($mimeTypes.ContainsKey($extension)) {
          $contentType = $mimeTypes[$extension]
        }
        $bytes = [System.IO.File]::ReadAllBytes($candidate)
      }

      $header = (
        "HTTP/1.1 $status`r`n" +
        "Content-Type: $contentType`r`n" +
        "Content-Length: $($bytes.Length)`r`n" +
        "Cache-Control: no-store`r`n" +
        "Connection: close`r`n`r`n"
      )
      $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
      $stream.Write($headerBytes, 0, $headerBytes.Length)

      if ($method -ne "HEAD" -and $bytes.Length -gt 0) {
        $stream.Write($bytes, 0, $bytes.Length)
      }
      $stream.Flush()
    }
    catch {
      Write-Warning $_.Exception.Message
    }
    finally {
      $client.Dispose()
    }
  }
}
finally {
  $listener.Stop()
}
