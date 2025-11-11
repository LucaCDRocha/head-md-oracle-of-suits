let port;
let reader;
let connectButton;
let buffer = "";

// Store 4 knob values (0-1023 from Arduino)
export let knobValues = [0, 0, 0, 0];

// Callback that will be called when knob values change
let onKnobChangeCallback = null;

export function setKnobChangeCallback(callback) {
	onKnobChangeCallback = callback;
}

export function setupSerial() {
	connectButton = createButton("Connect Arduino");
	connectButton.position(10, 10);
	connectButton.mousePressed(connectSerial);
}

async function connectSerial() {
	if (!("serial" in navigator)) {
		console.error("Web Serial API not supported in this browser.");
		alert("Web Serial API not supported in this browser. Use Chrome/Edge.");
		return;
	}
	try {
		// user will pick the correct COM/port
		port = await navigator.serial.requestPort();
		await port.open({ baudRate: 9600 });

		const decoder = new TextDecoderStream();
		port.readable.pipeTo(decoder.writable);
		reader = decoder.readable.getReader();

		connectButton.attribute("disabled", "");
		connectButton.html("Connected ✓");
		readLoop();
	} catch (err) {
		console.error("Serial connection failed:", err);
		alert("Failed to connect to Arduino: " + err.message);
	}
}

async function readLoop() {
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (value) {
				buffer += value;
				let idx;
				while ((idx = buffer.indexOf("\n")) >= 0) {
					const line = buffer.slice(0, idx).trim();
					buffer = buffer.slice(idx + 1);
					parseLine(line);
				}
			}
		}
	} catch (err) {
		console.error("Read error:", err);
	}
}

function parseLine(line) {
	const parts = line.split(/\s+/);
	if (parts.length < 4) return;

	const [knob1, knob2, knob3, knob4] = parts.map(Number);

	let changed = false;
	if (!isNaN(knob1) && knobValues[0] !== knob1) {
		knobValues[0] = knob1;
		changed = true;
	}
	if (!isNaN(knob2) && knobValues[1] !== knob2) {
		knobValues[1] = knob2;
		changed = true;
	}
	if (!isNaN(knob3) && knobValues[2] !== knob3) {
		knobValues[2] = knob3;
		changed = true;
	}
	if (!isNaN(knob4) && knobValues[3] !== knob4) {
		knobValues[3] = knob4;
		changed = true;
	}

	// Update display
	updateKnobDisplay();

	// Notify callback if values changed
	if (changed) {
		console.log("Serial data parsed:", knobValues);
		if (onKnobChangeCallback) {
			onKnobChangeCallback(knobValues);
		} else {
			console.warn("No knob change callback registered");
		}
	}
}

function updateKnobDisplay() {
	const k1 = document.getElementById("knob-1-value");
	const k2 = document.getElementById("knob-2-value");
	const k3 = document.getElementById("knob-3-value");
	const k4 = document.getElementById("knob-4-value");

	if (k1) k1.textContent = knobValues[0];
	if (k2) k2.textContent = knobValues[1];
	if (k3) k3.textContent = knobValues[2];
	if (k4) k4.textContent = knobValues[3];
}
