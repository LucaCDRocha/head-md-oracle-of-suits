@echo off
TITLE Oracle of Suits - Setup Auto Connect Arduino (Port 8080)
cd /d "%~dp0"

echo ========================================================
echo   CONFIGURING AUTOMATIC ARDUINO CONNECT FOR PORT 8080
echo ========================================================
echo.

echo -> Application de la politique Chrome SerialAllowAllPortsForUrls pour le port 8080 (niveau utilisateur HKCU)...

powershell -Command "New-Item -Path 'HKCU:\SOFTWARE\Policies\Google\Chrome\SerialAllowAllPortsForUrls' -Force | Out-Null; Set-ItemProperty -Path 'HKCU:\SOFTWARE\Policies\Google\Chrome\SerialAllowAllPortsForUrls' -Name '1' -Value '[\"http://localhost:8080\", \"http://127.0.0.1:8080\"]'"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCES] La politique Chrome pour le port 8080 a ete appliquee avec succes !
    echo L'Arduino se connectera automatiquement sans aucun popup.
) else (
    echo.
    echo [ERREUR] Impossible d'appliquer la politique Chrome.
)

echo.
pause
