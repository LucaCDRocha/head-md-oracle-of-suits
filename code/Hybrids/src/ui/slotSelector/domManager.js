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
	updateAllSlotPaginations();
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

	// Progress fill overlay for hold-to-generate animation
	const progressFill = document.createElement("div");
	progressFill.className = "slot-progress-fill";
	progressFill.id = `slot-progress-${slot.id}`;
	slotDiv.appendChild(progressFill);

	// Header (layout structure)
	const header = document.createElement("div");
	header.className = "slot-header";
	slotDiv.appendChild(header);

	// Card preview area
	const previewDiv = document.createElement("div");
	previewDiv.className = "slot-preview";
	previewDiv.id = `preview-${slot.id}`;

	if (slot.selectedCard) {
		const cachedSrc = slot.selectedCard.img_src && slot.selectedCard.img_src.startsWith('blob:') ? slot.selectedCard.img_src : (slot.selectedCard.img_src && slot.selectedCard.img_src.startsWith('data:') ? slot.selectedCard.img_src : '');
		previewDiv.innerHTML = `<img src="${cachedSrc}" alt="${slot.selectedCard.name}" />`;
	} else {
		previewDiv.innerHTML = '<div class="no-card">Select filters to choose a card</div>';
	}
	slotDiv.appendChild(previewDiv);

	const infoSection = document.createElement("div");
	infoSection.className = "slot-info";
	infoSection.id = `info-${slot.id}`;

	renderSlotInfoHTML(infoSection, slot);
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
	if (!slotEl.querySelector(".slot-progress-fill")) {
		const progressFill = document.createElement("div");
		progressFill.className = "slot-progress-fill";
		progressFill.id = `slot-progress-${slot.id}`;
		slotEl.appendChild(progressFill);
	}

	if (baseSlotId === slot.id) {
		slotEl.classList.add("base-card");
	} else {
		slotEl.classList.remove("base-card");
	}

	const previewDiv = document.getElementById(`preview-${slot.id}`);
	if (previewDiv) {
		if (slot.selectedCard) {
			let imgEl = previewDiv.querySelector('img');
			if (!imgEl) {
				const cachedSrc = (slot.selectedCard.img_src && (slot.selectedCard.img_src.startsWith('blob:') || slot.selectedCard.img_src.startsWith('data:'))) ? slot.selectedCard.img_src : '';
				previewDiv.innerHTML = `<img src="${cachedSrc}" alt="${slot.selectedCard.name}" />`;
			} else {
				imgEl.alt = slot.selectedCard.name;
			}
		} else {
			previewDiv.innerHTML = '<div class="no-card">Select filters to choose a card</div>';
		}
	}

	const infoDiv = document.getElementById(`info-${slot.id}`);
	if (infoDiv) {
		renderSlotInfoHTML(infoDiv, slot);
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
		const previousEquivalence = slot.selectedCard?.name_en || slot.selectedCard?.name;
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

	const h3 = selectedArea.querySelector("h3");
	if (h3) {
		h3.textContent = `Selected (${count}/3)`;
	}

	const btn = document.getElementById("generate-btn");
	const btnText = document.getElementById("generate-btn-text");
	if (btn) {
		if (!btn.hasAttribute("data-generating")) {
			const isReady = count === 3;
			btn.disabled = !isReady;
			if (btnText) {
				btnText.textContent = isReady ? "Generate & Upload Hybrid" : `Select 3 cards (${count}/3)`;
			} else {
				btn.textContent = isReady ? "Generate & Upload Hybrid" : `Select 3 cards (${count}/3)`;
			}
		}
	}

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
export function updateKnobPaginationIfChanged(slotId, knobIndex, currentIndex, totalOptions, isDirectUserAction = false) {
	const paginationEl = document.getElementById(`slot-${slotId}-knob-${knobIndex}-pagination`);
	if (!paginationEl) return;

	const prevIndex = parseInt(paginationEl.dataset.currentIndex || "-1");
	const prevTotal = parseInt(paginationEl.dataset.totalOptions || "0");

	if (prevIndex !== currentIndex || prevTotal !== totalOptions) {
		updateKnobPagination(slotId, knobIndex, currentIndex, totalOptions, isDirectUserAction);
	}
}

/**
 * Update pagination dots for a specific knob in a slot
 */
export function updateKnobPagination(slotId, knobIndex, currentIndex, totalOptions, isDirectUserAction = false) {
	const paginationEl = document.getElementById(`slot-${slotId}-knob-${knobIndex}-pagination`);
	if (!paginationEl) return;

	if (totalOptions <= 1) {
		paginationEl.style.display = "none";
		paginationEl.dataset.totalOptions = "0";
		paginationEl.dataset.currentIndex = "-1";
		return;
	} else {
		paginationEl.style.display = "flex";
	}

	let track = paginationEl.querySelector(".knob-pagination-track");
	const isBrandNewTrack = !track;

	if (!track) {
		track = document.createElement("div");
		track.className = "knob-pagination-track";
		paginationEl.appendChild(track);
	}

	let dots = Array.from(track.querySelectorAll(".knob-pagination-dot"));

	// Incrementally adjust dot elements without destroying DOM tree
	while (dots.length < totalOptions) {
		const dot = document.createElement("div");
		dot.className = "knob-pagination-dot";
		track.appendChild(dot);
		dots.push(dot);
	}
	while (dots.length > totalOptions) {
		const dot = dots.pop();
		if (dot && dot.parentNode) dot.parentNode.removeChild(dot);
	}

	const prevTotal = parseInt(paginationEl.dataset.totalOptions || "0");
	dots.forEach((dot, i) => {
		const distance = Math.abs(i - currentIndex);
		const offsetPx = (i - currentIndex) * 12;

		dot.classList.remove("active", "near", "mid", "far");

		if (i === currentIndex) {
			dot.classList.add("active");
		} else if (distance === 1) {
			dot.classList.add("near");
		} else if (distance === 2) {
			dot.classList.add("mid");
		} else {
			dot.classList.add("far");
		}

		// Anchor red dot at exact center (translateX 0), space dots to left and right
		dot.style.transform = `translateX(${offsetPx}px)`;
	});

	paginationEl.dataset.currentIndex = currentIndex;
}

function formatNoBreakHyphen(str) {
	if (!str) return '';
	return String(str).replace(/-/g, '&#8209;');
}

/**
 * Render card info & tags (Années, Jeu, Enseigne, Valeur) matching DBHybrids design
 */
function renderSlotInfoHTML(container, slot) {
	if (!container) return;
	const card = slot.selectedCard;

	const gameName = formatNoBreakHyphen(card?.game?.name || "Standard");
	const gameDesc = formatNoBreakHyphen(card?.game?.description || (card ? "Tarot / Jeu traditionnel." : "Sélectionnez une carte"));
	const gameDescEng = formatNoBreakHyphen(card?.game?.description_eng || card?.game?.description || (card ? "Tarot / Traditional deck." : "Select a card"));
	const yearVal = formatNoBreakHyphen(slot.filters?.yearRange || card?.game?.year || card?.year || (card ? "1950-2000" : "-"));
	const suitVal = formatNoBreakHyphen(card?.suits || card?.suit || (card ? "Cups" : "-"));
	const valueVal = formatNoBreakHyphen(card?.value || (card ? "Queen" : "-"));

	let infoCols = container.querySelector(".card-info-columns");
	let metaTags = container.querySelector(".card-meta-tags");

	if (infoCols && metaTags) {
		// Update text without destroying pagination containers!
		const frColP = infoCols.querySelector(".info-col:nth-child(1) p");
		const enColP = infoCols.querySelector(".info-col:nth-child(2) p");
		if (frColP) frColP.innerHTML = gameDesc;
		if (enColP) enColP.innerHTML = gameDescEng;

		const tagBoxes = metaTags.querySelectorAll(".tag-box");
		if (tagBoxes.length >= 4) {
			tagBoxes[0].innerHTML = yearVal;
			tagBoxes[1].innerHTML = gameName;
			tagBoxes[2].innerHTML = suitVal;
			tagBoxes[3].innerHTML = valueVal;
		}
		return;
	}

	container.innerHTML = `
		<div class="card-info-columns">
			<div class="info-col">
				<strong>Informations &#8209; FR</strong>
				<p>${gameDesc}</p>
			</div>
			<div class="info-col">
				<strong>Informations &#8209; EN</strong>
				<p>${gameDescEng}</p>
			</div>
		</div>
		<div class="card-meta-tags">
			<div class="tag-group">
				<div class="tag-box">${yearVal}</div>
				<span class="tag-label">Années</span>
				<div class="knob-pagination" id="slot-${slot.id}-knob-0-pagination"></div>
			</div>
			<div class="tag-group">
				<div class="tag-box">${gameName}</div>
				<span class="tag-label">Jeu</span>
				<div class="knob-pagination" id="slot-${slot.id}-knob-1-pagination"></div>
			</div>
			<div class="tag-group">
				<div class="tag-box">${suitVal}</div>
				<span class="tag-label">Enseigne</span>
				<div class="knob-pagination" id="slot-${slot.id}-knob-2-pagination"></div>
			</div>
			<div class="tag-group">
				<div class="tag-box">${valueVal}</div>
				<span class="tag-label">Valeur</span>
				<div class="knob-pagination" id="slot-${slot.id}-knob-3-pagination"></div>
			</div>
		</div>
	`;
}

export function updateAllSlotPaginations() {
	slots.forEach((slot) => {
		const yearRangeOptions = getYearRanges();
		const gameOptions = getAvailableGames(slot);
		const suitsOptions = getAvailableSuits(slot.filters);
		const valueOptions = getAvailableValues(slot.filters);

		const yearRangeIdx = yearRangeOptions.findIndex((r) => r.key === slot.filters.yearRange);
		const gameIdx = gameOptions.indexOf(slot.filters.game);
		const suitsIdx = suitsOptions.indexOf(slot.filters.suits);
		const valueIdx = valueOptions.indexOf(slot.filters.value);

		updateKnobPaginationIfChanged(slot.id, 0, yearRangeIdx >= 0 ? yearRangeIdx : 0, yearRangeOptions.length);
		updateKnobPaginationIfChanged(slot.id, 1, gameIdx >= 0 ? gameIdx : 0, gameOptions.length);
		updateKnobPaginationIfChanged(slot.id, 2, suitsIdx >= 0 ? suitsIdx : 0, suitsOptions.length);
		updateKnobPaginationIfChanged(slot.id, 3, valueIdx >= 0 ? valueIdx : 0, valueOptions.length);
	});
}

