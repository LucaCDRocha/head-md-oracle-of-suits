@echo off
TITLE Oracle of Suits - Borne Launcher
cd /d "%~dp0"

echo ========================================================
echo       ORACLE OF SUITS - BORNE LAUNCHER
echo ========================================================
echo.

:: Detecter la commande git (systeme ou GitHub Desktop)
set "GIT_CMD=git"
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    for /d %%D in ("%LOCALAPPDATA%\GitHubDesktop\app-*") do (
        if exist "%%D\resources\app\git\cmd\git.exe" (
            set "GIT_CMD=%%D\resources\app\git\cmd\git.exe"
        )
    )
)

echo [*] Verification des mises a jour GitHub...
call "%GIT_CMD%" pull origin main

echo.
echo [*] Lancement de la borne...
call node launch_borne.js %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Erreur lors du lancement de launch_borne.js.
)
pause
