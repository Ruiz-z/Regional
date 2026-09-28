// ====================================================================
// SmartRiego MX - Servidor Web WiFi Local + Estructura Estable
// Muestra el valor en tiempo real del Sensor de Agua (GPIO 25) en Serie
// + Integración con el backend SmartRiego (POST /readings, /irrigation-events)
// ====================================================================

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <DHT.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// --- CREDENCIALES WIFI ---
const char* ssid     = "A36 de Silvia";
const char* password = "MammaMia19";

WebServer server(80);

// --- BACKEND SMARTRIEGO ---
// Túnel HTTP (ngrok/exp.direct) hacia `apps/api` en local. Se usa un túnel
// en vez de la IP LAN directa porque la red WiFi tiene aislamiento entre
// dispositivos (AP isolation) y el ESP32 no puede ver a la laptop por IP,
// aunque estén en la misma red — el túnel esquiva eso por completo.
const char* API_BASE_URL = "http://smartriego-api-local.exp.direct";
// API keys en texto plano de los devices ESP32 registrados en /devices (se
// emiten una sola vez). Cada zona del backend tiene su propio device/key —
// no hay forma de indicar "esta lectura es de la zona X" en el body del
// POST, la zona la determina la key que se usa.
const char* DEVICE_API_KEY_P1 = "RnY6cQ3s_kIKRRAPnLxaDlZsECVoq7Gc8QgTsFmMY7Y";
const char* DEVICE_API_KEY_P2 = "EHqqcP8MfBhTdQOUfXQ4A6NS_-wsUwWttasgtEhAUaY";
const char* DEVICE_API_KEY_P3 = "Q6ShOKf0oH9eKK5ft7r8gLSKESCYTrVjXTjzNp2p3HA";

// --- CONFIGURACIÓN DHT11 ---
#define DHTPIN 27
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// --- PIN DEL BOTÓN DE INICIO ---
const int PIN_BOTON = 12;

// --- OBJETOS SERVO ---
Servo servoParcela1;
Servo servoParcela3;
Servo servoDron;

// --- PINES DE ACTUADORES ---
const int PIN_SERVO_P1   = 22;
const int PIN_SERVO_P3   = 23;
const int PIN_SERVO_DRON = 21;
const int PIN_BOMBA_P2   = 18;

// --- PINES DE SENSORES ---
const int PIN_SENSOR_P1    = 35;  // Parcela 1
const int PIN_SENSOR_P2    = 34;  // Parcela 2
const int PIN_SENSOR_P3    = 32;  // Parcela 3
const int PIN_SENSOR_GAS   = 33;  // MQ-2 Gas/Humo
const int PIN_SENSOR_AGUA  = 36;  // Sensor de Agua (GPIO 25)

// --- POSICIONES DE SERVOS ---
const int SERVO_CERRADO      = 0;
const int SERVO_ABIERTO      = 90;
const int SERVO_DRON_ABIERTO = 120;

// --- UMBRALES DE ACTIVACIÓN ---
const int UMBRAL_P1    = 2500;
const int UMBRAL_P2    = 2500;
const int UMBRAL_P3    = 2500;
const int UMBRAL_GAS   = 1200;

// Variables globales de estado
bool sistemaActivo = false;
bool banderaDron   = false;
unsigned long ultimoDebounce = 0;
unsigned long ultimoEnvioSerial = 0;

float tempAire = 0.0;
float humAire  = 0.0;
int valP1 = 0, valP2 = 0, valP3 = 0, valGas = 0, valAgua = 0;

// Decisión del backend sobre la última lectura enviada (viene en el body de
// POST /readings: {"decision":"REGAR"|"ESPERAR",...}). Arranca en true
// (falla abierto) para que, sin WiFi o con la API caída, el riego local por
// umbral siga funcionando igual que antes de esta integración.
bool servidorDiceRegar = true;

int leerPromedioADC(int pin) {
  long suma = 0;
  for (int i = 0; i < 10; i++) {
    suma += analogRead(pin);
    delay(5);
  }
  return (int)(suma / 10);
}

// --- INTEGRACIÓN CON EL BACKEND (best-effort: nunca bloquea el riego local) ---

