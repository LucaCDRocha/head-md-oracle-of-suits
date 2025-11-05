let cards = [];
let selected = [];
let baseCardId = null;
let canvas;
let lastGeneratedBase64 = null;

// Read injected env from generated config.js (window.ENV) or fall back to window globals.
// Run `node generate-config.js` (once) to create `config.js` from .env; the script writes `window.ENV`.
const env = typeof window !== "undefined" && window.ENV ? window.ENV : {};
const API_BASE = window.API_BASE || env.API_BASE || "";
// Only GEMINI_API_KEY is supported for generative API key
const GEMINI_API_KEY = window.GEMINI_API_KEY || env.GEMINI_API_KEY || "";

console.log("Generative key present:", !!GEMINI_API_KEY);

// Add global error handler to prevent page reload on uncaught errors
window.addEventListener("error", function (e) {
	console.error("Global error caught:", e.error);
	e.preventDefault();
	return false;
});

function setup() {
	// small canvas used for composing the hybrid image
	const holder = document.getElementById("p5-holder");
	canvas = createCanvas(512, 512);
	canvas.parent(holder);
	background(240);

	// wire UI
	document.getElementById("generate-btn").addEventListener(
		"click",
		async (e) => {
			e.preventDefault(); // Prevent page reload
			e.stopPropagation(); // Stop event bubbling
			try {
				await onGenerate();
			} catch (error) {
				console.error("Error in onGenerate:", error);
				const status = document.getElementById("status");
				if (status) status.innerText = "Error: " + error.message;
			}
			return false; // Extra safety
		},
		false
	);

	fetchCards();
}

function generateHybridName() {
	if (selected.length === 0) return "Hybrid";

	// Extract card names and create a combined name
	const names = selected.map((card) => {
		// Use the card name, or fallback to id
		return card.name || `Card${card.id}`;
	});

	// Join with " + " to show it's a hybrid combination
	return names.join(" + ");
}

function draw() {
	// draw a preview of composed image if we have 3 selected
	background(200);
	if (selected.length === 3) {
		// draw three images as blended collage
		const imgs = selected.map((s) => s.img);
		if (imgs.every((i) => i && i.width > 0)) {
			push();
			// simple composition: draw images with multiply blend
			blendMode(BLEND);
			image(imgs[0], 0, 0, width, height);
			tint(255, 200);
			image(imgs[1], 0, 0, width, height);
			tint(255, 160);
			image(imgs[2], 0, 0, width, height);
			noTint();
			// overlay text
			fill(255);
			stroke(0);
			strokeWeight(2);
			textSize(24);
			textAlign(CENTER, BOTTOM);
			text("HYBRID", width / 2, height - 10);
			pop();
		}
	}
}

async function fetchCards() {
	const list = document.getElementById("cards-list");
	list.innerHTML = "Loading cards…";
	try {
		const res = await fetch(API_BASE + "/api/cards");
		if (!res.ok) throw new Error("Failed to fetch cards: " + res.status);
		const body = await res.json();
		// API returns { data: [...] }
		cards = body.data || body;
		renderCards();
	} catch (err) {
		list.innerHTML = "Error loading cards: " + err.message;
	}
}

function renderCards() {
	const list = document.getElementById("cards-list");
	list.innerHTML = "";
	const grid = document.createElement("div");
	grid.className = "cards-grid";
	cards.forEach((card) => {
		const cardEl = document.createElement("div");
		cardEl.className = "card";
		const img = document.createElement("img");
		img.src = card.img_src || "";
		img.alt = card.name || "";
		img.onerror = () => {
			img.style.opacity = 0.5;
		};
		const label = document.createElement("div");
		label.className = "card-label";
		label.innerText = card.name || "#" + card.id;
		cardEl.appendChild(img);
		cardEl.appendChild(label);
		cardEl.addEventListener("click", () => toggleSelect(card, img));
		grid.appendChild(cardEl);
	});
	list.appendChild(grid);
}

