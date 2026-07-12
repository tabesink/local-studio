#Requires -Version 5.1
<#
.SYNOPSIS
  Host-native Context Engine dev stack for Windows (backend + frontend).

.DESCRIPTION
  PowerShell equivalent of scripts/dev.sh. Expects a local Python venv, frontend
  dependencies, and .env.stack.local. Starts compose postgres only (not the full
  stack) when local Postgres is not already reachable, then runs host-native
  backend + frontend.

.EXAMPLE
  .\scripts\dev.ps1

.EXAMPLE
  $env:BACKEND_PORT = "8001"; $env:FRONTEND_PORT = "3003"; .\scripts\dev.ps1
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$EnvFile = if ($env:ENV_FILE) { $env:ENV_FILE } else { Join-Path $RootDir ".env.stack.local" }
$PythonBin = if ($env:PYTHON_BIN) { $env:PYTHON_BIN } else { Join-Path $RootDir ".venv\Scripts\python.exe" }
$BackendHost = if ($env:BACKEND_HOST) { $env:BACKEND_HOST } else { "127.0.0.1" }
$BackendPortExplicit = $env:BACKEND_PORT
$FrontendPortExplicit = $env:FRONTEND_PORT
$BackendPort = if ($BackendPortExplicit) { [int]$BackendPortExplicit } else { 8000 }
$FrontendPort = if ($FrontendPortExplicit) { [int]$FrontendPortExplicit } else { 3002 }
$FrontendMode = if ($env:FRONTEND_MODE) { $env:FRONTEND_MODE } else { "dev" }
$ContextEngineApiBaseSet = [bool]$env:CONTEXT_ENGINE_API_BASE
$ContextEngineApiBase = if ($env:CONTEXT_ENGINE_API_BASE) { $env:CONTEXT_ENGINE_API_BASE } else { "http://${BackendHost}:$BackendPort" }

$script:BackendProcess = $null
$script:FrontendProcess = $null

function Write-DevError {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Write-DevWarning {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
}

function Write-DevHint {
    param([string]$Message)
    Write-Host $Message -ForegroundColor DarkGray
}

function Import-EnvFile {
    param(
        [string]$Path,
        [switch]$Force
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = ($_ -replace '#.*$', '').Trim()
        if ([string]::IsNullOrWhiteSpace($line) -or $line -notmatch '=') {
            return
        }

        $eqIndex = $line.IndexOf('=')
        $key = $line.Substring(0, $eqIndex).Trim()
        $value = $line.Substring($eqIndex + 1).Trim()
        $value = $value.Trim('"').Trim("'")

        if ([string]::IsNullOrWhiteSpace($key)) {
            return
        }

        # Prefer process-scope only. GetEnvironmentVariable() without a target can
        # see User/Machine values and skip loading the local file.
        $existing = [Environment]::GetEnvironmentVariable($key, "Process")
        if ($Force -or [string]::IsNullOrEmpty($existing)) {
            Set-Item -Path "Env:$key" -Value $value
        }
    }
}

function Test-PlaceholderValue {
    param([string]$Value)

    return [string]::IsNullOrWhiteSpace($Value) -or
        $Value -eq "<set locally>" -or
        $Value -eq "<set-locally>"
}

function Get-PortListenerPid {
    param([int]$Port)

    $matches = netstat -ano | Select-String -Pattern ":[ ]*$Port[ ]" | Select-String "LISTENING"
    foreach ($match in $matches) {
        $parts = ($match.Line -split '\s+') | Where-Object { $_ -ne "" }
        if ($parts.Count -ge 1) {
            $pidText = $parts[-1]
            if ($pidText -match '^\d+$') {
                return [int]$pidText
            }
        }
    }

    return $null
}

function Test-PortInUse {
    param([int]$Port)

    return $null -ne (Get-PortListenerPid -Port $Port)
}

function Resolve-DevPort {
    param(
        [string]$Name,
        [int]$Preferred,
        [string]$Explicit
    )

    $port = $Preferred
    $attempts = 0
    $maxAttempts = 20

    if ($Explicit) {
        if (Test-PortInUse -Port $port) {
            $listenerPid = Get-PortListenerPid -Port $port
            Write-DevError "Port $port is already in use ($Name)."
            if ($listenerPid) {
                Get-Process -Id $listenerPid -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, Path -AutoSize
            }
            Write-DevHint "Stop that process or choose another port, for example:"
            Write-DevHint '  $env:BACKEND_PORT = "8001"; $env:FRONTEND_PORT = "3003"; .\scripts\dev.ps1'
            exit 1
        }
        return $port
    }

    while ((Test-PortInUse -Port $port) -and ($attempts -lt $maxAttempts)) {
        if ($attempts -eq 0) {
            Write-DevWarning "Port $Preferred is in use ($Name); trying alternatives..."
        }
        $port += 1
        $attempts += 1
    }

    if (Test-PortInUse -Port $port) {
        Write-DevError "Could not find a free $Name port near $Preferred."
        exit 1
    }

    if ($port -ne $Preferred) {
        Write-DevWarning "Using $Name port $port (default $Preferred was busy)."
    }

    return $port
}

function Test-DockerCliAvailable {
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    return $null -ne $dockerCmd
}

function Test-DockerDaemonRunning {
    if (-not (Test-DockerCliAvailable)) {
        return $false
    }

    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & docker info *> $null
        return $LASTEXITCODE -eq 0
    }
    finally {
        $ErrorActionPreference = $oldEap
    }
}

