# Changelog

TAIS projesindeki tüm önemli değişiklikler bu dosyada belgelenir.

Format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına,
versiyonlama ise [Semantic Versioning](https://semver.org/spec/v2.0.0.html) standardına uygundur.

## [Unreleased]

### Eklendi
- Tam modüler plugin sistemi ve PluginManifest yapısı
- 15 tetikleyici tipi: battery, charging, time, date, location, bluetooth, wifi, headset, motion, shake, flip, app_open, app_close, notification, nfc
- 14 aksiyon tipi: notification, speak, vibrate, flashlight, open_app, close_app, volume, brightness, wifi, bluetooth, clipboard, launch_intent, http_request, file_operation
- llama.cpp JNI entegrasyon altyapısı (LlamaManager)
- AutomationParser: LLM çıktısını JSON veya heuristik yöntemle ayrıştırır
- AutomationValidator: AI ile Android API'leri arasında güvenlik katmanı
- AutomationEngine: Tetikleyici kayıt ve aksiyon yürütme orkestratörü
- AndroidBridge: Tüm Android API çağrılarının tek giriş noktası
- TaisService: Foreground Service ile arka plan çalışma
- TaisBridgePlugin: Capacitor → Kotlin köprüsü
- BatteryTriggerHandler: Broadcast receiver tabanlı batarya izleme
- MotionTriggerHandler: Accelerometer tabanlı sarsıntı/çevirme tespiti
- TimeTriggerHandler: AlarmManager tabanlı zaman tetikleyicileri
- Web arayüzü: Chat, Automations, Plugins, Models, Permissions, Logs, Settings ekranları
- Material Design 3 ilhamlı terminal teması
- GitHub Actions CI/CD: Lint → Typecheck → Build → Capacitor Sync → Android APK
- Otomatik release workflow (main branch + "release:" prefix commit)

## [0.1.0] - 2026-07-14

### Eklendi
- İlk proje yapısı oluşturuldu
- pnpm workspace monorepo yapısı
- React + Vite + TypeScript frontend scaffolding
- Express 5 + Drizzle ORM backend
- OpenAPI spec + Orval codegen pipeline
- Capacitor entegrasyon altyapısı

[Unreleased]: https://github.com/your-org/tais/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/tais/releases/tag/v0.1.0
