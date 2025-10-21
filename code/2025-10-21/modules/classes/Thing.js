class Thing {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(20, 50);
  }

  draw() {
    ellipse(this.x, this.y, this.size);
  }
}