function Test-TcpPortOpen {
    param(
        [string]$HostName,
        [int]$Port,
        [int]$TimeoutMs = 1500
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($HostName, $Port, $null, $null)
        $completed = $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
        if (-not $completed) {
            return $false
        }
        $client.EndConnect($async)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Close()
    }
}

function Assert-RuntimeFiles {
    $missing = New-Object System.Collections.Generic.List[string]

    if (-not (Test-Path -LiteralPath $PythonBin)) {
        $missing.Add("Python venv at $PythonBin")
    }

    $frontendModules = Join-Path $RootDir "frontend\node_modules"
    if (-not (Test-Path -LiteralPath $frontendModules)) {
        $missing.Add("frontend dependencies at $frontendModules")
    }

    if (-not (Test-Path -LiteralPath $EnvFile)) {
        $missing.Add("environment file at $EnvFile")
    }

    $composeFile = Join-Path $RootDir "compose.stack.yml"
    if (-not (Test-Path -LiteralPath $composeFile)) {
        $missing.Add("compose fixture at $composeFile")
    }

    if ($missing.Count -gt 0) {
        Write-DevError "Missing required runtime files for host-native dev:"
        foreach ($item in $missing) {
            Write-Host "  - $item" -ForegroundColor Red
        }
        Write-Host ""
        Write-DevHint "Typical setup on Windows:"
        Write-DevHint "  py -3 -m venv .venv"
        Write-DevHint "  .\.venv\Scripts\python.exe -m pip install -e '.[test]'"
        Write-DevHint "  cd frontend; npm ci"
        Write-DevHint "  Copy-Item .env.stack.example .env.stack.local"
        Write-DevHint "  Edit .env.stack.local with real local values (not placeholders)."
        exit 1
    }
}

function Get-ComposePostgresArgs {
    param([switch]$ForceRecreate)

    $composeFile = Join-Path $RootDir "compose.stack.yml"
    $composeArgs = @(
        "compose",
        "--env-file", $EnvFile,
        "-f", $composeFile,
        "-p", "context_engine_stack",
        "up", "-d"
    )
    if ($ForceRecreate) {
        $composeArgs += "--force-recreate"
    }
    $composeArgs += "postgres"
    # Unary comma prevents PowerShell from unrolling the array on return.
    return ,$composeArgs
}

function Test-PostgresAcceptingConnections {
    param(
        [string]$HostName,
        [int]$Port,
        [string]$UserName,
        [string]$Password,
        [string]$Database
    )

    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $PythonBin -c @"
import sys
import psycopg
try:
    with psycopg.connect(
        host='$HostName',
        port=$Port,
        user='$UserName',
        password='$Password',
        dbname='$Database',
        connect_timeout=2,
    ) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT 1')
            cur.fetchone()
except Exception:
    sys.exit(1)
sys.exit(0)
"@
        return $LASTEXITCODE -eq 0
    }
    finally {
        $ErrorActionPreference = $oldEap
    }
}

