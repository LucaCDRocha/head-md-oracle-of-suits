import wsClient from "./src/network/wsClient.js";
import { API_BASE, DEBUG } from "./config.js";
import { compositeCardCanvas } from "./src/utils/cardCanvas.js";

// State elements
const views = {
  IDLE: document.getElementById("view-idle"),
  EXPLORE: document.getElementById("view-explore"),
  GENERATING: document.getElementById("view-generating"),
  RESULT: document.getElementById("view-result"),
};

const progressBarFill = document.getElementById("progress-bar-fill");
const resultHybridImg = document.getElementById("result-hybrid-img");
const floatingContainer = document.getElementById("floating-hybrids-container");

let currentState = "IDLE";
let progressTimer = null;
let currentProgress = 0;
let isPayloadReceived = false;
let pendingPayload = null;

let qrExploreObj = null;
let qrDownloadObj = null;

// Initialize App 2
document.addEventListener("DOMContentLoaded", () => {
  initQRCodes();
  initWebSocket();
  setViewState("IDLE");
  initDebugPanel();
});

function initQRCodes() {
  const qrExploreEl = document.getElementById("qr-explore-idle");
  if (qrExploreEl && window.QRCode) {
    const galleryUrl = API_BASE ? `${API_BASE.replace(/\/$/, "")}` : `${window.location.origin}/`;
    qrExploreEl.innerHTML = "";
    qrExploreObj = new QRCode(qrExploreEl, {
      text: galleryUrl,
      width: 100,
      height: 100,
      colorDark: "#721422",
      colorLight: "#fefbf5",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }

  const qrDownloadEl = document.getElementById("qr-download-result");
  if (qrDownloadEl && window.QRCode) {
    qrDownloadEl.innerHTML = "";
    qrDownloadObj = new QRCode(qrDownloadEl, {
      text: API_BASE || window.location.href,
      width: 100,
      height: 100,
      colorDark: "#721422",
      colorLight: "#fefbf5",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }
}

function updateDownloadQR(hybridId) {
  if (!qrDownloadObj) return;
  const downloadUrl = API_BASE
    ? `${API_BASE.replace(/\/$/, "")}/${hybridId}`
    : `${window.location.origin}/${hybridId}`;
  qrDownloadObj.clear();
  qrDownloadObj.makeCode(downloadUrl);
}

function initWebSocket() {
  wsClient.connect("display");

  wsClient.on("STATE_CHANGE", (data) => {
    console.log("[App2 Display] STATE_CHANGE received:", data);
    if (data.state) {
      setViewState(data.state, data);
    }
  });

  wsClient.on("HYBRID_GENERATED", (data) => {
    console.log("[App2 Display] HYBRID_GENERATED received:", data);
    const payload = data.payload || data;
    handleHybridGenerated(payload);
  });

  wsClient.on("CARDS_UPDATED", (data) => {
    console.log("[App2 Display] CARDS_UPDATED received:", data);
  });
}

function setViewState(nextState, extraData = {}) {
  console.log(`[App2 Display] Transitioning: ${currentState} -> ${nextState}`);
  currentState = nextState;

  // Toggle view elements
  Object.keys(views).forEach((key) => {
    if (views[key]) {
      if (key === nextState) {
        views[key].classList.add("active");
      } else {
        views[key].classList.remove("active");
      }
    }
  });

  // Handle state-specific logic
  if (nextState === "IDLE") {
    if (floatingContainer) floatingContainer.style.display = "block";
    resetProgressBar();
    fetchAndRenderFloatingCards();
  } else if (nextState === "EXPLORE") {
    if (floatingContainer) floatingContainer.style.display = "none";
    resetProgressBar();
  } else if (nextState === "GENERATING") {
    if (floatingContainer) floatingContainer.style.display = "none";
    startProgressBar();
  } else if (nextState === "RESULT") {
    if (floatingContainer) floatingContainer.style.display = "none";
  }
}

let isPayloadLoaded = false;
let preloadedImageSrc = null;

/**
 * Smart 15-second progress bar filling timer:
 * - Fills smoothly from 0% to ~92% over 15s (15,000 ms)
 * - Holds at ~92% until result payload is 100% loaded in GPU/RAM memory
 * - When loaded, rapidly completes fill to 100% and opens RESULT view
 */
function startProgressBar() {
  resetProgressBar();

  const intervalMs = 100;
  currentProgress = 0;

  progressTimer = setInterval(() => {
    // Rapidly & smoothly complete fill when the image payload is 100% loaded
    if (isPayloadLoaded) {
      currentProgress += 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        if (progressBarFill) progressBarFill.style.width = "100%";
        clearInterval(progressTimer);
        progressTimer = null;
        setTimeout(() => {
          showResultView(pendingPayload);
        }, 250);
      } else {
        if (progressBarFill) progressBarFill.style.width = currentProgress.toFixed(1) + "%";
      }
    } else {
      // Never fully stop: fast up to ~65%, then asymptotically slow down as it approaches 99%
      if (currentProgress < 65) {
        currentProgress += 0.7;
      } else {
        const remaining = 99 - currentProgress;
        currentProgress += Math.max(0.02, remaining * 0.03);
      }

      if (currentProgress > 99) currentProgress = 99;
      if (progressBarFill) progressBarFill.style.width = currentProgress.toFixed(1) + "%";
    }
  }, intervalMs);
}

function resetProgressBar() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  currentProgress = 0;
  isPayloadLoaded = false;
  isPayloadReceived = false;
  preloadedImageSrc = null;
  pendingPayload = null;
  if (progressBarFill) progressBarFill.style.width = "0%";
  if (resultHybridImg) {
    resultHybridImg.style.opacity = "0";
    resultHybridImg.removeAttribute("src");
  }
}

function handleHybridGenerated(payload) {
  pendingPayload = payload;
  isPayloadReceived = true;

  const newSrc = payload.base64
    ? (payload.base64.startsWith("data:") ? payload.base64 : `data:image/png;base64,${payload.base64}`)
    : payload.img_src;

  preloadedImageSrc = newSrc;

  // Background preload in memory while progress bar is running
  if (newSrc) {
    const tempImg = new Image();
    const onReady = () => {
      isPayloadLoaded = true;
      if (!progressTimer) {
        showResultView(payload);
      }
    };
    tempImg.onload = onReady;
    tempImg.onerror = onReady;
    tempImg.src = newSrc;
  } else {
    isPayloadLoaded = true;
    if (!progressTimer) {
      showResultView(payload);
    }
  }
}

function showResultView(payload) {
  if (!payload) return;

  const newSrc = preloadedImageSrc || (payload.base64
    ? (payload.base64.startsWith("data:") ? payload.base64 : `data:image/png;base64,${payload.base64}`)
    : payload.img_src);

  if (payload.id) {
    updateDownloadQR(payload.id);
  }

  if (newSrc && resultHybridImg) {
    resultHybridImg.src = newSrc;
  }

  const isStateChanged = currentState !== "RESULT";

  // Switch to RESULT view
  setViewState("RESULT");

  // Broadcast RESULT state to App 1 so Brain un-dims at the exact same instant
  if (isStateChanged) {
    wsClient.sendStateChange("RESULT", { hybridPayload: payload });
  }

  requestAnimationFrame(() => {
    if (resultHybridImg) {
      resultHybridImg.style.opacity = "1";
    }
  });
}

let floatingCardsRenderToken = 0;
let isFloatingCardsRendered = false;
let isFetchingFloatingCards = false;

/**
 * Fetch top 5-10 most-liked hybrids from API_BASE and animate them across screen
 */
async function fetchAndRenderFloatingCards(forceReRender = false) {
  if (!floatingContainer) return;

  // If already rendered or fetch is currently in-flight, maintain single clean slot instance
  if ((isFloatingCardsRendered || isFetchingFloatingCards) && floatingContainer.children.length > 0 && !forceReRender) {
    return;
  }

  isFetchingFloatingCards = true;
  const currentToken = ++floatingCardsRenderToken;
  let rawList = [];

  try {
    // 1. Try fetching top 10 generated hybrids from backend API directly
    if (API_BASE) {
      try {
        const url = `${API_BASE.replace(/\/$/, "")}/api/hybrids?limit=10&sort_by=nb_like`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          rawList = json.data || [];
          console.log(`[Display] Loaded ${rawList.length} floating hybrids from API`);
        }
      } catch (e) {
        console.warn("Could not fetch hybrids for idle floating background:", e);
      }
    }
  } finally {
    isFetchingFloatingCards = false;
  }

  // Cancel if another render process started while fetching
  if (currentToken !== floatingCardsRenderToken) return;

  // 2. If API hybrids list is empty, fetch API cards dataset
  if (!rawList || rawList.length === 0) {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/cards`);
        if (res.ok) {
          const json = await res.json();
          rawList = json.data || json || [];
        }
      } catch (e) {
        console.warn("Could not fetch API cards fallback:", e);
      }
    }
  }

  // Cancel if another render process started while fetching
  if (currentToken !== floatingCardsRenderToken) return;

  // 3. Strict Deduplication: Extract unique normalized image URL for every card
  const seenImageUrls = new Set();
  const uniqueHybrids = [];

  for (const item of rawList) {
    const src = item.img_src || item.img || item.url || (item.base64 ? `data:image/png;base64,${item.base64}` : null);
    if (!src) continue;

    // Normalize image source key to detect duplicate paths
    const normalizedKey = String(src).replace(/^(\.\/|\/)/, "").trim();

    if (!seenImageUrls.has(normalizedKey)) {
      seenImageUrls.add(normalizedKey);
      uniqueHybrids.push({ ...item, img_src: src });
    }
  }

  if (uniqueHybrids.length === 0) return;

  // Clear single container slot completely before appending
  floatingContainer.innerHTML = "";

  // Render unique floating cards passing through left-to-right & right-to-left
  const count = uniqueHybrids.length;
  const bandIndices = Array.from({ length: count }, (_, i) => i);
  // Shuffle band indices for random initial vertical placement
  for (let i = bandIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bandIndices[i], bandIndices[j]] = [bandIndices[j], bandIndices[i]];
  }

  // Calculate distributed Y top percentage across [5%, 82%] range (reaching ~95% with card height)
  function getDistributedTop(bandIndex, total) {
    const minTop = 5;
    const maxTop = 82; 
    const bandSize = (maxTop - minTop) / total;
    const topVal = minTop + bandIndex * bandSize + Math.random() * (bandSize * 0.7);
    return Math.min(maxTop, Math.max(minTop, topVal));
  }

  uniqueHybrids.forEach((item, idx) => {
    const cardEl = document.createElement("img");
    cardEl.className = "floating-card";
    cardEl.src = item.img_src;

    const isLeftToRight = idx % 2 === 0;
    const initialTop = getDistributedTop(bandIndices[idx], count);
    const duration = 16 + (idx % 4) * 4; // 16s - 28s
    const delay = -(idx * 3.5); // Stagger initial start times across screen
    const rot = -14 + Math.random() * 28;

    cardEl.style.top = `${initialTop}%`;
    cardEl.style.setProperty("--card-rot", `${rot}deg`);

    const animName = isLeftToRight ? "passLeftToRight" : "passRightToLeft";
    cardEl.style.animation = `${animName} ${duration}s linear ${delay}s infinite`;

    // Randomize Y position using distributed bands on every loop iteration
    cardEl.addEventListener("animationiteration", () => {
      const newBand = Math.floor(Math.random() * count);
      const nextTop = getDistributedTop(newBand, count);
      const randomRot = -14 + Math.random() * 28;
      cardEl.style.top = `${nextTop}%`;
      cardEl.style.setProperty("--card-rot", `${randomRot}deg`);
    });

    floatingContainer.appendChild(cardEl);
  });

  isFloatingCardsRendered = true;
}

// ── Interactive Debug Layout Tester Panel ──
const isDebugActive = () => DEBUG === true || window.location.search.includes("debug=true") || window.ENV?.DEBUG === true;

const TAROT_PRESETS = [
  { num: "XXI", name: "LE MONDE" },
  { num: "XX", name: "LE JUGEMENT" },
  { num: "XIX", name: "LE SOLEIL" },
  { num: "XVIII", name: "LA LUNE" },
  { num: "XVII", name: "L'ÉTOILE" },
  { num: "XVI", name: "LA MAISON DIEU" },
  { num: "XV", name: "LE DIABLE" },
  { num: "XIV", name: "LA TEMPÉRANCE" },
  { num: "XIII", name: "LA MORT" },
  { num: "XII", name: "LE PENDU" },
  { num: "XI", name: "LA FORCE" },
  { num: "X", name: "LA ROUE DE FORTUNE" },
  { num: "IX", name: "L'ERMITE" },
  { num: "VIII", name: "LA JUSTICE" },
  { num: "VII", name: "LE CHARIOT" },
  { num: "VI", name: "L'AMOUREUX" },
  { num: "V", name: "LE PAPE" },
  { num: "IV", name: "L'EMPEREUR" },
  { num: "III", name: "L'IMPÉRATRICE" },
  { num: "II", name: "LA PAPESSE" },
  { num: "I", name: "LE BATELEUR" },
  { num: "0", name: "LE MAT" },
];

function initDebugPanel() {
  if (!isDebugActive()) return;

  const panel = document.createElement("div");
  panel.id = "debug-layout-panel";
  panel.innerHTML = `
    <div class="dbg-panel-header">
      <span>🛠 Canvas Layout & Suit Tester</span>
      <span style="font-size:0.75rem; color:#10b981; font-weight: bold;">DEBUG ACTIVE</span>
    </div>
    <div class="dbg-panel-body">
      <div class="dbg-preview-box">
        <img id="debug-canvas-preview" alt="Canvas Layout Live Preview" />
      </div>
      
      <div class="dbg-row">
        <div class="dbg-field-group">
          <label>Card Type</label>
          <select id="dbg-card-type">
            <option value="playing_card" selected>Playing Card</option>
            <option value="tarot">Tarot Card</option>
          </select>
        </div>
        <div class="dbg-field-group">
          <label>Suit Symbol</label>
          <select id="dbg-suit">
            <option value="spades">♠ Spades (Pique)</option>
            <option value="hearts" selected>♥ Hearts (Cœur)</option>
            <option value="diamonds">♦ Diamonds (Carreau)</option>
            <option value="clubs">♣ Clubs (Trèfle)</option>
            <option value="swords">⚔ Swords (Épée)</option>
            <option value="cups">🍷 Cups (Coupe)</option>
            <option value="coins">🪙 Coins (Denier)</option>
            <option value="wands">🦯 Wands (Bâton)</option>
            <option value="shields">🛡 Shields (Bouclier)</option>
            <option value="acorns">🌰 Acorns (Gland)</option>
            <option value="bells">🔔 Bells (Grelot)</option>
            <option value="roses">🌹 Roses (Rose)</option>
            <option value="leaves">🍃 Leaves (Feuille)</option>
          </select>
        </div>
      </div>

      <div class="dbg-row">
        <div class="dbg-field-group">
          <label>Rank / Value</label>
          <select id="dbg-rank">
            <option value="A" selected>A (Ace)</option>
            <option value="K">K (King / Roi)</option>
            <option value="Q">Q (Queen / Reine)</option>
            <option value="C">C (Cavalier / Knight)</option>
            <option value="J">J (Jack / Valet)</option>
            <option value="10">10</option>
            <option value="9">9</option>
            <option value="8">8</option>
            <option value="7">7</option>
            <option value="6">6</option>
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
            <option value="O">O (Ober)</option>
            <option value="U">U (Unter)</option>
            <option value="JOKER">JOKER</option>
          </select>
        </div>
        <div class="dbg-field-group">
          <label>Tarot Number</label>
          <select id="dbg-tarot-num">
            ${TAROT_PRESETS.map(t => `<option value="${t.num}" ${t.num === 'XXI' ? 'selected' : ''}>${t.num}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="dbg-field-group">
        <label>Tarot Title Name</label>
        <select id="dbg-tarot-name">
          ${TAROT_PRESETS.map(t => `<option value="${t.name}" ${t.name === 'LE MONDE' ? 'selected' : ''}>${t.num} - ${t.name}</option>`).join('')}
        </select>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const previewImg = document.getElementById("debug-canvas-preview");
  const cardTypeEl = document.getElementById("dbg-card-type");
  const suitEl = document.getElementById("dbg-suit");
  const rankEl = document.getElementById("dbg-rank");
  const tarotNumEl = document.getElementById("dbg-tarot-num");
  const tarotNameEl = document.getElementById("dbg-tarot-name");

  // Create neutral sample artwork base64 background
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 1200;
  sampleCanvas.height = 1600;
  const sCtx = sampleCanvas.getContext("2d");
  sCtx.fillStyle = "#EAE4D8";
  sCtx.fillRect(0, 0, 1200, 1600);
  sCtx.fillStyle = "#B5A795";
  sCtx.font = "bold 50px sans-serif";
  sCtx.textAlign = "center";
  sCtx.textBaseline = "middle";
  sCtx.fillText("SAMPLE ARTWORK AREA", 600, 800);
  const sampleBase64 = sampleCanvas.toDataURL("image/png");

  // Enable mouse wheel scrolling over select elements to cycle values
  function enableScrollOnSelect(selectEl) {
    selectEl.addEventListener("wheel", (e) => {
      e.preventDefault();
      const options = selectEl.options;
      if (options.length === 0) return;

      let newIndex = selectEl.selectedIndex + (e.deltaY > 0 ? 1 : -1);
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= options.length) newIndex = options.length - 1;

      if (newIndex !== selectEl.selectedIndex) {
        selectEl.selectedIndex = newIndex;
        selectEl.dispatchEvent(new Event("change"));
      }
    }, { passive: false });
  }

  [cardTypeEl, suitEl, rankEl, tarotNumEl, tarotNameEl].forEach(enableScrollOnSelect);

  // Sync Tarot Name -> Tarot Number & Card Type
  tarotNameEl.addEventListener("change", () => {
    const found = TAROT_PRESETS.find(t => t.name === tarotNameEl.value);
    if (found) {
      tarotNumEl.value = found.num;
    }
    cardTypeEl.value = "tarot";
    updateDebugPreview();
  });

  tarotNumEl.addEventListener("change", () => {
    const found = TAROT_PRESETS.find(t => t.num === tarotNumEl.value);
    if (found) {
      tarotNameEl.value = found.name;
    }
    cardTypeEl.value = "tarot";
    updateDebugPreview();
  });

  rankEl.addEventListener("change", () => {
    cardTypeEl.value = "playing_card";
    updateDebugPreview();
  });

  suitEl.addEventListener("change", () => {
    cardTypeEl.value = "playing_card";
    updateDebugPreview();
  });

  cardTypeEl.addEventListener("change", updateDebugPreview);

  async function updateDebugPreview() {
    const cardType = cardTypeEl.value;
    const suit = suitEl.value;
    const rank = rankEl.value;
    const tarotNumber = tarotNumEl.value;
    const tarotName = tarotNameEl.value;

    const resultBase64 = await compositeCardCanvas(sampleBase64, {
      cardType,
      rank,
      suit,
      tarotNumber,
      tarotName,
    });

    previewImg.src = resultBase64.startsWith("data:") ? resultBase64 : "data:image/png;base64," + resultBase64;
  }

  updateDebugPreview();
}
