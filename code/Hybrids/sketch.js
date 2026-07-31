import {
  initSlotSelector,
  getSelectedCards,
  getBaseCardId,
  drawPreview,
  handleKnobChange,
  shuffleAllSlots,
} from "./src/ui/slotSelector/index.js";
import { generateImage } from "./src/api/generationApi.js";
import { uploadHybridBase64 } from "./src/api/hybridApi.js";
import {
  setupSerial,
  setKnobChangeCallback,
  setButtonPressCallback,
  setButtonReleaseCallback,
  setKnobValue,
} from "./src/hardware/Serial.js";
import { initQRCodes, updateDownloadQR } from "./src/ui/qrCodes.js";
import { DEBUG, DEV_MODE } from "./config.js";
import soundEffects from "./src/audio/soundEffects.js";
import LoadingAnimation from "./src/ui/loadingAnimation.js";
import wsClient from "./src/network/wsClient.js";

let canvas;
let lastGeneratedBase64 = null;
let loadingAnimation = null;

// Generation & Hold state
let isGenerating = false;
let isBatchGenerating = false;
let lastGenerateTime = 0;
const DEBOUNCE_DURATION = 5000; // 5 seconds minimum between generations
const HOLD_DURATION = 2000; // 2 seconds hold required to start generation

let isHolding = false;
let holdStartTime = 0;
let holdAnimFrame = null;
let holdSource = null;

// Add global error handler to prevent page reload on uncaught errors
window.addEventListener("error", function (e) {
  console.error("Global error caught:", e.error);
  e.preventDefault();
  return false;
});

window.setup = function () {
  // Make p5 functions globally available for the slot selector
  window.loadImage = loadImage;
  window.createButton = createButton;

  // small canvas used for composing the hybrid image
  const holder = document.getElementById("p5-holder");
  canvas = createCanvas(512, 512);
  canvas.parent(holder);
  background(240);

  // Initialize QR codes
  initQRCodes();

  // Initialize loading animation
  loadingAnimation = new LoadingAnimation("loading-overlay");

  // Initialize sound effects on first user interaction
  document.body.addEventListener(
    "click",
    () => {
      soundEffects.init();
    },
    { once: true }
  );

  // Initialize WebSocket connection as Controller / Brain & sync state on connection
  wsClient.connect("brain");
  wsClient.on("connection_change", ({ connected }) => {
    if (connected) {
      syncBrainState();
    }
  });

  // Setup Arduino serial connection
  setupSerial();

  // Set callback for knob changes
  setKnobChangeCallback((knobValues) => {
    handleKnobChange(knobValues);
    markUserInteracted();
    syncBrainState();
  });

  // Set callbacks for serial button press/release
  setButtonPressCallback(() => {
    markUserInteracted();
    startHold("serial");
  });
  setButtonReleaseCallback(() => {
    cancelHold("serial");
  });

  // Apply DEBUG & DEV_MODE mode visibility
  applyDebugMode();

  // Wire Dev Mode batch generation button
  const devBatchBtn = document.getElementById("dev-batch-btn");
  if (devBatchBtn) {
    devBatchBtn.addEventListener("click", () => {
      markUserInteracted();
      runDevBatchGeneration();
    });
  }

  // Wire Shuffle Cards button
  const shuffleBtn = document.getElementById("shuffle-btn");
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      markUserInteracted();
      shuffleAllSlots();
      syncBrainState();
    });
  }

  // Wire screen generate button with 3-second hold logic
  const genBtn = document.getElementById("generate-btn");
  if (genBtn) {
    genBtn.addEventListener("mousedown", () => startHold("mouse"));
    genBtn.addEventListener("mouseup", () => cancelHold("mouse"));
    genBtn.addEventListener("mouseleave", () => cancelHold("mouse"));
    genBtn.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        startHold("mouse");
      },
      { passive: false }
    );
    genBtn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        cancelHold("mouse");
      },
      { passive: false }
    );
    genBtn.addEventListener(
      "touchcancel",
      (e) => {
        e.preventDefault();
        cancelHold("mouse");
      },
      { passive: false }
    );
    genBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }

  // Load cards using slot selector and sync initial state
  initSlotSelector().then(() => {
    syncBrainState();
  });

  // Add Enter key hold listener for hybridization
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!e.repeat) {
        startHold("keyboard");
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      cancelHold("keyboard");
    }
  });

  window.addEventListener("blur", () => {
    cancelHold(null);
  });

  // Reset 60-second inactivity timer on any screen interaction
  ["pointerdown", "touchstart", "keydown"].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (userHasInteracted) {
        resetInactivityTimer();
      }
    });
  });
};

