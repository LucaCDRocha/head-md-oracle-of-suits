// create an empty array
const values = [];

function setup() {
  // fit to window
  createCanvas(windowWidth, windowHeight);
  // fill the array with 100 random values between 0 and height
  for (let i = 0; i < 100; i++) {
    values.push(random(height));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);

  // make the array values change like a wave but keep the start value
  // for (let i = 1; i < values.length; i++) {
  //   values[i] = values[i] + sin(frameCount * 0.05 + i * 0.1) * 2;
  // }

  for (let i = 0; i < values.length; i++) {
    values[i] = height / 3 + (height / 10) * sin(frameCount * 0.02 + i * 10);
  }

  // draw the values as bars around a circle in the middle of the canvas with the bottom of the bars pointing outwards
  translate(width / 2, height / 2);
  const radius = 50;
  const angleStep = TWO_PI / values.length;
  for (let i = 0; i < values.length; i++) {
    const angle = i * angleStep;
    const x = cos(angle) * radius;
    const y = sin(angle) * radius;
    // Constrain so the bars do not cross the circle inward
    const len = constrain(values[i], 0, height - radius);
    push();
    translate(x, y);
    rotate(angle + HALF_PI);
    rect(0, 0, 5, -len);
    pop();
  }
}