function Wait-PostgresReady {
    param(
        [string]$HostName,
        [int]$Port,
        [string]$UserName,
        [string]$Password,
        [string]$Database,
        [int]$TimeoutSeconds = 90
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-PostgresAcceptingConnections -HostName $HostName -Port $Port -UserName $UserName -Password $Password -Database $Database) {
            return $true
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Get-PublishedPostgresPort {
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $composeFile = Join-Path $RootDir "compose.stack.yml"
        $line = & docker compose --env-file $EnvFile -f $composeFile -p context_engine_stack port postgres 5432 2>$null
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($line)) {
            return $null
        }
        # docker compose port prints host:port, e.g. 127.0.0.1:5438
        $parts = $line.Trim().Split(":")
        if ($parts.Count -lt 2) {
            return $null
        }
        return [int]$parts[-1]
    }
    finally {
        $ErrorActionPreference = $oldEap
    }
}

function Ensure-ComposePostgres {
    $postgresHost = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "127.0.0.1" }
    $postgresPort = if ($env:POSTGRES_PORT) { [int]$env:POSTGRES_PORT } else { 5432 }
    $postgresUser = $env:POSTGRES_USER
    $postgresPassword = $env:POSTGRES_PASSWORD
    $postgresDb = $env:POSTGRES_DB
    $expectsLocalPostgres = $postgresHost -in @("127.0.0.1", "localhost", "::1")

    if (-not $expectsLocalPostgres) {
        Write-DevHint "POSTGRES_HOST=$postgresHost is remote; skipping local compose postgres startup."
        return
    }

    Write-Host "Using Postgres ${postgresHost}:$postgresPort (from $EnvFile)"

    if (-not (Test-DockerCliAvailable)) {
        if (Test-PostgresAcceptingConnections -HostName $postgresHost -Port $postgresPort -UserName $postgresUser -Password $postgresPassword -Database $postgresDb) {
            Write-Host "Postgres already accepting connections at ${postgresHost}:$postgresPort"
            return
        }
        Write-DevError "Postgres is not reachable at ${postgresHost}:$postgresPort and Docker CLI is not installed."
        Write-DevHint "Install Docker Desktop for Windows, or run a local Postgres and set POSTGRES_HOST/POSTGRES_PORT in $EnvFile."
        exit 1
    }

    if (-not (Test-DockerDaemonRunning)) {
        Write-DevError "Docker Desktop is installed but the Docker daemon is not running."
        Write-DevHint "Start Docker Desktop and wait until it reports 'Docker Desktop is running', then retry."
        exit 1
    }

    $publishedPort = Get-PublishedPostgresPort
    $needsRecreate = $false
    if ($null -ne $publishedPort -and $publishedPort -ne $postgresPort) {
        Write-DevWarning "Compose postgres is published on $publishedPort but $EnvFile expects $postgresPort; recreating container."
        $needsRecreate = $true
    }

    $alreadyReady = Test-PostgresAcceptingConnections -HostName $postgresHost -Port $postgresPort -UserName $postgresUser -Password $postgresPassword -Database $postgresDb
    if ($alreadyReady -and -not $needsRecreate) {
        Write-Host "Postgres already accepting connections at ${postgresHost}:$postgresPort"
        return
    }

    # Compose does not rewrite published ports on a plain `up -d`; recreate when the
    # expected host port is not already accepting connections.
    if (-not $alreadyReady) {
        $needsRecreate = $true
    }

    # Host-native mode: start only postgres. Full `compose up -d` would also start
    # api/worker/frontend in Docker and fight host uvicorn/Next on the same ports.
    Write-Host "Starting compose postgres (host-native dependency only)..."
    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        # Ensure compose interpolation sees the same port as this script.
        $env:POSTGRES_PORT = "$postgresPort"
        & docker @(Get-ComposePostgresArgs -ForceRecreate:$needsRecreate)
        $composeExit = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $oldEap
    }

    if ($composeExit -ne 0) {
        Write-DevError "Failed to start compose postgres."
        Write-DevHint "Manual equivalent:"
        Write-DevHint '  docker compose --env-file .env.stack.local -f compose.stack.yml -p context_engine_stack up -d --force-recreate postgres'
        exit 1
    }

    Write-Host "Waiting for Postgres to accept connections at ${postgresHost}:$postgresPort ..."
    if (-not (Wait-PostgresReady -HostName $postgresHost -Port $postgresPort -UserName $postgresUser -Password $postgresPassword -Database $postgresDb)) {
        Write-DevError "Compose postgres started but is not accepting connections at ${postgresHost}:$postgresPort."
        Write-DevHint "Check POSTGRES_PORT in $EnvFile matches the published host port, then recreate:"
        Write-DevHint '  docker compose --env-file .env.stack.local -f compose.stack.yml -p context_engine_stack up -d --force-recreate postgres'
        exit 1
    }

    Write-Host "Postgres is ready at ${postgresHost}:$postgresPort"
}

