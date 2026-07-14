/**
 * Shared Capacitor / Android types for TAIS
 */

export type TriggerType =
  | "battery"
  | "charging"
  | "time"
  | "date"
  | "location"
  | "bluetooth"
  | "wifi"
  | "headset"
  | "motion"
  | "shake"
  | "flip"
  | "app_open"
  | "app_close"
  | "notification"
  | "nfc";

export type ActionType =
  | "notification"
  | "speak"
  | "vibrate"
  | "flashlight"
  | "open_app"
  | "close_app"
  | "volume"
  | "brightness"
  | "wifi"
  | "bluetooth"
  | "clipboard"
  | "launch_intent"
  | "http_request"
  | "file_operation";

export type PermissionCategory =
  | "sensor"
  | "connectivity"
  | "media"
  | "system"
  | "location"
  | "storage";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type ModelProvider =
  | "qwen"
  | "gemma"
  | "phi"
  | "smollm"
  | "tinyllama"
  | "custom";

export type ModelStatus =
  | "available"
  | "downloading"
  | "error"
  | "missing";

export type Theme = "light" | "dark" | "system";

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  battery: "Batarya",
  charging: "Şarj",
  time: "Zaman",
  date: "Tarih",
  location: "Konum",
  bluetooth: "Bluetooth",
  wifi: "Wi-Fi",
  headset: "Kulaklık",
  motion: "Hareket",
  shake: "Sarsıntı",
  flip: "Ters Çevirme",
  app_open: "Uygulama Aç",
  app_close: "Uygulama Kapat",
  notification: "Bildirim",
  nfc: "NFC",
};

export const ACTION_LABELS: Record<ActionType, string> = {
  notification: "Bildirim",
  speak: "Sesli Bildirim",
  vibrate: "Titreşim",
  flashlight: "El Feneri",
  open_app: "Uygulama Aç",
  close_app: "Uygulama Kapat",
  volume: "Ses",
  brightness: "Parlaklık",
  wifi: "Wi-Fi",
  bluetooth: "Bluetooth",
  clipboard: "Pano",
  launch_intent: "Intent",
  http_request: "HTTP İstek",
  file_operation: "Dosya İşlemi",
};

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  qwen: "Qwen",
  gemma: "Gemma",
  phi: "Phi",
  smollm: "SmolLM",
  tinyllama: "TinyLlama",
  custom: "Özel Model",
};

export const CATEGORY_LABELS: Record<PermissionCategory, string> = {
  sensor: "Sensörler",
  connectivity: "Bağlantı",
  media: "Medya",
  system: "Sistem",
  location: "Konum",
  storage: "Depolama",
};
