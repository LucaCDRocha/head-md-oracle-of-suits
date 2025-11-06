import {
	initSlotSelector,
	getSelectedCards,
	getBaseCardId,
	drawPreview,
	setActiveSlotForKnobs,
	handleKnobChange,
} from "./ui/slotSelector.js";
import { generateImage } from "./api/geminiApi.js";
import { uploadHybridBase64 } from "./api/hybridApi.js";
import { setupSerial, setKnobChangeCallback } from "./Serial.js";

let canvas;
let lastGeneratedBase64 = null;

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

	// Setup radio buttons for slot selection
	setupSlotRadioButtons();

	// Setup fullscreen image click handler
	const generatedImg = document.getElementById("generated-img");
	if (generatedImg) {
		generatedImg.addEventListener("click", () => {
			generatedImg.style.display = "none";
		});
	}

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

// Setup radio buttons to switch active slot for knob control
function setupSlotRadioButtons() {
	const radios = document.querySelectorAll('input[name="active-slot"]');
	radios.forEach((radio) => {
		radio.addEventListener("change", (e) => {
			const slotId = parseInt(e.target.value);
			setActiveSlotForKnobs(slotId);
		});
	});
}

window.draw = function () {
	// Use drawPreview from slot selector module
	drawPreview(window);
};

async function onGenerate() {
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
		btn.disabled = false;
		btn.textContent = "Generate & Upload Hybrid";
	}
}
