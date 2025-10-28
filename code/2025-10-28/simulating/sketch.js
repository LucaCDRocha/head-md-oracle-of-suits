const years = [1300, 1400, 1500, 1600, 1700, 1800, 1900];
const games = ["French", "Tarot", "Poker", "Jass"];
const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const cards = [
  "Ace",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "Jack",
  "Queen",
  "King",
];

let currentYear = years[0];
let currentGame = games[0];
let currentSuit = suits[0];
let currentCard = cards[0];

// Settings that control automatic card selection. Change these to alter behavior.
const settings = {
  mode: "auto", // "auto" or "manual". In manual mode the mouse bands control current values.
  numberOfCards: 3, // how many cards to pick in auto mode
  allowedSuits: [...suits], // subset of suits to allow (use suits array values)
  unique: true, // whether to sample without replacement
  seed: 12345, // seeded randomness for reproducibility
};

// chosenCards holds the result of selection when settings.mode === 'auto'
let chosenCards = [];
let _lastSettingsHash = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);

  // create vertical bands (one band per controlled element)
  const bandNames = ["Year", "Game", "Suit", "Card"];
  const bandCount = bandNames.length;
  const bandH = height / bandCount;
  const activeBand = constrain(floor(mouseY / bandH), 0, bandCount - 1);

  // draw bands and labels
  for (let i = 0; i < bandCount; i++) {
    if (i === activeBand) {
      fill(200, 220, 255); // highlight active band
      stroke(50, 100, 200);
      strokeWeight(2);
    } else {
      fill(240);
      stroke(200);
      strokeWeight(1);
    }
    rect(0, i * bandH, width, bandH);

    // band label
    noStroke();
    fill(50);
    textSize(14);
    textAlign(LEFT, TOP);
    text(
      `${bandNames[i]} band : ${eval(`current${bandNames[i]}`)}`,
      10,
      i * bandH + 8
    );
    // instruction
    textSize(12);
    textAlign(RIGHT, TOP);
    text("move mouseX to change", width - 10, i * bandH + 8);
  }

  // map mouseX to values only when cursor is in the corresponding band
  switch (activeBand) {
    case 0: {
      // Year band
      const yIdx = constrain(
        floor(map(mouseX, 0, width, 0, years.length)),
        0,
        years.length - 1
      );
      currentYear = years[yIdx];
      break;
    }
    case 1: {
      // Game band
      const gIdx = constrain(
        floor(map(mouseX, 0, width, 0, games.length)),
        0,
        games.length - 1
      );
      currentGame = games[gIdx];
      break;
    }
    case 2: {
      // Suit band
      const sIdx = constrain(
        floor(map(mouseX, 0, width, 0, suits.length)),
        0,
        suits.length - 1
      );
      currentSuit = suits[sIdx];
      break;
    }
    case 3: {
      // Card band
      const cIdx = constrain(
        floor(map(mouseX, 0, width, 0, cards.length)),
        0,
        cards.length - 1
      );
      currentCard = cards[cIdx];
      break;
    }
    default:
    // noop
  }

  // show an image depending of the suit
  // map full card names to short codes used in filenames (Ace -> A, Jack -> J, etc.)
  const shortCard =
    currentCard === "Ace"
      ? "A"
      : currentCard === "Jack"
      ? "J"
      : currentCard === "Queen"
      ? "Q"
      : currentCard === "King"
      ? "K"
      : currentCard; // numbers (2..10) stay as-is

  const suitPrefix =
    currentSuit === "Hearts"
      ? "H"
      : currentSuit === "Diamonds"
      ? "D"
      : currentSuit === "Clubs"
      ? "C"
      : currentSuit === "Spades"
      ? "S"
      : "";

  // images live in the folder "test-scan-cards"
  const dir = "test-scan-cards";
  const filename = `${dir}/${suitPrefix}${shortCard}.jpg`;

  // simple helper to map suit name to prefix (used for prefetch)
  const suitToPrefix = (s) =>
    s === "Hearts"
      ? "H"
      : s === "Diamonds"
      ? "D"
      : s === "Clubs"
      ? "C"
      : s === "Spades"
      ? "S"
      : "";

  // initialize global caches once
  window._imgCache = window._imgCache || {}; // filename -> p5.Image or null (failed)
  window._imgLoading = window._imgLoading || {}; // filename -> true while loading

  // start a one-time prefetch of all allowed suit/card images to make subsequent loads faster
  if (!window._imgPrefetchStarted) {
    window._imgPrefetchStarted = true;
    const allowed = settings.allowedSuits && settings.allowedSuits.length
      ? settings.allowedSuits
      : suits;
    allowed.forEach((s) => {
      const prefix = suitToPrefix(s);
      cards.forEach((c) => {
        const sc =
          c === "Ace"
            ? "A"
            : c === "Jack"
            ? "J"
            : c === "Queen"
            ? "Q"
            : c === "King"
            ? "K"
            : c;
        const fn = `${dir}/${prefix}${sc}.jpg`;
        if (!window._imgCache[fn] && !window._imgLoading[fn]) {
          window._imgLoading[fn] = true;
          // begin async load and store into cache when ready
          loadImage(
            fn,
            (img) => {
              window._imgCache[fn] = img;
              delete window._imgLoading[fn];
            },
            (err) => {
              console.warn("Failed to preload", fn, err);
              window._imgCache[fn] = null;
              delete window._imgLoading[fn];
            }
          );
        }
      });
    });
  }

  // use cached image if available, otherwise if not yet requested start a single load for this file
  let img = window._imgCache[filename];
  if (typeof img === "undefined" && !window._imgLoading[filename]) {
    // kick off on-demand load for the currently selected image
    window._imgLoading[filename] = true;
    loadImage(
      filename,
      (loaded) => {
        window._imgCache[filename] = loaded;
        delete window._imgLoading[filename];
      },
      (err) => {
        console.warn("Failed to load", filename, err);
        window._imgCache[filename] = null;
        delete window._imgLoading[filename];
      }
    );
  }

  img = window._imgCache[filename];

  // draw the img (centered) but scaled down to fit a fraction of the canvas
  if (img) {
    imageMode(CENTER);
    const maxPortionW = 0.6;
    const maxPortionH = 0.6;

    const imgW = img.width || width * 0.5;
    const imgH = img.height || height * 0.5;

    const maxW = width * maxPortionW;
    const maxH = height * maxPortionH;
    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    image(img, width / 2, height / 2, drawW, drawH);
  } else {
    // either loading or failed — give immediate feedback without calling loadImage repeatedly
    imageMode(CORNER);
    noStroke();
    fill(80);
    textAlign(CENTER, CENTER);
    textSize(16);
    const status = window._imgLoading[filename] ? "Loading" : "Missing";
    text(`${status}: ${filename}`, width / 2, height / 2);
  }
}
