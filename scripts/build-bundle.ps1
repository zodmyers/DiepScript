# Builds the single-file Tampermonkey bundle used by `tampermonkey/TamperScript.user.js`.
# Run from the repository root: `pwsh -File scripts/build-bundle.ps1`

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) {
    throw "Failed to determine script directory."
}
$projectRoot = Split-Path -Parent $scriptDir
if (-not $projectRoot) {
    throw "Failed to determine project root."
}

Set-Location $projectRoot

$files = @(
    "src/core/moduleLoader.js",
    "src/core/constants.js",
    "src/core/state.js",
    "src/core/math.js",
    "src/core/stats.js",
    "src/core/coordinates.js",
    "src/runtime/players.js",
    "src/features/visuals.js",
    "src/features/aimbot.js",
    "src/features/autofarm.js",
    "src/features/spinner.js",
    "src/features/fov.js",
    "src/features/stacking.js",
    "src/hooks/canvas.js",
    "src/hooks/input.js",
    "src/ui/menu.js",
    "src/runtime/gameLoop.js",
    "src/runtime/lifecycle.js",
    "src/main.js",
    "src/index.js"
)

$bundlePath = "dist/diepScript.bundle.js"

if (-not (Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist" | Out-Null
}

$header = @(
    "/*",
    " * DiepScript bundle (auto-generated)",
    " * Do not edit manually; regenerate via scripts/build-bundle.ps1.",
    " */",
    ""
)
$header | Set-Content $bundlePath

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        throw "Missing expected module: $file"
    }
    Add-Content $bundlePath "// ---- Begin $file"
    Get-Content $file | Add-Content $bundlePath
    Add-Content $bundlePath "// ---- End $file"
    Add-Content $bundlePath ""
}

Write-Host "Bundle written to $bundlePath"