// Helper: compress image to be under max size
async function compressImage(base64Data, maxSizeKB = 10000) {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			let width = img.width;
			let height = img.height;

			// Calculate initial file size
			const initialSize = Math.round((base64Data.length * 3) / 4 / 1024);
			console.log(`Initial image size: ${initialSize} KB`);

			// If already under limit, return as is
			if (initialSize <= maxSizeKB) {
				resolve(base64Data);
				return;
			}

			// Scale down image to reduce size (more conservative scaling)
			const scaleFactor = Math.sqrt(maxSizeKB / initialSize) * 0.95;
			width = Math.floor(width * scaleFactor);
			height = Math.floor(height * scaleFactor);

			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, width, height);

			// Start with higher quality to preserve image quality
			let quality = 0.95;
			let compressed = canvas.toDataURL("image/jpeg", quality).split(",")[1];
			let compressedSize = Math.round((compressed.length * 3) / 4 / 1024);

			while (compressedSize > maxSizeKB && quality > 0.5) {
				quality -= 0.05;
				compressed = canvas.toDataURL("image/jpeg", quality).split(",")[1];
				compressedSize = Math.round((compressed.length * 3) / 4 / 1024);
			}

			console.log(
				`Compressed image size: ${compressedSize} KB (quality: ${quality.toFixed(
					2
				)}, dimensions: ${width}x${height})`
			);
			resolve(compressed);
		};
		img.src = "data:image/png;base64," + base64Data;
	});
}

// Helper: convert base64 to Blob/File and upload to API_BASE + /api/hybrids
async function uploadHybridBase64(base64) {
	const status = document.getElementById("status");
	if (!API_BASE) {
		if (status) status.innerText = "API_BASE not configured; cannot upload hybrid.";
		console.warn("API_BASE not configured; skipping upload");
		return;
	}

	try {
		// build FormData
		const fd = new FormData();
		// Generate name from selected cards
		const name = generateHybridName();
		if (name) fd.append("name", name);

		// append selected card ids
		const cardIds = selected.map((s) => s.id);
		console.log("Uploading with card IDs:", cardIds);
		selected.forEach((s) => fd.append("cards[]", s.id));

		const baseId = baseCardId || (selected[0] && selected[0].id) || null;
		console.log("Base card ID:", baseId);
		if (baseId) fd.append("base_card_id", baseId);

		// Compress the image before uploading
		if (status) status.innerText = "Compressing image...";
		const compressedBase64 = await compressImage(base64);

		// convert base64 to blob
		// Remove data URL prefix if present
		const base64Data = compressedBase64.replace(/^data:image\/\w+;base64,/, "");
		const byteString = atob(base64Data);
		const ab = new ArrayBuffer(byteString.length);
		const ia = new Uint8Array(ab);
		for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
		const blob = new Blob([ia], { type: "image/png" });
		const file = new File([blob], `hybrid_${Date.now()}.png`, { type: "image/png" });

		// Backend expects 'img' field name
		fd.append("img", file);

		console.log("File size:", blob.size, "bytes");
		console.log("File name:", file.name);
		console.log("FormData prepared, posting to:", API_BASE + "/api/hybrids");

		if (status) status.innerText = "Uploading hybrid to server...";

		const url = API_BASE.replace(/\/$/, "") + "/api/hybrids";
		console.log("Posting to URL:", url);

		const res = await fetch(url, {
			method: "POST",
			body: fd,
			headers: {
				Accept: "application/json",
				"X-Requested-With": "XMLHttpRequest",
			},
			redirect: "manual", // Don't follow redirects
		});

		console.log("Response status:", res.status);
		console.log("Response headers:", Object.fromEntries(res.headers.entries()));

		const json = await res.json().catch((e) => {
			console.error("Failed to parse JSON response:", e);
			return null;
		});

		console.log("Response JSON:", json);

		if (!res.ok) {
			console.error("Store error", res.status, json);
			const errorMsg = json?.message || json?.error || JSON.stringify(json);
			if (status) status.innerText = "Upload failed (" + res.status + "): " + errorMsg;
			return;
		}

		console.log("Stored hybrid successfully:", json);
		if (status) status.innerText = "Hybrid stored (id: " + (json?.data?.id || "?") + ")";
	} catch (err) {
		console.error("Upload error:", err);
		const status = document.getElementById("status");
		if (status) status.innerText = "Upload error: " + err.message;
	}
}

