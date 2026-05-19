/*
  STM32 Sensor + ESP32 Camera Bridge
  ==================================

  Target STM32 UART / Pin Mapping
  --------------------------------
  DS18B20 Data         -> PB4
  DS18B20 Power        -> PB5

  TDS Power            -> PA0
  TDS Analog           -> PA1

  Battery UART         -> PA2 (TX)
                          PA3 (RX)

  Output UART          -> PA9 (TX)
                          PA10 (RX)

  ESP32 Camera UART    -> PB10 (TX)
                          PB11 (RX)

  Shutdown Signal      -> PB0
  Capture Active       -> PB1

  IMPORTANT:
  ----------
  - Compile using STM32 Arduino Core.
  - Board example:
      "Generic STM32F103C series"

  Required Libraries:
  -------------------
  - OneWire
  - DallasTemperature
*/

#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>

// ======================================================
// PIN DEFINITIONS
// ======================================================

#define TEMP_DATA_PIN   PB4
#define TEMP_POWER_PIN  PB5

#define TDS_POWER_PIN   PA0
#define TDS_PIN         PA1

#define SHUTDOWN_PIN    PB0
#define CAPTURE_PIN     PB1

// ======================================================
// UART DEFINITIONS
// ======================================================

// Battery MCU UART
HardwareSerial BatterySerial(PA3, PA2);   // RX, TX

// Main Output UART
HardwareSerial OutputSerial(PA10, PA9);   // RX, TX

// ESP32 Camera UART
HardwareSerial CameraSerial(PB11, PB10);  // RX, TX

// ======================================================
// ONE WIRE / TEMPERATURE
// ======================================================

OneWire oneWire(TEMP_DATA_PIN);
DallasTemperature sensors(&oneWire);

// ======================================================
// GLOBAL VARIABLES
// ======================================================

float voltage;
float tdsValue;

float temperature = 0.0;
float salinity = 0.0;
float dissolvedOxygen = 0.0;
float battery = 0.0;

// ======================================================
// FUNCTION DECLARATIONS
// ======================================================

float getTemp();
float getSalin(float temp);
float getDO(float temp, float salin);

void getBattery();
void sendData();
void getCapture();

// ======================================================
// SETUP
// ======================================================

void setup() {

  // -----------------------------
  // GPIO
  // -----------------------------

  pinMode(TEMP_POWER_PIN, OUTPUT);
  digitalWrite(TEMP_POWER_PIN, HIGH);

  pinMode(TDS_POWER_PIN, OUTPUT);
  digitalWrite(TDS_POWER_PIN, HIGH);

  pinMode(SHUTDOWN_PIN, OUTPUT);
  digitalWrite(SHUTDOWN_PIN, LOW);

  pinMode(CAPTURE_PIN, OUTPUT);
  digitalWrite(CAPTURE_PIN, LOW);

  // -----------------------------
  // UARTS
  // -----------------------------

  Serial.begin(115200);

  BatterySerial.begin(115200);
  OutputSerial.begin(115200);
  CameraSerial.begin(115200);

  delay(1000);

  // -----------------------------
  // Sensors
  // -----------------------------

  sensors.begin();

  Serial.print("Sensors found: ");
  Serial.println(sensors.getDeviceCount());
}

// ======================================================
// LOOP
// ======================================================

void loop() {

  // -----------------------------
  // Read sensors
  // -----------------------------

  temperature = getTemp();

  salinity = getSalin(temperature);

  dissolvedOxygen = getDO(temperature, salinity);

  // -----------------------------
  // Battery
  // -----------------------------

  getBattery();

  // -----------------------------
  // Send packet + image bridge
  // -----------------------------

  sendData();

  delay(5000);
}

// ======================================================
// TEMPERATURE
// ======================================================

float getTemp() {

  float total = 0;

  for (int i = 0; i < 10; i++) {

    sensors.requestTemperatures();

    total += sensors.getTempCByIndex(0);

    delay(500);
  }

  return total / 10.0;
}

// ======================================================
// SALINITY
// ======================================================

