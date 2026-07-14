# TAIS — Terminal AI System

> **Telefonunu doğal dille programla.**

TAIS, doğal dil komutlarını gerçek Android otomasyonlarına dönüştüren, tamamen yerel çalışan, açık kaynaklı bir Android otomasyon platformudur.

```
"Şarj %20 olunca bana sesli haber ver."
"Telefonu sallayınca feneri aç."
"Eve gelince Wi-Fi aç."
"Her gece saat 22:00'de Rahatsız Etme modunu aç."
```

---

## Özellikler

| Özellik | Detay |
|---------|-------|
| **Yerel AI** | llama.cpp — internet gerekmez |
| **GGUF Model Desteği** | Qwen, Gemma, Phi, SmolLM, TinyLlama |
| **Tetikleyiciler** | Batarya, Zaman, Konum, Wi-Fi, Bluetooth, Sarsıntı, NFC ve daha fazlası |
| **Aksiyonlar** | Bildirim, TTS, Titreşim, Fener, Ses, Parlaklık, HTTP ve daha fazlası |
| **Plugin Sistemi** | Tamamen modüler, manifest tabanlı |
| **Offline** | Bulut bağlantısı zorunlu değil |
| **Açık Kaynak** | MIT Lisansı |

---

## Mimari

```
Kullanıcı (Doğal Dil)
        ↓
   Web UI (React + Vite + TypeScript)
        ↓
   Capacitor Bridge (TypeScript)
        ↓
   TaisBridgePlugin (Kotlin / Capacitor)
        ↓
   AutomationValidator (Güvenlik Katmanı)
        ↓
   AutomationEngine (Orkestratör)
        ↓
   AndroidBridge (Android API'leri)
```

**Güvenlik prensibi:** AI hiçbir zaman Android API'lerine doğrudan erişemez. Her işlem `AutomationValidator` üzerinden geçer.

---

## Teknoloji Yığını

### Frontend
- **React 18** + **TypeScript** (strict mode)
- **Vite** — geliştirme sunucusu ve build
- **Tailwind CSS** — stil
- **TanStack Query** — veri yönetimi
- **Framer Motion** — animasyonlar

### Mobil Katman
- **Capacitor** — web ↔ native köprüsü

### Native Android
- **Kotlin** — tüm native kod
- **AlarmManager** — zaman tetikleyicileri
- **WorkManager** — arka plan görevleri
- **TextToSpeech** — sesli bildirimler

### Yerel AI
- **llama.cpp** — GGUF model çalıştırıcı (JNI binding)
- Desteklenen formatlar: **GGUF** (Q4_K_M önerilir)

### Backend (Geliştirme/Preview)
- **Express 5** + **Node.js 24**
- **PostgreSQL** + **Drizzle ORM**
- **Zod** — şema doğrulama

---

## Hızlı Başlangıç

### Gereksinimler
- Node.js 20+
- pnpm 9+
- Java 17+ (Android build için)
- Android Studio (opsiyonel)

### Kurulum

```bash
# Depoyu klonla
git clone https://github.com/your-org/tais.git
cd tais

# Bağımlılıkları yükle
pnpm install

# API tiplerini oluştur
pnpm --filter @workspace/api-spec run codegen

# Web arayüzünü başlat
pnpm --filter @workspace/tais run dev

# API sunucusunu başlat (ayrı terminal)
pnpm --filter @workspace/api-server run dev
```

### Android Build

```bash
# Web projesini derle
export PORT=3000 BASE_PATH=/
pnpm --filter @workspace/tais run build

# Capacitor sync
npx cap sync android

# Android Studio'da aç
npx cap open android
```

### APK Build

```bash
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Model Kurulumu

Uygulama ilk açıldığında, eğer model bulunamazsa model kurulum ekranı gösterilir.

### Desteklenen Modeller

| Model | Boyut | Öneri |
|-------|-------|-------|
| Qwen2.5 1.5B Q4_K_M | ~986 MB | Çoğu cihaz için |
| Gemma 2 2B Q4_K_M | ~1.58 GB | Yüksek doğruluk |
| Phi-3.5 Mini Q4_K_M | ~2.39 GB | Güçlü cihazlar |
| SmolLM2 360M Q4_K_M | ~229 MB | Zayıf cihazlar |
| TinyLlama 1.1B Q4_K_M | ~669 MB | Dengeli |

### Model Yükleme Seçenekleri
1. Uygulama içinden desteklenen modeller listesinden indir
2. Kendi GGUF modelini dosya seçici ile yükle

---

## Plugin Sistemi

Her özellik bir plugin olarak paketlenebilir:

```json
{
  "id": "com.example.myplugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Plugin açıklaması",
  "author": "Geliştirici",
  "permissions": ["android.permission.CAMERA"],
  "triggers": ["shake", "flip"],
  "actions": ["flashlight", "vibrate"],
  "minAppVersion": "1.0.0"
}
```

---

## Katkıda Bulunma

[CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bakın.

---

## Lisans

[MIT](LICENSE) — Tüm haklarla özgürce kullanın.

---

## Yol Haritası

- [ ] Room DB ile yerel veri saklama
- [ ] llama.cpp JNI tam entegrasyon
- [ ] Bluetooth LE tetikleyicileri
- [ ] IFTTT / Webhook entegrasyonu
- [ ] Plugin Marketplace
- [ ] Wear OS desteği
- [ ] iOS (Capacitor) desteği
