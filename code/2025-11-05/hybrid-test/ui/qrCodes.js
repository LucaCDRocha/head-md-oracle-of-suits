/**
 * Initialize and manage QR codes for download and view all actions
 */

import { API_BASE } from "../config.js";

let downloadQRCode = null;
let viewAllQRCode = null;
let currentHybridId = null;

/**
 * Initialize QR codes with default URLs
 */
export function initQRCodes() {
	// URL for viewing all hybrids
	const viewAllURL = API_BASE + "/hybrids";

	// Clear existing QR codes
	document.getElementById("qr-download").innerHTML = "";
	document.getElementById("qr-view-all").innerHTML = "";

	// Generate QR code for "View All"
	viewAllQRCode = new QRCode(document.getElementById("qr-view-all"), {
		text: viewAllURL,
		width: 150,
		height: 150,
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H,
	});

	// Don't generate a QR code for download initially - wait for hybrid generation
	// Hide the download container until a hybrid is generated
	const downloadContainer = document.getElementById("qr-download").closest(".qr-code-container");
	if (downloadContainer) {
		downloadContainer.style.visibility = "hidden";
	}
}

/**
 * Update download QR code with the generated hybrid URL
 * @param {number} hybridId - The ID of the generated hybrid
 */
export function updateDownloadQR(hybridId) {
	if (!hybridId) return;

	currentHybridId = hybridId;
	const downloadURL = API_BASE + `/hybrids/${hybridId}`;

	// Clear and regenerate the download QR code
	document.getElementById("qr-download").innerHTML = "";
	downloadQRCode = new QRCode(document.getElementById("qr-download"), {
		text: downloadURL,
		width: 150,
		height: 150,
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H,
	});

	// Show the download container
	const downloadContainer = document.getElementById("qr-download").closest(".qr-code-container");
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