float getSalin(float temp) {

  float total = 0;

  for (int i = 0; i < 10; i++) {

    total += analogRead(TDS_PIN);

    delay(500);
  }

  float raw = total / 10.0;

  // Calibration offset
  float raw_cal = 0.883 * raw - 8.0;

  // Temperature compensation factor
  float C = 1.0 + 0.02 * (temp - 25.0);

  // STM32 ADC is 12-bit (0-4095)
  voltage = raw_cal * (3.3 / 4095.0);

  // Temperature compensation
  float voltage_comp = voltage / C;

  // TDS formula
  float salin =
      0.5 * (
        133.42 * pow(voltage_comp, 3)
        - 255.86 * pow(voltage_comp, 2)
        + 857.39 * voltage_comp
      );

  return salin;
}

// ======================================================
// DISSOLVED OXYGEN
// ======================================================

float getDO(float temp, float salin) {

  float T = temp + 273.15;

  float DO_T =
      -139.34411
      + 157570.1 / T
      - 66423080.0 / pow(T, 2)
      + 12438000000.0 / pow(T, 3)
      - 862194900000.0 / pow(T, 4);

  float DO_S =
      salin * (
        0.017674
        - 10.754 / T
        + 2140.7 / pow(T, 2)
      );

  float DO = exp(DO_T - DO_S);

  return DO;
}

// ======================================================
// GET BATTERY
// ======================================================

void getBattery() {

  // Clear old UART data
  while (BatterySerial.available()) {
    BatterySerial.read();
  }

  // Request battery value
  BatterySerial.println("REQUEST_BATTERY");

  unsigned long startTime = millis();

  String response = "";

  // Wait up to 2 seconds
  while ((millis() - startTime) < 2000) {

    while (BatterySerial.available()) {

      char c = BatterySerial.read();

      if (c == '\n') {

        battery = response.toFloat();

        return;
      }

      if (c != '\r') {
        response += c;
      }
    }
  }

  // Timeout fallback
  battery = -1;
}

// ======================================================
// SEND DATA PACKET
// ======================================================

void sendData() {

  // -----------------------------
  // Packet Start
  // -----------------------------

  OutputSerial.println("START_PACKET");

  OutputSerial.print("temperature_C: ");
  OutputSerial.println(temperature, 2);

  OutputSerial.print("salinity_ppt: ");
  OutputSerial.println(salinity, 2);

  OutputSerial.print("dissolved_oxygen_mg_L: ");
  OutputSerial.println(dissolvedOxygen, 2);

  OutputSerial.print("battery_V: ");
  OutputSerial.println(battery, 2);

  // -----------------------------
  // Capture + UART bridge
  // -----------------------------

  getCapture();

  // -----------------------------
  // Packet End
  // -----------------------------

  OutputSerial.println("END_PACKET");

  // -----------------------------
  // Shutdown signal
  // -----------------------------

  digitalWrite(SHUTDOWN_PIN, HIGH);

  delay(1000);

  digitalWrite(SHUTDOWN_PIN, LOW);
}

// ======================================================
// GET CAMERA CAPTURE
// ======================================================

void getCapture() {

  // Capture active HIGH
  digitalWrite(CAPTURE_PIN, HIGH);

  // Clear old UART data
  while (CameraSerial.available()) {
    CameraSerial.read();
  }

  // Request capture
  CameraSerial.println("BEGIN_CAPTURE");

  String lineBuffer = "";

  bool imageEnded = false;

  while (!imageEnded) {

    while (CameraSerial.available()) {

      char c = CameraSerial.read();

      // ---------------------------------
      // Forward EVERYTHING directly
      // to output UART
      // ---------------------------------

      OutputSerial.write(c);

      // ---------------------------------
      // Track lines to detect IMAGE_END
      // ---------------------------------

      if (c == '\n') {

        lineBuffer.trim();

        if (lineBuffer == "IMAGE_END") {

          imageEnded = true;

          break;
        }

        lineBuffer = "";
      }
      else {
        lineBuffer += c;
      }
    }
  }

  // Capture inactive
  digitalWrite(CAPTURE_PIN, LOW);
}