// deviceKey: cada zona real (Parcela 1/2/3) tiene su propio device/key en el
// backend. actualizarGate: solo Parcela 1 usa la decisión del servidor para
// frenar su riego (servidorDiceRegar) — P2/P3 mandan su lectura igual, pero
// no se les pide actualizar ese flag.
void enviarLectura(float humedadPct, float temp, float humedadAmbiente, const char* deviceKey, bool actualizarGate) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ [API] Sin WiFi, se omite envío de lectura.");
    return;
  }

  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/readings");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", deviceKey);

  String body = "{\"humidity\":" + String(humedadPct, 1) +
                ",\"temperature\":" + String(temp, 1);
  // El DHT11 puede fallar la lectura (NaN) — en ese caso se omite el campo
  // en vez de mandar un JSON inválido (ambientHumidity es opcional en el DTO).
  if (!isnan(humedadAmbiente)) {
    body += ",\"ambientHumidity\":" + String(humedadAmbiente, 1);
  }
  body += "}";
  int code = http.POST(body);
  Serial.printf("📡 [API] POST /readings -> %d\n", code);

  if (code == 200 && actualizarGate) {
    // Sin librería de JSON (evita agregar una dependencia extra): el body
    // es chico y controlado por nosotros, alcanza con buscar el texto de
    // la decisión. Ej: {"decision":"ESPERAR","durationMinutes":null,...}
    String respuesta = http.getString();
    if (respuesta.indexOf("\"decision\":\"ESPERAR\"") != -1) {
      if (servidorDiceRegar) {
        Serial.println("🌧️ [API] El servidor dice ESPERAR (humedad suficiente o lluvia prevista).");
      }
      servidorDiceRegar = false;
    } else if (respuesta.indexOf("\"decision\":\"REGAR\"") != -1) {
      servidorDiceRegar = true;
    }
    // Cualquier otro caso (respuesta inesperada): se conserva el último
    // valor conocido de servidorDiceRegar en vez de asumir uno nuevo.
  }

  http.end();
}

void enviarEventoRiego(int minutos, const char* deviceKey) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ [API] Sin WiFi, se omite envío de evento de riego.");
    return;
  }

  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/irrigation-events");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", deviceKey);

  String body = "{\"durationMinutes\":" + String(minutos) + "}";
  int code = http.POST(body);
  Serial.printf("📡 [API] POST /irrigation-events -> %d\n", code);
  http.end();
}

// Botón "Activar servo del dron" (app mobile): el backend no le puede pegar
// directo al ESP32 (aislamiento de red de la WiFi), así que este consulta
// (poll) si hay una solicitud pendiente en su propio ciclo de 4s. El dron es
// UN solo servo físico compartido por las 3 parcelas/devices — el usuario
// puede pedirlo desde cualquiera de las 3 zonas en la app, así que hay que
// preguntar con las 3 keys (cada una consulta el flag de SU propia zona).
void consultarDronRemoto() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  const char* keys[] = {DEVICE_API_KEY_P1, DEVICE_API_KEY_P2, DEVICE_API_KEY_P3};
  for (int i = 0; i < 3; i++) {
    HTTPClient http;
    http.begin(String(API_BASE_URL) + "/drone-status");
    http.addHeader("X-Device-Key", keys[i]);
    int code = http.GET();
    if (code == 200) {
      String respuesta = http.getString();
      if (respuesta.indexOf("\"shouldActivate\":true") != -1) {
        Serial.println("🚁 [API] El servidor pidió activar el dron.");
        banderaDron = true;
      }
    }
    http.end();
  }
}

void apagarTodoActuadores() {
  digitalWrite(PIN_BOMBA_P2, LOW);

  servoParcela1.attach(PIN_SERVO_P1, 500, 2400);
  servoParcela1.write(SERVO_CERRADO);
  delay(300);
  servoParcela1.detach();

  servoParcela3.attach(PIN_SERVO_P3, 500, 2400);
  servoParcela3.write(SERVO_CERRADO);
  delay(300);
  servoParcela3.detach();

  servoDron.attach(PIN_SERVO_DRON, 500, 2400);
  servoDron.write(SERVO_CERRADO);
  delay(300);
  servoDron.detach();

  banderaDron = false;
}

// --- ENDPOINT PARA ACTIVAR EL DRON VÍA WEB ---
void handleActivarDron() {
  banderaDron = true;
  server.send(200, "text/plain", "Orden recibida: Dron desplegado");
}

