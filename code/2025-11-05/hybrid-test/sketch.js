import { initSlotSelector, getSelectedCards, getBaseCardId, drawPreview, handleKnobChange } from "./ui/slotSelector.js";
import { generateImage } from "./api/geminiApi.js";
import { uploadHybridBase64 } from "./api/hybridApi.js";
import { setupSerial, setKnobChangeCallback, setButtonPressCallback, setKnobValue } from "./Serial.js";
import { initQRCodes, updateDownloadQR } from "./ui/qrCodes.js";
import { DEBUG } from "./config.js";

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

	// Initialize QR codes
	initQRCodes();

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

	// Apply DEBUG mode visibility
	applyDebugMode();

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

/**
 * Apply DEBUG mode visibility settings
 * - Shows/hides knob values display
 * - Shows/hides selected area (generate button section)
 */
function applyDebugMode() {
	// Control knob values display
	const knobValuesDisplay = document.getElementById("knob-values-display");
	if (knobValuesDisplay) {
		knobValuesDisplay.style.display = DEBUG ? "block" : "none";
	}

	// Control selected area (generate button section)
	const selectedArea = document.getElementById("selected-area");
	if (selectedArea) {
		selectedArea.style.display = DEBUG ? "block" : "none";
	}
}

window.draw = function () {
	// Use drawPreview from slot selector module
	drawPreview(window);

	simulateSerialInput();
};

// make setKnobValue globally available and callable from browser console
window.setKnobValue = setKnobValue;

function simulateSerialInput() {

	let keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'A', 'B'];

	for (let i = 0; i < keys.length; i++) {
		const knobIndex = i;
		if (keyIsDown(keys[i].charCodeAt(0))) {
			// map mouse x position within div with id cards-list to 0-1023
			const cardsListDiv = document.getElementById("cards-list");
			const rect = cardsListDiv.getBoundingClientRect();
			const relativeX = mouseX - rect.left;
			const value = Math.floor(map(relativeX, 0, rect.width, 0, 1023));
			//console.log(`Simulating knob ${knobIndex} change to ${value}`);
			//console.log(`mousex=${mouseX} width=${width} mappedValue=${value}`);
			setKnobValue(knobIndex, value);
		}
	}
	
}

function handleButtonPress() {
	// Check if we're currently generating or within debounce period
	const currentTime = Date.now();
	const timeSinceLastGenerate = currentTime - lastGenerateTime;

	if (isGenerating) {
		const status = document.getElementById("status");
		if (status) status.innerText = "Generation in progress, please wait...";
		return;
	}

	if (timeSinceLastGenerate < DEBOUNCE_DURATION) {
		const remainingTime = Math.ceil((DEBOUNCE_DURATION - timeSinceLastGenerate) / 1000);
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
	const loadingOverlay = document.getElementById("loading-overlay");
	const loadingStatus = document.getElementById("loading-status");
	const generatedImg = document.getElementById("generated-img");

	btn.disabled = true;
	status.innerText = "Generating...";

	// Show loading overlay and hide previous image
	if (loadingOverlay) loadingOverlay.style.display = "flex";
	if (generatedImg) generatedImg.style.display = "none";

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
			if (loadingStatus) loadingStatus.innerText = msg;
		};

		// Generate image using Gemini API
		statusCallback("Génération de l'image...");
		const base64 = await generateImage(selected, baseCardId, statusCallback);

		// Check if this is a prompt (DEBUG mode) or actual image
		if (base64.startsWith("PROMPT:")) {
			// DEBUG mode: Display the prompt as text
			const prompt = base64.substring(7); // Remove "PROMPT:" prefix

			// Hide loading overlay
			if (loadingOverlay) loadingOverlay.style.display = "none";

			// Hide the image element and show prompt instead
			const imgEl = document.getElementById("generated-img");
			if (imgEl) imgEl.style.display = "none";

			// Create or get the prompt display element
			let promptDisplay = document.getElementById("prompt-display");
			if (!promptDisplay) {
				promptDisplay = document.createElement("div");
				promptDisplay.id = "prompt-display";
				promptDisplay.style.cssText = `
					max-width: 90%;
					max-height: 100%;
					overflow-y: auto;
					background: white;
					padding: 20px;
					border-radius: 12px;
					box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
					font-family: monospace;
					font-size: 14px;
					line-height: 1.6;
					white-space: pre-wrap;
					text-align: left;
				`;
				document.getElementById("app2-content").appendChild(promptDisplay);
			}
			promptDisplay.textContent = prompt;
			promptDisplay.style.display = "block";

			statusCallback("DEBUG: Prompt affiché");

			// Store the prompt (not base64)
			lastGeneratedBase64 = null;
		} else {
			// Normal mode: Display the generated image
			// Store the returned base64 in memory
			lastGeneratedBase64 = base64;

			// Display the generated image in the DOM
			const dataUrl = "data:image/png;base64," + base64;
			const imgEl = document.getElementById("generated-img");
			if (imgEl) {
				imgEl.src = dataUrl;
				imgEl.style.display = "block";
			}

			// Hide prompt display if it exists
			const promptDisplay = document.getElementById("prompt-display");
			if (promptDisplay) promptDisplay.style.display = "none";

			// Hide loading overlay
			if (loadingOverlay) loadingOverlay.style.display = "none";

			// Upload to backend
			statusCallback("Envoi au serveur...");
			const uploadResult = await uploadHybridBase64(base64, selected, baseCardId, statusCallback);

			// Update download QR code with the hybrid ID
			if (uploadResult && uploadResult.data && uploadResult.data.id) {
				updateDownloadQR(uploadResult.data.id);
			}

			statusCallback("Terminé!");
		}
	} catch (err) {
		// Hide loading overlay on error
		if (loadingOverlay) loadingOverlay.style.display = "none";
		status.innerText = "Error: " + err.message;
		console.error(err);
	} finally {
		isGenerating = false;
		lastGenerateTime = Date.now();
		btn.disabled = false;
		btn.textContent = "Generate & Upload Hybrid";
	}
}
