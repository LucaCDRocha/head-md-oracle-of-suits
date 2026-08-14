@echo off
TITLE Oracle of Suits - Setup Auto Connect Arduino (Port 8080)
cd /d "%~dp0"

echo ========================================================
echo   CONFIGURING AUTOMATIC ARDUINO CONNECT FOR PORT 8080
echo ========================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Demande des privileges Administrateur pour configurer la politique Chrome...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo -> Application de la politique Chrome SerialAllowAllPortsForUrls pour le port 8080...

powershell -Command "New-Item -Path 'HKLM:\SOFTWARE\Policies\Google\Chrome\SerialAllowAllPortsForUrls' -Force; Set-ItemProperty -Path 'HKLM:\SOFTWARE\Policies\Google\Chrome\SerialAllowAllPortsForUrls' -Name '1' -Value '[\"http://localhost:8080\", \"http://127.0.0.1:8080\"]'"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCES] La politique Chrome pour le port 8080 a ete appliquee avec succes !
    echo L'Arduino se connectera automatiquement dans la borne sans aucun clic ni popup.
) else (
    echo.
    echo [ERREUR] Impossible d'appliquer la politique Chrome.
)

echo.
pause
