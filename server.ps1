# ============================================================================
# Nammooru - Local Development Server (PowerShell Launcher)
# ============================================================================

$port = 8000
$targetUrl = "http://localhost:$port/"
$scriptPath = Join-Path $PSScriptRoot "server.py"

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Nammooru - Local Development Server" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Port:    $port" -ForegroundColor Gray
Write-Host "  Address: $targetUrl" -ForegroundColor Gray
Write-Host ""

# Check if port is already answering HTTP 200
try {
    $test = Invoke-WebRequest -Uri $targetUrl -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
    if ($test.StatusCode -eq 200) {
        Write-Host "[INFO] Nammooru is ALREADY running at $targetUrl" -ForegroundColor Green
        Write-Host "Opening your browser..." -ForegroundColor Cyan
        Start-Process $targetUrl
        exit 0
    }
} catch {
    # Server not responding yet, proceed to start
}

# Free port 8000 if occupied by a stale Python process
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -like "*python*") {
            Write-Host "Freeing port $port from previous Python process (PID: $($proc.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
        }
    }
}

# Open browser
Start-Process $targetUrl

# Run server.py with Python
if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 -u $scriptPath
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python -u $scriptPath
} else {
    Write-Host "[ERROR] Python 3 was not found in your PATH." -ForegroundColor Red
    Write-Host "Please install Python 3 or use 'run this.bat'." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
}
