/**
 * indexedDbCache.js
 * 
 * Provides persistent, 0-RAM storage for all card images (Blobs and DataURLs).
 * This prevents the browser from hitting the network or proxy repeatedly,
 * and keeps heavy assets out of the JS memory heap when not in use.
 */

const DB_NAME = 'OracleHybridsCache';
const STORE_NAME = 'images';
const DB_VERSION = 2;

let dbPromise = null;

/**
 * Initialize and open the IndexedDB database
 */
function initDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                return reject(new Error('IndexedDB not supported'));
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create new store for all images if upgrading from v1
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'cardId' });
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
    return dbPromise;
}

/**
 * Save image data (Blob or DataURL) to IndexedDB
 * @param {string|number} cardId - Unique ID of the card
 * @param {any} data - The image data (Blob or base64)
 */
export async function setImageCache(cardId, data) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put({ cardId, data });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn(`[IndexedDB] Failed to cache image for card ${cardId}:`, err);
    }
}

/**
 * Retrieve image data from IndexedDB
 * @param {string|number} cardId - Unique ID of the card
 * @returns {Promise<any|null>} The image data, or null if not found
 */
export async function getImageCache(cardId) {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(cardId);

            request.onsuccess = (event) => {
                const result = event.target.result;
                resolve(result ? result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn(`[IndexedDB] Failed to retrieve image cache for card ${cardId}:`, err);
        return null;
    }
}

/**
 * Clear the entire IndexedDB cache (useful for hard reloads)
 */
export async function clearImageCache() {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('[IndexedDB] Failed to clear cache:', err);
    }
}

// Optionally, detect hard reloads to clear the DB
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
        // Shift + F5 or Shift + R
        if (e.shiftKey && (e.key === 'F5' || e.key.toLowerCase() === 'r')) {
            console.log('[IndexedDB] Hard reload detected. Clearing TIFF cache...');
            clearTiffCache();
        }
    });
}
