// removed persistent fingertip trail; implement magnetic grid instead
let grid = [];
let gridSpacing = 20; // spacing between grid points
let influenceRadius = 200; // how far the finger influences the grid
let maxForce = 10000; // strength of repulsion (tweak as needed)
let damping = 0.85; // damping applied to velocity each frame
let spring = 0.12; // spring force back to origin

function setup() {
  // full window canvas
  createCanvas(windowWidth, windowHeight);
  // create grid
  buildGrid();

  // initialize MediaPipe settings
  setupHands();
  // start camera using MediaPipeHands.js helper
  setupVideo();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buildGrid();
}

// populate the grid array with nodes that have position, origin and velocity
function buildGrid() {
  grid = [];
  // offset to center points nicely
  const startY = gridSpacing / 2;
  const startX = gridSpacing / 2;
  for (let y = startY; y < height; y += gridSpacing) {
    for (let x = startX; x < width; x += gridSpacing) {
      grid.push({
        ox: x,
        oy: y,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
      });
    }
  }
}

function draw() {
  // clear the canvas
  background(255);

  // if the video connection is ready
  if (isVideoReady()) {
    // draw the capture image
    // image(videoElement, 0, 0);
  }

  // use thicker lines for drawing hand connections
  strokeWeight(2);

  // make sure we have detections to draw
  if (detections) {
    // for each detected hand
    for (let hand of detections.multiHandLandmarks) {
      // draw the index finger
      drawIndex(hand);

      // draw the thumb finger
      // drawThumb(hand);

      // draw fingertip points
      // drawTips(hand);

      // draw connections
      // drawConnections(hand);

      // draw all landmarks
      // drawLandmarks(hand);
    } // end of hands loop
  } // end of if detections

  // compute index fingertip position (use first detected hand if present)
  let indexPos = null;
  if (detections && detections.multiHandLandmarks.length > 0) {
    const hand = detections.multiHandLandmarks[0];
    const mark = hand[FINGER_TIPS.index];
    if (mark) {
      indexPos = {
        x: mark.x * videoElement.width,
        y: mark.y * videoElement.height,
      };
    }
  }

  // update grid physics: apply repulsive force from finger, spring back to origin, damping
  for (let p of grid) {
    // vector from finger to point
    if (indexPos) {
      let dx = p.x - indexPos.x;
      let dy = p.y - indexPos.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < influenceRadius * influenceRadius && d2 > 0.001) {
        // inverse-square style force with falloff, but clamped
        let force = maxForce / d2;
        // direction normalized
        let d = sqrt(d2);
        let nx = dx / d;
        let ny = dy / d;
        p.vx += nx * force;
        p.vy += ny * force;
      }
    }

    // spring back to original position
    let sx = (p.ox - p.x) * spring;
    let sy = (p.oy - p.y) * spring;
    p.vx += sx;
    p.vy += sy;

    // apply velocity and damping
    p.x += p.vx * (deltaTime / 16.666); // scale by frame time (approx 60fps)
    p.y += p.vy * (deltaTime / 16.666);
    p.vx *= damping;
    p.vy *= damping;
  }

  // draw grid points
  noStroke();
  fill(30, 120, 200, 220);
  for (let p of grid) {
    circle(p.x, p.y, 6);
  }
} // end of draw

// only the index finger tip landmark
function drawIndex(landmarks) {
  // get the index fingertip landmark
  let mark = landmarks[FINGER_TIPS.index];

  noStroke();
  // set fill color for index fingertip
  fill(200, 25, 25);

  // adapt the coordinates (0..1) to video coordinates
  let x = mark.x * videoElement.width;
  let y = mark.y * videoElement.height;
  circle(x, y, 20);
}

// draw the thumb finger tip landmark
function drawThumb(landmarks) {
  // get the thumb fingertip landmark
  let mark = landmarks[FINGER_TIPS.thumb];

  noStroke();
  // set fill color for thumb fingertip
  fill(255, 255, 0);

  // adapt the coordinates (0..1) to video coordinates
  let x = mark.x * videoElement.width;
  let y = mark.y * videoElement.height;
  circle(x, y, 20);
}

function drawTips(landmarks) {
  noStroke();
  // set fill color for fingertips
  fill(0, 0, 255);

  // fingertip indices
  const tips = [4, 8, 12, 16, 20];

  for (let tipIndex of tips) {
    let mark = landmarks[tipIndex];
    // adapt the coordinates (0..1) to video coordinates
    let x = mark.x * videoElement.width;
    let y = mark.y * videoElement.height;
    circle(x, y, 10);
  }
}

function drawLandmarks(landmarks) {
  noStroke();
  // set fill color for landmarks
  fill(255, 0, 0);

  for (let mark of landmarks) {
    // adapt the coordinates (0..1) to video coordinates
    let x = mark.x * videoElement.width;
    let y = mark.y * videoElement.height;
    circle(x, y, 6);
  }
}

function drawConnections(landmarks) {
  // set stroke color for connections
  stroke(0, 255, 0);

  // iterate through each connection
  for (let connection of HAND_CONNECTIONS) {
    // get the two landmarks to connect
    const a = landmarks[connection[0]];
    const b = landmarks[connection[1]];
    // skip if either landmark is missing
    if (!a || !b) continue;
    // landmarks are normalized [0..1], (x,y) with origin top-left
    let ax = a.x * videoElement.width;
    let ay = a.y * videoElement.height;
    let bx = b.x * videoElement.width;
    let by = b.y * videoElement.height;
    line(ax, ay, bx, by);
  }
}
