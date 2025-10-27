
// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

// the loop function runs over and over again forever
void loop() {
  digitalWrite(13, HIGH);  // turn the LED on (HIGH is the voltage level)
  Serial.write('A');
  delay(500);                      // wait for a second
  digitalWrite(13, LOW);   // turn the LED off by making the voltage LOW
  Serial.write(' ');
  delay(500);                      // wait for a second
}
