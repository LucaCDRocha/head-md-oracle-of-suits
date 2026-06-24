/**
 * slotState.js - Data and state management for slot selector
 */

import { fetchCards } from "../../api/cardApi.js";

export let allCards = [];
export let allGames = [];
export let slots = [
	{ id: 1, filters: {}, selectedCard: null },
	{ id: 2, filters: {}, selectedCard: null },
	{ id: 3, filters: {}, selectedCard: null },
];
export let baseSlotId = 2; // Middle card is default base card for Gemini

export function setBaseSlotId(id) {
	baseSlotId = id;
}

export async function fetchAndInitCards() {
	allCards = await fetchCards();
	extractGameData();

	// Initialize each slot with a random card
	slots.forEach((slot) => {
		selectRandomCard(slot);
	});
}

/**
 * Extract unique games, years, suits, values from cards
 */
function extractGameData() {
	const gameMap = new Map();

	allCards.forEach((card) => {
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
 * Select a random card for a slot
 */
export function selectRandomCard(slot) {
	if (allCards.length === 0) return;

	const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
	const gameId = randomCard.game_id || randomCard.game?.id;

	const yearRanges = getYearRanges();
	const cardYearRange = yearRanges.find((range) => isYearInRange(randomCard.game?.year, range.key));

	slot.filters.yearRange = cardYearRange ? cardYearRange.key : null;
	slot.filters.game = gameId;
	slot.filters.suits = randomCard.suits;
	slot.filters.value = randomCard.value;

	selectCardForSlot(slot, randomCard);
}

/**
 * Select a card for a slot
 */
export function selectCardForSlot(slot, card) {
	slot.selectedCard = card;

	// Load p5 image for preview (will be available after p5 setup)
	if (typeof loadImage !== "undefined" || typeof window.loadImage !== "undefined") {
		const p5LoadImage = window.loadImage || loadImage;
		
		let imgUrl = card.img_src;
		if (imgUrl && imgUrl.startsWith('http') && !imgUrl.includes('localhost:8080')) {
			imgUrl = `/proxy-image?url=${encodeURIComponent(imgUrl)}`;
		}

		slot.selectedCard.img = p5LoadImage(
			imgUrl,
			() => {},
			() => {}
		);
	}
}

/**
 * Auto-select card if all required filters are set
 */
export function autoSelectCardIfFiltersComplete(slot) {
	const previousEquivalence = slot.selectedCard?.french_equivalence;

	if (!slot.filters.game || !slot.filters.suits || !slot.filters.value) {
		if (previousEquivalence && slot.filters.game) {
			tryMatchByFrenchEquivalence(slot, previousEquivalence);
		}
		return;
	}

	let matchingCards = allCards.filter((card) => {
		const gameId = card.game_id || card.game?.id;

		if (slot.filters.yearRange && !isYearInRange(card.game?.year, slot.filters.yearRange)) return false;
		if (slot.filters.game && gameId != slot.filters.game) return false;
		if (slot.filters.suits && card.suits != slot.filters.suits) return false;
		if (slot.filters.value && card.value != slot.filters.value) return false;

		return true;
	});

	if (matchingCards.length > 0) {
		selectCardForSlot(slot, matchingCards[0]);
	}
}

/**
 * Try to match a card by French equivalence when changing games
 */
export function tryMatchByFrenchEquivalence(slot, targetEquivalence) {
	if (!targetEquivalence) return false;

	let matchingCards = allCards.filter((card) => {
		const gameId = card.game_id || card.game?.id;

		if (slot.filters.yearRange && !isYearInRange(card.game?.year, slot.filters.yearRange)) return false;
		if (slot.filters.game && gameId != slot.filters.game) return false;

		return card.french_equivalence === targetEquivalence;
	});

	if (matchingCards.length === 0) {
		matchingCards = allCards.filter((card) => {
			const gameId = card.game_id || card.game?.id;

			if (slot.filters.yearRange && !isYearInRange(card.game?.year, slot.filters.yearRange)) return false;
			if (slot.filters.game && gameId != slot.filters.game) return false;

			return card.french_equivalence === targetEquivalence;
		});
	}

	if (matchingCards.length > 0) {
		const matchedCard = matchingCards[0];
		slot.filters.game = matchedCard.game_id || matchedCard.game?.id;
		slot.filters.suits = matchedCard.suits;
		slot.filters.value = matchedCard.value;

		selectCardForSlot(slot, matchedCard);
		return true;
	}

	return false;
}

/**
 * Get all available years from games
 */
export function getAvailableYears() {
	const years = [...new Set(allGames.map((g) => g.year).filter((y) => y))];
	return years.sort((a, b) => a - b);
}

/**
 * Get year ranges based on available game years
 */
export function getYearRanges() {
	const years = getAvailableYears();
	if (years.length === 0) return [];

	const minYear = Math.min(...years);
	const maxYear = Math.max(...years);

	const startCentury = Math.floor(minYear / 100) * 100;
	const endCentury = Math.ceil((maxYear + 1) / 100) * 100;

	const ranges = [];
	for (let start = startCentury; start < endCentury; start += 100) {
		const end = start + 100;
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
 */
export function isYearInRange(year, rangeKey) {
	if (!year || !rangeKey) return false;
	const [start, end] = rangeKey.split("-").map(Number);
	return year >= start && year < end;
}

/**
 * Get available games based on current filters
 */
export function getAvailableGames(slot) {
	let games = allGames;
	if (slot.filters.yearRange) {
		games = games.filter((g) => isYearInRange(g.year, slot.filters.yearRange));
	}
	return games.map((g) => g.id);
}

/**
 * Get available suits based on current filters
 */
export function getAvailableSuits(filters) {
	let cards = allCards;

	if (filters.yearRange) {
		cards = cards.filter((c) => isYearInRange(c.game?.year, filters.yearRange));
	}
	if (filters.game) {
		cards = cards.filter((c) => (c.game_id || c.game?.id) == filters.game);
	}

	const suitToFrenchMap = new Map();
	cards.forEach((c) => {
		if (c.suits && c.french_suits) {
			suitToFrenchMap.set(c.suits, c.french_suits);
		}
	});

	const suits = [...new Set(cards.map((c) => c.suits).filter((s) => s))];

	return suits.sort((a, b) => {
		const frenchA = suitToFrenchMap.get(a) || a;
		const frenchB = suitToFrenchMap.get(b) || b;
		return frenchA.localeCompare(frenchB);
	});
}

/**
 * Get available values based on current filters
 */
export function getAvailableValues(filters) {
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

	const valueToFrenchMap = new Map();
	cards.forEach((c) => {
		if (c.value && c.french_value) {
			valueToFrenchMap.set(c.value, c.french_value);
		}
	});

	const values = [...new Set(cards.map((c) => c.value).filter((v) => v))];

	return values.sort((a, b) => {
		const frenchA = valueToFrenchMap.get(a) || a;
		const frenchB = valueToFrenchMap.get(b) || b;

		const numA = parseInt(frenchA);
		const numB = parseInt(frenchB);

		if (!isNaN(numA) && !isNaN(numB)) {
			return numA - numB;
		}

		const origNumA = parseInt(a);
		const origNumB = parseInt(b);

		if (!isNaN(origNumA) && !isNaN(origNumB)) {
			return origNumA - origNumB;
		}

		return String(frenchA).localeCompare(String(frenchB));
	});
}

export function getSelectedCards() {
	return slots.filter((s) => s.selectedCard).map((s) => s.selectedCard);
}

export function getBaseCard() {
	const baseSlot = slots.find((s) => s.id === baseSlotId);
	return baseSlot?.selectedCard || null;
}

export function getBaseCardId() {
	return getBaseCard()?.id || null;
}
