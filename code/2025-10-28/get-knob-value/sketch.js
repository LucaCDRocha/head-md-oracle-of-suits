let REPLICATE_API_KEY = 'your-replicate-token'; // Get from https://replicate.com/

async function generateHybridImage() {
  isGenerating = true;
  
  let prompt = `Fusion of ${hybridCard.rank} ${hybridCard.suit} playing card, 
    ${hybridCard.game} style from ${hybridCard.year}, 
    surreal artistic hybrid design, detailed vintage card illustration`;
  
  try {
    // Start prediction
    let response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "stability-ai/sdxl model version here",
        input: {
          prompt: prompt,
          width: 768,
          height: 1024
        }
      })
    });
    
    let prediction = await response.json();
    
    // Poll for result
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      let statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_KEY}` }
      });
      prediction = await statusResponse.json();
    }
    
    if (prediction.output) {
      generatedCardImage = loadImage(prediction.output[0]);
    }
  } catch (error) {
    console.error('Generation failed:', error);
  }
  
  isGenerating = false;
}

let vals = [0, 0, 0];
let buttonPressed = false;

// Card data
let games = ['French', 'Italian', 'Spanish', 'German', 'Swiss'];
let suits = {
  'French': ['Hearts', 'Diamonds', 'Clubs', 'Spades'],
  'Italian': ['Cups', 'Coins', 'Swords', 'Batons'],
  'Spanish': ['Copas', 'Oros', 'Espadas', 'Bastos'],
  'German': ['Hearts', 'Bells', 'Acorns', 'Leaves'],
  'Swiss': ['Roses', 'Bells', 'Acorns', 'Shields']
};
let ranks = {
  'French': ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
  'Italian': ['1', '2', '3', '4', '5', '6', '7', 'Fante', 'Cavallo', 'Re'],
  'Spanish': ['1', '2', '3', '4', '5', '6', '7', 'Sota', 'Caballo', 'Rey'],
  'German': ['7', '8', '9', '10', 'Unter', 'Ober', 'König', 'Ass'],
  'Swiss': ['6', '7', '8', '9', '10', 'Unter', 'Ober', 'König', 'Ass']
};
let years = [1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];

// Card images storage
let cardImages = {};

// Three cards state - each card stores its selections independently
let cards = [
  { year: 4, game: 0, suit: 0, rank: 0 },  // Default to middle year
  { year: 4, game: 0, suit: 1, rank: 5 },  // Different defaults
  { year: 4, game: 0, suit: 2, rank: 10 }
];

// Active card selection (which card is being controlled by physical knobs)
let activeCardIndex = 0;

// Store knob positions when switching cards (to detect actual movement)
let lastKnobValues = [0, 0, 0];
let knobsInitialized = false;

let hybridCard = null;
let glitchEffect = 0;
let imagesLoaded = false;

// Animation variables
let scanlineY = 0;
let dataStreamOffset = 0;

// Button positions for card selection
let selectButtons = [];

function preload() {
  // Load all French deck cards
  let suitCodes = { 'Hearts': 'H', 'Diamonds': 'D', 'Clubs': 'C', 'Spades': 'S' };
  let rankCodes = { 'A': 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', 
                    '7': '7', '8': '8', '9': '9', '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K' };
  
  for (let suitName in suitCodes) {
    for (let rankName in rankCodes) {
      let filename = rankCodes[rankName] + suitCodes[suitName] + '.png';
      let key = rankName + '_' + suitName;
      try {
        cardImages[key] = loadImage('Classic Cards/' + filename);
      } catch(e) {
        console.log('Could not load: ' + filename);
      }
    }
  }
  imagesLoaded = true;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupSerial();
}

function draw() {
  // Industrial dark background
  background(15, 18, 22);
  
  // Draw control panel background
  drawControlPanel();
  
  // Animated scanline
  scanlineY = (scanlineY + 2) % height;
  dataStreamOffset += 0.5;
  
  // Initialize knob tracking on first frame
  if (!knobsInitialized) {
    lastKnobValues = [vals[0], vals[1], vals[2]];
    knobsInitialized = true;
  }
  
  // Only update card if knobs have actually moved since last check
  let threshold = 5; // Minimum movement to register change
  
  if (abs(vals[0] - lastKnobValues[0]) > threshold) {
    let newYear = floor(map(vals[0], 0, 1023, 0, years.length));
    newYear = constrain(newYear, 0, years.length - 1);
    cards[activeCardIndex].year = newYear;
    lastKnobValues[0] = vals[0];
  }
  
  if (abs(vals[1] - lastKnobValues[1]) > threshold) {
    let newGame = floor(map(vals[1], 0, 1023, 0, games.length));
    newGame = constrain(newGame, 0, games.length - 1);
    cards[activeCardIndex].game = newGame;
    lastKnobValues[1] = vals[1];
  }
  
  if (abs(vals[2] - lastKnobValues[2]) > threshold) {
    let newSuit = floor(map(vals[2], 0, 1023, 0, 4));
    newSuit = constrain(newSuit, 0, 3);
    cards[activeCardIndex].suit = newSuit;
    lastKnobValues[2] = vals[2];
  }
  
  // Update rank (simulated 4th knob - always updates)
  let gameName = games[cards[activeCardIndex].game];
  let newRank = floor(map(512, 0, 1023, 0, ranks[gameName].length));
  newRank = constrain(newRank, 0, ranks[gameName].length - 1);
  cards[activeCardIndex].rank = newRank;
  
  // Draw main interface panels
  drawDataStream();
  
  // Draw three card slots
  let cardSpacing = 350;
  let startX = width / 2 - cardSpacing;
  
  for (let i = 0; i < 3; i++) {
    push();
    translate(startX + i * cardSpacing, height / 2 - 120);
    let card = cards[i];
    let cardGameName = games[card.game];
    let suitName = suits[cardGameName][card.suit];
    let rankName = ranks[cardGameName][card.rank];
    drawCardSlot(years[card.year], cardGameName, suitName, rankName, false, i);
    pop();
  }
  
  // Draw control knobs
  drawAllKnobIndicators();
  
  // Draw card selection buttons
  drawCardSelectionButtons();
  
  // Handle button press for hybrid merge
  if (buttonPressed) {
    glitchEffect = min(glitchEffect + 0.1, 1);
    if (!hybridCard) {
      createHybrid();
    }
    drawHybridEffect();
  } else {
    glitchEffect = max(glitchEffect - 0.05, 0);
    hybridCard = null;
  }
  
  // Draw header
  drawHeader();
  
  // Draw status indicators
  drawStatusBar();
}

function drawControlPanel() {
  // Metal panel texture with rivets
  fill(25, 28, 32);
  noStroke();
  rect(0, 0, width, height);
  
  // Panel sections with beveled edges
  stroke(40, 45, 50);
  strokeWeight(2);
  noFill();
  
  // Main card display panel
  rect(width/2 - 550, 120, 1100, 400);
  
  // Inner bevel
  stroke(60, 65, 70);
  strokeWeight(1);
  rect(width/2 - 545, 125, 1090, 390);
  
  // Control panel bottom section
  stroke(40, 45, 50);
  strokeWeight(2);
  rect(width/2 - 550, 540, 1100, 180);
  
  // Draw rivets in corners
  drawRivet(width/2 - 540, 130);
  drawRivet(width/2 + 540, 130);
  drawRivet(width/2 - 540, 510);
  drawRivet(width/2 + 540, 510);
  
  // Vent slits on sides
  drawVentSlits(50, height/2, 5);
  drawVentSlits(width - 70, height/2, 5);
}

function drawRivet(x, y) {
  fill(50, 55, 60);
  noStroke();
  circle(x, y, 8);
  fill(30, 35, 40);
  circle(x - 1, y - 1, 6);
}

function drawVentSlits(x, y, count) {
  stroke(35, 40, 45);
  strokeWeight(3);
  for (let i = 0; i < count; i++) {
    line(x, y - 40 + i * 20, x + 15, y - 40 + i * 20);
  }
}

function drawHeader() {
  // Header panel
  fill(30, 35, 40);
  noStroke();
  rect(0, 0, width, 100);
  
  // Title with industrial font style
  fill(200, 180, 120); // Amber/gold color
  textAlign(CENTER);
  textSize(32);
  textStyle(BOLD);
  text('◢ ORACLE OF SUITS ◣', width / 2, 45);
  
  // Subtitle
  fill(150, 140, 110);
  textSize(12);
  textStyle(NORMAL);
  text('CARD SYNTHESIS TERMINAL v2.3', width / 2, 70);
  
  // Warning stripes
  fill(200, 180, 60, 100);
  for (let i = 0; i < 10; i++) {
    rect(i * 60, 90, 30, 10);
  }
}

function drawDataStream() {
  // Scrolling data effect on left side
  fill(100, 180, 120, 50);
  textAlign(LEFT);
  textSize(8);
  for (let i = 0; i < 30; i++) {
    let y = ((i * 20 + dataStreamOffset) % height);
    text('█ SYNC ' + floor(random(1000, 9999)), 15, y);
  }
}

function drawCardSlot(year, game, suit, rank, isHybrid, cardIndex) {
  let cardWidth = 200;
  let cardHeight = 280;
  
  // Highlight active card slot
  if (cardIndex === activeCardIndex) {
    fill(80, 180, 120, 30);
    noStroke();
    rect(-cardWidth/2 - 15, -cardHeight/2 - 15, cardWidth + 30, cardHeight + 30, 8);
  }
  
  // Card slot bezel (industrial frame)
  fill(35, 40, 45);
  noStroke();
  rect(-cardWidth/2 - 10, -cardHeight/2 - 10, cardWidth + 20, cardHeight + 20, 5);
  
  // Inner shadow
  fill(25, 30, 35);
  rect(-cardWidth/2 - 5, -cardHeight/2 - 5, cardWidth + 10, cardHeight + 10, 3);
  
  // Card display area
  fill(40, 45, 50);
  rect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 3);
  
  // Corner brackets - green if active
  let bracketColor = cardIndex === activeCardIndex ? color(80, 180, 120) : color(200, 180, 120);
  stroke(bracketColor);
  strokeWeight(2);
  noFill();
  let cornerSize = 15;
  // Top left
  line(-cardWidth/2, -cardHeight/2, -cardWidth/2 + cornerSize, -cardHeight/2);
  line(-cardWidth/2, -cardHeight/2, -cardWidth/2, -cardHeight/2 + cornerSize);
  // Top right
  line(cardWidth/2, -cardHeight/2, cardWidth/2 - cornerSize, -cardHeight/2);
  line(cardWidth/2, -cardHeight/2, cardWidth/2, -cardHeight/2 + cornerSize);
  // Bottom left
  line(-cardWidth/2, cardHeight/2, -cardWidth/2 + cornerSize, cardHeight/2);
  line(-cardWidth/2, cardHeight/2, -cardWidth/2, cardHeight/2 - cornerSize);
  // Bottom right
  line(cardWidth/2, cardHeight/2, cardWidth/2 - cornerSize, cardHeight/2);
  line(cardWidth/2, cardHeight/2, cardWidth/2, cardHeight/2 - cornerSize);
  
  // Try to display card image
  if (game === 'French' && imagesLoaded) {
    let imageKey = rank + '_' + suit;
    let cardImg = cardImages[imageKey];
    
    if (cardImg) {
      push();
      tint(255, 255);
      imageMode(CENTER);
      let imgWidth = cardWidth - 30;
      let imgHeight = cardHeight - 30;
      image(cardImg, 0, 0, imgWidth, imgHeight);
      pop();
      
      // Scanline overlay
      stroke(100, 180, 120, 30);
      strokeWeight(1);
      for (let i = -cardHeight/2; i < cardHeight/2; i += 3) {
        line(-cardWidth/2, i, cardWidth/2, i);
      }
    } else {
      drawCardFallback(year, game, suit, rank, cardWidth, cardHeight, cardIndex);
    }
  } else {
    drawCardFallback(year, game, suit, rank, cardWidth, cardHeight, cardIndex);
  }
  
  // Status LED - green if active
  let ledColor = cardIndex === activeCardIndex ? color(80, 180, 120) : 
                 (cardIndex === 0 ? color(180, 80, 80) : cardIndex === 1 ? color(80, 180, 120) : color(180, 160, 80));
  fill(ledColor);
  noStroke();
  circle(-cardWidth/2 + 15, -cardHeight/2 + 15, 8);
  fill(255, 255, 255, 150);
  circle(-cardWidth/2 + 14, -cardHeight/2 + 14, 4);
  
  // Card ID label
  fill(150, 140, 110);
  textAlign(CENTER);
  textSize(10);
  text(`SLOT-0${cardIndex + 1}`, 0, cardHeight/2 + 25);
  
  // Year and game display
  fill(200, 180, 120);
  textSize(9);
  text(`${year} | ${game.toUpperCase()}`, 0, cardHeight/2 + 40);
}

function drawCardFallback(year, game, suit, rank, cardWidth, cardHeight, cardIndex) {
  // Game name
  fill(150, 140, 110);
  textSize(10);
  textAlign(CENTER, CENTER);
  text(game.toUpperCase(), 0, -cardHeight/2 + 30);
  
  // Rank
  fill(200, 180, 120);
  textSize(70);
  text(rank, 0, -10);
  
  // Suit symbol
  textSize(35);
  let suitSymbol = getSuitSymbol(suit);
  fill(150, 140, 110);
  text(suitSymbol, 0, 40);
  
  // Suit name
  fill(120, 110, 90);
  textSize(14);
  text(suit, 0, 75);
  
  // Horizontal lines
  stroke(100, 180, 120, 50);
  strokeWeight(1);
  for (let i = -cardHeight/2 + 20; i < cardHeight/2 - 20; i += 5) {
    line(-cardWidth/2 + 20, i, cardWidth/2 - 20, i);
  }
}

function drawAllKnobIndicators() {
  let baseY = height / 2 + 280;
  let cardSpacing = 350;
  let startX = width / 2 - cardSpacing;
  
  for (let i = 0; i < 3; i++) {
    let x = startX + i * cardSpacing;
    let card = cards[i];
    let gameName = games[card.game];
    
    // Get current knob values
    // For active card: show actual Arduino knob positions
    // For inactive cards: show stored card values converted to knob positions
    let knobValues;
    if (i === activeCardIndex) {
      knobValues = [vals[0], vals[1], vals[2], 512];
    } else {
      // Convert card's stored values back to knob positions for display
      knobValues = [
        map(card.year, 0, years.length - 1, 0, 1023),
        map(card.game, 0, games.length - 1, 0, 1023),
        map(card.suit, 0, 3, 0, 1023),
        map(card.rank, 0, ranks[gameName].length - 1, 0, 1023)
      ];
    }
    
    drawCardKnobs(x, baseY, card, gameName, knobValues, i);
  }
}

function drawCardKnobs(centerX, baseY, card, gameName, knobValues, cardIndex) {
  let knobSpacing = 50;
  let startX = centerX - knobSpacing * 1.5;
  
  // Use green color for active card
  let knobColor = cardIndex === activeCardIndex ? color(80, 180, 120) :
                  (cardIndex === 0 ? color(180, 80, 80) : cardIndex === 1 ? color(80, 180, 120) : color(180, 160, 80));
  
  // Control labels above knobs
  fill(150, 140, 110);
  textSize(8);
  textAlign(CENTER);
  text('YEAR', startX, baseY - 45);
  text('GAME', startX + knobSpacing, baseY - 45);
  text('SUIT', startX + knobSpacing * 2, baseY - 45);
  text('RANK', startX + knobSpacing * 3, baseY - 45);
  
  // Draw knobs
  drawKnob(startX, baseY, years[card.year].toString().slice(2), knobValues[0], knobColor, 40);
  drawKnob(startX + knobSpacing, baseY, gameName.slice(0, 3).toUpperCase(), knobValues[1], knobColor, 40);
  drawKnob(startX + knobSpacing * 2, baseY, getSuitSymbol(suits[gameName][card.suit]), knobValues[2], knobColor, 40);
  drawKnob(startX + knobSpacing * 3, baseY, ranks[gameName][card.rank], knobValues[3], knobColor, 40);
}

function drawKnob(x, y, value, rawValue, knobColor, size) {
  push();
  translate(x, y);
  
  // Knob base
  fill(30, 35, 40);
  noStroke();
  circle(0, 0, size + 5);
  
  // Knob body
  fill(45, 50, 55);
  circle(0, 0, size);
  
  // Knob ring
  stroke(knobColor);
  strokeWeight(3);
  noFill();
  circle(0, 0, size - 4);
  
  // Indicator notches
  stroke(70, 75, 80);
  strokeWeight(2);
  for (let a = 0; a < TWO_PI; a += PI / 6) {
    let x1 = cos(a) * (size / 2 - 8);
    let y1 = sin(a) * (size / 2 - 8);
    let x2 = cos(a) * (size / 2 - 12);
    let y2 = sin(a) * (size / 2 - 12);
    line(x1, y1, x2, y2);
  }
  
  // Pointer
  let angle = map(rawValue, 0, 1023, -PI * 0.75, PI * 0.75);
  stroke(knobColor);
  strokeWeight(3);
  line(0, 0, cos(angle) * (size/2 - 8), sin(angle) * (size/2 - 8));
  
  // Center dot
  fill(knobColor);
  noStroke();
  circle(0, 0, 6);
  
  // Value display below
  fill(200, 180, 120);
  textAlign(CENTER);
  textSize(11);
  text(value, 0, size/2 + 18);
  
  pop();
}

function drawCardSelectionButtons() {
  selectButtons = []; // Reset button positions
  
  let baseY = height / 2 + 380;
  let cardSpacing = 350;
  let startX = width / 2 - cardSpacing;
  
  let buttonWidth = 120;
  let buttonHeight = 35;
  
  for (let i = 0; i < 3; i++) {
    let x = startX + i * cardSpacing;
    let isActive = i === activeCardIndex;
    
    // Store button bounds for click detection
    selectButtons.push({
      x: x - buttonWidth / 2,
      y: baseY - buttonHeight / 2,
      w: buttonWidth,
      h: buttonHeight,
      index: i
    });
    
    // Button background
    if (isActive) {
      fill(80, 180, 120);
    } else {
      fill(45, 50, 55);
    }
    
    // Check if mouse is hovering
    let isHovering = mouseX >= x - buttonWidth/2 && mouseX <= x + buttonWidth/2 &&
                     mouseY >= baseY - buttonHeight/2 && mouseY <= baseY + buttonHeight/2;
    
    if (!isActive && isHovering) {
      fill(60, 65, 70);
    }
    
    noStroke();
    rect(x - buttonWidth/2, baseY - buttonHeight/2, buttonWidth, buttonHeight, 5);
    
    // Button border
    stroke(isActive ? color(120, 220, 160) : color(70, 75, 80));
    strokeWeight(2);
    noFill();
    rect(x - buttonWidth/2, baseY - buttonHeight/2, buttonWidth, buttonHeight, 5);
    
    // Button text
    fill(isActive ? color(20, 30, 35) : color(200, 180, 120));
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(BOLD);
    text(isActive ? '● ACTIVE' : 'SELECT', x, baseY);
    textStyle(NORMAL);
  }
}

function mousePressed() {
  // Check if any select button was clicked
  for (let btn of selectButtons) {
    if (mouseX >= btn.x && mouseX <= btn.x + btn.w &&
        mouseY >= btn.y && mouseY <= btn.y + btn.h) {
      // Switch active card and snapshot current knob positions
      activeCardIndex = btn.index;
      // Save current knob positions so card doesn't change until knobs move
      lastKnobValues = [vals[0], vals[1], vals[2]];
      return;
    }
  }
}

function drawStatusBar() {
  // Status bar at bottom
  fill(30, 35, 40);
  noStroke();
  rect(0, height - 80, width, 80);
  
  // Status indicators
  fill(100, 180, 120);
  textAlign(LEFT);
  textSize(10);
  text('⬢ SYSTEM ONLINE', 30, height - 50);
  text(`⬢ ACTIVE CARD: SLOT-0${activeCardIndex + 1} | KNOBS: ${vals[0]} | ${vals[1]} | ${vals[2]}`, 30, height - 30);
  
  fill(buttonPressed ? color(180, 80, 80) : color(80, 80, 80));
  text(`◆ FUSION ${buttonPressed ? 'ACTIVE' : 'STANDBY'}`, 30, height - 10);
  
  // Right side info
  textAlign(RIGHT);
  fill(150, 140, 110);
  text('PRESS [SPACE] TO ACTIVATE FUSION | CLICK SELECT TO SWITCH CARDS', width - 30, height - 30);
}

function createHybrid() {
  let avgYear = floor((cards[0].year + cards[1].year + cards[2].year) / 3);
  let randomGame = games[cards[floor(random(3))].game];
  let randomSuit = floor(random(4));
  let randomRank = floor(random(ranks[randomGame].length));
  
  hybridCard = {
    year: years[avgYear],
    game: randomGame,
    suit: suits[randomGame][randomSuit],
    rank: ranks[randomGame][randomRank],
    timestamp: millis()
  };
}

function drawHybridEffect() {
  // Warning overlay
  fill(180, 80, 80, 50 * glitchEffect);
  noStroke();
  rect(0, 0, width, height);
  
  // Hybrid card display in top center
  push();
  translate(width / 2 + random(-3, 3) * glitchEffect, 80 + random(-3, 3) * glitchEffect);
  scale(0.7);
  
  // Glitch offset layers
  push();
  translate(-2 * glitchEffect, 0);
  tint(255, 200 * glitchEffect);
  drawCardSlot(hybridCard.year, hybridCard.game, hybridCard.suit, hybridCard.rank, true, -1);
  pop();
  
  blendMode(BLEND);
  pop();
  
  // Warning text
  fill(180, 80, 80);
  textAlign(CENTER);
  textSize(18);
  text('⚠ FUSION SEQUENCE ACTIVE ⚠', width / 2, 340);
  
  // Progress bar
  let progress = glitchEffect;
  fill(40, 45, 50);
  rect(width/2 - 150, 360, 300, 20);
  fill(180, 80, 80);
  rect(width/2 - 148, 362, 296 * progress, 16);
}

function getSuitSymbol(suit) {
  const symbols = {
    'Hearts': '♥', 'Diamonds': '♦', 'Clubs': '♣', 'Spades': '♠',
    'Cups': '⚱', 'Coins': '◉', 'Swords': '⚔', 'Batons': '▮',
    'Copas': '⚱', 'Oros': '◉', 'Espadas': '⚔', 'Bastos': '▮',
    'Bells': '🔔', 'Acorns': '◆', 'Leaves': '♣',
    'Roses': '✿', 'Shields': '◈'
  };
  return symbols[suit] || suit.slice(0, 1);
}

function getSuitColor(suit, game) {
  return color(150, 140, 110);
}

function keyPressed() {
  if (key === ' ') {
    buttonPressed = !buttonPressed;
  }
}


