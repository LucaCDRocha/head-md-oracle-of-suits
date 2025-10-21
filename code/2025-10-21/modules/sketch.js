const things = [];

function setup() {
  // fit to window
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);
  // draw all things
  for (let i = 0; i < things.length; i++) {
    things[i].draw();
  }
}

function mousePressed() {
  // create a new Thing and add it to the array
  const t = new Thing();
  things.push(t);
}
