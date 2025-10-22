
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

  // make sure we have detections to draw
  if (detections) {

    // for each detected hand
    for (let hand of detections.multiHandLandmarks) {
      // get the index tip
      let indexTip = hand[FINGER_TIPS.index];
      // get the thumb tip
      let thumbTip = hand[FINGER_TIPS.thumb];
      // draw a line between index and thumb tips
      stroke(0, 255, 255);
      strokeWeight(4);
      line(indexTip.x * videoElement.width, indexTip.y * videoElement.height,
           thumbTip.x * videoElement.width, thumbTip.y * videoElement.height);
    }
  }
}
