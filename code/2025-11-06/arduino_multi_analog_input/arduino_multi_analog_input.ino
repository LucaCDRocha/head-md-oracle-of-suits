int buttonPin = 7;

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT);
  pinMode(13, OUTPUT);
}

void loop() {
  // read the value from the sensor:
  int sensor0 = analogRead(A0);
  int sensor1 = analogRead(A1);
  int sensor2 = analogRead(A2);
  int sensor3 = analogRead(A3);

  Serial.print(sensor0);
  Serial.print(' ');
  Serial.print(sensor1);
  Serial.print(' ');
  Serial.print(sensor2);
  Serial.print(' ');
  Serial.print(sensor3);
  Serial.println();

  delay(20);
}

