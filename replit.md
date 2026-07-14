# TAIS — Terminal AI System

Telefonunu doğal dille programlayan, tamamen yerel çalışan, LLM destekli Android otomasyon platformu.

## Run & Operate

- `pnpm --filter @workspace/tais run dev` — Web arayüzü (port dinamik)
- `pnpm --filter @workspace/api-server run dev` — API sunucusu (port 8080)
- `pnpm run typecheck` — Tam TypeScript kontrolü
- `pnpm run build` — Typecheck + tüm paketleri derle
- `pnpm --filter @workspace/api-spec run codegen` — OpenAPI'dan hook ve Zod şemalarını yeniden oluştur
- `pnpm --filter @workspace/db run push` — DB şemasını gönder (sadece geliştirme)
- `export PORT=3000 BASE_PATH=/ && pnpm --filter @workspace/tais run build` — Web'i derle
- Required env: `DATABASE_URL` — Postgres bağlantı dizesi

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS + Framer Motion
- API: Express 5 + Drizzle ORM + PostgreSQL
- Mobile: Capacitor (Android)
- Native Android: Kotlin + llama.cpp JNI
- AI Model: GGUF format (llama.cpp)
- Validation: Zod (zod/v4) + drizzle-zod
- Codegen: Orval (OpenAPI → React Query hooks + Zod)

## Where things live

- `artifacts/tais/` — React + Vite frontend (7 ekran)
- `artifacts/tais/src/capacitor/` — TypeScript ↔ Android bridge
- `artifacts/tais/capacitor.config.ts` — Capacitor yapılandırması
- `artifacts/api-server/` — Express API sunucusu
- `artifacts/api-server/src/routes/` — Tüm API route handler'ları
- `lib/api-spec/openapi.yaml` — OpenAPI spec (kaynak doğrusu)
- `lib/api-client-react/src/generated/` — Orval üretilmiş React Query hook'ları
- `lib/api-zod/src/generated/` — Orval üretilmiş Zod şemaları
- `lib/db/src/schema/` — Drizzle ORM şemaları (7 tablo)
- `android/` — Native Android projesi
- `android/app/src/main/java/com/tais/app/` — Tüm Kotlin kaynak kodu
- `.github/workflows/ci.yml` — GitHub Actions CI/CD pipeline

## Architecture Decisions

- **AI soyutlama katmanı**: LLM asla Android API çağıramaz. Tüm komutlar AutomationValidator → AutomationEngine → AndroidBridge zincirinden geçer.
- **GGUF-only model formatı**: llama.cpp ile maksimum uyumluluk ve quantization esnekliği.
- **Plugin-first tasarım**: Her trigger ve action PluginManifest tabanlı — core engine değiştirmeden genişletilebilir.
- **Foreground Service**: TaisService ile arka planda kesintisiz trigger izleme.
- **OpenAPI-first**: Tek doğru kaynak lib/api-spec/openapi.yaml; frontend ve backend Orval codegen ile senkronize.
- **Offline-first**: Tüm AI inference yerel, cloud zorunlu değil.

## Product

- **Chat ekranı**: Doğal dil komutları → AI → otomasyon oluşturma
- **Automations**: Tüm otomasyonları listeleme, toggle, silme, istatistikler
- **Plugins**: Plugin kurma, yönetme, toggle
- **Models**: AI model yönetimi, desteklenen model listesi, indirme, aktivasyon
- **Permissions**: Android izin durumu, grup görünümü, toggle
- **Logs**: Sistem logları, seviye filtreleme, temizleme
- **Settings**: Tema, AI parametreleri, developer modu, foreground servis

## User Preferences

_Kullanıcı tercihleri burada biriktirilecek._

## Gotchas

- Codegen sonrası `pnpm run typecheck:libs` çalıştır — aksi halde leaf artifact tip kontrolü stale olabilir.
- Android build için Java 17+ gerekli.
- llama.cpp JNI için llama.cpp git submodule olarak eklenmeli: `git submodule add https://github.com/ggerganov/llama.cpp.git`
- Capacitor sync için önce web build çalıştır: `export PORT=3000 BASE_PATH=/ && pnpm --filter @workspace/tais run build`
- Android manifest'te namespace ve tools xmlns ayrı satırda tanımlı — Gradle 8+ gereksinimi.
- API route'lar `/api` prefix altında. Health: `/api/healthz`.
- Tüm routes `artifacts/api-server/src/routes/` altında — index.ts tüm alt router'ları birleştirir.

## Pointers

- pnpm workspace yapısı için `pnpm-workspace` skill'ine bak
- Android bridge detayları: `android/app/src/main/java/com/tais/app/bridge/AndroidBridge.kt`
- llama.cpp JNI stub: `android/app/src/main/cpp/llama_jni.cpp`
- GitHub Actions pipeline: `.github/workflows/ci.yml`
