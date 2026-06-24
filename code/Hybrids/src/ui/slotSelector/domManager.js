/**
 * domManager.js - UI rendering and pagination controls for slot selector
 */

import {
	slots,
	baseSlotId,
	allGames,
	setBaseSlotId,
	autoSelectCardIfFiltersComplete,
	tryMatchByFrenchEquivalence,
	getYearRanges,
	isYearInRange,
	getAvailableGames,
	getAvailableSuits,
	getAvailableValues,
	getSelectedCards,
} from "./slotState.js";

/**
 * Render the slot-based UI
 */
export function renderSlotUI() {
	const container = document.getElementById("cards-list");
	if (!container) return;

	const existingSlots = container.querySelectorAll(".slot-card");
	const slotsExist = existingSlots.length === slots.length;

	if (!slotsExist) {
		container.innerHTML = "";
		container.className = "slots-container";

		slots.forEach((slot) => {
			const slotEl = createSlotElement(slot);
			container.appendChild(slotEl);
		});
	} else {
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

	if (baseSlotId === slot.id) {
		slotDiv.classList.add("base-card");
	}

	// Header (layout structure)
	const header = document.createElement("div");
	header.className = "slot-header";
	slotDiv.appendChild(header);

	// Card preview area
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

	// Information section
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

	// Filters section
	const filtersDiv = document.createElement("div");
	filtersDiv.className = "slot-filters";

	filtersDiv.appendChild(createYearFilter(slot));
	filtersDiv.appendChild(createGameFilter(slot));
	filtersDiv.appendChild(createSuitsFilter(slot));
	filtersDiv.appendChild(createValueFilter(slot));

	slotDiv.appendChild(filtersDiv);

	// Base card selector
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
		setBaseSlotId(slot.id);
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
 * Update an existing slot element
 */
export function updateSlotElement(slot) {
	const slotEl = document.getElementById(`slot-${slot.id}`);
	if (!slotEl) return;

	if (baseSlotId === slot.id) {
		slotEl.classList.add("base-card");
	} else {
		slotEl.classList.remove("base-card");
	}

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

	updateFilterSelects(slot);

	const baseCheckbox = document.getElementById(`base-${slot.id}`);
	if (baseCheckbox) {
		baseCheckbox.checked = baseSlotId === slot.id;
	}
}

/**
 * Update filter select dropdowns without recreating them
 */
function updateFilterSelects(slot) {
	const yearSelect = document.getElementById(`year-${slot.id}`);
	if (yearSelect) {
		const yearRanges = getYearRanges();
		const currentValue = yearSelect.value;
		const currentOptions = Array.from(yearSelect.options).map((o) => o.value).join(",");
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

	const gameSelect = document.getElementById(`game-${slot.id}`);
	if (gameSelect) {
		let availableGames = allGames;
		if (slot.filters.yearRange) {
			availableGames = allGames.filter((g) => isYearInRange(g.year, slot.filters.yearRange));
		}

		const currentOptions = Array.from(gameSelect.options).map((o) => o.value).join(",");
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

	const suitsSelect = document.getElementById(`suits-${slot.id}`);
	if (suitsSelect) {
		const availableSuits = getAvailableSuits(slot.filters);
		const currentOptions = Array.from(suitsSelect.options).map((o) => o.value).join(",");
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

	const valueSelect = document.getElementById(`value-${slot.id}`);
	if (valueSelect) {
		const availableValues = getAvailableValues(slot.filters);
		const currentOptions = Array.from(valueSelect.options).map((o) => o.value).join(",");
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
		slot.filters.game = null;
		slot.filters.suits = null;
		slot.filters.value = null;
		slot.selectedCard = null;
		autoSelectCardIfFiltersComplete(slot);
		renderSlotUI();
	});

	filterGroup.appendChild(label);
	filterGroup.appendChild(select);

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
		const previousEquivalence = slot.selectedCard?.french_equivalence;
		slot.filters.game = select.value || null;

		if (previousEquivalence && slot.filters.game) {
			const matched = tryMatchByFrenchEquivalence(slot, previousEquivalence);
			if (!matched) {
				slot.filters.suits = null;
				slot.filters.value = null;
				slot.selectedCard = null;
			}
		} else {
			slot.filters.suits = null;
			slot.filters.value = null;
			slot.selectedCard = null;
		}

		renderSlotUI();
	});

	filterGroup.appendChild(label);
	filterGroup.appendChild(select);

	const pagination = document.createElement("div");
	pagination.className = "knob-pagination";
	pagination.id = `slot-${slot.id}-knob-1-pagination`;
	filterGroup.appendChild(pagination);

	return filterGroup;
}

/**
 * Create suits filter dropdown
 */
function createSuitsFilter(slot) {
	const filterGroup = document.createElement("div");
	filterGroup.className = "filter-group";

	const label = document.createElement("label");
	label.textContent = "Suits:";

	const select = document.createElement("select");
	select.className = "filter-select";
	select.id = `suits-${slot.id}`;

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

	const pagination = document.createElement("div");
	pagination.className = "knob-pagination";
	pagination.id = `slot-${slot.id}-knob-2-pagination`;
	filterGroup.appendChild(pagination);

	return filterGroup;
}

/**
 * Create value/rank filter dropdown
 */
function createValueFilter(slot) {
	const filterGroup = document.createElement("div");
	filterGroup.className = "filter-group";

	const label = document.createElement("label");
	label.textContent = "Rank:";

	const select = document.createElement("select");
	select.className = "filter-select";
	select.id = `value-${slot.id}`;

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

	const pagination = document.createElement("div");
	pagination.className = "knob-pagination";
	pagination.id = `slot-${slot.id}-knob-3-pagination`;
	filterGroup.appendChild(pagination);

	return filterGroup;
}

/**
 * Update current filter selects values
 */
export function updateSlotFilterUI(slot) {
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
 * Update the selected summary and generate button state
 */
export function updateSelectedArea() {
	const selectedArea = document.getElementById("selected-area");
	if (!selectedArea) return;

	const selectedCards = getSelectedCards();
	const count = selectedCards.length;

	selectedArea.querySelector("h3").textContent = `Selected (${count}/3)`;

	const btn = document.getElementById("generate-btn");
	if (btn) btn.disabled = count !== 3;

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
 * Optimized pagination wrapper
 */
export function updateKnobPaginationIfChanged(slotId, knobIndex, currentIndex, totalOptions) {
	const paginationEl = document.getElementById(`slot-${slotId}-knob-${knobIndex}-pagination`);
	if (!paginationEl) return;

	const prevIndex = parseInt(paginationEl.dataset.currentIndex || "-1");
	const prevTotal = parseInt(paginationEl.dataset.totalOptions || "0");

	if (prevIndex !== currentIndex || prevTotal !== totalOptions) {
		updateKnobPagination(slotId, knobIndex, currentIndex, totalOptions);
	}
}

/**
 * Update pagination dots for a specific knob in a slot
 */
export function updateKnobPagination(slotId, knobIndex, currentIndex, totalOptions) {
	const paginationEl = document.getElementById(`slot-${slotId}-knob-${knobIndex}-pagination`);
	if (!paginationEl) return;

	let dotsToShow = [];
	if (totalOptions <= 5) {
		for (let i = 0; i < totalOptions; i++) {
			dotsToShow.push(i);
		}
	} else {
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

	const prevTotal = parseInt(paginationEl.dataset.totalOptions || "0");
	const prevDotsToShow = paginationEl.dataset.dotsToShow ? JSON.parse(paginationEl.dataset.dotsToShow) : [];
	const structureChanged = prevTotal !== totalOptions || JSON.stringify(prevDotsToShow) !== JSON.stringify(dotsToShow);

	if (structureChanged) {
		paginationEl.innerHTML = "";
		dotsToShow.forEach((i) => {
			const dot = document.createElement("div");
			dot.className = "knob-pagination-dot";
			dot.dataset.index = i;
			paginationEl.appendChild(dot);
		});

		paginationEl.dataset.totalOptions = totalOptions;
		paginationEl.dataset.dotsToShow = JSON.stringify(dotsToShow);
	}

	const dots = paginationEl.querySelectorAll(".knob-pagination-dot");
	dots.forEach((dot, idx) => {
		const i = dotsToShow[idx];
		const distance = Math.abs(i - currentIndex);

		dot.classList.remove("active", "near", "far");

		if (i === currentIndex) {
			dot.classList.add("active");
		} else if (distance === 1) {
			dot.classList.add("near");
		} else if (distance >= 2 || idx === 0 || idx === dots.length - 1) {
			dot.classList.add("far");
		}
	});

	paginationEl.dataset.currentIndex = currentIndex;
}
