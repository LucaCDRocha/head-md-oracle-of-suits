// create a ocsiation for making sound
let osc;
// store left-hand control values so right hand can trigger using them
let leftControl = { freq: 440, amp: 0 };
// simple state to know if sound is currently triggered by right hand
let rightTriggering = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // setup MediaPipe Hands
  setupHands();
  setupVideo();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // clear the canvas
  background(255);

  // if the video connection is ready
  if (isVideoReady()) {
    // draw the capture image
    image(videoElement, 0, 0);
  }

  // make sure we have detections to draw and that the landmarks array exists
  if (
    detections &&
    detections.multiHandLandmarks &&
    detections.multiHandLandmarks.length > 0
  ) {
    // reset visual hint
    let leftSeen = false;
    let rightSeen = false;

    // fall back to canvas size if videoElement dimensions aren't ready yet
    const vw = (videoElement && videoElement.width) || width;
    const vh = (videoElement && videoElement.height) || height;

    // iterate with index to keep handedness in sync
    for (
      let handIndex = 0;
      handIndex < detections.multiHandLandmarks.length;
      handIndex++
    ) {
      const hand = detections.multiHandLandmarks[handIndex];
      if (!hand) continue;

      // get handedness safely
      let handedness = null;
      if (
        detections.multiHandedness &&
        detections.multiHandedness[handIndex] &&
        detections.multiHandedness[handIndex].classification &&
        detections.multiHandedness[handIndex].classification[0]
      ) {
        handedness =
          detections.multiHandedness[handIndex].classification[0].label; // "Left" or "Right"
      }

      // get the index and thumb tips; if missing, skip this hand frame
      const indexTip = hand[FINGER_TIPS.index];
      const thumbTip = hand[FINGER_TIPS.thumb];
      if (!indexTip || !thumbTip) continue;

      // If handedness wasn't provided, infer it from the horizontal position on screen
      // (hands on left half => 'Left', right half => 'Right'). This is a simple fallback
      // and may be inverted if your capture is mirrored; tweak as needed.
      if (!handedness) {
        const handCenterX = ((indexTip.x + thumbTip.x) / 2) * vw;
        const midX = vw / 2;
        handedness = handCenterX < midX ? "Left" : "Right";
      }

      // compute pixel positions for convenience
      const ix = indexTip.x * vw;
      const iy = indexTip.y * vh;
      const tx = thumbTip.x * vw;
      const ty = thumbTip.y * vh;

      // draw a line between index and thumb tips and change its color with distance and weight based on direction
      const d = getDistance(ix, iy, tx, ty);
      const dir = getDirectionVector(ix, iy, tx, ty);
      const col = map(d, 0, 200, 0, 255);
      stroke(col, 0, 255 - col);
      strokeWeight(map(dir.x, 1, -1, 1, 100));
      line(ix, iy, tx, ty);

      // make frequency based on distance and amplitude based on direction
      const freq = map(d, 0, 200, 200, 1000);
      // map direction (-1..1) to amplitude (0..1) and constrain
      const amp = constrain(map(dir.x, -1, 1, 1, 0), 0, 1);

      // If this is the left hand, store its control values (frequency and amplitude)
      if (handedness === "Left") {
        leftSeen = true;
        leftControl.freq = freq;
        leftControl.amp = amp;
        // draw a marker for left hand
        noFill();
        stroke(0, 200, 0);
        strokeWeight(4);
        ellipse(ix, iy, 24);
      }

      // If this is the right hand, check for pinch (thumb+index close) to trigger sound
      if (handedness === "Right") {
        rightSeen = true;
        // detect pinch by small distance threshold (in pixels)
        const PINCH_THRESHOLD = 40; // tweakable
        const isPinched = d < PINCH_THRESHOLD;

        // show pinch visual
        if (isPinched) {
          stroke(255, 0, 0);
          strokeWeight(6);
          point((ix + tx) / 2, (iy + ty) / 2);
        }

        // manage triggering state: when pinched start sound using leftControl values; when released stop
        if (isPinched && !rightTriggering) {
          // start or update oscillator with left-hand values
          if (!osc) {
            // try to resume audio context (some browsers block audio until a user gesture)
            try {
              if (typeof getAudioContext === "function") {
                const ac = getAudioContext();
                if (ac && ac.state !== "running" && ac.resume) ac.resume();
              }
            } catch (e) {
              // ignore
            }
            osc = new p5.Oscillator("sine");
            osc.start();
            osc.amp(0);
          }
          osc.freq(leftControl.freq);
          osc.amp(leftControl.amp, 0.05);
          rightTriggering = true;
        } else if (!isPinched && rightTriggering) {
          // release
          if (osc) {
            osc.amp(0, 0.2);
            // keep osc reference in case another pinch happens; do not stop immediately
          }
          rightTriggering = false;
        } else if (isPinched && rightTriggering) {
          // still pinched: keep updating frequency/amp from leftControl for expressive control
          if (osc) {
            osc.freq(leftControl.freq);
            osc.amp(leftControl.amp, 0.05);
          }
        }
      }
    }
  } else {
    // no hands detected: ensure sound is stopped and reset triggering state
    if (osc) {
      osc.amp(0, 0.5);
      try {
        osc.stop(0.5);
      } catch (e) {
        // some browsers/contexts may throw if oscillator already stopped
      }
      osc = null;
    }
    rightTriggering = false;
  }
}

// make a function to get the distance between two points
function getDistance(x1, y1, x2, y2) {
  return dist(x1, y1, x2, y2);
}

// create a function to get the direction vector between two points
function getDirectionVector(x1, y1, x2, y2) {
  let angle = atan2(y2 - y1, x2 - x1);
  return createVector(cos(angle), sin(angle));
}
