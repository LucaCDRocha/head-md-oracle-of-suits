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
    const galleryUrl = API_BASE ? `${API_BASE.replace(/\/$/, "")}/hybrids` : `${window.location.origin}/`;
    qrExploreEl.innerHTML = "";
    qrExploreObj = new QRCode(qrExploreEl, {
      text: galleryUrl,
      width: 100,
      height: 100,
      colorDark: "#721422",
      colorLight: "#fdf4e3",
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
      colorLight: "#fdf4e3",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }
}

function updateDownloadQR(hybridId) {
  if (!qrDownloadObj) return;
  const downloadUrl = API_BASE
    ? `${API_BASE.replace(/\/$/, "")}/hybrids/${hybridId}`
    : `${window.location.origin}/hybrids/${hybridId}`;
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
    const cards = data.selectedCards || [];
    if (cards.length > 0 && currentState === "IDLE") {
      setViewState("EXPLORE");
    } else if (cards.length === 0 && currentState === "EXPLORE") {
      setViewState("IDLE");
    }
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

/**
 * Fetch top 5-10 most-liked hybrids from API_BASE and animate them across screen
 */
async function fetchAndRenderFloatingCards() {
  if (!floatingContainer) return;
  floatingContainer.innerHTML = "";

  let hybridsList = [];

  if (API_BASE) {
    try {
      const url = `${API_BASE.replace(/\/$/, "")}/api/hybrids`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        // Sort by likes descending and take top 10
        hybridsList = data.sort((a, b) => (b.nb_like || 0) - (a.nb_like || 0)).slice(0, 10);
      }
    } catch (e) {
      console.warn("Could not fetch hybrids for idle floating background:", e);
    }
  }

  // Fallback to sample card assets if no hybrids from API
  if (!hybridsList || hybridsList.length === 0) {
    hybridsList = [
      { img_src: "assets/card_placeholder.jpg" },
      { img_src: "assets/card_placeholder.jpg" },
      { img_src: "assets/card_placeholder.jpg" },
      { img_src: "assets/card_placeholder.jpg" },
      { img_src: "assets/card_placeholder.jpg" },
    ];
  }

  // Render floating card elements with randomized positions and animation delays
  hybridsList.forEach((item, idx) => {
    const cardEl = document.createElement("div");
    cardEl.className = "floating-card";

    const imgSrc = item.img_src || "assets/card_placeholder.jpg";
    cardEl.style.backgroundImage = `url('${imgSrc}')`;

    // Random initial positions and animation speeds
    const leftPercent = (idx * 18 + Math.random() * 8) % 90;
    const topPercent = (idx * 22 + Math.random() * 12) % 80;
    const duration = 18 + (idx % 5) * 4; // 18s - 34s
    const delay = (idx * 1.5) % 8;
    const rot = -15 + Math.random() * 30;

    cardEl.style.left = `${leftPercent}%`;
    cardEl.style.top = `${topPercent}%`;
    cardEl.style.animation = `floatDrift ${duration}s ease-in-out ${delay}s infinite alternate`;
    cardEl.style.transform = `rotate(${rot}deg)`;

    floatingContainer.appendChild(cardEl);
  });
}
