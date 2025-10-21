const rays = [];

function setup() {
  // fit to window
  createCanvas(windowWidth, windowHeight);

  // create rays randomly on a circle
  for (let i = 0; i < 2000; i++) {
    const angle = random(TWO_PI);
    const origin = createVector(
      width / 2 + cos(angle) * 200,
      height / 2 + sin(angle) * 200
    );
    const direction = createVector(
      random(-width, width),
      random(-height, height)
    );
    const ray = new Ray(origin, direction);
    rays.push(ray);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // make the rays rotate allong the circle
  const center = createVector(width / 2, height / 2);
  for (const ray of rays) {
    // Translate origin to center, rotate, then translate back
    let offset = p5.Vector.sub(ray.origin, center);
    offset.rotate(0.01);
    ray.origin = p5.Vector.add(center, offset);
  }

  // frameRate(0.1);
  background(0, 40);
  for (const ray of rays) {
    ray.draw();
  }
}
