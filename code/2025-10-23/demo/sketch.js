// the blendshapes we are going to track
let leftEyeBlink = 0.0;
let rightEyeBlink = 0.0;
let jawOpen = 0.0;
let backgroundColor = [0, 100, 50];
let particles = [];

function setup() {
  // full window canvas
  createCanvas(windowWidth, windowHeight);
  // initialize MediaPipe
  setupFace();
  setupVideo();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // get detected faces
  let faces = getFaceLandmarks();

  // see blendshapes.txt for full list of possible blendshapes
  leftEyeBlink = getBlendshapeScore("eyeBlinkLeft");
  rightEyeBlink = getBlendshapeScore("eyeBlinkRight");
  jawOpen = getBlendshapeScore("jawOpen");

  // if we blick with both eye it change the color but make it in hsl
  if (leftEyeBlink > 0.5 && rightEyeBlink > 0.5) {
    backgroundColor = [
      backgroundColor[0] + 10 <= 360 ? backgroundColor[0] + 10 : 0,
      100,
      50,
    ];
  }

  // set background color
  colorMode(HSL);
  background(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
  colorMode(RGB);

  // compute complementary HSL (h + 180) and convert to RGB
  const [h, s, l] = backgroundColor;
  const compH = (h + 180) % 360;
  const sr = s / 100;
  const lr = l / 100;

  const compRGB = hslToRgb(compH, sr, lr);

  // update & draw particles
  updateAndDrawMouthParticles(compRGB);
  drawMouth(compRGB);

  // when the mouth is open fire fire from the mouth
  if (jawOpen > 0.005) {

    // from this mouth fire particles like a dragon
    const mouth = getFeatureRings("FACE_LANDMARKS_LIPS");
    if (mouth) {
      const innerLip = mouth[1];
      // get center of inner lip
      let centerX = 0;
      let centerY = 0;
      innerLip.forEach((p) => {
        centerX += p.x;
        centerY += p.y;
      });
      centerX /= innerLip.length;
      centerY /= innerLip.length;

      // derive emission direction from top->bottom of inner lip (accounts for tilt)
      let top = innerLip[0];
      let bottom = innerLip[0];
      innerLip.forEach((p) => {
        if (p.y < top.y) top = p;
        if (p.y > bottom.y) bottom = p;
      });
      const baseAngle = Math.atan2(bottom.y - top.y, bottom.x - top.x);

      // spawn particles based on jawOpen
      const numNew = Math.floor(map(jawOpen, 0.2, 1, 2, 30, true));
      if (numNew > 0)
        spawnMouthParticles(centerX, centerY, baseAngle, jawOpen, numNew);
    }
  }

  // draw the leftEyeBlink value in text at the bottom of the screen
  // fill(255);
  // textSize(20);
  // textAlign(LEFT, BOTTOM);
  // text("Left Eye Blink: " + nf(leftEyeBlink, 1, 2), 10, height - 10);
  // text("Right Eye Blink: " + nf(rightEyeBlink, 1, 2), 10, height - 50);
  // text("Jaw Open: " + nf(jawOpen, 1, 2), 10, height - 90);
  
  // add a little camera return in the corner bottom
  if (isVideoReady()) {
    // draw a smaller video preview in the bottom-left corner
    const margin = 12;
    const maxW = 320;
    const maxH = 240;
    // try to get real video aspect, fallback to 4:3
    const vidW = videoElement.videoWidth || videoElement.width || 640;
    const vidH = videoElement.videoHeight || videoElement.height || 480;
    const aspect = vidW / vidH;

    // size the thumbnail relative to canvas but capped
    let thumbW = Math.min(maxW, width * 0.22);
    let thumbH = thumbW / aspect;
    if (thumbH > maxH) {
      thumbH = maxH;
      thumbW = thumbH * aspect;
    }

    const x = margin;
    const y = height - thumbH - margin;

    push();
    // subtle border + rounded corner
    stroke(255, 200);
    strokeWeight(2);
    noFill();
    rect(x - 4, y - 4, thumbW + 8, thumbH + 8, 8);

    // draw the video scaled into the thumbnail
    image(videoElement, x, y, thumbW, thumbH);
    pop();
  }
}

function drawMouth(col = [255, 165, 0]) {
  const mouth = getFeatureRings("FACE_LANDMARKS_LIPS");
  if (!mouth) return;

  const [outerLip, innerLip] = mouth;

  // set stroke + semi-transparent fill for lips
  if (Array.isArray(col)) {
    const [r, g, b, a] = col;
    fill(r, g, b, a ?? 64);
    stroke(r, g, b);
  } else {
    fill(col);
    stroke(col);
  }

  // outer lip with inner hole
  beginShape();
  outerLip.forEach((p) => vertex(p.x, p.y));
  beginContour();
  for (let i = innerLip.length - 1; i >= 0; i--) {
    const p = innerLip[i];
    vertex(p.x, p.y);
  }
  endContour();
  endShape(CLOSE);

  // fill inner mouth solid
  if (Array.isArray(col)) {
    const [r, g, b] = col;
    fill(r, g, b, 255);
  } else {
    fill(col);
  }
  beginShape();
  innerLip.forEach((p) => vertex(p.x, p.y));
  endShape(CLOSE);
}
// --- Utility: convert HSL to RGB (0..255) ---
function hslToRgb(hDeg, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = hDeg / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (0 <= hh && hh < 1) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (1 <= hh && hh < 2) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (2 <= hh && hh < 3) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (3 <= hh && hh < 4) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (4 <= hh && hh < 5) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else if (5 <= hh && hh < 6) {
    r1 = c;
    g1 = 0;
    b1 = x;
  }
  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return [r, g, b];
}

// --- Mouth particle helpers ---
function ensureMouthParticlesInit() {
  if (!window.mouthParticles) window.mouthParticles = [];
}

function spawnMouthParticles(
  centerX,
  centerY,
  baseAngle,
  jawOpen,
  count,
  sizeRange = [4, 12],
  lifeRange = [30, 80]
) {
  ensureMouthParticlesInit();
  for (let i = 0; i < count; i++) {
    const spread = random(-PI / 10, PI / 10);
    const angle = baseAngle + spread;
    const speed = random(4, 12) * (0.8 + jawOpen);
    const vx = -Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = random(sizeRange[0], sizeRange[1]);
    const life = Math.floor(random(lifeRange[0], lifeRange[1]));

    window.mouthParticles.push({
      x: centerX,
      y: centerY,
      vx,
      vy,
      size,
      life,
      maxLife: life,
    });
  }
}

function updateAndDrawMouthParticles(compRGB) {
  ensureMouthParticlesInit();
  noStroke();
  for (let i = window.mouthParticles.length - 1; i >= 0; i--) {
    const p = window.mouthParticles[i];

    // simple physics
    p.vy += 0.25; // gravity/falloff
    p.vx *= 0.995; // slight air drag
    p.vy *= 0.995;
    p.x += p.vx;
    p.y += p.vy;

    p.life--;
    const alpha = Math.max(0, (p.life / p.maxLife) * 255);

    fill(compRGB[0], compRGB[1], compRGB[2], alpha);
    circle(p.x, p.y, p.size);

    // remove dead or off-screen particles
    if (
      p.life <= 0 ||
      p.x < -50 ||
      p.x > width + 50 ||
      p.y < -50 ||
      p.y > height + 50
    ) {
      window.mouthParticles.splice(i, 1);
    }
  }
}
