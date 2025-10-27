void setup() {
  // declare the ledPin as an OUTPUT:
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // read the value from the sensor:
  int sensorValue = analogRead(A0);
  Serial.println(sensorValue);
  // turn the 13 on
  digitalWrite(13, HIGH);
  // stop the program for <sensorValue> milliseconds:
  delay(sensorValue);
  // turn the 13 off:
  digitalWrite(13, LOW);
  // stop the program for <sensorValue> milliseconds:
  delay(sensorValue);
}