// --- DASHBOARD WEB EN TIEMPO REAL ---
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<meta http-equiv='refresh' content='4'>";
  html += "<title>SmartRiego MX</title>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; background-color: #f4f6f9; text-align: center; margin: 0; padding: 20px; }";
  html += "h1 { color: #2c3e50; }";
  html += ".status { font-weight: bold; padding: 8px 15px; border-radius: 5px; display: inline-block; margin-bottom: 15px; }";
  html += ".active { background-color: #2ecc71; color: white; } .paused { background-color: #e74c3c; color: white; }";
  html += ".container { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; max-width: 900px; margin: auto; }";
  html += ".card { background: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); width: 250px; }";
  html += ".badge { font-size: 0.9em; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }";
  html += ".dry { background-color: #e67e22; } .wet { background-color: #3498db; } .alert { background-color: #e74c3c; } .normal { background-color: #2ecc71; }";
  html += "</style></head><body>";

  html += "<h1>🌱 SmartRiego MX</h1>";
  html += sistemaActivo ? "<div class='status active'>SISTEMA EN EJECUCIÓN</div>" : "<div class='status paused'>SISTEMA PAUSADO</div>";

  html += "<div class='container'>";
  html += "<div class='card'><h3>🌡️ Clima Ambiente</h3><p><b>Temp:</b> " + String(tempAire, 1) + " °C</p><p><b>Humedad:</b> " + String(humAire, 1) + " %</p></div>";
  html += "<div class='card'><h3>🌾 Parcela 1</h3><p><b>ADC:</b> " + String(valP1) + "</p><p><b>Estado:</b> " + String(valP1 >= UMBRAL_P1 ? "<span class='badge dry'>SECO</span>" : "<span class='badge wet'>HÚMEDO</span>") + "</p></div>";
  html += "<div class='card'><h3>💧 Parcela 2</h3><p><b>ADC:</b> " + String(valP2) + "</p><p><b>Estado:</b> " + String(valP2 >= UMBRAL_P2 ? "<span class='badge dry'>SECO</span>" : "<span class='badge wet'>HÚMEDO</span>") + "</p></div>";
  html += "<div class='card'><h3>🌱 Parcela 3</h3><p><b>ADC:</b> " + String(valP3) + "</p><p><b>Estado:</b> " + String(valP3 >= UMBRAL_P3 ? "<span class='badge dry'>SECO</span>" : "<span class='badge wet'>HÚMEDO</span>") + "</p></div>";
  html += "<div class='card'><h3>💧 Nivel de Agua</h3><p><b>Lectura ADC:</b> " + String(valAgua) + "</p></div>";
  html += "<div class='card'><h3>🔥 Gas / Humo</h3><p><b>MQ-2:</b> " + String(valGas) + "</p><p><b>Estado:</b> " + String(valGas >= UMBRAL_GAS ? "<span class='badge alert'>⚠️ ALERTA</span>" : "<span class='badge normal'>NORMAL</span>") + "</p></div>";
  html += "</div></body></html>";

  server.send(200, "text/html", html);
}

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_BOTON, INPUT_PULLUP);
  dht.begin();

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);

  servoParcela1.setPeriodHertz(50);
  servoParcela3.setPeriodHertz(50);
  servoDron.setPeriodHertz(50);

  pinMode(PIN_BOMBA_P2, OUTPUT);
  pinMode(PIN_SENSOR_AGUA, INPUT);

  apagarTodoActuadores();

  analogReadResolution(12);

  // Conexión WiFi
  Serial.print("\nConectando a WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 15) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Conectado!");
    Serial.print("🌐 Dashboard IP: http://");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n⚠️ Sin conexión WiFi. Modo Local.");
  }

  server.on("/", handleRoot);
  server.on("/activar_dron", handleActivarDron);
  server.begin();

  Serial.println("==================================================");
  Serial.println(" SmartRiego MX - Listo (Presione Botón GPIO12)   ");
  Serial.println("==================================================");
}

