import { fetchCards } from "../../api/cardApi.js";
import { 
	isAlreadyCached, 
	setAlreadyCached, 
	showCacheProgress, 
	hideCacheProgress 
} from "../../ui/cacheLoaderModal.js";

export let allCards = [];
export let allGames = [];
export let slots = [
	{ id: 1, filters: {}, selectedCard: null },
	{ id: 2, filters: {}, selectedCard: null },
	{ id: 3, filters: {}, selectedCard: null },
];
export let baseSlotId = 2;
export let slotAbortControllers = [null, null, null];

export function setBaseSlotId(id) {
	baseSlotId = id;
}

// ----------------------------------------------------
// WEB CACHE API HELPERS (Replaces IndexedDB & HTTP cache)
// ----------------------------------------------------
const CACHE_NAME = 'oracle-cards-cache-v1';

async function getFromCache(key) {
	if (typeof window === 'undefined' || !window.caches) return null;
	try {
		const cache = await caches.open(CACHE_NAME);
		const res = await cache.match(key);
		if (res) return res;
	} catch (e) {
		console.warn("Cache read error:", e);
	}
	return null;
}

async function saveToCache(key, response) {
	if (typeof window === 'undefined' || !window.caches) return;
	try {
		const cache = await caches.open(CACHE_NAME);
		await cache.put(key, response);
	} catch (e) {
		console.warn("Cache write error:", e);
	}
}
// ----------------------------------------------------

let isProgressivePreloading = false;

export async function fetchAndInitCards() {
	allCards = await fetchCards();
	extractGameData();

	// Initialize each slot with a random card
	slots.forEach((slot) => {
		selectRandomCard(slot);
	});

	// Check if this is the first launch (un-cached)
	if (!isAlreadyCached()) {
		startProgressivePreloader();
	} else {
		console.log(`[Cache] Borne already cached! Skipping loading screen for instant 0-latency launch.`);
	}
}

async function startProgressivePreloader() {
	if (isProgressivePreloading || !allCards || allCards.length === 0) return;
	isProgressivePreloading = true;
	console.log(`[Cache] First launch detected! Preloading ${allCards.length} cards...`);

	showCacheProgress(0, allCards.length);

	const total = allCards.length;
	let completed = 0;
	const BATCH_SIZE = 5;

	for (let i = 0; i < total; i += BATCH_SIZE) {
		const batch = allCards.slice(i, i + BATCH_SIZE);
		
		await Promise.all(batch.map(async (card) => {
			if (!card.img_src || card.img_src.startsWith('data:')) {
				completed++;
				return;
			}

			let targetUrl = card.img_src;
			if (targetUrl.startsWith('http') && !targetUrl.includes('localhost:8080')) {
				targetUrl = `/proxy-image?url=${encodeURIComponent(targetUrl)}`;
			}

			const isTiff = targetUrl.toLowerCase().endsWith('.tif') || targetUrl.toLowerCase().endsWith('.tiff');

			try {
				if (isTiff) {
					const cached = await getFromCache(`tiff-${card.id}`);
					if (!cached) {
						const dataUrl = await decodeTiffToDataUrl(targetUrl);
						if (dataUrl && dataUrl.startsWith('data:')) {
							await saveToCache(`tiff-${card.id}`, new Response(dataUrl));
						}
					}
				} else {
					const cached = await getFromCache(targetUrl);
					if (!cached) {
						const response = await fetch(targetUrl);
						if (response.ok) {
							await saveToCache(targetUrl, response.clone());
						}
					}
				}
			} catch (e) {
				console.warn(`[Cache] Preloader error for ${card.id}:`, e);
			}

			completed++;
			showCacheProgress(completed, total);
		}));

		// Small 30ms gap between 5-card batches for maximum speed & stability
		await new Promise(resolve => setTimeout(resolve, 30));
	}

	console.log(`[Cache] First launch preloading complete! Saving cache flag.`);
	setAlreadyCached(true);
	hideCacheProgress();
}

async function decodeTiffToDataUrl(url, signal) {
	try {
		if (typeof UTIF === 'undefined') {
			console.warn("UTIF library is not loaded. Cannot decode TIFF image:", url);
			return url;
		}
		const response = await fetch(url, { signal });
		if (!response.ok) throw new Error("Failed to fetch TIFF");
		const buffer = await response.arrayBuffer();
		const ifds = UTIF.decode(buffer);
		if (!ifds || ifds.length === 0) {
			console.warn("UTIF could not find image IFD frame in TIFF:", url);
			return url;
		}
		UTIF.decodeImage(buffer, ifds[0]);
		const rgba = UTIF.toRGBA8(ifds[0]);

		const canvas = document.createElement('canvas');
		canvas.width = ifds[0].width;
		canvas.height = ifds[0].height;
		const ctx = canvas.getContext('2d');

		const imgData = ctx.createImageData(canvas.width, canvas.height);
		imgData.data.set(rgba);
		ctx.putImageData(imgData, 0, 0);

		return canvas.toDataURL('image/png');
	} catch (err) {
		if (err.name === 'AbortError') {
			throw err;
		}
		console.error("Error decoding TIFF at:", url, err);
		return url;
	}
}

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

