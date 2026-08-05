const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");
const os = require("os");
const http = require("http");

const PORT = 8080;
const URL_DISPLAY1 = `http://localhost:${PORT}/index.html`;
const URL_DISPLAY2 = `http://localhost:${PORT}/display.html`;

console.log("========================================================");
console.log("      ORACLE OF SUITS - HYBRIDS BORNE LAUNCHER          ");
console.log("========================================================\n");

// 1. Check if Node Server (server.js) is running
function checkServerRunning(port) {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		socket.setTimeout(1000);
		socket.on("connect", () => {
			socket.destroy();
			resolve(true);
		});
		socket.on("error", () => {
			socket.destroy();
			resolve(false);
		});
		socket.on("timeout", () => {
			socket.destroy();
			resolve(false);
		});
		socket.connect(port, "127.0.0.1");
	});
}

// Check if ComfyUI HTTP server is online and ready
function checkComfyReady(port = 8188) {
	return new Promise((resolve) => {
		const req = http.get(`http://127.0.0.1:${port}/system_stats`, (res) => {
			if (res.statusCode === 200) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
		req.on("error", () => resolve(false));
		req.setTimeout(1200, () => {
			req.destroy();
			resolve(false);
		});
	});
}

// 2. Locate ComfyUI Directory
function findComfyDir() {
	if (process.env.COMFYUI_DIR && fs.existsSync(process.env.COMFYUI_DIR)) {
		return process.env.COMFYUI_DIR;
	}
	const userHome = os.homedir();
	const hybridsDir = __dirname;

	const candidatePaths = [
		"C:\\ComfyUI_windows_portable",
		"C:\\ComfyUI",
		"D:\\ComfyUI_windows_portable",
		"D:\\ComfyUI",
		path.join(userHome, "ComfyUI_windows_portable"),
		path.join(userHome, "Desktop", "ComfyUI_windows_portable"),
		path.join(userHome, "Desktop", "HEAD-Hybrids\\ComfyUI_windows_portable"),
		path.join(userHome, "Desktop", "ComfyUI"),
		path.resolve(hybridsDir, "..", "..", "..", "..", "ComfyUI_windows_portable"),
		path.resolve(hybridsDir, "..", "..", "..", "..", "ComfyUI"),
	];

	for (const p of candidatePaths) {
		if (fs.existsSync(p)) {
			return p;
		}
	}
	return null;
}

// 3. Find Chrome binary path on Windows
function findChromeExecutable() {
	const localAppData = process.env.LOCALAPPDATA || "";
	const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
	const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

	const candidates = [
		path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
		path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
		path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
	];

	for (const c of candidates) {
		if (fs.existsSync(c)) {
			return c;
		}
	}
	return "chrome"; // fallback to system PATH
}

// 4. Get connected display bounds from Windows Forms via PowerShell
function getScreens() {
	try {
		const psCmd = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::AllScreens | Select-Object -ExpandProperty Bounds | ConvertTo-Json"`;
		const output = execSync(psCmd, { encoding: "utf8" }).trim();
		if (!output) return [];
		const parsed = JSON.parse(output);
		if (Array.isArray(parsed)) {
			return parsed;
		} else if (parsed && typeof parsed === "object") {
			return [parsed];
		}
	} catch (e) {
		console.warn("Could not query display configuration via PowerShell:", e.message);
	}
	return [];
}

let serverProc = null;
let comfyProc = null;
let isShuttingDown = false;

function stopAllServices() {
	isShuttingDown = true;
	if (serverProc && serverProc.pid) {
		try {
			execSync(`taskkill /F /PID ${serverProc.pid} /T`, { stdio: "ignore" });
		} catch (e) {}
	}
	if (comfyProc && comfyProc.pid) {
		try {
			execSync(`taskkill /F /PID ${comfyProc.pid} /T`, { stdio: "ignore" });
		} catch (e) {}
	}
	try {
		const profileBase = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "OracleOfSuitsBorneProfiles");
		if (fs.existsSync(profileBase)) {
			fs.rmSync(profileBase, { recursive: true, force: true });
		}
	} catch (e) {}
}

// Clean up background services when terminal is closed or interrupted
process.on("SIGINT", () => {
	stopAllServices();
	process.exit(0);
});
process.on("SIGTERM", () => {
	stopAllServices();
	process.exit(0);
});
process.on("SIGHUP", () => {
	stopAllServices();
	process.exit(0);
});
process.on("exit", () => {
	stopAllServices();
});

async function main() {
	// --- STEP 1: Launch Hybrids server.js ---
	console.log("[1/3] Checking Hybrids Server (server.js)...");
	let isRunning = await checkServerRunning(PORT);
	if (isRunning) {
		console.log(` -> Hybrids server is already running on port ${PORT}.`);
	} else {
		console.log(` -> Starting Node.js server (server.js) on port ${PORT}...`);
		function spawnServer() {
			serverProc = spawn("node", ["server.js"], {
				cwd: __dirname,
				stdio: "ignore",
			});
			console.log(` -> Server process spawned (PID: ${serverProc.pid}).`);
			
			serverProc.on("close", (code) => {
				if (!isShuttingDown) {
					console.warn(`\n[!] Warning: server.js closed unexpectedly (code ${code}). Auto-restarting in 5s...`);
					setTimeout(spawnServer, 5000);
				}
			});
		}
		spawnServer();

		// Wait until server is listening on port
		for (let i = 0; i < 10; i++) {
			await new Promise((r) => setTimeout(r, 500));
			isRunning = await checkServerRunning(PORT);
			if (isRunning) break;
		}
		if (isRunning) {
			console.log(` -> Server successfully initialized on port ${PORT}.`);
		} else {
			console.warn(` -> Warning: Server did not respond on port ${PORT} within 5s.`);
		}
	}

	// --- STEP 2: Launch ComfyUI without browser opening ---
	console.log("\n[2/3] Preparing ComfyUI backend...");
	let isComfyOnline = await checkComfyReady(8188);

	if (isComfyOnline) {
		console.log(" -> ComfyUI server is already online and ready on port 8188.");
	} else {
		const comfyDir = findComfyDir();
		if (comfyDir) {
			console.log(` -> Found ComfyUI directory at: ${comfyDir}`);
			const embeddedPython = path.join(comfyDir, "python_embeded", "python.exe");
			const comfyMainPy = path.join(comfyDir, "ComfyUI", "main.py");
			const rootMainPy = path.join(comfyDir, "main.py");

			let comfyCmd = "python";
			let comfyArgs = ["main.py", "--disable-auto-launch"];
			let spawnCwd = comfyDir;

			if (fs.existsSync(embeddedPython) && fs.existsSync(comfyMainPy)) {
				// ComfyUI Windows Portable distribution
				comfyCmd = embeddedPython;
				comfyArgs = [
					"-s",
					comfyMainPy,
					"--windows-standalone-build",
					"--disable-auto-launch",
				];
				spawnCwd = comfyDir;
				console.log(" -> Launching ComfyUI Portable Python with --disable-auto-launch");
			} else if (fs.existsSync(rootMainPy)) {
				// Standard ComfyUI installation with main.py in root
				comfyArgs = ["main.py", "--disable-auto-launch"];
				spawnCwd = comfyDir;
				console.log(" -> Launching main.py with --disable-auto-launch");
			} else {
				const batFile = path.join(comfyDir, "run_nvidia_gpu.bat");
				if (fs.existsSync(batFile)) {
					comfyCmd = batFile;
					comfyArgs = [];
					console.log(" -> Launching via run_nvidia_gpu.bat");
				}
			}

			function spawnComfy() {
				comfyProc = spawn(comfyCmd, comfyArgs, {
					cwd: spawnCwd,
					stdio: "ignore",
					shell: false,
				});
				console.log(` -> ComfyUI backend process spawned (PID: ${comfyProc.pid}).`);
				
				comfyProc.on("close", (code) => {
					if (!isShuttingDown) {
						console.warn(`\n[!] Warning: ComfyUI closed unexpectedly (code ${code}). Auto-restarting in 5s...`);
						setTimeout(spawnComfy, 5000);
					}
				});
			}
			spawnComfy();
			console.log(" -> Waiting for ComfyUI server to finish booting and reach ready status on port 8188...");

			const maxWaitSeconds = 60;
			for (let i = 1; i <= maxWaitSeconds; i++) {
				await new Promise((r) => setTimeout(r, 1000));
				isComfyOnline = await checkComfyReady(8188);
				if (isComfyOnline) {
					console.log(` -> ComfyUI server is fully online and ready after ${i}s!`);
					break;
				}
				if (i % 5 === 0) {
					console.log(`    ... still booting ComfyUI backend (${i}s)`);
				}
			}

			if (!isComfyOnline) {
				console.warn(" [!] Warning: ComfyUI server did not respond within 60s. Proceeding to launch browsers...");
			}
		} else {
			console.warn(" [!] ComfyUI directory not found automatically.");
			console.warn("     If ComfyUI is installed elsewhere, set environment variable COMFYUI_DIR");
			console.warn("     e.g., set COMFYUI_DIR=C:\\path\\to\\ComfyUI");
		}
	}

	// --- STEP 3: Multi-Monitor Chrome Placement ---
	console.log("\n[3/3] Detecting screens & launching 2 Chrome browser instances...");
	const screens = getScreens();
	console.log(` -> Total displays detected: ${screens.length}`);

	let screen1 = { X: 0, Y: 0, Width: 1920, Height: 1080 };
	let screen2 = { X: 1920, Y: 0, Width: 1920, Height: 1080 };

	if (screens.length >= 2) {
		screen1 = screens[0];
		screen2 = screens[1];
		console.log(`    Display 1: ${screen1.Width}x${screen1.Height} at (${screen1.X}, ${screen1.Y})`);
		console.log(`    Display 2: ${screen2.Width}x${screen2.Height} at (${screen2.X}, ${screen2.Y})`);
	} else if (screens.length === 1) {
		console.log("    Only 1 display detected. Setting side-by-side mode for testing.");
		const halfWidth = Math.floor(screens[0].Width / 2);
		screen1 = { X: screens[0].X, Y: screens[0].Y, Width: halfWidth, Height: screens[0].Height };
		screen2 = { X: screens[0].X + halfWidth, Y: screens[0].Y, Width: halfWidth, Height: screens[0].Height };
	}

	const chromeExe = findChromeExecutable();
	console.log(` -> Using Chrome executable: ${chromeExe}`);

	// Isolated profile directories for independent multi-monitor Chrome windows
	const profileBase = path.join(process.env.LOCALAPPDATA || os.tmpdir(), "OracleOfSuitsBorneProfiles");
	const p1 = path.join(profileBase, "Display1");
	const p2 = path.join(profileBase, "Display2");

	// Purge previous browser cache and user data for THIS APP ONLY on start
	console.log(" -> Clearing cache and temporary profile data for Borne application...");
	try {
		if (fs.existsSync(p1)) fs.rmSync(p1, { recursive: true, force: true });
		if (fs.existsSync(p2)) fs.rmSync(p2, { recursive: true, force: true });
	} catch (e) {
		console.warn("    (Note: previous cache lock pending, continuing clean start...)");
	}

	fs.mkdirSync(p1, { recursive: true });
	fs.mkdirSync(p2, { recursive: true });

	// Enable kiosk and start-fullscreen only when multiple physical displays are connected.
	// On a single display, omitting --kiosk allows Chrome to respect side-by-side window positioning and sizing.
	const isMultiScreen = screens.length >= 2;
	const fullscreenArgs = isMultiScreen ? ["--start-fullscreen", "--kiosk"] : [];

	// 1. Launch Chrome 2 FIRST (Display 2 - Exhibition Display Screen)
	console.log(` -> Opening Chrome 2 on Display 2 (${URL_DISPLAY2})...`);
	const chrome2Args = [
		`--user-data-dir=${p2}`,
		`--window-position=${screen2.X},${screen2.Y}`,
		`--window-size=${screen2.Width},${screen2.Height}`,
		...fullscreenArgs,
		"--no-first-run",
		"--no-default-browser-check",
		`--app=${URL_DISPLAY2}`,
	];
	const c2 = spawn(chromeExe, chrome2Args, { stdio: "ignore" });

	await new Promise((r) => setTimeout(r, 1000));

	// 2. Launch Chrome 1 LAST (Display 1 - Control / Interactive Screen) so it gains active focus
	console.log(` -> Opening Chrome 1 on Display 1 (${URL_DISPLAY1}) [FOCUSED]...`);
	const chrome1Args = [
		`--user-data-dir=${p1}`,
		`--window-position=${screen1.X},${screen1.Y}`,
		`--window-size=${screen1.Width},${screen1.Height}`,
		...fullscreenArgs,
		"--no-first-run",
		"--no-default-browser-check",
		`--app=${URL_DISPLAY1}`,
	];
	const c1 = spawn(chromeExe, chrome1Args, { stdio: "ignore" });

	await new Promise((r) => setTimeout(r, 800));

	// Focus Display 1 explicitly via Win32 API if process ID is available
	if (c1 && c1.pid) {
		try {
			const psFocusCmd = `powershell -Command "$code = '[DllImport(\\"user32.dll\\")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport(\\"user32.dll\\")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);'; Add-Type -MemberDefinition $code -Name Win32 -Namespace Win32Utils; $proc = Get-Process -Id ${c1.pid} -ErrorAction SilentlyContinue; if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) { [Win32Utils.Win32]::ShowWindow($proc.MainWindowHandle, 9); [Win32Utils.Win32]::SetForegroundWindow($proc.MainWindowHandle); }"`;
			execSync(psFocusCmd, { stdio: "ignore" });
		} catch (e) {
			// ignore focus error fallback
		}
	}

	console.log("\n========================================================");
	console.log("      BORNE LAUNCH COMPLETE!                            ");
	console.log(`  Control Screen (Display 1): ${URL_DISPLAY1}`);
	console.log(`  Exhibition Screen (Display 2): ${URL_DISPLAY2}`);
	console.log("  [INFO] Closing this terminal window or pressing Ctrl+C");
	console.log("         will automatically shut down server.js and ComfyUI.");
	console.log("========================================================\n");
}

main().catch((err) => {
	console.error("Error launching Borne:", err);
});
