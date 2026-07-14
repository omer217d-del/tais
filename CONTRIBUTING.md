# TAIS'e Katkıda Bulunma

TAIS'e katkıda bulunmak istediğiniz için teşekkürler! Bu belge projeye nasıl katkıda bulunabileceğinizi açıklar.

## Davranış Kuralları

Bu projeye katılmadan önce lütfen [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) belgesini okuyun.

## Nasıl Katkıda Bulunabilirim?

### Hata Bildirme

1. [GitHub Issues](https://github.com/your-org/tais/issues) sayfasında var olan issue'ları kontrol edin
2. Hata henüz bildirilmemişse [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) kullanarak yeni bir issue açın
3. Mümkün olduğunca fazla detay ekleyin: Android versiyonu, cihaz modeli, yeniden üretme adımları

### Özellik Önerisi

1. Önce bir issue açarak özelliği tartışın
2. Projenin genel mimarisiyle uyumlu olup olmadığını değerlendirin
3. [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) kullanın

### Kod Katkısı

#### Geliştirme Ortamı Kurulumu

```bash
git clone https://github.com/your-org/tais.git
cd tais
pnpm install
pnpm --filter @workspace/api-spec run codegen
```

#### Branch Stratejisi

- `main` — kararlı, üretim sürümü
- `develop` — aktif geliştirme
- `feature/xyz` — yeni özellikler
- `fix/xyz` — hata düzeltmeleri
- `chore/xyz` — bakım işlemleri

#### Pull Request Süreci

1. `develop` branch'inden fork edin
2. Feature branch oluşturun: `git checkout -b feature/my-feature`
3. Değişikliklerinizi yapın
4. Testlerinizi çalıştırın: `pnpm run typecheck`
5. Commit edin: `git commit -m 'feat: add my feature'`
6. Branch'inizi push edin: `git push origin feature/my-feature`
7. Pull Request açın

## Commit Mesajı Kuralları

[Conventional Commits](https://www.conventionalcommits.org/) formatını kullanıyoruz:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Tipler:**
- `feat`: Yeni özellik
- `fix`: Hata düzeltmesi
- `docs`: Sadece dokümantasyon
- `style`: Kod stili (boşluk, format, vb.)
- `refactor`: Kod yeniden yapılandırma
- `perf`: Performans iyileştirmesi
- `test`: Test ekleme/düzeltme
- `chore`: Build, CI veya araç güncellemesi

**Örnekler:**
```
feat(engine): add NFC trigger support
fix(bridge): handle missing flashlight permission gracefully
docs(readme): update model installation instructions
```

## Kod Standartları

### TypeScript

- Strict mode aktif — `any` kullanmayın
- Her public fonksiyon ve tip için JSDoc
- Interface'leri type'lara tercih edin
- Barrel exportlar kullanın (`src/index.ts`)

### Kotlin

- SOLID prensipleri
- Coroutine tercih edin, thread'den kaçının
- `Log.e()` yerine structured logging kullanın
- Data class'lar için copy() pattern kullanın

### Genel

- Yorum satırı olarak `TODO`, `FIXME` bırakmayın — issue açın
- Magic number kullanmayın — named constant tercih edin
- Her özellik için unit test yazın

## Plugin Geliştirme

Yeni bir plugin ekliyorsanız:

1. `android/app/src/main/java/com/tais/app/plugins/` altında Kotlin class oluşturun
2. Plugin manifest şemasını `PluginManifest` data class'ına uydurun
3. `AutomationValidator`'a gereken izinleri ekleyin
4. `AndroidBridge.executeAction()` veya `registerTrigger()` metodlarını güncelleyin
5. TypeScript tarafında `src/capacitor/types.ts` dosyasını güncelleyin

## Lisans

Katkılarınız [MIT Lisansı](LICENSE) altında yayınlanacaktır.
