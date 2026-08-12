# Starts the GB Messenger Docker Compose stack after safe local preflight checks.
# This script intentionally never prints values from .env.

[CmdletBinding()]
param(
    [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
    Write-Error $Message
    exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $projectRoot 'docker-compose.yml'
$envFile = Join-Path $projectRoot '.env'
$envExampleFile = Join-Path $projectRoot '.env.example'

if (-not (Test-Path -LiteralPath $composeFile -PathType Leaf)) {
    Fail "docker-compose.yml was not found in $projectRoot. Run this script from the project checkout."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Fail 'Docker CLI was not found. Install Docker Desktop (or Docker Engine with the Compose plugin), start it, then try again.'
}

try {
    & docker version --format '{{.Server.Version}}' *> $null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Fail 'Docker is not available. Start Docker Desktop (or the Docker daemon) and try again.'
}

try {
    & docker compose version *> $null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Fail 'Docker Compose v2 is not available. Install or enable the Docker Compose plugin, then try again.'
}

if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
    $hint = if (Test-Path -LiteralPath $envExampleFile -PathType Leaf) {
        'Create .env from .env.example, set the required values, and run this script again.'
    } else {
        'Create a .env file with the required configuration, then run this script again.'
    }
    Fail ".env was not found. $hint"
}

# Required by docker-compose.yml. Only variable names are reported; values are never read or displayed.
$requiredVariables = @('JWT_SECRET', 'TURN_REALM', 'TURN_EXTERNAL_IP', 'TURN_SHARED_SECRET')
$envKeys = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    $trimmed = $line.Trim()
    if ($trimmed -and -not $trimmed.StartsWith('#') -and $trimmed -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
        $envKeys[$matches[1]] = $matches[2].Trim()
    }
}

$missingVariables = @($requiredVariables | Where-Object { -not $envKeys.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envKeys[$_]) })
if ($missingVariables.Count -gt 0) {
    Fail ('.env is missing required non-empty variable(s): ' + ($missingVariables -join ', ') + '. Values were not displayed.')
}

$placeholderVariables = @()
foreach ($name in @('JWT_SECRET', 'TURN_SHARED_SECRET')) {
    if ($envKeys[$name] -match '(?i)replace_with|validation-only|your\.domain\.com|example\.com') {
        $placeholderVariables += $name
    }
}
if ($placeholderVariables.Count -gt 0) {
    Fail ('.env still appears to contain placeholder value(s) for: ' + ($placeholderVariables -join ', ') + '. Replace them with unique production secrets. Values were not displayed.')
}

Push-Location -LiteralPath $projectRoot
try {
    Write-Host 'Validating Docker Compose configuration...'
    & docker compose --env-file .env config -q
    if ($LASTEXITCODE -ne 0) { Fail 'Docker Compose configuration validation failed. Fix the reported configuration issue and try again.' }

    $upArgs = @('compose', '--env-file', '.env', 'up', '-d')
    if (-not $NoBuild) { $upArgs += '--build' }

    Write-Host 'Starting GB Messenger services: backend, frontend, caddy, coturn, backup...'
    & docker @upArgs
    if ($LASTEXITCODE -ne 0) { Fail 'Docker Compose could not start the stack. Review the Docker output above.' }

    Write-Host ''
    Write-Host 'Stack started. Useful follow-up commands:'
    Write-Host '  docker compose --env-file .env ps'
    Write-Host '  docker compose --env-file .env logs -f backend caddy coturn backup'
    Write-Host '  docker compose --env-file .env down'
    Write-Host 'Open https://<DOMAIN> after DNS, TLS, and firewall configuration are complete.'
} finally {
    Pop-Location
}
