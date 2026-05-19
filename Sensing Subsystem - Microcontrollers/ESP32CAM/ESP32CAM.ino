#include "esp_camera.h"

// ======================================================
// AI THINKER ESP32-CAM PIN DEFINITIONS
// ======================================================

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5

#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ======================================================
// CONFIG
// ======================================================

// Arduino Pin 7 -> ESP32 GPIO13
#define TRIGGER_PIN 12

bool previousTriggerState = LOW;

// ======================================================
// SETUP
// ======================================================

void setup() {

  pinMode(TRIGGER_PIN, INPUT);

  Serial.begin(115200);

  // ====================================================
  // CAMERA CONFIG
  // ====================================================

  camera_config_t config;

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn  = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;

  config.pixel_format = PIXFORMAT_JPEG;

  // ====================================================
  // FRAME SETTINGS
  // ====================================================

  if (psramFound()) {

    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count = 2;

  } else {

    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }

  // ====================================================
  // INIT CAMERA
  // ====================================================

  esp_err_t err = esp_camera_init(&config);

  if (err != ESP_OK) {

    while (true) {

      Serial.println("image_size_bytes: 0");
      Serial.println("IMAGE_START");
      Serial.println("IMAGE_END");

      delay(5000);
    }
  }
}

// ======================================================
// LOOP
// ======================================================

void loop() {

  bool triggerState = digitalRead(TRIGGER_PIN);

  // Trigger only on rising edge
  if (true) {

    captureAndSendImage();
  }

  previousTriggerState = triggerState;

  delay(10);
}

// ======================================================
// CAPTURE + SEND
// ======================================================

void captureAndSendImage() {

  camera_fb_t * fb = esp_camera_fb_get();

  // ====================================================
  // CAPTURE FAILED
  // ====================================================

  if (!fb) {

    Serial.println("image_size_bytes: 0");
    Serial.println("IMAGE_START");
    Serial.println("IMAGE_END");

    return;
  }

  // ====================================================
  // SEND HEADER
  // ====================================================

  Serial.print("image_size_bytes: ");
  Serial.println(fb->len);

  Serial.println("IMAGE_START");

  // ====================================================
  // SEND RAW JPEG BYTES
  // ====================================================

  Serial.println("[JPEG DATA]");

  Serial.println();
  Serial.println("IMAGE_END");

  // ====================================================
  // RETURN BUFFER
  // ====================================================

  esp_camera_fb_return(fb);
}