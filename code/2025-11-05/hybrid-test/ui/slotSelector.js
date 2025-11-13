/**
 * Dynamic slot-based card selector
 * Each slot can filter by: year range (century segments), game, suits, rank (value)
 */

import { fetchCards } from "../api/cardApi.js";

let allCards = [];
let allGames = [];
let slots = [
	{ id: 1, filters: {}, selectedCard: null },
	{ id: 2, filters: {}, selectedCard: null },
	{ id: 3, filters: {}, selectedCard: null },
];
let baseSlotId = 2; // Middle card is the base card for Gemini generation

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
				description: card.game?.description || null,
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
}

/**
 * Render the slot-based UI
 */
function renderSlotUI() {
	const container = document.getElementById("cards-list");

	// Check if slots already exist
	const existingSlots = container.querySelectorAll(".slot-card");
	const slotsExist = existingSlots.length === slots.length;

	if (!slotsExist) {
		// First render or slot count changed - full recreate
		container.innerHTML = "";
		container.className = "slots-container";

		slots.forEach((slot) => {
			const slotEl = createSlotElement(slot);
			container.appendChild(slotEl);
		});
	} else {
		// Slots exist - just update their content without destroying pagination
		slots.forEach((slot) => {
			updateSlotElement(slot);
		});
	}

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

	// Header (removed card number label)
	const header = document.createElement("div");
	header.className = "slot-header";

	// Title removed - no "Card X" label
	// header is kept for layout structure but empty

	slotDiv.appendChild(header);

	// Card preview area (will be displayed first due to CSS order)
	const previewDiv = document.createElement("div");
	previewDiv.className = "slot-preview";
	previewDiv.id = `preview-${slot.id}`;

	if (slot.selectedCard) {
		const gameName = slot.selectedCard.game?.name || "";
		const gameDescription = slot.selectedCard.game?.description || "";
		previewDiv.innerHTML = `
			<img src="${slot.selectedCard.img_src}" alt="${slot.selectedCard.name}" />
			<div class="card-info">
				<div class="card-name">${slot.selectedCard.name}</div>
				${gameName ? `<div class="game-name">${gameName}</div>` : ""}
				${gameDescription ? `<div class="game-description">${gameDescription}</div>` : ""}
			</div>
		`;
	} else {
		previewDiv.innerHTML = '<div class="no-card">Select filters to choose a card</div>';
	}

	slotDiv.appendChild(previewDiv);

	// Add information section below card preview
	const infoSection = document.createElement("div");
	infoSection.className = "slot-info";
	infoSection.id = `info-${slot.id}`;

	if (slot.selectedCard) {
		const gameDescription = slot.selectedCard.game?.description || "No description available";
		infoSection.innerHTML = `
			<h4>Informations</h4>
			<p>${gameDescription}</p>
		`;
	} else {
		infoSection.innerHTML = `
			<h4>Informations</h4>
			<p>Select a card to view information</p>
		`;
	}

	slotDiv.appendChild(infoSection);

	// Filters section (will be displayed below info due to CSS order)
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
 * Update an existing slot element without recreating pagination
 * This prevents flickering by only updating the parts that changed
 */
function updateSlotElement(slot) {
	const slotEl = document.getElementById(`slot-${slot.id}`);
	if (!slotEl) return;

	// Update base card class
	if (baseSlotId === slot.id) {
		slotEl.classList.add("base-card");
	} else {
		slotEl.classList.remove("base-card");
	}

	// Update card preview
	const previewDiv = document.getElementById(`preview-${slot.id}`);
	if (previewDiv) {
		if (slot.selectedCard) {
			const gameName = slot.selectedCard.game?.name || "";
			const gameDescription = slot.selectedCard.game?.description || "";
			previewDiv.innerHTML = `
				<img src="${slot.selectedCard.img_src}" alt="${slot.selectedCard.name}" />
				<div class="card-info">
					<div class="card-name">${slot.selectedCard.name}</div>
					${gameName ? `<div class="game-name">${gameName}</div>` : ""}
					${gameDescription ? `<div class="game-description">${gameDescription}</div>` : ""}
				</div>
			`;
		} else {
			previewDiv.innerHTML = '<div class="no-card">Select filters to choose a card</div>';
		}
	}

	// Update info section
	const infoDiv = document.getElementById(`info-${slot.id}`);
	if (infoDiv) {
		if (slot.selectedCard) {
			const gameDescription = slot.selectedCard.game?.description || "No description available";
			infoDiv.innerHTML = `
				<h4>Informations</h4>
				<p>${gameDescription}</p>
			`;
		} else {
			infoDiv.innerHTML = `
				<h4>Informations</h4>
				<p>Select a card to view information</p>
			`;
		}
	}

	// Update filter select values (not the entire filter structure)
	updateFilterSelects(slot);

	// Update base card radio button
	const baseCheckbox = document.getElementById(`base-${slot.id}`);
	if (baseCheckbox) {
		baseCheckbox.checked = baseSlotId === slot.id;
	}
}

/**
 * Update filter select dropdowns without recreating them
 */
function updateFilterSelects(slot) {
	// Update Year Range options and value
	const yearSelect = document.getElementById(`year-${slot.id}`);
	if (yearSelect) {
		const yearRanges = getYearRanges();
		const currentValue = yearSelect.value;

		// Only rebuild options if the available ranges changed
		const currentOptions = Array.from(yearSelect.options)
			.map((o) => o.value)
			.join(",");
		const newOptions = yearRanges.map((r) => r.key).join(",");

		if (currentOptions !== newOptions) {
			yearSelect.innerHTML = "";
			yearRanges.forEach((range) => {
				const option = document.createElement("option");
				option.value = range.key;
				option.textContent = range.label;
				yearSelect.appendChild(option);
			});
		}
		yearSelect.value = slot.filters.yearRange || "";
	}

	// Update Game options and value
	const gameSelect = document.getElementById(`game-${slot.id}`);
	if (gameSelect) {
		let availableGames = allGames;
		if (slot.filters.yearRange) {
			availableGames = allGames.filter((g) => isYearInRange(g.year, slot.filters.yearRange));
		}

		const currentOptions = Array.from(gameSelect.options)
			.map((o) => o.value)
			.join(",");
		const newOptions = ["", ...availableGames.map((g) => g.id)].join(",");

		if (currentOptions !== newOptions) {
			gameSelect.innerHTML = "";

			const allOption = document.createElement("option");
			allOption.value = "";
			allOption.textContent = "All games";
			gameSelect.appendChild(allOption);

			availableGames.forEach((game) => {
				const option = document.createElement("option");
				option.value = game.id;
				option.textContent = `${game.name}${game.year ? ` (${game.year})` : ""}`;
				gameSelect.appendChild(option);
			});
		}
		gameSelect.value = slot.filters.game || "";
	}

	// Update Suits options and value
	const suitsSelect = document.getElementById(`suits-${slot.id}`);
	if (suitsSelect) {
		const availableSuits = getAvailableSuits(slot.filters);

		const currentOptions = Array.from(suitsSelect.options)
			.map((o) => o.value)
			.join(",");
		const newOptions = availableSuits.join(",");

		if (currentOptions !== newOptions) {
			suitsSelect.innerHTML = "";
			availableSuits.forEach((suit) => {
				const option = document.createElement("option");
				option.value = suit;
				option.textContent = suit;
				suitsSelect.appendChild(option);
			});
		}
		suitsSelect.value = slot.filters.suits || "";
		suitsSelect.disabled = availableSuits.length === 0;
	}

	// Update Value options and value
	const valueSelect = document.getElementById(`value-${slot.id}`);
	if (valueSelect) {
		const availableValues = getAvailableValues(slot.filters);

		const currentOptions = Array.from(valueSelect.options)
			.map((o) => o.value)
			.join(",");
		const newOptions = availableValues.join(",");

		if (currentOptions !== newOptions) {
			valueSelect.innerHTML = "";
			availableValues.forEach((value) => {
				const option = document.createElement("option");
				option.value = value;
				option.textContent = value;
				valueSelect.appendChild(option);
			});
		}
		valueSelect.value = slot.filters.value || "";
		valueSelect.disabled = availableValues.length === 0;
	}
}

/**
 * Select a random card for a slot
 */
function selectRandomCard(slot) {
	if (allCards.length === 0) return;

	const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
	const gameId = randomCard.game_id || randomCard.game?.id;

	// Find the year range this card belongs to
	const yearRanges = getYearRanges();
	const cardYearRange = yearRanges.find((range) => isYearInRange(randomCard.game?.year, range.key));

	// Set filters based on the random card
	slot.filters.yearRange = cardYearRange ? cardYearRange.key : null;
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

		if (slot.filters.yearRange && !isYearInRange(card.game?.year, slot.filters.yearRange)) return false;
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

	// First, try direct match (same French equivalence string)
	let matchingCards = allCards.filter((card) => {
		const gameId = card.game_id || card.game?.id;

		// Must match year range filter if set
		if (slot.filters.yearRange && !isYearInRange(card.game?.year, slot.filters.yearRange)) return false;

		// Must match the new game
		if (slot.filters.game && gameId != slot.filters.game) return false;

		// Must match French equivalence exactly
		return card.french_equivalence === targetEquivalence;
	});

	// If no direct match, try to find cards in the new game that share the same French equivalence
	// This handles cases like: Pentacles -> Diamonds -> Coins
	// All three might have "3 de Carreau" as their French equivalence
	if (matchingCards.length === 0) {
		// Find all cards in ANY game that have this French equivalence
		const cardsWithSameEquivalence = allCards.filter((card) => card.french_equivalence === targetEquivalence);

		if (cardsWithSameEquivalence.length > 0) {
			// Get the French equivalence components (this is our "universal" reference)
			// Now find cards in the NEW game that also map to this same French equivalence
			matchingCards = allCards.filter((card) => {
				const gameId = card.game_id || card.game?.id;

				// Must match year range filter if set
				if (slot.filters.yearRange && !isYearInRange(card.game?.year, slot.filters.yearRange)) return false;

				// Must match the new game
				if (slot.filters.game && gameId != slot.filters.game) return false;

				// Must have the same French equivalence as our target
				return card.french_equivalence === targetEquivalence;
			});
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
		return true;
	}

	return false;
}

/**
 * Create year filter dropdown
 */
function createYearFilter(slot) {
	const filterGroup = document.createElement("div");
	filterGroup.className = "filter-group";

	const label = document.createElement("label");
	label.textContent = "Year Range:";

	const select = document.createElement("select");
	select.className = "filter-select";
	select.id = `year-${slot.id}`;

	const yearRanges = getYearRanges();
	yearRanges.forEach((range) => {
		const option = document.createElement("option");
		option.value = range.key;
		option.textContent = range.label;
		option.selected = slot.filters.yearRange == range.key;
		select.appendChild(option);
	});

	select.addEventListener("change", () => {
		slot.filters.yearRange = select.value || null;
		slot.filters.game = null; // Reset dependent filters
		slot.filters.suits = null;
		slot.filters.value = null;
		slot.selectedCard = null;
		autoSelectCardIfFiltersComplete(slot);
		renderSlotUI();
	});

	filterGroup.appendChild(label);
	filterGroup.appendChild(select);

	// Add pagination dots below the select
	const pagination = document.createElement("div");
	pagination.className = "knob-pagination";
	pagination.id = `slot-${slot.id}-knob-0-pagination`;
	filterGroup.appendChild(pagination);

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

	// Filter games by year range if year range is selected
	let availableGames = allGames;
	if (slot.filters.yearRange) {
		availableGames = allGames.filter((g) => isYearInRange(g.year, slot.filters.yearRange));
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

	// Add pagination dots below the select
	const pagination = document.createElement("div");
	pagination.className = "knob-pagination";
	pagination.id = `slot-${slot.id}-knob-1-pagination`;
	filterGroup.appendChild(pagination);

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

	// No "All suits" option - knob control requires specific selection

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

	// Add pagination dots below the select
	const pagination = document.createElement("div");
	pagination.className = "knob-pagination";
	pagination.id = `slot-${slot.id}-knob-2-pagination`;
	filterGroup.appendChild(pagination);

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

	// No "All ranks" option - knob control requires specific selection

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

	// Add pagination dots below the select
	const pagination = document.createElement("div");
	pagination.className = "knob-pagination";
	pagination.id = `slot-${slot.id}-knob-3-pagination`;
	filterGroup.appendChild(pagination);

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
 * Get year ranges based on available game years
 * Groups years into century segments (1400-1500, 1500-1600, etc.)
 */
function getYearRanges() {
	const years = getAvailableYears();
	if (years.length === 0) return [];

	// Find min and max years
	const minYear = Math.min(...years);
	const maxYear = Math.max(...years);

	// Round down min to nearest 100
	const startCentury = Math.floor(minYear / 100) * 100;

	// Round up max to next century
	const endCentury = Math.ceil((maxYear + 1) / 100) * 100;

	const ranges = [];
	for (let start = startCentury; start < endCentury; start += 100) {
		const end = start + 100;

		// Check if there are any games in this range
		const gamesInRange = allGames.filter((g) => g.year >= start && g.year < end);

		if (gamesInRange.length > 0) {
			ranges.push({
				key: `${start}-${end}`,
				label: `${start} - ${end}`,
				start: start,
				end: end,
				count: gamesInRange.length,
			});
		}
	}

	return ranges;
}

/**
 * Check if a year falls within a year range
 * @param {number} year - The year to check
 * @param {string} rangeKey - Range key like "1400-1500"
 * @returns {boolean}
 */
function isYearInRange(year, rangeKey) {
	if (!year || !rangeKey) return false;

	const [start, end] = rangeKey.split("-").map(Number);
	return year >= start && year < end;
}

/**
 * Get available games based on current filters
 */
function getAvailableGames(slot) {
	let games = allGames;

	// Filter by year range if set
	if (slot.filters.yearRange) {
		games = games.filter((g) => isYearInRange(g.year, slot.filters.yearRange));
	}

	// Return game IDs
	return games.map((g) => g.id);
}

/**
 * Get available suits based on current filters
 * Note: Does NOT filter by value to allow selecting any suit (e.g., Joker)
 * Sorts by French suits to ensure consistent ordering across games
 */
function getAvailableSuits(filters) {
	let cards = allCards;

	if (filters.yearRange) {
		cards = cards.filter((c) => isYearInRange(c.game?.year, filters.yearRange));
	}
	if (filters.game) {
		cards = cards.filter((c) => (c.game_id || c.game?.id) == filters.game);
	}
	// Removed value filter to allow independent suit selection

	// Create a map of suit -> french_suit for sorting
	const suitToFrenchMap = new Map();
	cards.forEach((c) => {
		if (c.suits && c.french_suits) {
			suitToFrenchMap.set(c.suits, c.french_suits);
		}
	});

	const suits = [...new Set(cards.map((c) => c.suits).filter((s) => s))];

	// Sort by French suits to maintain consistent order across games
	return suits.sort((a, b) => {
		const frenchA = suitToFrenchMap.get(a) || a;
		const frenchB = suitToFrenchMap.get(b) || b;
		return frenchA.localeCompare(frenchB);
	});
}

/**
 * Get available values based on current filters
 * Sorts by French values to ensure consistent ordering across games
 */
function getAvailableValues(filters) {
	let cards = allCards;

	if (filters.yearRange) {
		cards = cards.filter((c) => isYearInRange(c.game?.year, filters.yearRange));
	}
	if (filters.game) {
		cards = cards.filter((c) => (c.game_id || c.game?.id) == filters.game);
	}
	if (filters.suits) {
		cards = cards.filter((c) => c.suits == filters.suits);
	}

	// Create a map of value -> french_value for sorting
	const valueToFrenchMap = new Map();
	cards.forEach((c) => {
		if (c.value && c.french_value) {
			valueToFrenchMap.set(c.value, c.french_value);
		}
	});

	const values = [...new Set(cards.map((c) => c.value).filter((v) => v))];

	// Sort by French values to maintain consistent order across games
	// French values are typically numeric strings (e.g., "1", "2", ..., "14")
	return values.sort((a, b) => {
		// Get french values, fallback to original values
		const frenchA = valueToFrenchMap.get(a) || a;
		const frenchB = valueToFrenchMap.get(b) || b;

		// Try to parse as numbers first
		const numA = parseInt(frenchA);
		const numB = parseInt(frenchB);

		// Both are numbers - sort numerically
		if (!isNaN(numA) && !isNaN(numB)) {
			return numA - numB;
		}

		// If french values didn't work, try parsing original values
		const origNumA = parseInt(a);
		const origNumB = parseInt(b);

		if (!isNaN(origNumA) && !isNaN(origNumB)) {
			return origNumA - origNumB;
		}

		// One or both are not numbers - alphabetical sort
		return String(frenchA).localeCompare(String(frenchB));
	});
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
		const gameName = card.game?.name || "";
		const gameDescription = card.game?.description || "";
		previewDiv.innerHTML = `
			<img src="${card.img_src}" alt="${card.name}" />
			<div class="card-info">
				<div class="card-name">${card.name}</div>
				${gameName ? `<div class="game-name">${gameName}</div>` : ""}
				${gameDescription ? `<div class="game-description">${gameDescription}</div>` : ""}
			</div>
		`;
	}

	// Update info section
	const infoDiv = document.getElementById(`info-${slot.id}`);
	if (infoDiv) {
		const gameDescription = card.game?.description || "No description available";
		infoDiv.innerHTML = `
			<h4>Informations</h4>
			<p>${gameDescription}</p>
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

// Store previous knob indices to implement hysteresis
let previousKnobIndices = Array(12).fill(-1);

// Store the actual knob raw values to detect real movement
let previousKnobRawValues = Array(12).fill(-1);

// Store the number of options for each knob to detect when options change
let previousKnobNumOptions = Array(12).fill(-1);

// Store the min and max values of the active sliding window for each knob
let knobSlidingWindows = Array(12).fill({ min: 0, max: 1023 });

// Hysteresis threshold: how many raw analog units required to trigger a change
// Increased to prevent flickering even at boundaries
const HYSTERESIS_THRESHOLD = 20;

/**
 * Handle knob value changes from Arduino
 * knobValues = [k1, k2, ..., k12] each 0-1023
 * Card 1 (knobs 0-3): Year, Game, Suits, Value
 * Card 2 (knobs 4-7): Year, Game, Suits, Value
 * Card 3 (knobs 8-11): Year, Game, Suits, Value
 */
export function handleKnobChange(knobValues) {
	// Process all 3 cards simultaneously
	let anyChanged = false;

	for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
		const slot = slots[cardIndex];
		if (!slot) continue;

		// Extract the 4 knobs for this card
		const startIdx = cardIndex * 4;
		const cardKnobs = knobValues.slice(startIdx, startIdx + 4);

		const changed = updateSlotFromKnobs(slot, cardKnobs);
		if (changed) anyChanged = true;
	}

	// Re-render UI once if any slot changed
	if (anyChanged) {
		renderSlotUI();
	} else {
		// If nothing changed but we still got a knob update,
		// only update pagination dots without re-rendering everything
		for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
			const slot = slots[cardIndex];
			if (!slot) continue;

			const startIdx = cardIndex * 4;
			const cardKnobs = knobValues.slice(startIdx, startIdx + 4);

			// Just update pagination dots
			updateSlotPaginationOnly(slot, cardKnobs);
		}
	}
}

/**
 * Update only the pagination dots for a slot without changing any filters
 * Used when knob values change but don't cross thresholds to prevent flickering
 */
function updateSlotPaginationOnly(slot, knobValues) {
	// Get available options for each filter based on current slot state
	const yearRangeOptions = getYearRanges();
	const gameOptions = getAvailableGames(slot);
	const suitsOptions = getAvailableSuits(slot.filters);
	const valueOptions = getAvailableValues(slot.filters);

	// Calculate the base knob index offset for this slot
	const knobOffset = (slot.id - 1) * 4;

	// Map each knob value to its index
	let yearRangeIndex = mapKnobToIndexWithHysteresis(knobValues[0], yearRangeOptions.length, knobOffset + 0);
	let gameIndex = mapKnobToIndexWithHysteresis(knobValues[1], gameOptions.length, knobOffset + 1);
	let suitsIndex = mapKnobToIndexWithHysteresis(knobValues[2], suitsOptions.length, knobOffset + 2);
	let valueIndex = mapKnobToIndexWithHysteresis(knobValues[3], valueOptions.length, knobOffset + 3);

	// Only update pagination if index actually changed
	updateKnobPaginationIfChanged(slot.id, 0, yearRangeIndex, yearRangeOptions.length);
	updateKnobPaginationIfChanged(slot.id, 1, gameIndex, gameOptions.length);
	updateKnobPaginationIfChanged(slot.id, 2, suitsIndex, suitsOptions.length);
	updateKnobPaginationIfChanged(slot.id, 3, valueIndex, valueOptions.length);
}

/**
 * Update a single slot based on 4 knob values
 * Returns true if any filter changed
 */
function updateSlotFromKnobs(slot, knobValues) {
	// Get available options for each filter based on current slot state
	const yearRangeOptions = getYearRanges();
	const gameOptions = getAvailableGames(slot);

	// For suits and values, we need to pass the current filters to get dynamic options
	// This ensures that as you change game, the available suits/values update
	const suitsOptions = getAvailableSuits(slot.filters);
	const valueOptions = getAvailableValues(slot.filters);

	// Calculate the base knob index offset for this slot
	const knobOffset = (slot.id - 1) * 4;

	// Map each knob value (0-1023) to its respective filter length with hysteresis
	// For suits and values, we map to the actual options (no "All" option)
	let yearRangeIndex = mapKnobToIndexWithHysteresis(knobValues[0], yearRangeOptions.length, knobOffset + 0);
	let gameIndex = mapKnobToIndexWithHysteresis(knobValues[1], gameOptions.length, knobOffset + 1);
	let suitsIndex = mapKnobToIndexWithHysteresis(knobValues[2], suitsOptions.length, knobOffset + 2);
	let valueIndex = mapKnobToIndexWithHysteresis(knobValues[3], valueOptions.length, knobOffset + 3);

	// Only update pagination if index actually changed
	updateKnobPaginationIfChanged(slot.id, 0, yearRangeIndex, yearRangeOptions.length);
	updateKnobPaginationIfChanged(slot.id, 1, gameIndex, gameOptions.length);
	updateKnobPaginationIfChanged(slot.id, 2, suitsIndex, suitsOptions.length);
	updateKnobPaginationIfChanged(slot.id, 3, valueIndex, valueOptions.length);

	// Get values from options - suits and values are guaranteed to be specific (not null)
	const newYearRange = yearRangeOptions[yearRangeIndex]?.key || null;
	const newGame = gameOptions[gameIndex] || null;
	const newSuits = suitsOptions[suitsIndex] || null; // Will be a specific suit, never null
	const newValue = valueOptions[valueIndex] || null; // Will be a specific value, never null

	// Check if anything changed (compare as strings to handle type differences)
	let changed = false;
	if (String(slot.filters.yearRange) !== String(newYearRange)) {
		slot.filters.yearRange = newYearRange;
		changed = true;
	}
	if (String(slot.filters.game) !== String(newGame)) {
		slot.filters.game = newGame;
		changed = true;
	}
	if (String(slot.filters.suits) !== String(newSuits)) {
		slot.filters.suits = newSuits;
		changed = true;
	}
	if (String(slot.filters.value) !== String(newValue)) {
		slot.filters.value = newValue;
		changed = true;
	}

	if (changed) {
		// Update the UI select elements
		updateSlotFilterUI(slot);

		// Auto-select card based on new filters
		autoSelectCardIfFiltersComplete(slot);
	}

	return changed;
}

/**
 * Map a knob value (0-1023) to an index (0 to numOptions-1) with hysteresis
 * to prevent flickering when analog values fluctuate by ±2-3
 *
 * @param {number} knobValue - Raw analog value from Arduino (0-1023)
 * @param {number} numOptions - Number of available options to map to
 * @param {number} knobId - Unique ID for this knob (0-11) to track previous state
 * @returns {number} The selected index with hysteresis applied
 */
function mapKnobToIndexWithHysteresis(knobValue, numOptions, knobId) {
	if (numOptions === 0) return 0;
	if (numOptions === 1) return 0;

	// Adjuste sliding window size for this knob
	let { min, max } = knobSlidingWindows[knobId];

	let slidingWindowSize = Math.min(numOptions * 46, 1023);
	min = Math.min(min, 1023 - slidingWindowSize);
	max = min + slidingWindowSize;
	// if (knobId === 1)
	// 	console.log(`Knob ${knobId}: Sliding window [${min.toFixed(1)}, ${max.toFixed(1)}] for ${numOptions} options`);

	// Adjust window position to keep the knobValue within the window
	if (knobValue < min) {
		min = knobValue;
		max = min + slidingWindowSize;
	} else if (knobValue > max) {
		max = knobValue;
		min = max - slidingWindowSize;
	}

	// Save updated sliding window
	knobSlidingWindows[knobId] = { min, max };


	// Get previous values
	const previousIndex = previousKnobIndices[knobId];
	const previousRawValue = previousKnobRawValues[knobId];
	const previousNumOptions = previousKnobNumOptions[knobId];

	const rawIndex = Math.floor(map(knobValue, min, max, 0, numOptions));
	const clampedIndex = Math.min(rawIndex, numOptions - 1);
	// if (knobId === 1)
	// 	console.log(`Knob ${knobId}: Raw index ${rawIndex}, Clamped index ${clampedIndex}, Prev index ${previousIndex}`);

	previousKnobIndices[knobId] = clampedIndex;
	previousKnobRawValues[knobId] = knobValue;
	previousKnobNumOptions[knobId] = numOptions;

	// Check if the number of options changed or if previous index is out of bounds
	if (previousNumOptions !== numOptions || previousIndex >= numOptions) {
		// Options changed - reset hysteresis and recalculate

		previousKnobIndices[knobId] = clampedIndex;
		previousKnobRawValues[knobId] = knobValue;
		previousKnobNumOptions[knobId] = numOptions;

		return clampedIndex;
	}

	// If this is the first reading or we don't have a previous value
	if (previousIndex === -1) {
		previousKnobIndices[knobId] = clampedIndex;
		previousKnobRawValues[knobId] = knobValue;
		previousKnobNumOptions[knobId] = numOptions;
		return clampedIndex;
	}

	// If the calculated index is the same as before, update raw value and return
	if (clampedIndex === previousIndex) {
		previousKnobRawValues[knobId] = knobValue;
		return previousIndex;
	}

	// The index wants to change - apply hysteresis with expanded deadband
	// Calculate boundaries with overlap to create a stable zone
	const stepSize = slidingWindowSize / numOptions;

	// For the CURRENT index position, calculate its safe zone
	// This creates a wider "sticky" region around each option
	const currentIndexStart = clampedIndex * stepSize;
	const currentIndexEnd = (clampedIndex + 1) * stepSize;
	const currentIndexCenter = currentIndexStart + stepSize / 2;

	// For the PREVIOUS index, calculate its boundaries
	const previousIndexStart = previousIndex * stepSize;
	const previousIndexEnd = (previousIndex + 1) * stepSize;
	const previousIndexCenter = previousIndexStart + stepSize / 2;

	// Calculate distance from the previous index center
	const distanceFromPreviousCenter = Math.abs(knobValue - previousIndexCenter);

	// Only switch if we're:
	// 1. Far enough from the previous center (HYSTERESIS_THRESHOLD)
	// 2. AND clearly past the midpoint between the two options
	const midpointBetweenOptions = (previousIndexCenter + currentIndexCenter) / 2;

	// Determine if we should switch based on direction of movement
	let shouldSwitch = false;

	if (clampedIndex > previousIndex) {
		// Moving to a higher index - must be past midpoint AND threshold
		shouldSwitch = knobValue > midpointBetweenOptions + HYSTERESIS_THRESHOLD;
	} else {
		// Moving to a lower index - must be past midpoint AND threshold
		shouldSwitch = knobValue < midpointBetweenOptions - HYSTERESIS_THRESHOLD;
	}

	if (shouldSwitch) {
		// Switch confirmed - update both tracking variables
		previousKnobIndices[knobId] = clampedIndex;
		previousKnobRawValues[knobId] = knobValue;
		return clampedIndex;
	} else {
		// Stay with previous index
		previousKnobRawValues[knobId] = knobValue;
		return previousIndex;
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

	if (yearSelect) yearSelect.value = slot.filters.yearRange || "";
	if (gameSelect) gameSelect.value = slot.filters.game || "";
	if (suitsSelect) suitsSelect.value = slot.filters.suits || "";
	if (valueSelect) valueSelect.value = slot.filters.value || "";
}

/**
 * Wrapper that only calls updateKnobPagination if the index or total actually changed
 * Prevents unnecessary DOM manipulation
 */
function updateKnobPaginationIfChanged(slotId, knobIndex, currentIndex, totalOptions) {
	const paginationEl = document.getElementById(`slot-${slotId}-knob-${knobIndex}-pagination`);
	if (!paginationEl) return;

	const prevIndex = parseInt(paginationEl.dataset.currentIndex || "-1");
	const prevTotal = parseInt(paginationEl.dataset.totalOptions || "0");

	// Only update if something actually changed
	if (prevIndex !== currentIndex || prevTotal !== totalOptions) {
		updateKnobPagination(slotId, knobIndex, currentIndex, totalOptions);
	}
}

/**
 * Update pagination dots for a specific knob in a slot
 * Shows max 5 dots at a time, scrolling window as needed
 * Optimized to update existing dots instead of recreating to prevent flickering
 * @param {number} slotId - Slot ID (1-3)
 * @param {number} knobIndex - Knob index within slot (0-3: Year, Game, Suits, Rank)
 * @param {number} currentIndex - Current selected index
 * @param {number} totalOptions - Total number of options
 */
function updateKnobPagination(slotId, knobIndex, currentIndex, totalOptions) {
	const paginationEl = document.getElementById(`slot-${slotId}-knob-${knobIndex}-pagination`);
	if (!paginationEl) return;

	// Store metadata to detect if structure needs to change
	const prevTotal = parseInt(paginationEl.dataset.totalOptions || "0");
	const prevIndex = parseInt(paginationEl.dataset.currentIndex || "-1");

	// Calculate what dots should be shown
	let dotsToShow = [];

	if (totalOptions <= 5) {
		// Show all dots
		for (let i = 0; i < totalOptions; i++) {
			dotsToShow.push(i);
		}
	} else {
		// Show a sliding window of 5 dots
		const maxDots = 5;
		const halfWindow = Math.floor(maxDots / 2);

		let windowStart = Math.max(0, currentIndex - halfWindow);
		let windowEnd = Math.min(totalOptions, windowStart + maxDots);

		if (windowEnd - windowStart < maxDots) {
			windowStart = Math.max(0, windowEnd - maxDots);
		}

		for (let i = windowStart; i < windowEnd; i++) {
			dotsToShow.push(i);
		}
	}

	// Store previous dots info for comparison
	const prevDotsToShow = paginationEl.dataset.dotsToShow ? JSON.parse(paginationEl.dataset.dotsToShow) : [];

	// Check if we need to recreate dots (structure changed)
	const structureChanged = prevTotal !== totalOptions || JSON.stringify(prevDotsToShow) !== JSON.stringify(dotsToShow);

	if (structureChanged) {
		// Structure changed - recreate dots
		paginationEl.innerHTML = "";

		dotsToShow.forEach((i) => {
			const dot = document.createElement("div");
			dot.className = "knob-pagination-dot";
			dot.dataset.index = i;
			paginationEl.appendChild(dot);
		});

		// Update metadata
		paginationEl.dataset.totalOptions = totalOptions;
		paginationEl.dataset.dotsToShow = JSON.stringify(dotsToShow);
	}

	// Update classes on existing dots (no flickering)
	const dots = paginationEl.querySelectorAll(".knob-pagination-dot");
	dots.forEach((dot, idx) => {
		const i = dotsToShow[idx];
		const distance = Math.abs(i - currentIndex);

		// Clear all state classes
		dot.classList.remove("active", "near", "far");

		// Add appropriate class
		if (i === currentIndex) {
			dot.classList.add("active");
		} else if (distance === 1) {
			dot.classList.add("near");
		} else if (distance >= 2 || idx === 0 || idx === dots.length - 1) {
			dot.classList.add("far");
		}
	});

	// Update current index metadata
	paginationEl.dataset.currentIndex = currentIndex;
}