void loop() {
  server.handleClient(); // Atiende la petición web /activar_dron

  // --- LÓGICA DEL DRON (Prioritaria desde la Web) ---
  if (banderaDron) {
    Serial.println("🚁 [DRON] Desplegando dron por orden remota...");
    servoDron.attach(PIN_SERVO_DRON, 500, 2400);
    delay(100);
    servoDron.write(SERVO_DRON_ABIERTO);

    delay(4000);

    Serial.println("🚁 [DRON] Retornando a base...");
    servoDron.write(SERVO_CERRADO);
    delay(800);
    servoDron.detach();

    banderaDron = false;
  }

  // --- LÓGICA DEL BOTÓN FÍSICO ---
  if (digitalRead(PIN_BOTON) == LOW && (millis() - ultimoDebounce > 400)) {
    ultimoDebounce = millis();
    sistemaActivo = !sistemaActivo;

    if (sistemaActivo) {
      Serial.println("\n🟢 SISTEMA ACTIVADO");
    } else {
      Serial.println("\n🔴 SISTEMA PAUSADO");
      apagarTodoActuadores();
    }
  }

  // --- LECTURA DE TODOS LOS SENSORES ---
  tempAire = dht.readTemperature();
  humAire  = dht.readHumidity();
  valP1    = leerPromedioADC(PIN_SENSOR_P1);
  valP2    = leerPromedioADC(PIN_SENSOR_P2);
  valP3    = leerPromedioADC(PIN_SENSOR_P3);
  valGas   = leerPromedioADC(PIN_SENSOR_GAS);
  valAgua  = leerPromedioADC(PIN_SENSOR_AGUA); // Lectura del Sensor de Agua (GPIO 25)

  // --- MONITOREO SERIAL UNIFICADO CADA 4 SEGUNDOS ---
  // y envío de la lectura de las 3 parcelas reales, cada una a su propia
  // zona/device en el backend (misma temperatura de aire compartida, cada
  // una con su propia humedad de suelo).
  if (millis() - ultimoEnvioSerial >= 4000) {
    ultimoEnvioSerial = millis();

    Serial.println("\n=========================================================================================");
    Serial.printf("📊 [CLIMA] Temp: %.1f°C | Hum Aire: %.1f%%  ||  [GAS MQ-2]: %d [%s]  ||  [AGUA GPIO25]: %d\n",
                  tempAire, humAire, valGas, (valGas >= UMBRAL_GAS ? "⚠️ ALERTA" : "NORMAL"),
                  valAgua);
    Serial.println("-----------------------------------------------------------------------------------------");
    Serial.printf("🌾 Parcela 1: ADC %4d -> %-8s | 💧 Parcela 2: ADC %4d -> %-8s | 🌱 Parcela 3: ADC %4d -> %-8s\n",
                  valP1, (valP1 >= UMBRAL_P1 ? "[SECO]" : "[HÚMEDO]"),
                  valP2, (valP2 >= UMBRAL_P2 ? "[SECO]" : "[HÚMEDO]"),
                  valP3, (valP3 >= UMBRAL_P3 ? "[SECO]" : "[HÚMEDO]"));
    Serial.println("=========================================================================================");

    // ADC alto = seco -> % de humedad bajo; ADC bajo = húmedo -> % de humedad alto.
    float humedadPctP1 = constrain(map(valP1, 4095, 0, 0, 100), 0, 100);
    float humedadPctP2 = constrain(map(valP2, 4095, 0, 0, 100), 0, 100);
    float humedadPctP3 = constrain(map(valP3, 4095, 0, 0, 100), 0, 100);
    enviarLectura(humedadPctP1, tempAire, humAire, DEVICE_API_KEY_P1, true);
    enviarLectura(humedadPctP2, tempAire, humAire, DEVICE_API_KEY_P2, false);
    enviarLectura(humedadPctP3, tempAire, humAire, DEVICE_API_KEY_P3, false);
    consultarDronRemoto();
  }

  if (!sistemaActivo) return;

  // --- PARCELA 1 (Servo 1) ---
  // Circuito cerrado: además de estar seco localmente, el backend tiene que
  // autorizar el riego (servidorDiceRegar, actualizado en cada POST
  // /readings). Así el pronóstico de lluvia de Open-Meteo puede frenar un
  // riego aunque el sensor local ya haya cruzado el umbral.
  if (valP1 >= UMBRAL_P1 && !servidorDiceRegar) {
    Serial.println("🌧️ [P1] Seco localmente, pero el servidor dijo ESPERAR — no se riega.");
  }

  if (valP1 >= UMBRAL_P1 && servidorDiceRegar) {
    Serial.println("🔓 [P1] Abriendo Servo Parcela 1...");
    servoParcela1.attach(PIN_SERVO_P1, 500, 2400);
    servoParcela1.write(SERVO_ABIERTO);
    delay(5000);

    Serial.println("🔒 [P1] Cerrando Servo Parcela 1...");
    servoParcela1.write(SERVO_CERRADO);
    delay(500);
    servoParcela1.detach();

    // El DTO del backend exige durationMinutes entero >= 1 (no admite fracciones ni 0).
    enviarEventoRiego(1, DEVICE_API_KEY_P1);

    delay(2500);
  }

  // --- PARCELA 2 (Bomba a Presión) ---
  if (valP2 >= UMBRAL_P2) {
    Serial.println("⚡ [P2] Encendiendo Bomba Parcela 2...");
    digitalWrite(PIN_BOMBA_P2, HIGH);
    delay(5000);

    Serial.println("🛑 [P2] Apagando Bomba Parcela 2...");
    digitalWrite(PIN_BOMBA_P2, LOW);
    delay(3000);
    enviarEventoRiego(1, DEVICE_API_KEY_P2);
  } else {
    digitalWrite(PIN_BOMBA_P2, LOW);
  }

  // --- PARCELA 3 (Servo 2) ---
  if (valP3 >= UMBRAL_P3) {
    Serial.println("🔓 [P3] Abriendo Servo Parcela 3...");
    servoParcela3.attach(PIN_SERVO_P3, 500, 2400);
    servoParcela3.write(SERVO_ABIERTO);
    delay(5000);

    Serial.println("🔒 [P3] Cerrando Servo Parcela 3...");
    servoParcela3.write(SERVO_CERRADO);
    delay(500);
    servoParcela3.detach();
    enviarEventoRiego(1, DEVICE_API_KEY_P3);
    delay(2500);
  }

  delay(200);
}
