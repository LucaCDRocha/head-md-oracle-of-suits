// API calls for hybrids
import { API_BASE } from "../config.js";
import { compressImage } from "../utils/imageUtils.js";

/**
 * Generate a hybrid name from selected cards
 * @param {Array} selected - Array of selected cards
 * @returns {string} Combined name
 */
export function generateHybridName(selected) {
	if (selected.length === 0) return "Hybrid";

	const names = selected.map((card) => {
		return card.name || `Card${card.id}`;
	});

	return names.join(" + ");
}

/**
 * Upload hybrid image to the backend
 * @param {string} base64 - Base64 encoded image data
 * @param {Array} selected - Array of selected cards
 * @param {number} baseCardId - ID of the base card
 * @param {Function} statusCallback - Callback to update status messages
 * @returns {Promise<Object>} Response data from the server
 */
export async function uploadHybridBase64(base64, selected, baseCardId, statusCallback) {
	if (!API_BASE) {
		statusCallback("API_BASE not configured; cannot upload hybrid.");
		return;
	}

	try {
		// build FormData
		const fd = new FormData();

		// Generate name from selected cards
		const name = generateHybridName(selected);
		if (name) fd.append("name", name);

		// append selected card ids
		const cardIds = selected.map((s) => s.id);
		selected.forEach((s) => fd.append("cards[]", s.id));

		const baseId = baseCardId || (selected[0] && selected[0].id) || null;
		if (baseId) fd.append("base_card_id", baseId);

		// Compress the image before uploading
		statusCallback("Compressing image...");
		const compressedBase64 = await compressImage(base64);

		// convert base64 to blob
		const base64Data = compressedBase64.replace(/^data:image\/\w+;base64,/, "");
		const byteString = atob(base64Data);
		const ab = new ArrayBuffer(byteString.length);
		const ia = new Uint8Array(ab);
		for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
		const blob = new Blob([ia], { type: "image/png" });
		const file = new File([blob], `hybrid_${Date.now()}.png`, { type: "image/png" });

		// Backend expects 'img' field name
		fd.append("img", file);

		statusCallback("Uploading hybrid to server...");

		const url = API_BASE.replace(/\/$/, "") + "/api/hybrids";

		const res = await fetch(url, {
			method: "POST",
			body: fd,
			headers: {
				Accept: "application/json",
				"X-Requested-With": "XMLHttpRequest",
			},
			redirect: "manual",
		});

		const json = await res.json().catch((e) => {
			return null;
		});

		if (!res.ok) {
			const errorMsg = json?.message || json?.error || JSON.stringify(json);
			statusCallback("Upload failed (" + res.status + "): " + errorMsg);
			throw new Error(errorMsg);
		}

		statusCallback("Hybrid stored (id: " + (json?.data?.id || "?") + ")");
		return json;
	} catch (err) {
		console.error("Upload error:", err);
		statusCallback("Upload error: " + err.message);
		throw err;
	}
}
