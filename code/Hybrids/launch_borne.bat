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
"%GIT_CMD%" pull origin main
if %ERRORLEVEL% EQU 0 (
    echo [*] Code a jour avec GitHub.
) else (
    echo [!] Mise a jour GitHub ignoree (hors-ligne ou git absent).
)

echo.
echo [*] Lancement de la borne...
node launch_borne.js %*
pause
