class Ray {
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction;
  }

  draw() {
    // make an effect of more there are more white it become but still red when not a lot in the same place
    stroke(232, 6, 48, 10);
    strokeWeight(1.5);
    line(
      this.origin.x,
      this.origin.y,
      this.origin.x + this.direction.x * 10,
      this.origin.y + this.direction.y * 10
    );
  }
}
