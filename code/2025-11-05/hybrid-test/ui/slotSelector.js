/**
 * Dynamic slot-based card selector
 * Each slot can filter by: year, game, suits, rank (value)
 */

import { fetchCards } from "../api/cardApi.js";

let allCards = [];
let allGames = [];
let slots = [
	{ id: 1, filters: {}, selectedCard: null },
	{ id: 2, filters: {}, selectedCard: null },
	{ id: 3, filters: {}, selectedCard: null },
];
let baseSlotId = 1;

/**
 * Initialize the slot selector UI
 */
export async function initSlotSelector() {
	try {
		// Fetch all cards and extract unique games/years/suits/values
		allCards = await fetchCards();
		extractGameData();

		// Initialize each slot with a random card
		slots.forEach((slot) => {
			selectRandomCard(slot);
		});

		renderSlotUI();

		// Initialize knob control visual indicator
		updateKnobActiveIndicator();
	} catch (err) {
		console.error("Error initializing slot selector:", err);
	}
}

/**
 * Extract unique games, years, suits, values from cards
 */
function extractGameData() {
	// Group cards by game to build game metadata
	const gameMap = new Map();

	console.log("Extracting game data from", allCards.length, "cards");

	allCards.forEach((card) => {
		// Cards may have game_id or game.id depending on API structure
		const gameId = card.game_id || card.game?.id;

		if (!gameId) {
			console.warn("Card missing game_id:", card);
			return;
		}

		if (!gameMap.has(gameId)) {
			gameMap.set(gameId, {
				id: gameId,
				name: card.game?.name || `Game ${gameId}`,
				year: card.game?.year || null,
				suits: new Set(),
				values: new Set(),
			});
		}

		const game = gameMap.get(gameId);
		if (card.suits) game.suits.add(card.suits);
		if (card.value) game.values.add(card.value);
	});

	allGames = Array.from(gameMap.values()).map((game) => ({
		...game,
		suits: Array.from(game.suits).sort(),
		values: Array.from(game.values).sort(),
	}));

	console.log("Extracted games:", allGames);
}

/**
 * Render the slot-based UI
 */
function renderSlotUI() {
	const container = document.getElementById("cards-list");
	container.innerHTML = "";
	container.className = "slots-container";

	slots.forEach((slot) => {
		const slotEl = createSlotElement(slot);
		container.appendChild(slotEl);
	});

	updateSelectedArea();
}

/**
 * Create a single slot element with filters
 */
function createSlotElement(slot) {
	const slotDiv = document.createElement("div");
	slotDiv.className = "slot-card";
	slotDiv.id = `slot-${slot.id}`;

	// Add base card indicator class
	if (baseSlotId === slot.id) {
		slotDiv.classList.add("base-card");
	}

	// Header (hidden by CSS but kept for structure)
	const header = document.createElement("div");
	header.className = "slot-header";

	const title = document.createElement("h3");
	title.textContent = `Card ${slot.id}`;
	header.appendChild(title);

	// Base card radio button
	const baseRadio = document.createElement("input");
	baseRadio.type = "radio";
	baseRadio.name = "base_slot";
	baseRadio.value = slot.id;
	baseRadio.checked = baseSlotId === slot.id;
	baseRadio.addEventListener("change", () => {
		baseSlotId = slot.id;
		renderSlotUI(); // Re-render to update visual indicator
	});

	const baseLabel = document.createElement("label");
	baseLabel.textContent = " Base card";
	baseLabel.prepend(baseRadio);
	header.appendChild(baseLabel);

	slotDiv.appendChild(header);

	// Card preview area (will be displayed first due to CSS order)
	const previewDiv = document.createElement("div");
	previewDiv.className = "slot-preview";
	previewDiv.id = `preview-${slot.id}`;

	if (slot.selectedCard) {
		previewDiv.innerHTML = `
			<img src="${slot.selectedCard.img_src}" alt="${slot.selectedCard.name}" />
			<div class="card-info">${slot.selectedCard.name}</div>
		`;
	} else {
		previewDiv.innerHTML = '<div class="no-card">Select filters to choose a card</div>';
	}

	slotDiv.appendChild(previewDiv);

	// Filters section (will be displayed below preview due to CSS order)
	const filtersDiv = document.createElement("div");
	filtersDiv.className = "slot-filters";

	// Year filter
	filtersDiv.appendChild(createYearFilter(slot));

	// Game filter
	filtersDiv.appendChild(createGameFilter(slot));

	// Suits filter (dynamic based on selected game)
	filtersDiv.appendChild(createSuitsFilter(slot));

	// Value/Rank filter (dynamic based on selected game)
	filtersDiv.appendChild(createValueFilter(slot));

	slotDiv.appendChild(filtersDiv);

	// Add base card selector below filters
	const baseSelector = document.createElement("div");
	baseSelector.className = "base-selector";
	baseSelector.style.marginTop = "12px";
	baseSelector.style.textAlign = "center";

	const baseCheckbox = document.createElement("input");
	baseCheckbox.type = "radio";
	baseCheckbox.name = "base_card_selector";
	baseCheckbox.id = `base-${slot.id}`;
	baseCheckbox.value = slot.id;
	baseCheckbox.checked = baseSlotId === slot.id;
	baseCheckbox.addEventListener("change", () => {
		baseSlotId = slot.id;
		renderSlotUI();
	});

	const baseLabelElement = document.createElement("label");
	baseLabelElement.htmlFor = `base-${slot.id}`;
	baseLabelElement.textContent = " Use as base card";
	baseLabelElement.style.fontSize = "12px";
	baseLabelElement.style.fontWeight = "600";
	baseLabelElement.style.cursor = "pointer";

	baseSelector.appendChild(baseCheckbox);
	baseSelector.appendChild(baseLabelElement);
	slotDiv.appendChild(baseSelector);

	return slotDiv;
}

