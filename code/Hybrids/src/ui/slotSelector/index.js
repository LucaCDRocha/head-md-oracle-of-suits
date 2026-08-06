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
} from "./domManager.js";

import { drawPreview as compositionDrawPreview } from "./canvasComposition.js";

/**
 * Initialize slot selector UI and fetch cards data
 */
export async function initSlotSelector() {
	await fetchAndInitCards();
	renderSlotUI();
}

/**
 * Shuffle all 3 slots and update UI
 */
export function shuffleAllSlots() {
	stateShuffleAllSlots();
	renderSlotUI();
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

/**
 * Handle raw knob values from Arduino (0-1023)
 * Maps 12 knobs: 4 knobs per card slot (Year range, Game, Suit, Rank)
 */
export function handleKnobChange(knobValues) {
	let anyChanged = false;

	for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
		const slot = slots[cardIndex];
		if (!slot) continue;

		const startIdx = cardIndex * 4;
		const cardKnobs = knobValues.slice(startIdx, startIdx + 4);

		const changed = updateSlotFromKnobs(slot, cardKnobs);
		if (changed) anyChanged = true;
	}

	if (anyChanged) {
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
	const yearRangeOptions = getYearRanges();
	const gameOptions = getAvailableGames(slot);
	const suitsOptions = getAvailableSuits(slot.filters);
	const valueOptions = getAvailableValues(slot.filters);

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

	updateKnobPaginationIfChanged(slot.id, 0, yearRangeIndex, yearRangeOptions.length, changedKnobIndex === 0);
	updateKnobPaginationIfChanged(slot.id, 1, gameIndex, gameOptions.length, changedKnobIndex === 1);
	updateKnobPaginationIfChanged(slot.id, 2, suitsIndex, suitsOptions.length, changedKnobIndex === 2);
	updateKnobPaginationIfChanged(slot.id, 3, valueIndex, valueOptions.length, changedKnobIndex === 3);

	if (changed) {
		updateSlotFilterUI(slot);
		autoSelectCardIfFiltersComplete(slot);
	}

	return changed;
}
