param(
    [string]$SillyTavernRoot = 'H:\sillytavern\SillyTavern',
    [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

function Resolve-SafeRoot([string]$Path) {
    $resolved = (Resolve-Path -LiteralPath $Path).Path.TrimEnd('\')
    $required = @(
        (Join-Path $resolved 'public'),
        (Join-Path $resolved 'public\scripts\extensions\third-party')
    )
    foreach ($item in $required) {
        if (-not (Test-Path -LiteralPath $item -PathType Container)) {
            throw "This does not look like a SillyTavern root: $resolved"
        }
    }
    return $resolved
}

function Remove-ExactDirectory([string]$Root, [string]$Target) {
    $rootPrefix = $Root.TrimEnd('\') + '\'
    $fullTarget = [System.IO.Path]::GetFullPath($Target).TrimEnd('\')
    if (-not $fullTarget.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove a path outside SillyTavern: $fullTarget"
    }

    if (-not (Test-Path -LiteralPath $fullTarget)) {
        Write-Host "Already absent: $fullTarget"
        return
    }

    if ($WhatIf) {
        Write-Host "Would remove: $fullTarget"
        return
    }

    Remove-Item -LiteralPath $fullTarget -Recurse -Force
    Write-Host "Removed: $fullTarget"
}

$root = Resolve-SafeRoot $SillyTavernRoot
$extensions = Join-Path $root 'public\scripts\extensions\third-party'

Remove-ExactDirectory $root (Join-Path $extensions 'tavern-notes')
Remove-ExactDirectory $root (Join-Path $extensions 'tavern-notes-lite')
Remove-ExactDirectory $root (Join-Path $root 'plugins\tavern-notes')

if (-not $WhatIf) {
    Write-Host ''
    Write-Host 'Local Tavern Notes installations were removed.'
    Write-Host 'Restart SillyTavern before reinstalling from GitHub.'
}
