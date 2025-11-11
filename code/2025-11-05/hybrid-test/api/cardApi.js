// API calls for cards
import { API_BASE } from "../config.js";

/**
 * Fetch all cards from the API
 * @returns {Promise<Array>} Array of card objects
 */
export async function fetchCards() {
	const res = await fetch(API_BASE + "/api/cards");
	if (!res.ok) throw new Error("Failed to fetch cards: " + res.status);
	const body = await res.json();
	return body.data || body;
}
