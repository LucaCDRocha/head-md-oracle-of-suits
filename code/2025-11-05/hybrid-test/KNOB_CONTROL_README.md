# Arduino Knob Control System

This system allows you to control card selection using 4 physical potentiometers connected to an Arduino.

## Hardware Setup

### Components Needed
- 1x Arduino board (Uno, Nano, etc.)
- 4x 10kΩ Potentiometers
- Jumper wires
- USB cable

### Wiring

Connect each potentiometer to the Arduino:

**Potentiometer 1 (Year Filter)** → A0
- Left pin: GND
- Center pin: A0
- Right pin: 5V

**Potentiometer 2 (Game Filter)** → A1
- Left pin: GND
- Center pin: A1
- Right pin: 5V

**Potentiometer 3 (Suits Filter)** → A2
- Left pin: GND
- Center pin: A2
- Right pin: 5V

**Potentiometer 4 (Rank/Value Filter)** → A3
- Left pin: GND
- Center pin: A3
- Right pin: 5V

## Arduino Setup

1. Open `arduino_4_knobs.ino` in Arduino IDE
2. Select your board: Tools → Board → Arduino Uno (or your board)
3. Select your port: Tools → Port → COM# (your Arduino port)
4. Upload the sketch to your Arduino
5. Keep the Arduino connected via USB

## Web Application Usage

### 1. Start the Application
- Open `index.html` in **Chrome** or **Edge** (Web Serial API required)
- You should see a "Connect Arduino" button in the top-left corner

### 2. Connect Arduino
- Click "Connect Arduino" button
- Select your Arduino's COM port from the popup
- The button will change to "Connected ✓"

### 3. Select Active Card
Use the radio buttons to choose which card slot the knobs control:
- **Card 1**: Knobs control the first card
- **Card 2**: Knobs control the second card  
- **Card 3**: Knobs control the third card

The active card will have:
- Orange background highlight
- Orange border
- "🎛️ KNOB CONTROL" badge

### 4. Control Filters with Knobs
Each knob controls one filter for the active card:

- **Knob 1 (A0)**: Year filter
- **Knob 2 (A1)**: Game filter
- **Knob 3 (A2)**: Suits filter
- **Knob 4 (A3)**: Rank/Value filter

Turn the knobs to cycle through available options. The card preview updates automatically.

### 5. Switch Between Cards
- Click different radio buttons to control different card slots
- Each card remembers its filter settings
- You can fine-tune all 3 cards using the same 4 knobs

## How It Works

1. **Arduino** reads analog values (0-1023) from 4 potentiometers
2. **Serial communication** sends these values to the browser via USB
3. **JavaScript** maps knob positions to filter options:
   - Knob value 0-1023 → Index in available options
   - Example: If there are 5 games, knob position determines which game (0-4)
4. **Auto-selection** triggers when filters are complete
5. **French equivalence** matching preserves card relationships when changing games

## Troubleshooting

### "Connect Arduino" button doesn't appear
- Check that you're using Chrome or Edge browser
- Web Serial API is not supported in Firefox or Safari

### Can't see COM port in selection dialog
- Make sure Arduino is connected via USB
- Check that drivers are installed (usually automatic)
- Try a different USB cable or port

### Knobs don't respond
- Check wiring: center pin to A0-A3, left to GND, right to 5V
- Open Arduino Serial Monitor (115200 baud) to verify values are being sent
- Format should be: `123 456 789 234` (4 space-separated numbers)

### Values are jumpy or erratic
- Add smoothing to Arduino code
- Use higher quality potentiometers
- Add small capacitors (0.1µF) between analog pins and GND

### Card doesn't auto-select
- Not all filter combinations result in valid cards
- Try different knob positions
- Check browser console for error messages

## Browser Compatibility

✅ **Supported:**
- Chrome 89+
- Edge 89+
- Opera 75+

❌ **Not Supported:**
- Firefox (no Web Serial API)
- Safari (no Web Serial API)

## Tips

- **Smooth control**: Turn knobs slowly for precise selection
- **Quick switching**: Use radio buttons to quickly jump between cards
- **Visual feedback**: Watch the orange highlight to see which card is active
- **Auto-completion**: Card auto-selects when all 4 filters are set to valid combination
- **French equivalence**: When changing games, system tries to find equivalent cards (e.g., 3 of Pentacles → 3 of Diamonds)
