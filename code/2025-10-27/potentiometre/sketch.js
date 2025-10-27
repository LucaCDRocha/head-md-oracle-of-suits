let vals = [0, 0, 0];

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupSerial();
}

function draw() {
  background(220);
  textSize(16);
  fill(0);
  text(`v1 ${vals[0]}  v2 ${vals[1]}  v3 ${vals[2]}`, 20, 60);

  // no fill
  noFill();
  // draw 3 circles with radii based on vals
  stroke(255, 0, 0);
  ellipse(width / 2, height / 2, vals[0], vals[0]);
  stroke(0, 255, 0);
  ellipse(width / 2, height / 2, vals[1], vals[1]);
  stroke(0, 0, 255);
  ellipse(width / 2, height / 2, vals[2], vals[2]);
}

