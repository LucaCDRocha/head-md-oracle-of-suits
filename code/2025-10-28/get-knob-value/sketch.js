let vals = [0, 0, 0];
let buttonPressed = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupSerial();
}

function draw() {
  background(220);
  textSize(16);
  fill(0);
  text(`v1 ${vals[0]}  v2 ${vals[1]}  v3 ${vals[2]}`, 20, 60);
  text(`Button: ${buttonPressed ? 'PRESSED' : 'NOT PRESSED'}`, 20, 90);

  noFill();
  
  // Change behavior based on button
  if (buttonPressed) {
    // Example: filled circles when button pressed
    fill(255, 100);
  }
  
  stroke(255, 0, 0);
  ellipse(width / 2, height / 2, vals[0], vals[0]);
  stroke(0, 255, 0);
  ellipse(width / 2, height / 2, vals[1], vals[1]);
  stroke(0, 0, 255);
  ellipse(width / 2, height / 2, vals[2], vals[2]);
}

