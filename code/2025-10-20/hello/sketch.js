function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  line(pmouseX, pmouseY, mouseX, mouseY);
}

// clear the canvas when the mouse is pressed
function mousePressed() {
  clear();
}