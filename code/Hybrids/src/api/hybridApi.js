// API calls for hybrids
import { API_BASE } from "../../config.js";
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
		const fd = new FormData();

		const name = generateHybridName(selected);
		if (name) fd.append("name", name);

		selected.forEach((s) => fd.append("cards[]", s.id));

		const baseId = baseCardId || (selected[0] && selected[0].id) || null;
		if (baseId) fd.append("base_card_id", baseId);

		statusCallback("Compressing image...");
		const compressedBase64 = await compressImage(base64);

		const base64Data = compressedBase64.replace(/^data:image\/\w+;base64,/, "");
		const byteString = atob(base64Data);
		const ab = new ArrayBuffer(byteString.length);
		const ia = new Uint8Array(ab);
		for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
		const blob = new Blob([ia], { type: "image/jpeg" });
		const file = new File([blob], `hybrid_${Date.now()}.jpg`, { type: "image/jpeg" });

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

		const json = await res.json().catch(() => null);

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
