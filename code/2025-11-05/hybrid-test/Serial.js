let port;
let reader;
let connectButton;
let buffer = "";

// Store 12 knob values (0-1023 from Arduino)
// Organized as 3 cards with 4 knobs each:
// Card 1: knobs 0-3, Card 2: knobs 4-7, Card 3: knobs 8-11
export let knobValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

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
	if (parts.length < 12) return;

	const newValues = parts.slice(0, 12).map(Number);

	let changed = false;
	for (let i = 0; i < 12; i++) {
		if (!isNaN(newValues[i]) && knobValues[i] !== newValues[i]) {
			knobValues[i] = newValues[i];
			changed = true;
		}
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
	// Update display for all 12 knobs
	for (let i = 0; i < 12; i++) {
		const element = document.getElementById(`knob-${i + 1}-value`);
		if (element) {
			element.textContent = knobValues[i];
		}
	}
}

// Helper function to get knob values for a specific card (0, 1, or 2)
export function getCardKnobs(cardIndex) {
	const startIdx = cardIndex * 4;
	return knobValues.slice(startIdx, startIdx + 4);
}