function toggleSelect(card, imgEl) {
	const existing = selected.findIndex((s) => s.id === card.id);
	if (existing >= 0) {
		selected.splice(existing, 1);
	} else {
		if (selected.length >= 3) return; // limit
		// create a p5.Image from the card img element for drawing
		const pImg = loadImage(
			imgEl.src,
			() => {},
			() => {}
		);
		selected.push({ ...card, img: pImg });
	}
	updateSelectedUI();
}

function updateSelectedUI() {
	const sel = document.getElementById("selected-cards");
	sel.innerHTML = "";
	selected.forEach((s, idx) => {
		const d = document.createElement("div");
		d.className = "selected-item";
		d.innerText = idx + 1 + ". " + (s.name || s.id);
		// mark base selection
		const radio = document.createElement("input");
		radio.type = "radio";
		radio.name = "base_card";
		radio.value = s.id;
		radio.checked = baseCardId == s.id || (selected.length === 1 && idx === 0 && baseCardId == null);
		radio.addEventListener("change", () => {
			baseCardId = s.id;
		});
		d.prepend(radio);
		sel.appendChild(d);
	});
	document.querySelector("#selected-area h3").innerText = `Selected (${selected.length}/3)`;
	document.getElementById("generate-btn").disabled = selected.length !== 3;
}

async function onGenerate() {
	const btn = document.getElementById("generate-btn");
	const status = document.getElementById("status");
	btn.disabled = true;
	status.innerText = "Generating...";

	// ensure baseCardId is set
	if (!baseCardId) baseCardId = selected[0].id;

	try {
		// Use the generative image API only when button clicked.
		// Use Gemini directly via Google's Generative Language REST API
		const API_KEY = GEMINI_API_KEY;
		const IMAGE_URL =
			"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

		if (!API_KEY) {
			status.innerText = "No generative API key provided; cannot call image API.";
			return;
		}

		status.innerText = "Calling Gemini image API...";

		// build a simple prompt from selected cards
		const baseId = baseCardId || selected[0]?.id;
		const baseCard = selected.find((s) => s.id === baseId) || selected[0];
		const suitName =
			baseCard?.equivalence_name || baseCard?.equivalence || baseCard?.suit || baseCard?.name || "spades";
		const prompt = `Create a hybrid card image blending: ${selected
			.map((s) => s.name)
			.join(
				", "
			)}. Use classic French suits (hearts, diamonds, clubs, spades) and use ${suitName} for corner symbols.`;

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
		};

		const res = await fetch(IMAGE_URL, {
			method: "POST",
			headers: {
				"x-goog-api-key": API_KEY,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		// Some non-200 can still return useful JSON; capture it for debugging
		const json = await res.json().catch(() => null);
		if (!res.ok) {
			console.error("API error", res.status, json);
			status.innerText = "Generative API error: " + res.status;
			return;
		}

		// Try to find base64-encoded image data in the response
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

		const base64 = findBase64Data(json);
		if (!base64) {
			status.innerText = "No image data found in API response. Check console for details.";
			console.warn("No base64 image data found", json);
			return;
		}

		// Store the returned base64 in memory but do not display it in the DOM (preview removed)
		lastGeneratedBase64 = base64;
		console.log("Generated image base64 length:", base64.length);

		// Display the generated image in the DOM (re-enable preview) and then upload it
		const dataUrl = "data:image/png;base64," + base64;
		const imgEl = document.getElementById("generated-img");
		if (imgEl) {
			imgEl.src = dataUrl;
			imgEl.style.display = "block";
		}
		status.innerText = "Image generated. Uploading to server...";
		await uploadHybridBase64(base64);
	} catch (err) {
		status.innerText = "Error: " + err.message;
		console.error(err);
	} finally {
		btn.disabled = false;
		// restore button label
		btn.textContent = "Generate & Upload Hybrid";
	}
}

function ensureImagesLoaded() {
	return new Promise((resolve) => {
		const checks = selected.map(
			(s) =>
				new Promise((res) => {
					const check = () => {
						if (s.img && s.img.width > 0) return res();
						setTimeout(check, 100);
					};
					check();
				})
		);
		Promise.all(checks).then(resolve);
	});
}
