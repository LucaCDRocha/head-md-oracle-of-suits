class Planet {
  constructor(distance, size, speed, color) {
    this.distance = distance; // Distance from sun
    this.size = size;
    this.angle = random(TWO_PI);
    this.speed = speed; // Orbital speed
    this.color = color;
  }

  draw(sunX, sunY) {
    this.angle += this.speed * 4;
    let x = sunX + cos(this.angle) * this.distance;
    let y = sunY + sin(this.angle) * this.distance;
    fill(this.color);
    noStroke();
    circle(x, y, this.size);
  }
}

class Rocket {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 0;
    this.size = 30;
  }

  update() {
    if (keyIsDown(LEFT_ARROW)) this.angle -= 0.06;
    if (keyIsDown(RIGHT_ARROW)) this.angle += 0.06;
    if (keyIsDown(UP_ARROW)) this.speed = min(this.speed + 0.2, 6);
    if (keyIsDown(DOWN_ARROW)) this.speed = max(this.speed - 0.14, -6);

    this.x = (this.x + cos(this.angle) * this.speed + width) % width;
    this.y = (this.y + sin(this.angle) * this.speed + height) % height;
    this.speed *= 0.98;
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(220);
    stroke(80);
    strokeWeight(1);

    beginShape();
    vertex(this.size, 0);
    vertex(-this.size * 0.5, -this.size * 0.5);
    vertex(-this.size * 0.3, 0);
    vertex(-this.size * 0.5, this.size * 0.5);
    endShape(CLOSE);

    if (keyIsDown(UP_ARROW)) {
      fill(255, 100, 0);
      noStroke();
      triangle(
        -this.size * 0.5,
        -this.size * 0.2,
        -this.size * 0.9,
        0,
        -this.size * 0.5,
        this.size * 0.2
      );
    }
    pop();
  }
}

let planets = [];
let sun;
let rocket;

function setup() {
  createCanvas(windowWidth, windowHeight);
  sun = { x: width / 2, y: height / 2, size: 80 };
  rocket = new Rocket(sun.x + 200, sun.y, PI / 2);

  // Add planets: distance, size, speed, color
  const planetData = [
    { distance: 120, size: 30, speed: 0.01, color: color(100, 150, 255) }, // Mercury
    { distance: 180, size: 40, speed: 0.008, color: color(150, 100, 250) }, // Venus
    { distance: 250, size: 45, speed: 0.006, color: color(100, 255, 150) }, // Earth
    { distance: 320, size: 35, speed: 0.005, color: color(255, 100, 100) }, // Mars
    { distance: 400, size: 60, speed: 0.003, color: color(255, 220, 100) }, // Jupiter
  ];

  for (let data of planetData) {
    planets.push(new Planet(data.distance, data.size, data.speed, data.color));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  sun.x = width / 2;
  sun.y = height / 2;
}

function draw() {
  // background(20);
  // Draw sun
  fill(255, 204, 0);
  noStroke();
  ellipse(sun.x, sun.y, sun.size);

  // Draw planets
  for (let p of planets) {
    p.draw(sun.x, sun.y);
  }

  rocket.update();
  rocket.draw();
}

// every time we click it add a new planet at the mouse position that orbit around the sun
function mousePressed() {
  let distance = dist(mouseX, mouseY, sun.x, sun.y);
  let size = random(20, 60);
  let speed = random(0.002, 0.01);
  let planetColor = color(random(50, 255), random(50, 255), random(50, 255));
  planets.push(new Planet(distance, size, speed, planetColor));
}
