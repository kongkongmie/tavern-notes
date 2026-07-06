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

function Test-SillyTavernRoot($Path) {
    if (-not $Path) {
        return $false
    }

    return (Test-Path -LiteralPath (Join-Path $Path "package.json")) -and
        (Test-Path -LiteralPath (Join-Path $Path "public\scripts\extensions")) -and
        (Test-Path -LiteralPath (Join-Path $Path "plugins"))
}

function Get-SillyTavernRootFromPath($Candidate) {
    if (-not $Candidate) {
        return $null
    }

    $path = $Candidate.Trim().Trim('"').Trim("'")

    if (Test-Path -LiteralPath $path) {
        $item = Get-Item -LiteralPath $path
        if (-not $item.PSIsContainer) {
            $path = Split-Path -Parent $item.FullName
        } else {
            $path = $item.FullName
        }
    } elseif ([System.IO.Path]::HasExtension($path)) {
        $path = Split-Path -Parent $path
    }

    while ($path) {
        if (Test-SillyTavernRoot $path) {
            return $path
        }

        $parent = Split-Path -Parent $path
        if (-not $parent -or $parent -eq $path) {
            return $null
        }
        $path = $parent
    }

    return $null
}

function Get-PathsFromText($Text) {
    if (-not $Text) {
        return @()
    }

    $matches = [regex]::Matches($Text, '[A-Za-z]:\\(?:[^<>:"|?*\r\n]+\\)*[^<>:"|?*\r\n]*')
    return @($matches | ForEach-Object {
        $_.Value.Trim().Trim('"').Trim("'").TrimEnd(")", " ")
    })
}

function Get-RunningSillyTavernRoot {
    $processes = @(Get-CimInstance Win32_Process)
    $byId = @{}
    foreach ($process in $processes) {
        $byId[[int]$process.ProcessId] = $process
    }

    $candidateTexts = New-Object System.Collections.Generic.List[string]

    foreach ($process in $processes) {
        $commandLine = [string]$process.CommandLine
        if ($commandLine -match 'SillyTavern|server\.js|Start\.bat|start\.sh|npm.*start') {
            $candidateTexts.Add($commandLine)

            $parentId = [int]$process.ParentProcessId
            for ($i = 0; $i -lt 4 -and $byId.ContainsKey($parentId); $i++) {
                $parent = $byId[$parentId]
                if ($parent.CommandLine) {
                    $candidateTexts.Add([string]$parent.CommandLine)
                }
                $parentId = [int]$parent.ParentProcessId
            }
        }
    }

    $paths = @($candidateTexts | ForEach-Object { Get-PathsFromText $_ } | Select-Object -Unique)
    foreach ($candidate in $paths) {
        $root = Get-SillyTavernRootFromPath $candidate
        if ($root) {
            return $root
        }
    }

    return $null
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
    $sillyTavernRoot = Get-RunningSillyTavernRoot
    if ($sillyTavernRoot) {
        Write-Step "Detected SillyTavern: $sillyTavernRoot"
    } else {
        Write-Step "Could not detect SillyTavern automatically; the installer may ask for the path."
    }
    Write-Step "Running installer..."
    if ($sillyTavernRoot) {
        & $nodePath $installer.FullName $sillyTavernRoot
    } else {
        & $nodePath $installer.FullName
    }

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
