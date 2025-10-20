let things = [];

class Ripple {
  constructor(x, y, growth = random(1, 3)) {
    this.x = x;
    this.y = y;
    this.r = 0;                // current radius
    this.growth = growth;      // speed of expansion
    this.alpha = 200;          // opacity
    this.dead = false;
    this.maxR = max(windowWidth, windowHeight) * 1.2;
  }
  draw() {
    // expand and fade like a water ripple
    noFill();
    stroke(0, 100, 255, this.alpha);
    strokeWeight(4);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);

    // advance
    this.r += this.growth;
    this.alpha -= this.growth * 1.5;

    if (this.r > this.maxR || this.alpha <= 0) {
      this.dead = true;
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
  // draw and remove dead ripples
  for (let i = things.length - 1; i >= 0; i--) {
    things[i].draw();
    if (things[i].dead) things.splice(i, 1);
  }
}

// create ripples on click: several concentric rings (by creating a few ripples)
function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    // create 3 rings with slightly different growth and stroke
    things.push(new Ripple(mouseX, mouseY, 1.5));
    things.push(new Ripple(mouseX, mouseY, 2));
    things.push(new Ripple(mouseX, mouseY, 2.5));
  }
}
