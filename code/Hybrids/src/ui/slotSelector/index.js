/**
 * index.js - Unified entry point and orchestrator for slot selector UI component
 */

import {
	slots,
	fetchAndInitCards,
	getSelectedCards as stateGetSelectedCards,
	getBaseCardId as stateGetBaseCardId,
	shuffleAllSlots as stateShuffleAllSlots,
	getYearRanges,
	getAvailableGames,
	getAvailableSuits,
	getAvailableValues,
	autoSelectCardIfFiltersComplete,
} from "./slotState.js";

import { mapKnobToIndexWithHysteresis } from "./knobMapper.js";

import {
	renderSlotUI,
	updateSlotFilterUI,
	updateKnobPaginationIfChanged,
	updateAllSlotPaginations,
} from "./domManager.js";

import { drawPreview as compositionDrawPreview } from "./canvasComposition.js";

/**
 * Initialize slot selector UI and fetch cards data
 */
export async function initSlotSelector() {
	await fetchAndInitCards();
	renderSlotUI();
	updateAllSlotPaginations();
}

/**
 * Shuffle all 3 slots and update UI
 */
export function shuffleAllSlots() {
	stateShuffleAllSlots();
	renderSlotUI();
	updateAllSlotPaginations();
}

/**
 * Expose selected cards list
 */
export function getSelectedCards() {
	return stateGetSelectedCards();
}

/**
 * Expose base card ID
 */
export function getBaseCardId() {
	return stateGetBaseCardId();
}

/**
 * Draw preview collage using p5 canvas
 */
export function drawPreview(p5Instance) {
	compositionDrawPreview(p5Instance, getSelectedCards());
}

let lastKnownRawKnobs = Array(12).fill(-1);
const RAW_NOISE_THRESHOLD = 15; // Ignore electrical noise fluctuations below 15 units (out of 1023)

/**
 * Handle raw knob values from Arduino (0-1023)
 * Maps 12 knobs: 4 knobs per card slot (Year range, Game, Suit, Rank)
 */
export function handleKnobChange(knobValues) {
	let anyFilterChanged = false;
	let hasPhysicalMovement = false;

	for (let i = 0; i < 12; i++) {
		if (lastKnownRawKnobs[i] === -1) {
			lastKnownRawKnobs[i] = knobValues[i];
		} else {
			const delta = Math.abs(knobValues[i] - lastKnownRawKnobs[i]);
			if (delta >= RAW_NOISE_THRESHOLD) {
				hasPhysicalMovement = true;
				lastKnownRawKnobs[i] = knobValues[i];
			}
		}
	}

	for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
		const slot = slots[cardIndex];
		if (!slot) continue;

		const startIdx = cardIndex * 4;
		const cardKnobs = knobValues.slice(startIdx, startIdx + 4);

		const changed = updateSlotFromKnobs(slot, cardKnobs);
		if (changed) anyFilterChanged = true;
	}

	if (anyFilterChanged) {
		renderSlotUI();
	} else {
		// Just update paginations without complete redrawing
		for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
			const slot = slots[cardIndex];
			if (!slot) continue;

			const startIdx = cardIndex * 4;
			const cardKnobs = knobValues.slice(startIdx, startIdx + 4);

			updateSlotPaginationOnly(slot, cardKnobs);
		}
	}

	return { anyFilterChanged, hasPhysicalMovement };
}

/**
 * Update knob pagination dots without triggering filter changes
 */
function updateSlotPaginationOnly(slot, knobValues) {
	const yearRangeOptions = getYearRanges();
	const gameOptions = getAvailableGames(slot);
	const suitsOptions = getAvailableSuits(slot.filters);
	const valueOptions = getAvailableValues(slot.filters);

	const knobOffset = (slot.id - 1) * 4;

	let yearRangeIndex = mapKnobToIndexWithHysteresis(knobValues[0], yearRangeOptions.length, knobOffset + 0);
	let gameIndex = mapKnobToIndexWithHysteresis(knobValues[1], gameOptions.length, knobOffset + 1);
	let suitsIndex = mapKnobToIndexWithHysteresis(knobValues[2], suitsOptions.length, knobOffset + 2);
	let valueIndex = mapKnobToIndexWithHysteresis(knobValues[3], valueOptions.length, knobOffset + 3);

	updateKnobPaginationIfChanged(slot.id, 0, yearRangeIndex, yearRangeOptions.length, true);
	updateKnobPaginationIfChanged(slot.id, 1, gameIndex, gameOptions.length, true);
	updateKnobPaginationIfChanged(slot.id, 2, suitsIndex, suitsOptions.length, true);
	updateKnobPaginationIfChanged(slot.id, 3, valueIndex, valueOptions.length, true);
}

/**
 * Map raw knobs to filter properties and update selection if changed
 */
