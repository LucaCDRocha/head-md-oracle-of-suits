/**
 * Initialize and manage QR codes for download and view all actions
 */

import { API_BASE } from "../../config.js";

let downloadQRCode = null;
let viewAllQRCode = null;
let currentHybridId = null;

/**
 * Initialize QR codes with default URLs
 */
export function initQRCodes() {
	const viewAllURL = API_BASE ? (API_BASE.replace(/\/$/, "")) : location.origin;

	const qrDownloadEl = document.getElementById("qr-download");
	const qrViewAllEl = document.getElementById("qr-view-all");

	if (qrDownloadEl) {
		qrDownloadEl.innerHTML = "";
	}

	if (qrViewAllEl) {
		qrViewAllEl.innerHTML = "";
		viewAllQRCode = new QRCode(qrViewAllEl, {
			text: viewAllURL,
			width: 150,
			height: 150,
			colorDark: "#721422",
			colorLight: "#fefbf5",
			correctLevel: QRCode.CorrectLevel.H,
		});
	}

	if (qrDownloadEl) {
		const downloadContainer = qrDownloadEl.closest(".qr-code-container");
		if (downloadContainer) {
			downloadContainer.style.visibility = "hidden";
		}
	}
}

/**
 * Update download QR code with the generated hybrid URL
 * @param {number} hybridId - The ID of the generated hybrid
 */
export function updateDownloadQR(hybridId) {
	if (!hybridId) return;

	currentHybridId = hybridId;
	const downloadURL = API_BASE ? `${API_BASE.replace(/\/$/, "")}/${hybridId}` : `${location.origin}/${hybridId}`;

	const qrDownloadEl = document.getElementById("qr-download");
	if (!qrDownloadEl) return;

	qrDownloadEl.innerHTML = "";
	downloadQRCode = new QRCode(qrDownloadEl, {
		text: downloadURL,
		width: 150,
		height: 150,
		colorDark: "#721422",
		colorLight: "#fefbf5",
		correctLevel: QRCode.CorrectLevel.H,
	});

	const downloadContainer = qrDownloadEl.closest(".qr-code-container");
	if (downloadContainer) {
		downloadContainer.style.visibility = "visible";
	}
}

/**
 * Get current hybrid ID
 * @returns {number|null} Current hybrid ID
 */
export function getCurrentHybridId() {
	return currentHybridId;
}
