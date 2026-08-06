/**
 * cacheLoaderModal.js
 * 
 * Manages the First-Launch Cache Setup Overlay.
 * Displays a sleek, modern progress screen on initial borne launch
 * and disappears forever once 100% of cards are saved locally.
 */

const STORAGE_KEY = 'oracle_borne_cached_v1';
let overlayEl = null;
let progressBarEl = null;
let statusTextEl = null;

export function isAlreadyCached() {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
        return false;
    }
}

export function setAlreadyCached(flag = true) {
    try {
        if (flag) {
            localStorage.setItem(STORAGE_KEY, 'true');
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch (e) {
        // Ignore storage access errors
    }
}

function createOverlayDOM() {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.id = 'cache-loading-overlay';
    overlayEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.92);
        backdrop-filter: blur(16px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: var(--color-white-cream, #fefbf5);
        font-family: var(--font-body, "Libre Franklin", sans-serif);
        transition: opacity 0.5s ease;
    `;

    overlayEl.innerHTML = `
        <div style="
            background: var(--color-cream, #fdf4e3);
            border: 2px solid var(--color-pearl-ruby, #721422);
            border-radius: 20px;
            padding: 50px 60px;
            max-width: 540px;
            width: 85%;
            text-align: center;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
            color: var(--color-black, #000000);
        ">
            <h1 class="text-fr-title" style="
                color: var(--color-black, #000000);
                font-family: var(--font-title, 'Nippo', sans-serif);
                font-size: 2.4rem;
                font-weight: 800;
                letter-spacing: 0.05em;
                margin-bottom: 8px;
            ">
                INITIALISATION DU CACHE
            </h1>
            <p class="text-en-sub" style="
                color: var(--color-grey-black, #555555);
                font-family: var(--font-body, 'Libre Franklin', sans-serif);
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 35px;
                text-transform: uppercase;
                letter-spacing: 0.15em;
            ">
                Premier lancement de la borne
            </p>

            <!-- Progress Bar Outer Container (Matching design image) -->
            <div style="
                width: 100%;
                height: 24px;
                background: var(--color-cream, #fdf4e3);
                border: 2.5px solid var(--color-pearl-ruby, #661823);
                border-radius: 7px;
                overflow: hidden;
                margin-bottom: 24px;
                box-sizing: border-box;
                position: relative;
            ">
                <div id="cache-progress-fill" style="
                    width: 0%;
                    height: 100%;
                    background: var(--color-pearl-ruby, #661823);
                    transition: width 0.15s ease-out;
                "></div>
            </div>

            <div id="cache-status-text" style="
                font-family: var(--font-title, 'Nippo', monospace);
                font-size: 1.1rem;
                color: var(--color-black, #000000);
                font-weight: 700;
                letter-spacing: 0.05em;
            ">
                Mise en cache des cartes: 0 / 0 (0%)
            </div>
            <div style="
                font-family: var(--font-body, 'Libre Franklin', sans-serif);
                font-size: 0.9rem;
                color: var(--color-grey-black, #555555);
                margin-top: 14px;
            ">
                Stockage local des cartes pour un affichage instantané
            </div>
        </div>
    `;

    document.body.appendChild(overlayEl);
    progressBarEl = overlayEl.querySelector('#cache-progress-fill');
    statusTextEl = overlayEl.querySelector('#cache-status-text');
}

export function showCacheProgress(current, total) {
    if (typeof document === 'undefined') return;
    createOverlayDOM();

    const percent = Math.min(100, Math.round((current / total) * 100));
    if (progressBarEl) {
        progressBarEl.style.width = `${percent}%`;
    }
    if (statusTextEl) {
        statusTextEl.textContent = `Stockage local: ${current} / ${total} (${percent}%)`;
    }
}

export function hideCacheProgress() {
    if (!overlayEl) return;
    overlayEl.style.opacity = '0';
    setTimeout(() => {
        if (overlayEl && overlayEl.parentNode) {
            overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
        progressBarEl = null;
        statusTextEl = null;
    }, 500);
}
