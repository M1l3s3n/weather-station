#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <EEPROM.h>
#include <HardwareSerial.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ====== WiFi параметри ======
const char* ssid = "AndroidAP5A29";
const char* password = "vvrv0993";
const char* backend_url = "https://weather-station-5qp7.onrender.com/api/sensor";

// ---------------------- ПІНИ ----------------------
#define SDA_PIN     21
#define SCL_PIN     22

#define MQ135_PIN   34
#define MQ7_PIN     35
#define RAIN_PIN    14

#define GPS_TX_PIN  16   // TX GPS -> RX ESP32 (GPIO16 як RX2)
#define GPS_RX_PIN  17   // RX GPS -> TX ESP32 (GPIO17 як TX2)

// ---------------------- ОБ'ЄКТИ -------------------
Adafruit_AHTX0 aht;
Adafruit_BMP280 bmp;
HardwareSerial GPS(2);

// ---------------------- ГАЗОВІ ДАТЧИКИ ------------
#define RLOAD     1000.0     // 1 кОм на модулі
#define VCC_ADC   4.75       // живлення датчика (приблизно)

#define A_CO2  116.0
#define B_CO2  -2.4
#define A_CO   605.0
#define B_CO   -3.1

#define CLEAN_RATIO_135 1.0   // для RLOAD = 1кОм
#define CLEAN_RATIO_7   27.5

// ---------------------- EEPROM --------------------
#define EEPROM_SIZE 128
#define ADDR_R0_135 0
#define ADDR_R0_7   4
#define ADDR_CAL    8

float R0_135 = 0;
float R0_7   = 0;

// ---------------------- GPS -----------------------
String nmeaBuffer = "";
float latitude  = 0.0;
float longitude = 0.0;
bool  gpsValid  = false;

// ---------------------- СТРУКТУРА ДАНИХ -----------
struct SensorData {
  float temperature;
  float humidity;
  float pressure;
  float co2_ppm;
  float co_ppm;
  bool  raining;
  float latitude;
  float longitude;
  bool  gpsValid;
};

SensorData data;
bool bmp_ok = false;

// ---------------------- ПРОТОТИПИ -----------------
void calibrateGas();
int  readAvg(int pin, int n);
void writeFloat(int addr, float val);
float readFloat(int addr);
void parseNMEA(String s);
float convertDegMin(float x);

// ======= Надсилання даних =======
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 15000UL; // 1 хвилина у мс