/**
 * Select a random card for a slot
 */
function selectRandomCard(slot) {
	if (allCards.length === 0) return;

	const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
	const gameId = randomCard.game_id || randomCard.game?.id;

	// Set filters based on the random card
	slot.filters.year = randomCard.game?.year || null;
	slot.filters.game = gameId;
	slot.filters.suits = randomCard.suits;
	slot.filters.value = randomCard.value;

	// Select the card
	selectCardForSlot(slot, randomCard);
}

/**
 * Auto-select card if all required filters are set
 * If changing filters and card was previously selected, try to match French equivalence
 */
function autoSelectCardIfFiltersComplete(slot) {
	// Store previous French equivalence if we had a card selected
	const previousEquivalence = slot.selectedCard?.french_equivalence;

	// Check if we have enough filters to uniquely identify a card
	// At minimum we need: game, suits, and value
	if (!slot.filters.game || !slot.filters.suits || !slot.filters.value) {
		// Not enough filters, try to find cards matching French equivalence if we're changing game
		if (previousEquivalence && slot.filters.game) {
			tryMatchByFrenchEquivalence(slot, previousEquivalence);
		}
		return;
	}

	// Find matching cards
	let matchingCards = allCards.filter((card) => {
		const gameId = card.game_id || card.game?.id;

		if (slot.filters.year && card.game?.year != slot.filters.year) return false;
		if (slot.filters.game && gameId != slot.filters.game) return false;
		if (slot.filters.suits && card.suits != slot.filters.suits) return false;
		if (slot.filters.value && card.value != slot.filters.value) return false;

		return true;
	});

	if (matchingCards.length === 1) {
		// Exactly one card matches - auto-select it
		selectCardForSlot(slot, matchingCards[0]);
	} else if (matchingCards.length > 1) {
		// Multiple cards match - select the first one
		selectCardForSlot(slot, matchingCards[0]);
	}
	// If no cards match, leave selectedCard as null
}

/**
 * Try to match a card by French equivalence when changing games
 */