function Configure-RuntimeEnv {
    # .env.stack.local is authoritative for this script (avoids stale shell/User env).
    Import-EnvFile -Path $EnvFile -Force

    $required = @(
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "CE_ADMIN_USERNAME",
        "CE_ADMIN_PASSWORD",
        "CONFIG_ENCRYPTION_KEY"
    )

    $missing = New-Object System.Collections.Generic.List[string]
    $placeholder = New-Object System.Collections.Generic.List[string]

    foreach ($key in $required) {
        $value = [Environment]::GetEnvironmentVariable($key, "Process")
        if (Test-PlaceholderValue -Value $value) {
            if ([string]::IsNullOrWhiteSpace($value)) {
                $missing.Add($key)
            }
            else {
                $placeholder.Add($key)
            }
        }
    }

    if ($placeholder.Count -gt 0 -or $missing.Count -gt 0) {
        Write-DevError "Incomplete local environment in $EnvFile."
        if ($placeholder.Count -gt 0) {
            Write-Host ("Replace placeholder values for: " + ($placeholder -join ", ")) -ForegroundColor Red
        }
        if ($missing.Count -gt 0) {
            Write-Host ("Set missing values for: " + ($missing -join ", ")) -ForegroundColor Red
        }
        Write-DevHint "Start from .env.stack.example, then set real local values."
        Write-DevHint "For host-native dev against a published Postgres container, also set POSTGRES_PORT (for example 5438)."
        exit 1
    }

    $oldEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $PythonBin -c "from cryptography.fernet import Fernet; Fernet('$($env:CONFIG_ENCRYPTION_KEY)'.encode('utf-8'))" *> $null
        $fernetValid = $LASTEXITCODE -eq 0
    }
    finally {
        $ErrorActionPreference = $oldEap
    }

    if (-not $fernetValid) {
        Write-DevError "CONFIG_ENCRYPTION_KEY in $EnvFile is not a valid Fernet key."
        Write-DevHint "Generate one with:"
        Write-DevHint '  .\.venv\Scripts\python.exe -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"'
        exit 1
    }

    # Always derive from POSTGRES_* so a stale shell DATABASE_URL cannot pin the wrong port.
    $postgresHost = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "127.0.0.1" }
    $postgresPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
    $env:CONTEXT_ENGINE_DATABASE_URL = "postgresql+psycopg://$($env:POSTGRES_USER):$($env:POSTGRES_PASSWORD)@${postgresHost}:$postgresPort/$($env:POSTGRES_DB)"
    Write-Host "Database URL host: ${postgresHost}:$postgresPort"

    if (-not $env:CE_SESSION_COOKIE_SECURE) {
        $env:CE_SESSION_COOKIE_SECURE = "false"
    }
}

function Sync-ApiBase {
    param([int]$PreferredBackendPort)

    $actualBase = "http://${BackendHost}:$BackendPort"
    $preferredBase = "http://${BackendHost}:$PreferredBackendPort"

    if (-not $ContextEngineApiBaseSet) {
        # Env-file / default value — always follow the backend this script starts
        # (including when Resolve-DevPort remapped away from :8000).
        $script:ContextEngineApiBase = $actualBase
    }
    else {
        $current = if ($env:CONTEXT_ENGINE_API_BASE) { $env:CONTEXT_ENGINE_API_BASE.TrimEnd("/") } else { "" }
        # Leftover shell env or .env pointing at the preferred local port must
        # retarget when that port was busy and we remapped the host backend.
        if ($BackendPort -ne $PreferredBackendPort -and $current -eq $preferredBase) {
            Write-DevWarning "CONTEXT_ENGINE_API_BASE retargeted to $actualBase (backend port remapped)."
            $script:ContextEngineApiBase = $actualBase
        }
        else {
            $script:ContextEngineApiBase = $env:CONTEXT_ENGINE_API_BASE
        }
    }

    $env:CONTEXT_ENGINE_API_BASE = $script:ContextEngineApiBase
}