export function shuffleAllSlots() {
	slots.forEach((slot) => {
		selectRandomCard(slot);
	});
}

export function selectCardForSlot(slot, card) {
	const slotIdx = slot.id - 1;
	if (slotAbortControllers[slotIdx]) {
		slotAbortControllers[slotIdx].abort();
		slotAbortControllers[slotIdx] = null;
	}

	slot.selectedCard = card;
	if (!card) return;

	const p5LoadImage = typeof window !== 'undefined' && window.loadImage ? window.loadImage : (typeof loadImage !== "undefined" ? loadImage : null);

	const triggerImageLoad = (imgUrl) => {
		let finalUrl = imgUrl || '';
		if (finalUrl.startsWith('http') && !finalUrl.includes('localhost:8080')) {
			finalUrl = `/proxy-image?url=${encodeURIComponent(finalUrl)}`;
		}

		if (typeof document !== 'undefined') {
			const slotEl = document.getElementById(`slot-${slot.id}`);
			if (slotEl) {
				const imgEl = slotEl.querySelector('.slot-preview img') || slotEl.querySelector('img');
				if (imgEl) {
					if (imgEl.src !== finalUrl) {
						imgEl.src = finalUrl;
					}
				}
			}
		}
	};

	const isTiff = card.img_src && (card.img_src.toLowerCase().endsWith('.tif') || card.img_src.toLowerCase().endsWith('.tiff'));

	let url = card.img_src;
	if (url && url.startsWith('http') && !url.includes('localhost:8080')) {
		url = `/proxy-image?url=${encodeURIComponent(url)}`;
	}

	if (card.img_src.startsWith('data:') || card.img_src.startsWith('blob:')) {
		triggerImageLoad(card.img_src);
		if (p5LoadImage) p5LoadImage(card.img_src);
		return;
	}

	if (isTiff) {
		getFromCache(`tiff-${card.id}`).then(async cached => {
			if (cached) {
				const dataUrl = await cached.text();
				card.img_src = dataUrl;
				triggerImageLoad(dataUrl);
				if (p5LoadImage) p5LoadImage(dataUrl);
			} else {
				const controller = new AbortController();
				slotAbortControllers[slotIdx] = controller;
		
				decodeTiffToDataUrl(url, controller.signal).then(dataUrl => {
					card.img_src = dataUrl;
					saveToCache(`tiff-${card.id}`, new Response(dataUrl));
					if (slot.selectedCard && slot.selectedCard.id === card.id) {
						triggerImageLoad(dataUrl);
						if (p5LoadImage) p5LoadImage(dataUrl);
					}
				}).catch(err => {
					if (err.name !== 'AbortError') console.error("Failed to decode card image:", card, err);
				});
			}
		});
	} else {
		getFromCache(url).then(async cached => {
			if (cached) {
				const blob = await cached.blob();
				const objectUrl = URL.createObjectURL(blob);
				card.img_src = objectUrl;
				triggerImageLoad(objectUrl);
				if (p5LoadImage) p5LoadImage(objectUrl);
			} else {
				const controller = new AbortController();
				slotAbortControllers[slotIdx] = controller;

				fetch(url, { signal: controller.signal }).then(res => {
					if (!res.ok) throw new Error("Fetch failed");
					const resClone = res.clone();
					saveToCache(url, resClone);
					return res.blob();
				}).then(blob => {
					if (slot.selectedCard && slot.selectedCard.id === card.id) {
						const objectUrl = URL.createObjectURL(blob);
						card.img_src = objectUrl;
						triggerImageLoad(objectUrl);
						if (p5LoadImage) p5LoadImage(objectUrl);
					}
				}).catch(err => {
					if (err.name !== 'AbortError') {
						console.error("Failed to fetch image dynamically:", err);
						triggerImageLoad(url); 
						if (p5LoadImage) p5LoadImage(url);
					}
				});
			}
		});
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
	return [...new Set(allGames.map((g) => g.year).filter(Boolean))];
}

/**
 * Get year ranges based on available game years
 */
export function getYearRanges() {
	const years = getAvailableYears();
	
	const order = [
		'avant 1700',
		'1700-1800',
		'1800-1850',
		'1850-1900',
		'1900-1950',
		'1950-2000',
		'2000-present'
	];
	
	years.sort((a, b) => {
		const idxA = order.indexOf(a);
		const idxB = order.indexOf(b);
		if (idxA !== -1 && idxB !== -1) return idxA - idxB;
		if (idxA !== -1) return -1;
		if (idxB !== -1) return 1;
		return a.localeCompare(b);
	});

	return years.map((y) => {
		return {
			key: y,
			label: y,
			count: allGames.filter((g) => g.year === y).length
		};
	});
}

/**
 * Check if a year falls within a year range
 */
export function isYearInRange(year, rangeKey) {
	if (!year || !rangeKey) return false;
	return year === rangeKey;
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