function tryMatchByFrenchEquivalence(slot, targetEquivalence) {
	if (!targetEquivalence) return false;

	console.log(`Trying to match French equivalence: ${targetEquivalence}`);

	// First, try direct match (same French equivalence string)
	let matchingCards = allCards.filter((card) => {
		const gameId = card.game_id || card.game?.id;

		// Must match year filter if set
		if (slot.filters.year && card.game?.year != slot.filters.year) return false;

		// Must match the new game
		if (slot.filters.game && gameId != slot.filters.game) return false;

		// Must match French equivalence exactly
		return card.french_equivalence === targetEquivalence;
	});

	// If no direct match, try to find cards in the new game that share the same French equivalence
	// This handles cases like: Pentacles -> Diamonds -> Coins
	// All three might have "3 de Carreau" as their French equivalence
	if (matchingCards.length === 0) {
		console.log(`No direct match found, searching for cards with same French equivalence target...`);

		// Find all cards in ANY game that have this French equivalence
		const cardsWithSameEquivalence = allCards.filter((card) => card.french_equivalence === targetEquivalence);

		if (cardsWithSameEquivalence.length > 0) {
			// Get the French equivalence components (this is our "universal" reference)
			// Now find cards in the NEW game that also map to this same French equivalence
			matchingCards = allCards.filter((card) => {
				const gameId = card.game_id || card.game?.id;

				// Must match year filter if set
				if (slot.filters.year && card.game?.year != slot.filters.year) return false;

				// Must match the new game
				if (slot.filters.game && gameId != slot.filters.game) return false;

				// Must have the same French equivalence as our target
				return card.french_equivalence === targetEquivalence;
			});

			console.log(`Found ${matchingCards.length} cards in new game with French equivalence: ${targetEquivalence}`);
		}
	}

	if (matchingCards.length > 0) {
		// Found matching card(s) - select the first one
		const matchedCard = matchingCards[0];

		// Update filters to match the found card
		const gameId = matchedCard.game_id || matchedCard.game?.id;
		slot.filters.game = gameId;
		slot.filters.suits = matchedCard.suits;
		slot.filters.value = matchedCard.value;

		selectCardForSlot(slot, matchedCard);
		console.log(
			`✓ Matched: ${matchedCard.name} (${matchedCard.suits}, ${matchedCard.value}) with French equivalence: ${matchedCard.french_equivalence}`
		);
		return true;
	}

	console.log(`✗ No match found for French equivalence: ${targetEquivalence}`);
	return false;
}

/**
 * Create year filter dropdown
 */
function createYearFilter(slot) {
	const filterGroup = document.createElement("div");
	filterGroup.className = "filter-group";

	const label = document.createElement("label");
	label.textContent = "Year:";

	const select = document.createElement("select");
	select.className = "filter-select";
	select.id = `year-${slot.id}`;

	const years = [...new Set(allGames.map((g) => g.year).filter((y) => y))].sort();
	years.forEach((year) => {
		const option = document.createElement("option");
		option.value = year;
		option.textContent = year;
		option.selected = slot.filters.year == year;
		select.appendChild(option);
	});

	select.addEventListener("change", () => {
		slot.filters.year = select.value || null;
		slot.filters.game = null; // Reset dependent filters
		slot.filters.suits = null;
		slot.filters.value = null;
		slot.selectedCard = null;
		autoSelectCardIfFiltersComplete(slot);
		renderSlotUI();
	});

	filterGroup.appendChild(label);
	filterGroup.appendChild(select);
	return filterGroup;
}

/**
 * Create game filter dropdown
 */
function createGameFilter(slot) {
	const filterGroup = document.createElement("div");
	filterGroup.className = "filter-group";

	const label = document.createElement("label");
	label.textContent = "Game:";

	const select = document.createElement("select");
	select.className = "filter-select";
	select.id = `game-${slot.id}`;

	const allOption = document.createElement("option");
	allOption.value = "";
	allOption.textContent = "All games";
	select.appendChild(allOption);

	// Filter games by year if year is selected
	let availableGames = allGames;
	if (slot.filters.year) {
		availableGames = allGames.filter((g) => g.year == slot.filters.year);
	}

	availableGames.forEach((game) => {
		const option = document.createElement("option");
		option.value = game.id;
		option.textContent = `${game.name}${game.year ? ` (${game.year})` : ""}`;
		option.selected = slot.filters.game == game.id;
		select.appendChild(option);
	});

	select.addEventListener("change", () => {
		// Store previous French equivalence before changing
		const previousEquivalence = slot.selectedCard?.french_equivalence;

		slot.filters.game = select.value || null;

		// If we had a card and are changing to a new game, try to match French equivalence
		if (previousEquivalence && slot.filters.game) {
			const matched = tryMatchByFrenchEquivalence(slot, previousEquivalence);
			if (!matched) {
				// No match found, reset filters
				slot.filters.suits = null;
				slot.filters.value = null;
				slot.selectedCard = null;
			}
		} else {
			// Reset dependent filters
			slot.filters.suits = null;
			slot.filters.value = null;
			slot.selectedCard = null;
		}

		renderSlotUI();
	});

	filterGroup.appendChild(label);
	filterGroup.appendChild(select);
	return filterGroup;
}