// ==================================================
//                      SETUP
// ==================================================
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("=== МЕТЕОСТАНЦІЯ НА ESP32 ===");

  // WiFi
  WiFi.begin(ssid, password);
  Serial.print("Підключення до WiFi ");
  Serial.print(ssid);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi підключено!");

  // I2C
  Wire.begin(SDA_PIN, SCL_PIN);
  Serial.println("I2C запущено");

  // EEPROM
  EEPROM.begin(EEPROM_SIZE);

  // AHT20
  if (!aht.begin()) {
    Serial.println("❌ AHT20 НЕ знайдено!");
  } else {
    Serial.println("✅ AHT20 знайдено");
  }

  // BMP280: пробуємо 0x76 та 0x77
  if (bmp.begin(0x76)) {
    Serial.println("✅ BMP280 знайдено на адресі 0x76");
    bmp_ok = true;
  } else if (bmp.begin(0x77)) {
    Serial.println("✅ BMP280 знайдено на адресі 0x77");
    bmp_ok = true;
  } else {
    Serial.println("❌ BMP280 НЕ знайдено!");
    bmp_ok = false;
  }

  // Дощовий датчик
  pinMode(RAIN_PIN, INPUT);

  // GPS UART
  GPS.begin(9600, SERIAL_8N1, GPS_TX_PIN, GPS_RX_PIN);
  Serial.println("GPS UART запущено");

  // Калібрування газових датчиків
  if (EEPROM.read(ADDR_CAL) != 1) {
    Serial.println("Перше вмикання — калібруємо MQ-135 та MQ-7 (30 с, не дихати прямо на датчики)");
    delay(30000);
    calibrateGas();
  } else {
    R0_135 = readFloat(ADDR_R0_135);
    R0_7   = readFloat(ADDR_R0_7);
    Serial.printf("R0 MQ-135: %.0f Ом (з EEPROM)\n", R0_135);
    Serial.printf("R0 MQ-7:   %.0f Ом (з EEPROM)\n", R0_7);
  }

  Serial.println("Готово! У Serial введи 'c' для перекалібрування газових датчиків.\n");
}
// ==================================================
//                      LOOP
// ==================================================
void loop() {
  // ---- Перекалібрування по 'c' ----
  if (Serial.available()) {
    char ch = Serial.read();
    if (ch == 'c' || ch == 'C') {
      Serial.println("\n=== ПЕРЕКАЛІБРУВАННЯ ГАЗОВИХ ДАТЧИКІВ ===");
      delay(1000);
      calibrateGas();
    }
  }

  // ---- Читання AHT20 ----
  sensors_event_t hum, temp;
  aht.getEvent(&hum, &temp);
  data.temperature = temp.temperature;
  data.humidity    = hum.relative_humidity;

  // ---- Читання BMP280 ----
  if (bmp_ok) {
    data.pressure = bmp.readPressure() / 100.0;  // у hPa
  } else {
    data.pressure = NAN;
  }

  // ---- Читання MQ-135 та MQ-7 ----
  int raw135 = readAvg(MQ135_PIN, 20);
  int raw7   = readAvg(MQ7_PIN,   20);

  float V135 = raw135 * VCC_ADC / 4095.0;
  float V7   = raw7   * VCC_ADC / 4095.0;

  float Rs135 = RLOAD * ((VCC_ADC / V135) - 1.0);
  float Rs7   = RLOAD * ((VCC_ADC / V7)   - 1.0);

  float ratio135 = Rs135 / R0_135;
  float ratio7   = Rs7   / R0_7;

  float ppm_co2 = A_CO2 * pow(ratio135, B_CO2);
  float ppm_co  = A_CO  * pow(ratio7,   B_CO);

  ppm_co2 = constrain(ppm_co2, 0, 5000);
  ppm_co  = constrain(ppm_co,  0, 1000);

  data.co2_ppm = ppm_co2;
  data.co_ppm  = ppm_co;

  // ---- Дощовий датчик ----
  int rainRaw = digitalRead(RAIN_PIN);
  data.raining = (rainRaw == 0);   // 0 = мокро, 1 = сухо

  // ---- GPS ----
  while (GPS.available()) {
    char c = GPS.read();
    if (c == '\n') {
      parseNMEA(nmeaBuffer);
      nmeaBuffer = "";
    } else if (c != '\r') {
      nmeaBuffer += c;
    }
  }

  data.latitude  = latitude;
  data.longitude = longitude;
  data.gpsValid  = gpsValid;

  // ---- ВИВІД У SERIAL ----
  Serial.println("========== МЕТЕОДАНІ ==========");
  Serial.printf("T:  %.2f °C\n",  data.temperature);
  Serial.printf("H:  %.2f %%\n",  data.humidity);
  Serial.printf("P:  %.2f hPa\n", data.pressure);
  Serial.printf("eCO2 (MQ-135): %.0f ppm\n", data.co2_ppm);
  Serial.printf("CO   (MQ-7):   %.0f ppm\n", data.co_ppm);
  Serial.print("Дощ: ");
  Serial.println(data.raining ? "ЙДЕ (мокро на платі)" : "НІ (сухо)");
  Serial.print("GPS: ");
  if (data.gpsValid) {
    Serial.printf("lat=%.6f  lon=%.6f\n", data.latitude, data.longitude);
  } else {
    Serial.println("нема фіксу (ще шукає супутники)");
  }
  Serial.println("Команда 'c' в Serial -> перекалібрування MQ-135 та MQ-7");
  Serial.println("================================\n");

  // ==== Відправлення даних на бекенд кожну хвилину ====
  if (WiFi.status() == WL_CONNECTED && millis() - lastSendTime > sendInterval) {
    lastSendTime = millis();

    HTTPClient http;
    http.begin(backend_url);
    http.addHeader("Content-Type", "application/json");

   String json = String("{") +
    "\"temperature\":" + String(data.temperature, 2) + "," +
    "\"humidity\":"    + String(data.humidity, 2) + "," +
    "\"pressure\":"    + String(data.pressure, 1) + "," +
    "\"rain\":"        + (data.raining ? "true" : "false") + "," +
    "\"co2\":"         + String(data.co2_ppm, 0) + "," +
    "\"co\":"          + String(data.co_ppm, 0) + "," +
    "\"gps\":{" +
    "\"lat\":"       + String(data.latitude, 6) + "," +
    "\"lon\":"       + String(data.longitude, 6) +
    "}" +
   "}";

    int code = http.POST(json);
    Serial.print("Відправка даних на сервер, код: ");
    Serial.println(code);
    Serial.println("JSON:\n" + json);
    http.end();
  }

  delay(3000); // старий цикл, не впливає на таймер відправки!
}

