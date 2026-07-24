import {
  initSlotSelector,
  getSelectedCards,
  getBaseCardId,
  drawPreview,
  handleKnobChange,
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
import { DEBUG } from "./config.js";
import soundEffects from "./src/audio/soundEffects.js";
import LoadingAnimation from "./src/ui/loadingAnimation.js";

let canvas;
let lastGeneratedBase64 = null;
let loadingAnimation = null;

// Generation & Hold state
let isGenerating = false;
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

  // Setup Arduino serial connection
  setupSerial();

  // Set callback for knob changes
  setKnobChangeCallback((knobValues) => {
    handleKnobChange(knobValues);
  });

  // Set callbacks for serial button press/release
  setButtonPressCallback(() => {
    startHold("serial");
  });
  setButtonReleaseCallback(() => {
    cancelHold("serial");
  });

  // Apply DEBUG mode visibility
  applyDebugMode();

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

  // Load cards using slot selector
  initSlotSelector();

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
};

/**
 * Apply DEBUG mode visibility settings
 * - Shows/hides knob values display
 * - Shows/hides selected area (generate button section)
 */
function applyDebugMode() {
  const knobValuesDisplay = document.getElementById("knob-values-display");
  if (knobValuesDisplay) {
    knobValuesDisplay.style.display = DEBUG ? "block" : "none";
  }

  const selectedArea = document.getElementById("selected-area");
  if (selectedArea) {
    selectedArea.style.display = DEBUG ? "block" : "none";
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

async function onGenerate() {
  const selected = getSelectedCards();
  if (!selected || selected.length !== 3) {
    const status = document.getElementById("status");
    if (status) status.innerText = "Error: Please select exactly 3 cards before generating.";
    return;
  }

  const currentTime = Date.now();
  const timeSinceLastGenerate = currentTime - lastGenerateTime;

  if (isGenerating) {
    return;
  }

  if (timeSinceLastGenerate < DEBOUNCE_DURATION) {
    const remainingTime = Math.ceil(
      (DEBOUNCE_DURATION - timeSinceLastGenerate) / 1000
    );
    const status = document.getElementById("status");
    if (status)
      status.innerText = `Please wait ${remainingTime}s before generating again`;
    return;
  }

  isGenerating = true;
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
					white-space: pre-wrap;
					text-align: left;
				`;
        document.getElementById("app2-content").appendChild(promptDisplay);
      }
      promptDisplay.textContent = prompt;
      promptDisplay.style.display = "block";

      statusCallback("DEBUG: Prompt affiché");
      lastGeneratedBase64 = null;
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

      if (uploadResult && uploadResult.data && uploadResult.data.id) {
        updateDownloadQR(uploadResult.data.id);
      }

      statusCallback("Terminé!");
    }
  } catch (err) {
    clearInterval(processingLoop);
    loadingAnimation.stop();

    if (loadingOverlay) loadingOverlay.style.display = "none";
    status.innerText = "Error: " + err.message;
    console.error(err);
  } finally {
    isGenerating = false;
    lastGenerateTime = Date.now();
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
}