/**
 * Create suits filter dropdown (dynamic based on selected game)
 */
function createSuitsFilter(slot) {
	const filterGroup = document.createElement("div");
	filterGroup.className = "filter-group";

	const label = document.createElement("label");
	label.textContent = "Suits:";

	const select = document.createElement("select");
	select.className = "filter-select";
	select.id = `suits-${slot.id}`;

	const allOption = document.createElement("option");
	allOption.value = "";
	allOption.textContent = "All suits";
	select.appendChild(allOption);

	// Get available suits based on filters
	const availableSuits = getAvailableSuits(slot.filters);

	availableSuits.forEach((suit) => {
		const option = document.createElement("option");
		option.value = suit;
		option.textContent = suit;
		option.selected = slot.filters.suits == suit;
		select.appendChild(option);
	});

	select.disabled = availableSuits.length === 0;

	select.addEventListener("change", () => {
		slot.filters.suits = select.value || null;
		slot.selectedCard = null;
		autoSelectCardIfFiltersComplete(slot);
		renderSlotUI();
	});

	filterGroup.appendChild(label);
	filterGroup.appendChild(select);
	return filterGroup;
}

/**
 * Create value/rank filter dropdown (dynamic based on selected game)
 */
function createValueFilter(slot) {
	const filterGroup = document.createElement("div");
	filterGroup.className = "filter-group";

	const label = document.createElement("label");
	label.textContent = "Rank:";

	const select = document.createElement("select");
	select.className = "filter-select";
	select.id = `value-${slot.id}`;

	const allOption = document.createElement("option");
	allOption.value = "";
	allOption.textContent = "All ranks";
	select.appendChild(allOption);

	// Get available values based on filters
	const availableValues = getAvailableValues(slot.filters);

	availableValues.forEach((value) => {
		const option = document.createElement("option");
		option.value = value;
		option.textContent = value;
		option.selected = slot.filters.value == value;
		select.appendChild(option);
	});

	select.disabled = availableValues.length === 0;

	select.addEventListener("change", () => {
		slot.filters.value = select.value || null;
		slot.selectedCard = null;
		autoSelectCardIfFiltersComplete(slot);
		renderSlotUI();
	});

	filterGroup.appendChild(label);
	filterGroup.appendChild(select);
	return filterGroup;
}

/**
 * Get all available years from games
 */
function getAvailableYears() {
	// Get unique years, excluding null/empty
	const years = [...new Set(allGames.map((g) => g.year).filter((y) => y))];
	return years.sort((a, b) => a - b);
}

/**
 * Get available games based on current filters
 */
function getAvailableGames(slot) {
	let games = allGames;

	// Filter by year if set
	if (slot.filters.year) {
		games = games.filter((g) => g.year == slot.filters.year);
	}

	// Return game IDs
	return games.map((g) => g.id);
}

/**
 * Get available suits based on current filters
 * Note: Does NOT filter by value to allow selecting any suit (e.g., Joker)
 */
function getAvailableSuits(filters) {
	let cards = allCards;

	if (filters.year) {
		cards = cards.filter((c) => c.game?.year == filters.year);
	}
	if (filters.game) {
		cards = cards.filter((c) => (c.game_id || c.game?.id) == filters.game);
	}
	// Removed value filter to allow independent suit selection

	const suits = [...new Set(cards.map((c) => c.suits).filter((s) => s))];
	return suits.sort();
}

/**
 * Get available values based on current filters
 */
function getAvailableValues(filters) {
	let cards = allCards;

	if (filters.year) {
		cards = cards.filter((c) => c.game?.year == filters.year);
	}
	if (filters.game) {
		cards = cards.filter((c) => (c.game_id || c.game?.id) == filters.game);
	}
	if (filters.suits) {
		cards = cards.filter((c) => c.suits == filters.suits);
	}

	const values = [...new Set(cards.map((c) => c.value).filter((v) => v))];
	return values.sort();
}

