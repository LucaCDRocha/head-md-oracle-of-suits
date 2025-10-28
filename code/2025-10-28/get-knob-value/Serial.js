let port;
let reader;
let connectButton;
let buffer = "";

function setupSerial() {
  connectButton = createButton("Connect Serial");
  connectButton.position(10, 10);
  connectButton.mousePressed(connectSerial);
}

async function connectSerial() {
  if (!("serial" in navigator)) {
    console.error("Web Serial API not supported in this browser.");
    return;
  }
  try {
    // user will pick the correct COM/port
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();

    connectButton.attribute("disabled", "");
    readLoop();
  } catch (err) {
    console.error("Serial connection failed:", err);
  }
}

async function readLoop() {
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value;
        let idx;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          parseLine(line);
        }
      }
    }
  } catch (err) {
    console.error("Read error:", err);
  }
}

function parseLine(line) {
  const parts = line.split(/\s+/);
  if (parts.length < 3) return;
  const [a, b, c, btnState] = parts.map(Number);
  if (!isNaN(a)) vals[0] = a;
  if (!isNaN(b)) vals[1] = b;
  if (!isNaN(c)) vals[2] = c;
  
  // Update button state (LOW = 0 = pressed, HIGH = 1 = not pressed)
  // Assuming you're using INPUT_PULLUP or button pulls LOW when pressed
  if (!isNaN(btnState)) {
    buttonPressed = (btnState === 0);  // LOW = pressed
  }
}