/**
 * Apply DEBUG & DEV_MODE visibility settings
 * - Shows/hides knob values display
 * - Shows/hides selected area (generate button section)
 * - Shows/hides Dev Mode batch generation button
 */
function applyDebugMode() {
  const knobValuesDisplay = document.getElementById("knob-values-display");
  if (knobValuesDisplay) {
    knobValuesDisplay.style.display = DEBUG ? "block" : "none";
  }

  const selectedArea = document.getElementById("selected-area");
  if (selectedArea) {
    selectedArea.style.display = (DEBUG || DEV_MODE) ? "block" : "none";
  }

  const devBatchBtn = document.getElementById("dev-batch-btn");
  if (devBatchBtn) {
    devBatchBtn.style.display = DEV_MODE ? "inline-block" : "none";
  }

  const shuffleBtn = document.getElementById("shuffle-btn");
  if (shuffleBtn) {
    shuffleBtn.style.display = (DEBUG || DEV_MODE) ? "inline-block" : "none";
  }
}

window.draw = function () {
  drawPreview(window);
  simulateSerialInput();
};

window.setKnobValue = setKnobValue;

function simulateSerialInput() {
  let keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "A", "B"];

  for (let i = 0; i < keys.length; i++) {
    const knobIndex = i;
    if (keyIsDown(keys[i].charCodeAt(0))) {
      const cardsListDiv = document.getElementById("cards-list");
      const rect = cardsListDiv.getBoundingClientRect();
      const relativeX = mouseX - rect.left;
      const rawValue = Math.floor(map(relativeX, 0, rect.width, 0, 1023));
      const value = Math.max(0, Math.min(rawValue, 1023));
      setKnobValue(knobIndex, value);
    }
  }
}

function updateSlotFills(elapsed) {
  const progress = Math.min(1.0, elapsed / HOLD_DURATION);
  const heightPercent = (progress * 100).toFixed(1) + "%";

  for (let i = 1; i <= 3; i++) {
    const fillEl = document.getElementById(`slot-progress-${i}`);
    const slotCard = document.getElementById(`slot-${i}`);

    if (fillEl) {
      fillEl.style.height = heightPercent;
    }

    if (slotCard) {
      if (progress > 0) {
        slotCard.classList.add("slot-charging");
      } else {
        slotCard.classList.remove("slot-charging");
      }
    }
  }
}

function startHold(source) {
  if (isGenerating) {
    const status = document.getElementById("status");
    if (status) status.innerText = "Generation in progress, please wait...";
    return;
  }

  const btn = document.getElementById("generate-btn");
  if (btn && btn.disabled) return;

  const selected = getSelectedCards();
  if (!selected || selected.length !== 3) {
    const status = document.getElementById("status");
    if (status) status.innerText = "Please select 3 cards before generating.";
    return;
  }

  const currentTime = Date.now();
  const timeSinceLastGenerate = currentTime - lastGenerateTime;
  if (timeSinceLastGenerate < DEBOUNCE_DURATION) {
    const remainingTime = Math.ceil(
      (DEBOUNCE_DURATION - timeSinceLastGenerate) / 1000
    );
    const status = document.getElementById("status");
    if (status)
      status.innerText = `Please wait ${remainingTime}s before generating again`;
    return;
  }

  if (isHolding) return;

  isHolding = true;
  holdSource = source;
  holdStartTime = Date.now();

  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.innerText = "Hold for 3 seconds to generate...";

  function animateHold() {
    if (!isHolding) return;

    const elapsed = Date.now() - holdStartTime;
    updateSlotFills(elapsed);

    if (elapsed >= HOLD_DURATION) {
      cancelHold(null, true);
      onGenerate().catch((error) => {
        console.error("Error in hold-triggered generation:", error);
      });
    } else {
      holdAnimFrame = requestAnimationFrame(animateHold);
    }
  }

  holdAnimFrame = requestAnimationFrame(animateHold);
}