// ==================================================
//                 ФУНКЦІЇ КАЛІБРУВАННЯ
// ==================================================
void calibrateGas() {
  Serial.println("Калібруємо MQ-135 і MQ-7 (100 вимірювань)...");

  long sum135 = 0, sum7 = 0;
  for (int i = 0; i < 100; i++) {
    sum135 += analogRead(MQ135_PIN);
    sum7   += analogRead(MQ7_PIN);
    if (i % 20 == 0) Serial.print(".");
    delay(50);
  }

  float avg135 = sum135 / 100.0;
  float avg7   = sum7   / 100.0;

  float V135 = avg135 * VCC_ADC / 4095.0;
  float V7   = avg7   * VCC_ADC / 4095.0;

  float Rs135 = RLOAD * ((VCC_ADC / V135) - 1.0);
  float Rs7   = RLOAD * ((VCC_ADC / V7)   - 1.0);

  R0_135 = Rs135 / CLEAN_RATIO_135;
  R0_7   = Rs7   / CLEAN_RATIO_7;

  writeFloat(ADDR_R0_135, R0_135);
  writeFloat(ADDR_R0_7,   R0_7);
  EEPROM.write(ADDR_CAL, 1);
  EEPROM.commit();

  Serial.println("\nКалібрування завершено!");
  Serial.printf("R0 MQ-135: %.0f Ом\n", R0_135);
  Serial.printf("R0 MQ-7:   %.0f Ом\n\n", R0_7);
}

// усереднення ADC
int readAvg(int pin, int n) {
  long sum = 0;
  for (int i = 0; i < n; i++) {
    sum += analogRead(pin);
    delay(10);
  }
  return sum / n;
}

// EEPROM: запис/читання float
void writeFloat(int addr, float val) {
  byte* p = (byte*)&val;
  for (int i = 0; i < 4; i++) EEPROM.write(addr + i, p[i]);
  EEPROM.commit();
}

float readFloat(int addr) {
  float val;
  byte* p = (byte*)&val;
  for (int i = 0; i < 4; i++) p[i] = EEPROM.read(addr + i);
  return val;
}

// ==================================================
//                     GPS ФУНКЦІЇ
// ==================================================
void parseNMEA(String s) {
  if (!s.startsWith("$GPRMC")) return;

  int idx = 0;
  int comma[12];
  for (int i = 0; i < 12; i++) comma[i] = -1;

  for (int i = 0; i < (int)s.length(); i++) {
    if (s[i] == ',') {
      comma[idx++] = i;
      if (idx >= 12) break;
    }
  }

  if (comma[1] == -1 || comma[2] == -1 || comma[3] == -1 || comma[4] == -1) {
    gpsValid = false;
    return;
}

  char status = s[comma[1] + 1];
  if (status != 'A') {
    gpsValid = false;
    return;
  }

  String latStr = s.substring(comma[2] + 1, comma[3]);
  String latHem = s.substring(comma[3] + 1, comma[4]);
  String lonStr = s.substring(comma[4] + 1, comma[5]);
  String lonHem = s.substring(comma[5] + 1, comma[6]);

  float latRaw = latStr.toFloat();
  float lonRaw = lonStr.toFloat();

  float lat = convertDegMin(latRaw);
  float lon = convertDegMin(lonRaw);

  if (latHem == "S") lat = -lat;
  if (lonHem == "W") lon = -lon;

  latitude  = lat;
  longitude = lon;
  gpsValid  = true;
}

float convertDegMin(float x) {
  int deg = int(x / 100);
  float minutes = x - deg * 100;
  return deg + minutes / 60.0;
}