import { initSlotSelector, getSelectedCards, getBaseCardId, drawPreview, handleKnobChange } from "./ui/slotSelector.js";
import { generateImage } from "./api/geminiApi.js";
import { uploadHybridBase64 } from "./api/hybridApi.js";
import { setupSerial, setKnobChangeCallback, setButtonPressCallback } from "./Serial.js";

let canvas;
let lastGeneratedBase64 = null;

// Debounce state for button press
let isGenerating = false;
let lastGenerateTime = 0;
const DEBOUNCE_DURATION = 5000; // 5 seconds minimum between generations

// Add global error handler to prevent page reload on uncaught errors
window.addEventListener("error", function (e) {
	console.error("Global error caught:", e.error);
	e.preventDefault();
	return false;
});

window.setup = function () {
	// Make p5 functions globally available for the slot selector
	window.loadImage = loadImage;
	window.createButton = createButton;

	// small canvas used for composing the hybrid image
	const holder = document.getElementById("p5-holder");
	canvas = createCanvas(512, 512);
	canvas.parent(holder);
	background(240);

	// Setup Arduino serial connection
	setupSerial();

	// Set callback for knob changes
	setKnobChangeCallback((knobValues) => {
		handleKnobChange(knobValues);
	});

	// Set callback for button press
	setButtonPressCallback(() => {
		handleButtonPress();
	});

	// wire UI
	document.getElementById("generate-btn").addEventListener(
		"click",
		async (e) => {
			e.preventDefault();
			e.stopPropagation();
			try {
				await onGenerate();
			} catch (error) {
				console.error("Error in onGenerate:", error);
				const status = document.getElementById("status");
				if (status) status.innerText = "Error: " + error.message;
			}
			return false;
		},
		false
	);

	// Load cards using slot selector
	initSlotSelector();
};

window.draw = function () {
	// Use drawPreview from slot selector module
	drawPreview(window);
};

function handleButtonPress() {
	console.log("Button press detected");

	// Check if we're currently generating or within debounce period
	const currentTime = Date.now();
	const timeSinceLastGenerate = currentTime - lastGenerateTime;

	if (isGenerating) {
		console.log("Already generating, ignoring button press");
		const status = document.getElementById("status");
		if (status) status.innerText = "Generation in progress, please wait...";
		return;
	}

	if (timeSinceLastGenerate < DEBOUNCE_DURATION) {
		const remainingTime = Math.ceil((DEBOUNCE_DURATION - timeSinceLastGenerate) / 1000);
		console.log(`Debounce active, ${remainingTime}s remaining`);
		const status = document.getElementById("status");
		if (status) status.innerText = `Please wait ${remainingTime}s before generating again`;
		return;
	}

	// Trigger generation
	onGenerate().catch((error) => {
		console.error("Error in button-triggered generation:", error);
	});
}

async function onGenerate() {
	// Check debounce again (in case called from UI button)
	const currentTime = Date.now();
	const timeSinceLastGenerate = currentTime - lastGenerateTime;

	if (isGenerating) {
		console.log("Already generating");
		return;
	}

	if (timeSinceLastGenerate < DEBOUNCE_DURATION) {
		const remainingTime = Math.ceil((DEBOUNCE_DURATION - timeSinceLastGenerate) / 1000);
		const status = document.getElementById("status");
		if (status) status.innerText = `Please wait ${remainingTime}s before generating again`;
		return;
	}

	isGenerating = true;
	const btn = document.getElementById("generate-btn");
	const status = document.getElementById("status");
	btn.disabled = true;
	status.innerText = "Generating...";

	const selected = getSelectedCards();
	let baseCardId = getBaseCardId();

	// ensure baseCardId is set
	if (!baseCardId && selected.length > 0) {
		baseCardId = selected[0].id;
	}

	try {
		// Status callback for API calls
		const statusCallback = (msg) => {
			status.innerText = msg;
		};

		// Generate image using Gemini API
		const base64 = await generateImage(selected, baseCardId, statusCallback);

		// Store the returned base64 in memory
		lastGeneratedBase64 = base64;

		// Display the generated image in the DOM
		const dataUrl = "data:image/png;base64," + base64;
		const imgEl = document.getElementById("generated-img");
		if (imgEl) {
			imgEl.src = dataUrl;
			imgEl.style.display = "block";
		}

		// Upload to backend
		status.innerText = "Image generated. Uploading to server...";
		await uploadHybridBase64(base64, selected, baseCardId, statusCallback);
	} catch (err) {
		status.innerText = "Error: " + err.message;
		console.error(err);
	} finally {
		isGenerating = false;
		lastGenerateTime = Date.now();
		btn.disabled = false;
		btn.textContent = "Generate & Upload Hybrid";
	}
}
