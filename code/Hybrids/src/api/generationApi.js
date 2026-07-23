/**
 * generationApi.js - Image generation dispatcher strategy
 */

import { GENERATOR_API } from "../../config.js";
import { generateImage as generateGeminiImage } from "./geminiApi.js";
import { generateImage as generateComfyImage } from "./comfyApi.js";

/**
 * Dispatches image generation based on config.js GENERATOR_API setting
 * @param {Array} selected - Array of selected cards
 * @param {number} baseCardId - ID of the base card
 * @param {Function} statusCallback - Callback to update status messages
 * @returns {Promise<string>} Base64 encoded image data
 */
export async function generateImage(selected, baseCardId, statusCallback) {
	const mode = (GENERATOR_API || "").toLowerCase();
	
	if (mode === "gemini") {
		return generateGeminiImage(selected, baseCardId, statusCallback);
	} else if (mode === "comfyui") {
		return generateComfyImage(selected, baseCardId, statusCallback);
	} else {
		throw new Error(`Unsupported GENERATOR_API: "${GENERATOR_API}". Supported values: "gemini", "comfyui"`);
	}
}
