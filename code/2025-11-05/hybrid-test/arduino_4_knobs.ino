/*
 * Arduino 4-Knob Controller for Hybrid Card Selector
 * 
 * Connect 4 potentiometers to analog pins A0, A1, A2, A3
 * Each knob controls one filter: Year, Game, Suits, Rank
 * 
 * Wiring:
 * - Potentiometer 1 (Year):  A0
 * - Potentiometer 2 (Game):  A1
 * - Potentiometer 3 (Suits): A2
 * - Potentiometer 4 (Rank):  A3
 * 
 * Each potentiometer should be wired:
 * - Left pin: GND
 * - Center pin: Analog input (A0-A3)
 * - Right pin: 5V
 */

const int KNOB_1_PIN = A0;  // Year filter
const int KNOB_2_PIN = A1;  // Game filter
const int KNOB_3_PIN = A2;  // Suits filter
const int KNOB_4_PIN = A3;  // Rank/Value filter

void setup() {
  Serial.begin(9600);
  
  // Configure analog pins as inputs (default, but explicit is good)
  pinMode(KNOB_1_PIN, INPUT);
  pinMode(KNOB_2_PIN, INPUT);
  pinMode(KNOB_3_PIN, INPUT);
  pinMode(KNOB_4_PIN, INPUT);
}

void loop() {
  // Read analog values (0-1023)
  int knob1 = analogRead(KNOB_1_PIN);
  int knob2 = analogRead(KNOB_2_PIN);
  int knob3 = analogRead(KNOB_3_PIN);
  int knob4 = analogRead(KNOB_4_PIN);
  
  // Send values space-separated, newline-terminated
  // Format: "knob1 knob2 knob3 knob4\n"
  Serial.print(knob1);
  Serial.print(" ");
  Serial.print(knob2);
  Serial.print(" ");
  Serial.print(knob3);
  Serial.print(" ");
  Serial.println(knob4);
  
  // Small delay to avoid flooding serial (adjust as needed)
  delay(50);
}
