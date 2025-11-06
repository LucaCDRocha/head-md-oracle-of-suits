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
	const suitName =
		baseCard?.french_equivalence ||
		baseCard?.equivalence_name ||
		baseCard?.equivalence ||
		baseCard?.suit ||
		baseCard?.name ||
		"spades";

	const prompt = `Create a hybrid playing card image with these EXACT specifications:

CARD STRUCTURE (Vintage French playing card style):
1. WHITE BORDER with ROUNDED CORNERS:
   - Add a clean white border around the entire card
   - The border should have gently rounded corners (like vintage playing cards)
   - Border width approximately 5-8% of card width
   - The main card area inside the border should also have rounded corners

2. CORNER INDICES (Minimal, stacked style):
   - Top-left corner: Display only the rank and suit symbols for "${suitName}"
   - Stack them vertically (rank on top, suit symbol below)
   - Bottom-right corner: Same symbols rotated 180 degrees
   - NO TEXT - only symbols (like A with ♥, K with ♠, etc.)
   - Use classic French playing card typography
   - Red color for hearts/diamonds, black for spades/clubs
   - Keep corners minimal and elegant

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
- White border with rounded corners is essential`;

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
