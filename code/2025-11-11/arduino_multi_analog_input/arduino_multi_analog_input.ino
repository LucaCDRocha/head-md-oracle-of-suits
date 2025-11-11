int buttonMerge = 5;
int buttonPrint = 10;

void setup() {
  Serial.begin(9600);
  pinMode(buttonMerge, INPUT);
  pinMode(buttonPrint, INPUT);
  pinMode(13, OUTPUT);
}

void loop() {
  // read the value from the sensor:
  int sensor1 = analogRead(A1);
  int sensor2 = analogRead(A2);
  int sensor3 = analogRead(A3);
  int sensor4 = analogRead(A4);
  int sensor5 = analogRead(A5);
  int sensor6 = analogRead(A6);
  int sensor7 = analogRead(A7);
  int sensor8 = analogRead(A8);
  int sensor9 = analogRead(A9);
  int sensor10 = analogRead(A10);
  int sensor11 = analogRead(A11);
  int sensor12 = analogRead(A12);

  int buttonStateMerge = digitalRead(buttonMerge);
  int buttonStatePrint = digitalRead(buttonPrint);

  if (buttonStateMerge == LOW) {
    digitalWrite(13, HIGH);
  }
  if (buttonStateMerge == HIGH) {
    digitalWrite(13, LOW);
  }

  Serial.print(sensor1);
  Serial.print(' ');
  Serial.print(sensor2);
  Serial.print(' ');
  Serial.print(sensor3);
  Serial.print(' ');
  Serial.print(sensor4);
  Serial.print(' ');
  Serial.print(sensor5);
  Serial.print(' ');
  Serial.print(sensor6);
  Serial.print(' ');
  Serial.print(sensor7);
  Serial.print(' ');
  Serial.print(sensor8);
  Serial.print(' ');
  Serial.print(sensor9);
  Serial.print(' ');
  Serial.print(sensor10);
  Serial.print(' ');
  Serial.print(sensor11);
  Serial.print(' ');
  Serial.print(sensor12);
  Serial.println();



  delay(20);
}