function updateSlotFromKnobs(slot, knobValues) {
	let yearRangeOptions = getYearRanges();
	let gameOptions = getAvailableGames(slot);
	let suitsOptions = getAvailableSuits(slot.filters);
	let valueOptions = getAvailableValues(slot.filters);

	const knobOffset = (slot.id - 1) * 4;

	let yearRangeIndex = mapKnobToIndexWithHysteresis(knobValues[0], yearRangeOptions.length, knobOffset + 0);
	let gameIndex = mapKnobToIndexWithHysteresis(knobValues[1], gameOptions.length, knobOffset + 1);
	let suitsIndex = mapKnobToIndexWithHysteresis(knobValues[2], suitsOptions.length, knobOffset + 2);
	let valueIndex = mapKnobToIndexWithHysteresis(knobValues[3], valueOptions.length, knobOffset + 3);

	const newYearRange = yearRangeOptions[yearRangeIndex]?.key || null;
	const newGame = gameOptions[gameIndex] || null;
	const newSuits = suitsOptions[suitsIndex] || null;
	const newValue = valueOptions[valueIndex] || null;

	let changedKnobIndex = -1;
	let changed = false;

	if (String(slot.filters.yearRange) !== String(newYearRange)) {
		slot.filters.yearRange = newYearRange;
		changed = true;
		changedKnobIndex = 0;
	}
	if (String(slot.filters.game) !== String(newGame)) {
		slot.filters.game = newGame;
		changed = true;
		if (changedKnobIndex === -1) changedKnobIndex = 1;
	}
	if (String(slot.filters.suits) !== String(newSuits)) {
		slot.filters.suits = newSuits;
		changed = true;
		if (changedKnobIndex === -1) changedKnobIndex = 2;
	}
	if (String(slot.filters.value) !== String(newValue)) {
		slot.filters.value = newValue;
		changed = true;
		if (changedKnobIndex === -1) changedKnobIndex = 3;
	}

	if (changed) {
		updateSlotFilterUI(slot);
		autoSelectCardIfFiltersComplete(slot);
	}

	// Re-evaluate options ONCE after autoSelectCardIfFiltersComplete is done
	yearRangeOptions = getYearRanges();
	gameOptions = getAvailableGames(slot);
	suitsOptions = getAvailableSuits(slot.filters);
	valueOptions = getAvailableValues(slot.filters);

	const finalYearIdx = yearRangeOptions.findIndex((r) => r.key === slot.filters.yearRange);
	const finalGameIdx = gameOptions.indexOf(slot.filters.game);
	const finalSuitsIdx = suitsOptions.indexOf(slot.filters.suits);
	const finalValueIdx = valueOptions.indexOf(slot.filters.value);

	function getPrevIndex(slotId, knobIndex, rawIdx, fallbackIdx, optionsLength) {
		if (optionsLength <= 0) return 0;
		if (rawIdx >= 0) return Math.min(rawIdx, optionsLength - 1);
		if (fallbackIdx >= 0) return Math.min(fallbackIdx, optionsLength - 1);
		const paginationEl = document.getElementById(`slot-${slotId}-knob-${knobIndex}-pagination`);
		if (paginationEl) {
			const prev = parseInt(paginationEl.dataset.currentIndex || "0");
			if (prev >= 0) return Math.min(prev, optionsLength - 1);
		}
		return 0;
	}

	if (changedKnobIndex !== -1) {
		if (changedKnobIndex <= 0) {
			updateKnobPaginationIfChanged(slot.id, 0, getPrevIndex(slot.id, 0, finalYearIdx, yearRangeIndex, yearRangeOptions.length), yearRangeOptions.length, changedKnobIndex === 0);
		}
		if (changedKnobIndex <= 1) {
			updateKnobPaginationIfChanged(slot.id, 1, getPrevIndex(slot.id, 1, finalGameIdx, gameIndex, gameOptions.length), gameOptions.length, changedKnobIndex === 1);
		}
		if (changedKnobIndex <= 2) {
			updateKnobPaginationIfChanged(slot.id, 2, getPrevIndex(slot.id, 2, finalSuitsIdx, suitsIndex, suitsOptions.length), suitsOptions.length, changedKnobIndex === 2);
		}
		if (changedKnobIndex <= 3) {
			updateKnobPaginationIfChanged(slot.id, 3, getPrevIndex(slot.id, 3, finalValueIdx, valueIndex, valueOptions.length), valueOptions.length, changedKnobIndex === 3);
		}
	} else {
		updateKnobPaginationIfChanged(slot.id, 0, getPrevIndex(slot.id, 0, finalYearIdx, yearRangeIndex, yearRangeOptions.length), yearRangeOptions.length, false);
		updateKnobPaginationIfChanged(slot.id, 1, getPrevIndex(slot.id, 1, finalGameIdx, gameIndex, gameOptions.length), gameOptions.length, false);
		updateKnobPaginationIfChanged(slot.id, 2, getPrevIndex(slot.id, 2, finalSuitsIdx, suitsIndex, suitsOptions.length), suitsOptions.length, false);
		updateKnobPaginationIfChanged(slot.id, 3, getPrevIndex(slot.id, 3, finalValueIdx, valueIndex, valueOptions.length), valueOptions.length, false);
	}

	return changed;
}
