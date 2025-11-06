// API calls for Gemini generative AI
import { GEMINI_API_KEY } from "../config.js";

/**
 * Recursively search for base64 image data in response object
 * @param {*} obj - Object to search
 * @returns {string|null} Base64 string if found
 */
function findBase64Data(obj) {
	if (!obj) return null;
	if (typeof obj === "string") {
		if (obj.length > 100 && /[\/+=]/.test(obj)) return obj;
		return null;
	}
	if (Array.isArray(obj)) {
		for (const v of obj) {
			const found = findBase64Data(v);
			if (found) return found;
		}
	}
	if (typeof obj === "object") {
		for (const k of Object.keys(obj)) {
			if (k === "data" && typeof obj[k] === "string") {
				return obj[k];
			}
			const found = findBase64Data(obj[k]);
			if (found) return found;
		}
	}
	return null;
}

/**
 * Generate an image using Gemini API
 * @param {Array} selected - Array of selected cards
 * @param {number} baseCardId - ID of the base card
 * @param {Function} statusCallback - Callback to update status messages
 * @returns {Promise<string>} Base64 encoded image data
 */
export async function generateImage(selected, baseCardId, statusCallback) {
	const IMAGE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

	if (!GEMINI_API_KEY) {
		throw new Error("No generative API key provided; cannot call image API.");
	}

	statusCallback("Calling Gemini image API...");

	// Card dimensions (poker card standard ratio: 2.5:3.5 or 5:7)
	// Standard playing card: 63mm x 88mm or 2.5" x 3.5"
	// Closest supported aspect ratio: 3:4 (portrait)
	const CARD_WIDTH = 750;
	const CARD_HEIGHT = 1050;
	const ASPECT_RATIO = "3:4"; // Portrait orientation, closest to 5:7 card ratio

	// build a simple prompt from selected cards
	const baseId = baseCardId || selected[0]?.id;
	const baseCard = selected.find((s) => s.id === baseId) || selected[0];
	const suitName = baseCard?.equivalence_name || baseCard?.equivalence || baseCard?.suit || baseCard?.name || "spades";

	const prompt = `Create a vertical portrait playing card image blending: ${selected.map((s) => s.name).join(", ")}. 

CRITICAL REQUIREMENTS:
- PORTRAIT/VERTICAL orientation - card must be taller than it is wide
- The ENTIRE image should be the card design - no white background, no padding, no borders outside the card
- Fill the entire canvas edge-to-edge with the card artwork
- Use classic French playing card design with corner symbols
- Main suit symbol should be ${suitName}
- Include corner indices (rank and suit in top-left and bottom-right corners)
- Central artwork blending the themes of the selected cards
- Professional playing card aesthetic with clean, crisp design
- The card design itself should have a subtle decorative border, but the image should not have any white space around it`;

	const payload = {
		contents: [
			{
				parts: [
					{
						text: prompt,
					},
				],
			},
		],
		generationConfig: {
			temperature: 0.8,
			topK: 40,
			topP: 0.95,
			maxOutputTokens: 8192,
			responseModalities: ["IMAGE"], // Only return image, no text
			imageConfig: {
				aspectRatio: ASPECT_RATIO, // 3:4 portrait (864x1184 pixels)
			},
		},
	};

	const res = await fetch(IMAGE_URL, {
		method: "POST",
		headers: {
			"x-goog-api-key": GEMINI_API_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const json = await res.json().catch(() => null);
	if (!res.ok) {
		console.error("API error", res.status, json);
		throw new Error("Generative API error: " + res.status);
	}

	// Try to find base64-encoded image data in the response
	const base64 = findBase64Data(json);
	if (!base64) {
		console.warn("No base64 image data found", json);
		throw new Error("No image data found in API response.");
	}

	console.log("Generated image base64 length:", base64.length);
	console.log(`Requested card dimensions: ${CARD_WIDTH}x${CARD_HEIGHT} (5:7 ratio)`);
	return base64;
}
