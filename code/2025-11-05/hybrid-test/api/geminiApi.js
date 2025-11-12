// API calls for Gemini generative AI
import { GEMINI_API_KEY, DEBUG } from "../config.js";

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

	// Get French suit and value from the base card
	const frenchSuit = baseCard?.french_suits || baseCard?.suits || "♠";
	const frenchValue = baseCard?.french_value || baseCard?.value || "A";

	// Check if this is a Joker card
	const isJoker = frenchValue?.toLowerCase() === "joker" || baseCard?.value?.toLowerCase() === "joker";

	// Build corner indices instructions based on card type
	let cornerInstructions;
	if (isJoker) {
		cornerInstructions = `2. CORNER INDICES (JOKER SPECIAL DESIGN):
   - Top-left corner: Write "JOKER" vertically (rotated 90 degrees clockwise, reading from bottom to top)
   - Bottom-right corner: Write "JOKER" vertically (rotated 90 degrees counter-clockwise, reading from top to bottom)
   - Use playful, decorative typography typical of Joker cards
   - Colorful design - can use multiple colors or rainbow effect
   - The word "JOKER" should be clearly visible but stylized to match vintage playing card aesthetics`;
	} else {
		cornerInstructions = `2. CORNER INDICES (IMPORTANT - Use these exact values):
   - Top-left corner: Display "${frenchValue}" (rank) and "${frenchSuit}" (suit symbol)
   - Stack them vertically (rank on top, suit symbol below)
   - Bottom-right corner: Same symbols rotated 180 degrees
   - Use classic French playing card typography
   - Red color for hearts (♥)/diamonds (♦), black for spades (♠)/clubs (♣)
   - Keep corners minimal and elegant
   - IMPORTANT: For the rank, use ONLY the first letter or initial (e.g., "J" for Jack, "Q" for Queen, "K" for King, "A" for Ace)
   - Do NOT write the full word - use only the single character initial
   - The rank "${frenchValue}" and suit symbol "${frenchSuit}" MUST appear in both corners`;
	}

	const prompt = `Create a hybrid playing card image with these EXACT specifications:

CARD STRUCTURE (Vintage French playing card style):
1. WHITE BORDER with ROUNDED CORNERS:
   - Add a clean white border around the entire card
   - The border should have gently rounded corners (like vintage playing cards)
   - Border width approximately 5-8% of card width
   - The main card area inside the border should also have rounded corners

${cornerInstructions}

3. CENTRAL HYBRID ARTWORK:
   - In the remaining center space, create a HYBRID fusion artwork
   - Blend visual elements from: ${selected.map((s) => s.name).join(", ")}
   - The hybrid should be creative, artistic, and seamlessly merge the themes
   - Vintage artistic style with rich colors and detailed illustration
   - Maintain sophisticated playing card aesthetic

TECHNICAL REQUIREMENTS:
- Portrait orientation (3:4 aspect ratio)
- Professional playing card quality with vintage aesthetic
- Clean, crisp design with rounded corners throughout
- White border with rounded corners is essential${
		isJoker
			? ""
			: `
- Corner indices must show: "${frenchValue}${frenchSuit}" in top-left and bottom-right (rotated)`
	}`;

	// If DEBUG mode is enabled, return the prompt as text instead of generating
	if (DEBUG) {
		console.log("DEBUG MODE: Returning prompt instead of generating image");
		console.log("Full prompt:", prompt);
		console.log(baseCard);
		statusCallback("DEBUG: Showing prompt instead of generating");
		// Return a special marker that indicates this is a prompt, not base64 image
		return "PROMPT:" + prompt;
	}

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
		throw new Error("No image data found in API response.");
	}

	return base64;
}
