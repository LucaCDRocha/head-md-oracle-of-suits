// UI functions for card display and selection
import { fetchCards } from "../api/cardApi.js";

let cards = [];
let selected = [];
let baseCardId = null;

/**
 * Load and display cards
 */
export async function loadCards() {
	const list = document.getElementById("cards-list");
	list.innerHTML = "Loading cards…";
	try {
		cards = await fetchCards();
		renderCards();
	} catch (err) {
		list.innerHTML = "Error loading cards: " + err.message;
	}
}

/**
 * Render cards grid in the DOM
 */
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

/**
 * Toggle card selection
 * @param {Object} card - Card object
 * @param {HTMLImageElement} imgEl - Image element
 */
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

/**
 * Update the selected cards UI
 */
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

/**
 * Get current selected cards
 * @returns {Array} Selected cards array
 */
export function getSelected() {
	return selected;
}

/**
 * Get base card ID
 * @returns {number} Base card ID
 */
export function getBaseCardId() {
	return baseCardId || (selected[0] && selected[0].id) || null;
}

/**
 * Set base card ID
 * @param {number} id - Card ID
 */
export function setBaseCardId(id) {
	baseCardId = id;
}

/**
 * Draw preview of selected cards
 * @param {Object} p5Instance - p5.js instance
 */
export function drawPreview(p5Instance) {
	p5Instance.background(200);
	if (selected.length === 3) {
		// draw three images as blended collage
		const imgs = selected.map((s) => s.img);
		if (imgs.every((i) => i && i.width > 0)) {
			p5Instance.push();
			// simple composition: draw images with multiply blend
			p5Instance.blendMode(p5Instance.BLEND);
			p5Instance.image(imgs[0], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.tint(255, 200);
			p5Instance.image(imgs[1], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.tint(255, 160);
			p5Instance.image(imgs[2], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.noTint();
			// overlay text
			p5Instance.fill(255);
			p5Instance.stroke(0);
			p5Instance.strokeWeight(2);
			p5Instance.textSize(24);
			p5Instance.textAlign(p5Instance.CENTER, p5Instance.BOTTOM);
			p5Instance.text("HYBRID", p5Instance.width / 2, p5Instance.height - 10);
			p5Instance.pop();
		}
	}
}
