let things = [];

class Thing {
  constructor(x, y) {
    this.x = x;
    this.y = y
  }
  draw() {
    // make the thing ripple and disapear like we tap on water
    let d = dist(mouseX, mouseY, this.x, this.y);
    let size = max(0, 100 - d);
    noStroke();
    fill(0, 100, 255, size * 2.5);
    ellipse(this.x, this.y, size, size);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // create a grid of  with a bit of random
    let spacing = 50;
    for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
            // jitter each grid point a bit and randomly skip some to break the regularity
            let jitter = spacing * 0.4;
            let rx = x + random(-jitter, jitter);
            let ry = y + random(-jitter, jitter);
            if (random() < 0.9) {
                things.push(new Thing(rx, ry));
            }
        }
    }

    // add some completely random things for extra variation
    for (let i = 0; i < 50; i++) {
        things.push(new Thing(random(width), random(height)));
    }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
  for (let t of things) {
    t.draw();
  }
}
