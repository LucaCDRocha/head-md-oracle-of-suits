let things = [];

class Thing {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dropWidth = random(20, 60);
    this.dropHeight = random(30, 90);
  }

  draw() {
    let parallax = map(this.dropHeight, 30, 90, 0.5, 2);
    // Make speed slower for smaller circles
    let sizeFactor = map(this.dropWidth, 20, 60, 0.5, 1.5); // smaller width = smaller factor
    let speed = 4 * parallax * sizeFactor;
    this.y += speed;

    if (this.y > height + this.dropHeight / 2) {
      this.y = -this.dropHeight / 2;
    }

    noStroke();
    fill(100, 180, 255, 200);
    ellipse(this.x, this.y, this.dropWidth, this.dropWidth);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

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

function mousePressed() {
  things.push(new Thing(mouseX, mouseY));
}
