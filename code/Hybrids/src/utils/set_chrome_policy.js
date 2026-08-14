const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function applyChromeSerialPolicies() {
	const psScript = `
$p1 = 'HKCU:\\SOFTWARE\\Policies\\Google\\Chrome\\SerialAllowAllPortsForUrls'
if (-not (Test-Path $p1)) { New-Item -Path $p1 -Force | Out-Null }
Set-ItemProperty -Path $p1 -Name '1' -Value '["http://localhost:8080", "http://127.0.0.1:8080"]'

$p2 = 'HKCU:\\SOFTWARE\\Policies\\Google\\Chrome\\SerialAllowUsbDevicesForUrls'
if (-not (Test-Path $p2)) { New-Item -Path $p2 -Force | Out-Null }
Set-ItemProperty -Path $p2 -Name '1' -Value '[{"devices":[],"urls":["http://localhost:8080","http://127.0.0.1:8080"]}]'
`;

	const tmpPsFile = path.join(os.tmpdir(), 'set_chrome_serial_policy.ps1');
	try {
		fs.writeFileSync(tmpPsFile, psScript, 'utf8');
		execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPsFile}"`, { stdio: 'ignore' });
		if (fs.existsSync(tmpPsFile)) fs.unlinkSync(tmpPsFile);
		console.log(" -> Web Serial policies successfully set in Windows Registry.");
	} catch (err) {
		console.warn(" -> Warning: Could not set Chrome registry policy:", err.message);
	}
}

module.exports = { applyChromeSerialPolicies };

if (require.main === module) {
	applyChromeSerialPolicies();
}