/**
 * Select a card for a slot
 */
function selectCardForSlot(slot, card) {
	slot.selectedCard = card;

	// Load p5 image for preview (will be available after p5 setup)
	if (typeof loadImage !== "undefined") {
		const p5LoadImage = window.loadImage || loadImage;
		slot.selectedCard.img = p5LoadImage(
			card.img_src,
			() => {},
			() => {}
		);
	}

	// Update UI
	const previewDiv = document.getElementById(`preview-${slot.id}`);
	if (previewDiv) {
		previewDiv.innerHTML = `
			<img src="${card.img_src}" alt="${card.name}" />
			<div class="card-info">${card.name}</div>
		`;
	}

	updateSelectedArea();
}

/**
 * Update the selected area (summary + generate button)
 */
function updateSelectedArea() {
	const selectedArea = document.getElementById("selected-area");
	if (!selectedArea) return;

	const selectedCards = slots.filter((s) => s.selectedCard).map((s) => s.selectedCard);
	const count = selectedCards.length;

	selectedArea.querySelector("h3").textContent = `Selected (${count}/3)`;

	const btn = document.getElementById("generate-btn");
	btn.disabled = count !== 3;

	// Update status or summary
	const summary = selectedArea.querySelector("#selected-summary");
	if (summary) {
		summary.innerHTML = "";
		slots.forEach((slot) => {
			if (slot.selectedCard) {
				const item = document.createElement("div");
				item.className = "summary-item";
				const isBase = baseSlotId === slot.id;
				item.innerHTML = `
					<strong>Slot ${slot.id}${isBase ? " (BASE)" : ""}:</strong> ${slot.selectedCard.name}
				`;
				summary.appendChild(item);
			}
		});
	}
}

/**
 * Get selected cards for generation
 */
export function getSelectedCards() {
	return slots.filter((s) => s.selectedCard).map((s) => s.selectedCard);
}

/**
 * Get base card
 */
export function getBaseCard() {
	const baseSlot = slots.find((s) => s.id === baseSlotId);
	return baseSlot?.selectedCard || null;
}

/**
 * Get base card ID
 */
export function getBaseCardId() {
	return getBaseCard()?.id || null;
}

/**
 * Draw preview using p5
 */
