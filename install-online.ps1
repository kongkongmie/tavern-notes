$ErrorActionPreference = "Stop"

$repoZip = "https://github.com/kongkongmie/tavern-notes/archive/refs/heads/main.zip"
$tempRoot = Join-Path $env:TEMP ("tavern-notes-online-" + [DateTime]::Now.ToString("yyyyMMddHHmmss"))
$zipPath = Join-Path $tempRoot "tavern-notes.zip"
$extractPath = Join-Path $tempRoot "extract"

function Write-Step($message) {
    Write-Host "[Tavern Notes] $message" -ForegroundColor Cyan
}

function Get-NodePath {
    $runningNode = Get-CimInstance Win32_Process |
        Where-Object {
            $_.Name -ieq "node.exe" -and
            $_.ExecutablePath -and
            $_.CommandLine -match "server\.js|SillyTavern|Start\.bat|npm.*start"
        } |
        Select-Object -First 1

    if ($runningNode -and (Test-Path -LiteralPath $runningNode.ExecutablePath)) {
        return $runningNode.ExecutablePath
    }

    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        return $nodeCommand.Source
    }

    throw "Node.js was not found. Please start SillyTavern first, or install Node.js."
}

try {
    Write-Host "Tavern Notes online installer" -ForegroundColor Yellow
    Write-Host "Keep your SillyTavern console running while installing."
    Write-Host ""

    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

    Write-Step "Downloading latest package..."
    Invoke-WebRequest -Uri $repoZip -OutFile $zipPath

    Write-Step "Extracting package..."
    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force

    $installer = Get-ChildItem -LiteralPath $extractPath -Filter "install-tavern-notes.js" -Recurse | Select-Object -First 1
    if (-not $installer) {
        throw "install-tavern-notes.js was not found in the downloaded package."
    }

    $nodePath = Get-NodePath
    Write-Step "Using Node.js: $nodePath"
    Write-Step "Running installer..."
    & $nodePath $installer.FullName

    if ($LASTEXITCODE -ne 0) {
        throw "Installer returned exit code $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "Installation completed. Restart SillyTavern, then refresh the browser page." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "If auto-detection failed, download the zip package and run install-tavern-notes.bat from the extracted folder."
    exit 1
}
