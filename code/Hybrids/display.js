import wsClient from "./src/network/wsClient.js";
import { API_BASE } from "./config.js";

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
  fetchAndRenderFloatingCards();
  setViewState("IDLE");
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
    if (extraData.hybridPayload) {
      handleHybridGenerated(extraData.hybridPayload);
    }
  }
}

/**
 * Smart 15-second progress bar filling timer:
 * - Fills smoothly from 0% to ~92% over 15s (15,000 ms)
 * - Holds at ~92% if result payload hasn't arrived yet
 * - When payload arrives, rapidly completes fill to 100% and opens RESULT view
 */
function startProgressBar() {
  resetProgressBar();
  isPayloadReceived = false;
  pendingPayload = null;

  const durationMs = 15000; // 15 seconds
  const targetSubMax = 92; // fill up to 92% over 15s
  const intervalMs = 100;
  const increment = (targetSubMax / (durationMs / intervalMs));

  currentProgress = 0;

  progressTimer = setInterval(() => {
    if (isPayloadReceived) {
      // Complete fill quickly
      currentProgress += 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        if (progressBarFill) progressBarFill.style.width = "100%";
        clearInterval(progressTimer);
        progressTimer = null;
        setTimeout(() => {
          showResultView(pendingPayload);
        }, 400);
      } else {
        if (progressBarFill) progressBarFill.style.width = currentProgress.toFixed(1) + "%";
      }
    } else {
      // Normal 15-second progress up to 92%
      if (currentProgress < targetSubMax) {
        currentProgress += increment;
        if (currentProgress > targetSubMax) currentProgress = targetSubMax;
      }
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
  if (progressBarFill) progressBarFill.style.width = "0%";
}

function handleHybridGenerated(payload) {
  pendingPayload = payload;
  isPayloadReceived = true;

  // If progress bar is running, let it complete to 100% via the timer
  if (!progressTimer) {
    showResultView(payload);
  }
}

function showResultView(payload) {
  if (!payload) return;

  if (resultHybridImg) {
    if (payload.base64) {
      resultHybridImg.src = payload.base64.startsWith("data:")
        ? payload.base64
        : `data:image/png;base64,${payload.base64}`;
    } else if (payload.img_src) {
      resultHybridImg.src = payload.img_src;
    }
  }

  if (payload.id) {
    updateDownloadQR(payload.id);
  }

  setViewState("RESULT");
}

let floatingCardsRenderToken = 0;
let isFloatingCardsRendered = false;

/**
 * Fetch top 5-10 most-liked hybrids from API_BASE and animate them across screen
 */
async function fetchAndRenderFloatingCards(forceReRender = false) {
  if (!floatingContainer) return;

  // If already rendered and not forced, maintain single clean slot instance
  if (isFloatingCardsRendered && floatingContainer.children.length > 0 && !forceReRender) {
    return;
  }

  const currentToken = ++floatingCardsRenderToken;
  let rawList = [];

  // 1. Try fetching generated hybrids from backend API
  if (API_BASE) {
    try {
      const url = `${API_BASE.replace(/\/$/, "")}/api/hybrids`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        rawList = json.data || [];
        rawList.sort((a, b) => (b.nb_like || 0) - (a.nb_like || 0));
      }
    } catch (e) {
      console.warn("Could not fetch hybrids for idle floating background:", e);
    }
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

    if (uniqueHybrids.length >= 8) break;
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
    const cardEl = document.createElement("div");
    cardEl.className = "floating-card";

    cardEl.style.backgroundImage = `url('${item.img_src}')`;

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