export function drawPreview(p5Instance) {
	p5Instance.background(200);

	const selectedCards = getSelectedCards();

	if (selectedCards.length === 3) {
		const imgs = selectedCards.map((c) => c.img).filter((img) => img && img.width > 0);

		if (imgs.length === 3) {
			p5Instance.push();
			p5Instance.blendMode(p5Instance.BLEND);
			p5Instance.image(imgs[0], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.tint(255, 200);
			p5Instance.image(imgs[1], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.tint(255, 160);
			p5Instance.image(imgs[2], 0, 0, p5Instance.width, p5Instance.height);
			p5Instance.noTint();

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

// ============= KNOB CONTROL SYSTEM =============

let activeSlotForKnobs = 1; // Which slot is being controlled by knobs

/**
 * Set which slot should be controlled by the knobs
 */
export function setActiveSlotForKnobs(slotId) {
	activeSlotForKnobs = slotId;
	console.log(`Active slot for knobs set to: ${slotId}`);

	// Update visual indicator
	updateKnobActiveIndicator();
}

/**
 * Get the currently active slot for knob control
 */
export function getActiveSlotForKnobs() {
	return activeSlotForKnobs;
}

/**
 * Update visual indicator showing which slot is controlled by knobs
 */
function updateKnobActiveIndicator() {
	// Remove active-knob-control class from all slots
	document.querySelectorAll(".slot-card").forEach((el) => {
		el.classList.remove("active-knob-control");
	});

	// Add to active slot
	const activeSlotEl = document.getElementById(`slot-${activeSlotForKnobs}`);
	if (activeSlotEl) {
		activeSlotEl.classList.add("active-knob-control");
	}
}

/**
 * Handle knob value changes from Arduino
 * knobValues = [knob1, knob2, knob3, knob4] each 0-1023
 * Map to: Year, Game, Suits, Value
 */
export function handleKnobChange(knobValues) {
	console.log("Knob values received:", knobValues);

	const slot = slots.find((s) => s.id === activeSlotForKnobs);
	if (!slot) {
		console.error("Active slot not found:", activeSlotForKnobs);
		return;
	}

	console.log("Controlling slot:", slot.id);

	// Get available options for each filter based on current slot state
	const yearOptions = getAvailableYears();
	const gameOptions = getAvailableGames(slot);

	// For suits and values, we need to pass the current filters to get dynamic options
	// This ensures that as you change game, the available suits/values update
	const suitsOptions = getAvailableSuits(slot.filters);
	const valueOptions = getAvailableValues(slot.filters);

	console.log("Available options:", {
		years: yearOptions.length,
		games: gameOptions.length,
		suits: suitsOptions.length,
		values: valueOptions.length,
	});

	// Map each knob value (0-1023) to its respective filter length
	// Use Math.floor to get index, and clamp to valid range
	let yearIndex = 0;
	let gameIndex = 0;
	let suitsIndex = 0;
	let valueIndex = 0;

	if (yearOptions.length > 0) {
		yearIndex = Math.floor((knobValues[0] / 1024) * yearOptions.length);
		yearIndex = Math.min(yearIndex, yearOptions.length - 1);
	}

	if (gameOptions.length > 0) {
		gameIndex = Math.floor((knobValues[1] / 1024) * gameOptions.length);
		gameIndex = Math.min(gameIndex, gameOptions.length - 1);
	}

	if (suitsOptions.length > 0) {
		suitsIndex = Math.floor((knobValues[2] / 1024) * suitsOptions.length);
		suitsIndex = Math.min(suitsIndex, suitsOptions.length - 1);
	}

	if (valueOptions.length > 0) {
		valueIndex = Math.floor((knobValues[3] / 1024) * valueOptions.length);
		valueIndex = Math.min(valueIndex, valueOptions.length - 1);
	}

	console.log("Calculated indices:", { yearIndex, gameIndex, suitsIndex, valueIndex });

	// Get values from options
	const newYear = yearOptions[yearIndex] || null;
	const newGame = gameOptions[gameIndex] || null;
	const newSuits = suitsOptions[suitsIndex] || null;
	const newValue = valueOptions[valueIndex] || null;

	console.log("New filter values:", { newYear, newGame, newSuits, newValue });
	console.log("Current filter values:", slot.filters);

	// Check if anything changed (compare as strings to handle type differences)
	let changed = false;
	if (String(slot.filters.year) !== String(newYear)) {
		console.log(`Year changed: ${slot.filters.year} -> ${newYear}`);
		slot.filters.year = newYear;
		changed = true;
	}
	if (String(slot.filters.game) !== String(newGame)) {
		console.log(`Game changed: ${slot.filters.game} -> ${newGame}`);
		slot.filters.game = newGame;
		changed = true;
	}
	if (String(slot.filters.suits) !== String(newSuits)) {
		console.log(`Suits changed: ${slot.filters.suits} -> ${newSuits}`);
		slot.filters.suits = newSuits;
		changed = true;
	}
	if (String(slot.filters.value) !== String(newValue)) {
		console.log(`Value changed: ${slot.filters.value} -> ${newValue}`);
		slot.filters.value = newValue;
		changed = true;
	}

	if (changed) {
		console.log("Filters changed, updating UI...");
		// Update the UI select elements
		updateSlotFilterUI(slot);

		// Auto-select card based on new filters
		autoSelectCardIfFiltersComplete(slot);

		// Re-render the entire UI to show changes
		renderSlotUI();
	} else {
		console.log("No filter changes detected");
	}
}

/**
 * Update the filter select elements for a slot based on current filter values
 */
function updateSlotFilterUI(slot) {
	const slotEl = document.getElementById(`slot-${slot.id}`);
	if (!slotEl) return;

	const yearSelect = slotEl.querySelector("#year-" + slot.id);
	const gameSelect = slotEl.querySelector("#game-" + slot.id);
	const suitsSelect = slotEl.querySelector("#suits-" + slot.id);
	const valueSelect = slotEl.querySelector("#value-" + slot.id);

	if (yearSelect) yearSelect.value = slot.filters.year || "";
	if (gameSelect) gameSelect.value = slot.filters.game || "";
	if (suitsSelect) suitsSelect.value = slot.filters.suits || "";
	if (valueSelect) valueSelect.value = slot.filters.value || "";
}