function cancelHold(source, completed = false) {
  if (!isHolding) return;
  if (source !== null && holdSource !== source) return;

  isHolding = false;
  holdSource = null;

  if (holdAnimFrame) {
    cancelAnimationFrame(holdAnimFrame);
    holdAnimFrame = null;
  }

  // Reset all 3 slot progress fills to 0%
  for (let i = 1; i <= 3; i++) {
    const fillEl = document.getElementById(`slot-progress-${i}`);
    if (fillEl) {
      fillEl.style.height = "0%";
    }
    const slotCard = document.getElementById(`slot-${i}`);
    if (slotCard) {
      slotCard.classList.remove("slot-charging");
    }
  }

  const statusEl = document.getElementById("status");
  if (!completed && !isGenerating) {
    if (statusEl && statusEl.innerText.startsWith("Hold for 3 seconds")) {
      statusEl.innerText = "";
    }
  }
}

async function onGenerate(bypassDebounce = false) {
  let isSuccess = false;
  const selected = getSelectedCards();
  if (!selected || selected.length !== 3) {
    const status = document.getElementById("status");
    if (status) status.innerText = "Error: Please select exactly 3 cards before generating.";
    return false;
  }

  const currentTime = Date.now();
  const timeSinceLastGenerate = currentTime - lastGenerateTime;

  if (isGenerating) {
    return false;
  }

  if (!bypassDebounce && timeSinceLastGenerate < DEBOUNCE_DURATION) {
    const remainingTime = Math.ceil(
      (DEBOUNCE_DURATION - timeSinceLastGenerate) / 1000
    );
    const status = document.getElementById("status");
    if (status)
      status.innerText = `Please wait ${remainingTime}s before generating again`;
    return false;
  }

  isGenerating = true;
  wsClient.sendStateChange("GENERATING");
  updateApp1State("GENERATING");

  const btn = document.getElementById("generate-btn");
  const btnText = document.getElementById("generate-btn-text");
  const status = document.getElementById("status");
  const loadingOverlay = document.getElementById("loading-overlay");
  const generatedImg = document.getElementById("generated-img");

  if (btn) {
    btn.disabled = true;
    btn.setAttribute("data-generating", "true");
  }
  if (btnText) {
    btnText.textContent = "Generating...";
  } else if (btn) {
    btn.textContent = "Generating...";
  }
  if (status) status.innerText = "Generating...";

  soundEffects.playStartSound();

  if (loadingOverlay) {
    loadingOverlay.style.display = "flex";
    loadingAnimation.start();
  }
  if (generatedImg) generatedImg.style.display = "none";

  const processingLoop = setInterval(() => {
    soundEffects.playProcessingLoop(2);
  }, 2000);

  let baseCardId = getBaseCardId();

  if (!baseCardId && selected.length > 0) {
    baseCardId = selected[0].id;
  }

  try {
    const statusCallback = (msg) => {
      status.innerText = msg;
    };

    statusCallback("Génération de l'image...");
    const base64 = await generateImage(selected, baseCardId, statusCallback);

    clearInterval(processingLoop);
    loadingAnimation.stop();

    if (base64.startsWith("PROMPT:")) {
      const prompt = base64.substring(7);

      if (loadingOverlay) loadingOverlay.style.display = "none";

      const imgEl = document.getElementById("generated-img");
      if (imgEl) imgEl.style.display = "none";

      let promptDisplay = document.getElementById("prompt-display");
      if (!promptDisplay) {
        promptDisplay = document.createElement("div");
        promptDisplay.id = "prompt-display";
        promptDisplay.style.cssText = `
					max-width: 90%;
					max-height: 100%;
					overflow-y: auto;
					background: white;
					padding: 20px;
					border-radius: 12px;
					box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
					font-family: monospace;
					font-size: 14px;
					line-height: 1.6;
					text-align: left;
				`;
        const targetParent = document.getElementById("app2-content") || document.getElementById("app1-wrapper") || document.body;
        targetParent.appendChild(promptDisplay);
      }
      promptDisplay.textContent = prompt;
      promptDisplay.style.display = "block";

      statusCallback("DEBUG: Prompt affiché");
      lastGeneratedBase64 = null;
      isSuccess = true;
    } else {
      lastGeneratedBase64 = base64;

      await new Promise((resolve) => setTimeout(resolve, 500));
      soundEffects.playCompleteSound();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const dataUrl = "data:image/png;base64," + base64;
      const imgEl = document.getElementById("generated-img");
      if (imgEl) {
        imgEl.src = dataUrl;
        imgEl.style.display = "block";
      }

      const promptDisplay = document.getElementById("prompt-display");
      if (promptDisplay) promptDisplay.style.display = "none";

      if (loadingOverlay) loadingOverlay.style.display = "none";

      statusCallback("Envoi au serveur...");
      const uploadResult = await uploadHybridBase64(
        base64,
        selected,
        baseCardId,
        statusCallback
      );

      const hybridId = uploadResult && uploadResult.data && uploadResult.data.id ? uploadResult.data.id : null;
      if (hybridId) {
        updateDownloadQR(hybridId);
      }

      wsClient.sendHybridGenerated({
        base64: base64,
        id: hybridId,
        cards: selected,
        baseCardId: baseCardId,
      });
      syncBrainState("RESULT");

      statusCallback("Terminé!");
      isSuccess = true;
    }
  } catch (err) {
    clearInterval(processingLoop);
    loadingAnimation.stop();

    if (loadingOverlay) loadingOverlay.style.display = "none";
    status.innerText = "Error: " + err.message;
    console.error(err);
    isSuccess = false;
  } finally {
    isGenerating = false;
    lastGenerateTime = Date.now();
    resetInactivityTimer();
    if (btn) {
      btn.removeAttribute("data-generating");
      const selected = getSelectedCards();
      const count = selected ? selected.length : 0;
      const isReady = count === 3;
      btn.disabled = !isReady;
      const btnText = document.getElementById("generate-btn-text");
      if (btnText) {
        btnText.textContent = isReady ? "Hold 3s to Generate" : `Select 3 cards (${count}/3)`;
      } else {
        btn.textContent = isReady ? "Hold 3s to Generate" : `Select 3 cards (${count}/3)`;
      }
    }
  }

  return isSuccess;
}