function Stop-DevProcesses {
    foreach ($proc in @($script:FrontendProcess, $script:BackendProcess)) {
        if ($null -ne $proc -and -not $proc.HasExited) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

function Start-Backend {
    param([int]$Port)

    $backendArgs = @(
        "-m", "uvicorn", "context_engine.app:create_app",
        "--factory",
        "--reload",
        "--reload-dir", "context_engine",
        "--reload-dir", "migrations",
        "--host", $BackendHost,
        "--port", "$Port"
    )

    return Start-Process `
        -FilePath $PythonBin `
        -ArgumentList $backendArgs `
        -WorkingDirectory $RootDir `
        -PassThru `
        -NoNewWindow
}

function Start-Frontend {
    param([int]$Port)

    $frontendDir = Join-Path $RootDir "frontend"
    $env:CONTEXT_ENGINE_API_BASE = $script:ContextEngineApiBase

    if ($FrontendMode -eq "prod") {
        & npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend production build failed."
        }

        $frontendArgs = @("next", "start", "-H", "0.0.0.0", "-p", "$Port")
        return Start-Process `
            -FilePath "npx" `
            -ArgumentList $frontendArgs `
            -WorkingDirectory $frontendDir `
            -PassThru `
            -NoNewWindow
    }

    if (-not $env:WATCHPACK_POLLING) { $env:WATCHPACK_POLLING = "true" }
    if (-not $env:CHOKIDAR_USEPOLLING) { $env:CHOKIDAR_USEPOLLING = "true" }

    $frontendArgs = @("run", "dev", "--", "--webpack", "-p", "$Port")
    return Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList $frontendArgs `
        -WorkingDirectory $frontendDir `
        -PassThru `
        -NoNewWindow
}

trap {
    Stop-DevProcesses
    break
}

try {
    Assert-RuntimeFiles

    Configure-RuntimeEnv
    Ensure-ComposePostgres

    $PreferredBackendPort = $BackendPort
    $PreferredFrontendPort = $FrontendPort
    $BackendPort = Resolve-DevPort -Name "backend" -Preferred $BackendPort -Explicit $BackendPortExplicit
    $FrontendPort = Resolve-DevPort -Name "frontend" -Preferred $FrontendPort -Explicit $FrontendPortExplicit
    Sync-ApiBase -PreferredBackendPort $PreferredBackendPort

    Write-Host "Migrating database..."
    Push-Location $RootDir
    try {
        & $PythonBin -m alembic upgrade head
        if ($LASTEXITCODE -ne 0) {
            throw "Database migration failed."
        }
    }
    finally {
        Pop-Location
    }

    Write-Host "Starting backend on http://${BackendHost}:$BackendPort"
    $script:BackendProcess = Start-Backend -Port $BackendPort

    Write-Host "Starting frontend on http://localhost:$FrontendPort"
    Push-Location (Join-Path $RootDir "frontend")
    try {
        $script:FrontendProcess = Start-Frontend -Port $FrontendPort
    }
    finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "Backend:  http://${BackendHost}:$BackendPort"
    Write-Host "Frontend: http://localhost:$FrontendPort/chat"
    Write-Host "API proxy: $($script:ContextEngineApiBase)"
    if ($BackendPort -ne $PreferredBackendPort -or $FrontendPort -ne $PreferredFrontendPort) {
        Write-DevHint "Port remapped from defaults; API proxy must match the backend above."
    }
    Write-Host "Stop both with Ctrl+C."
    Write-Host ""

    while (-not $script:BackendProcess.HasExited -and -not $script:FrontendProcess.HasExited) {
        Start-Sleep -Milliseconds 250
    }
}
catch {
    Write-DevError $_.Exception.Message
    exit 1
}
finally {
    Stop-DevProcesses
}
