@echo off
setlocal EnableExtensions
title Nammooru - Local Web Server

rem ============================================================================
rem  Nammooru - Windows Launch Script ("run this.bat")
rem ============================================================================
rem  Starts the Nammooru local server (server.py) which:
rem    - Serves all static files (HTML, CSS, JS, images)
rem    - Proxies Gemini Vision API calls securely (API key stays server-side)
rem  Then opens http://localhost:8000/ in your default browser.
rem
rem  Requirements: Python 3 must be installed.
rem  API Setup:    Edit api-config.json and add your Gemini API key.
rem ============================================================================

cd /d "%~dp0"

set "TARGET_HOST=localhost"
set "TARGET_PORT=8000"
set "TARGET_URL=http://%TARGET_HOST%:%TARGET_PORT%/"

echo ============================================================================
echo   Nammooru - Local Web Server Launcher
echo ============================================================================
echo.

rem ----------------------------------------------------------------------------
rem Step 1: Check for Python installation
rem ----------------------------------------------------------------------------
echo [1/4] Verifying Python installation...
set "PYTHON_CMD="

py -3 -c "import sys; sys.exit(0)" >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=py -3"
    goto :python_detected
)

python -c "import sys; sys.exit(0)" >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON_CMD=python"
    goto :python_detected
)

if exist "%LOCALAPPDATA%\Programs\Python" (
    for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python3*") do (
        if exist "%%D\python.exe" (
            set "PYTHON_CMD="%%D\python.exe""
            goto :python_detected
        )
    )
)

if exist "C:\Program Files\Python" (
    for /d %%D in ("C:\Program Files\Python\Python3*") do (
        if exist "%%D\python.exe" (
            set "PYTHON_CMD="%%D\python.exe""
            goto :python_detected
        )
    )
)

echo.
echo ============================================================================
echo  [ERROR] Python is not installed or not available in your system PATH.
echo ============================================================================
echo  Nammooru requires Python 3 to run its local development server.
echo.
echo  Manual Setup Required:
echo    1. Visit: https://www.python.org/downloads/
echo    2. Download the Python 3 installer for Windows.
echo    3. CRITICAL: On the first screen of the installer, check:
echo         [X] "Add python.exe to PATH"
echo    4. Click "Install Now" and wait for setup to finish.
echo    5. Re-run "run this.bat" by double-clicking it.
echo ============================================================================
echo.
pause
exit /b 1

:python_detected
echo       Python detected: %PYTHON_CMD%

rem Optional 2FA packages check
%PYTHON_CMD% -c "import pyotp, qrcode" >nul 2>&1
if errorlevel 1 %PYTHON_CMD% -m pip install pyotp qrcode[pil] --quiet >nul 2>&1

rem ----------------------------------------------------------------------------
rem Step 2: Check whether Nammooru is already running at http://localhost:8000/
rem ----------------------------------------------------------------------------
echo [2/4] Checking if Nammooru is already running at %TARGET_URL%...
%PYTHON_CMD% -c "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:%TARGET_PORT%/', timeout=1.5).status == 200 else 1)" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ============================================================================
    echo   [INFO] Nammooru is ALREADY running at %TARGET_URL%
    echo ============================================================================
    echo   Opening your default web browser to: %TARGET_URL%
    echo.
    start "" "%TARGET_URL%"
    echo   [OK] Browser opened!
    echo   Keep the existing server window open to continue using Nammooru.
    echo.
    echo   Press any key to close this helper window...
    pause >nul
    exit /b 0
)

rem ----------------------------------------------------------------------------
rem Step 3: Check if port 8000 is occupied, auto-recover if stale process
rem ----------------------------------------------------------------------------
echo [3/4] Checking port %TARGET_PORT% availability...
%PYTHON_CMD% -c "import socket, sys; s = socket.socket(); sys.exit(0 if s.connect_ex(('127.0.0.1', %TARGET_PORT%)) != 0 else 1)" >nul 2>&1
if %errorlevel% neq 0 (
    echo       Port %TARGET_PORT% is in use. Attempting to free previous process...
    powershell -NoProfile -Command "Get-Process python,py -ErrorAction SilentlyContinue | Where-Object { (Get-NetTCPConnection -LocalPort %TARGET_PORT% -OwningProcess $_.Id -ErrorAction SilentlyContinue) } | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
    %PYTHON_CMD% -c "import time; time.sleep(1)" >nul 2>&1
    %PYTHON_CMD% -c "import socket, sys; s = socket.socket(); sys.exit(0 if s.connect_ex(('127.0.0.1', %TARGET_PORT%)) != 0 else 1)" >nul 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo ============================================================================
        echo  [ERROR] Port %TARGET_PORT% is in use by another application.
        echo ============================================================================
        echo  The server cannot start on %TARGET_URL% because port %TARGET_PORT% is occupied.
        echo.
        echo  How to resolve:
        echo    1. Identify and close the application currently using port %TARGET_PORT%.
        echo    2. Or check Windows Task Manager for conflicting processes.
        echo    3. Then run "run this.bat" again.
        echo ============================================================================
        echo.
        pause
        exit /b 1
    )
    echo       Freed port %TARGET_PORT% successfully.
)

rem ----------------------------------------------------------------------------
rem Step 4: Launch browser and run server.py in foreground with live logs
rem ----------------------------------------------------------------------------
echo [4/4] Starting Nammooru server on %TARGET_URL%...
echo.

rem Open browser in default web browser
start "" "%TARGET_URL%"

rem Run server in foreground so logs stream cleanly and Ctrl+C stops it
%PYTHON_CMD% -u "%~dp0server.py"

exit /b 0