/**
 * Dev Mode 10-card batch generation protocol:
 * Click button -> generate one image -> once received, shuffle the 3 selected cards -> generate next.
 * If error occurs, shuffle cards again and retry without counting towards 10 cards.
 */
async function runDevBatchGeneration() {
  if (isBatchGenerating) {
    return;
  }

  isBatchGenerating = true;
  const devBtn = document.getElementById("dev-batch-btn");
  const status = document.getElementById("status");

  if (devBtn) {
    devBtn.disabled = true;
  }

  const TARGET_CARDS = 10;
  let successCount = 0;

  // Make sure 3 cards are selected initially
  let selected = getSelectedCards();
  if (!selected || selected.length !== 3) {
    shuffleAllSlots();
  }

  while (successCount < TARGET_CARDS) {
    if (devBtn) {
      devBtn.textContent = `⚡ Batch ${successCount}/${TARGET_CARDS}...`;
    }
    if (status) {
      status.innerText = `[DEV MODE] Generating card ${successCount + 1}/${TARGET_CARDS}...`;
    }

    const success = await onGenerate(true);

    if (success) {
      successCount++;
      if (status) {
        status.innerText = `[DEV MODE] Card ${successCount}/${TARGET_CARDS} generated successfully!`;
      }
      if (successCount < TARGET_CARDS) {
        // Shuffle the 3 selected cards upon success and wait briefly
        shuffleAllSlots();
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    } else {
      if (status) {
        status.innerText = `[DEV MODE] Error on card generation. Shuffling cards and retrying (${successCount}/${TARGET_CARDS} completed)...`;
      }
      // If error occurs, shuffle cards again and retry without incrementing success count
      shuffleAllSlots();
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  isBatchGenerating = false;
  if (devBtn) {
    devBtn.disabled = false;
    devBtn.textContent = "⚡ Generate 10 Cards (Dev)";
  }
  if (status) {
    status.innerText = `[DEV MODE] Complete! ${TARGET_CARDS} cards successfully generated.`;
  }
  resetInactivityTimer();
}

let currentApp1State = "IDLE";
let userHasInteracted = false;
let inactivityTimer = null;
const PHASE_TIMEOUT_MS = 60000; // 1 minute per phase

export function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  // Do not run inactivity timers during active generation, dev batch generation, or in IDLE
  if (isGenerating || isBatchGenerating || currentApp1State === "IDLE") {
    return;
  }

  if (currentApp1State === "RESULT") {
    // 1 Minute in RESULT -> Auto-transition to EXPLORE
    inactivityTimer = setTimeout(() => {
      console.log("[App1 Controller] 1 minute in RESULT. Auto-transitioning to EXPLORE.");
      syncBrainState("EXPLORE");
    }, PHASE_TIMEOUT_MS);
  } else if (currentApp1State === "EXPLORE") {
    // 1 Minute in EXPLORE -> Auto-transition to IDLE
    inactivityTimer = setTimeout(() => {
      console.log("[App1 Controller] 1 minute in EXPLORE. Auto-returning to IDLE.");
      userHasInteracted = false;
      syncBrainState("IDLE");
    }, PHASE_TIMEOUT_MS);
  }
}

export function markUserInteracted() {
  if (!userHasInteracted || currentApp1State === "RESULT") {
    userHasInteracted = true;
    console.log("[App1 Controller] User interaction detected! Transitioning to EXPLORE.");
    syncBrainState("EXPLORE");
  } else {
    resetInactivityTimer();
  }
}

/**
 * Synchronize App 1 state and selected cards to WebSocket server & App 2
 */
export function syncBrainState(forcedState = null) {
  const selected = getSelectedCards();
  const baseId = getBaseCardId();

  let state = forcedState;
  if (!state) {
    if (isGenerating) {
      state = "GENERATING";
    } else if (!userHasInteracted) {
      state = "IDLE";
    } else {
      state = "EXPLORE";
    }
  }

  currentApp1State = state;
  updateApp1State(state);
  resetInactivityTimer();

  wsClient.sendCardsUpdated(selected, baseId);
  wsClient.sendStateChange(state, {
    selectedCards: selected,
    baseCardId: baseId,
  });
}

/**
 * Manage App 1 state views (IDLE overlay vs EXPLORE / GENERATING / RESULT)
 */
function updateApp1State(newState) {
  currentApp1State = newState;
  const idleOverlay = document.getElementById("app1-idle-overlay");
  const cardsContainer = document.getElementById("app1-cards-container");

  if (newState === "IDLE") {
    if (idleOverlay) idleOverlay.classList.add("active");
    if (cardsContainer) cardsContainer.classList.add("blurred");
  } else {
    if (idleOverlay) idleOverlay.classList.remove("active");
    if (cardsContainer) cardsContainer.classList.remove("blurred");
  }

  if (newState === "GENERATING") {
    if (cardsContainer) cardsContainer.classList.add("dimmed");
  } else {
    if (cardsContainer) cardsContainer.classList.remove("dimmed");
  }
}

