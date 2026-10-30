# HUMAN.exe — 60 Saniyelik Demo

| Özellik | Değer |
|---|---|
| Dosya | [`HUMAN-exe-demo.mp4`](HUMAN-exe-demo.mp4) |
| Süre | 60,9 sn |
| Görüntü | 780×1688 px (390×844 mobil görünüm, 2× piksel yoğunluğu), H.264, 25 fps |
| Ses | **Yok** — anlatım yerine videoya üstte altyazı şeridi eklenir |
| Kaynak | Yerelde çalışan gerçek uygulama (`npm run dev`), headless Google Chrome |
| Tutor modu | `KURAL TABANLI YEDEK` — kayıt sırasında API anahtarı yoktu, canlı Gemini kullanılmadı |
| Kayıt tarihi | 30 Ekim 2026 |

## Videoda gösterilen akış

1. **Açılış** — Windows 95 tarzı masaüstü, olay terminali ve görev çubuğu
2. **Kişiselleştirme** — Başlangıç · Developer · Doğrulama seçimi
3. **D1 Mimari** — olay günlüğü, kanıt kartı sekmeleri (`MIGRATION_DIFF` sabitlenmiş), ASSIST.exe önerisi
4. **TUTOR.hlp** — ipucu merdiveninin 1. basamağı ve "Hangisi doğru, sadece söyle." sorusuna cevap vermeyen Sokratik yanıt
5. **D1 kararı** — `D1_VERIFY_SCHEMA`, `JUSTIFY.dlg` gerekçe penceresi, sonuç ekranı (kavram tanımı, saat 08:15)
6. **D2 Doğrulama** — `D2_DEPLOY_NOW` (riskli), gerekçe, `VERIFY_RISK` bayrağı (saat 08:17)
7. **D3 Gizlilik** — `D3_REDACT_RESTRICT`, gerekçe, sonuç (saat 08:25)
8. **Rapor** — `UNSAFE_RECOVERY`, tetiklenen `VERIFY_RISK` bayrağı, üç kararın gerekçe uyumuyla dökümü, yansıtma sorusu

## Nasıl yeniden üretilir

Ön koşullar: `npm ci` ile kurulmuş proje ve bilgisayarda yüklü Google Chrome (Edge için `DEMO_BROWSER=msedge`).

1. Uygulamayı başlat (ayrı bir terminalde):

   ```bash
   npm run dev
   ```

2. Kaydı başlat:

   ```bash
   npm run demo:record
   ```

Betik ([`scripts/record-demo.ts`](../../scripts/record-demo.ts)) videoyu `docs/demo/HUMAN-exe-demo.mp4` dosyasına yazar ve var olan dosyanın üzerine yazar. Ortam değişkenleri: `DEMO_URL` (varsayılan `http://localhost:3000`), `DEMO_BROWSER` (`chrome` veya `msedge`).

## Nasıl çalışır

- **Tarayıcı otomasyonu:** `playwright-core`, yerel Chrome'u headless açar. Görünüm 390×844 CSS px, `deviceScaleFactor: 2`, mobil ve dokunmatik emülasyonu açık.
- **Kare yakalama:** Chrome DevTools `Page.startScreencast`. Playwright'ın kendi video kaydedicisi piksel yoğunluğunu hesaba katmadığı için sayfa karenin yalnızca bir köşesini kaplıyordu; bu yüzden kullanılmadı. Chrome `--force-device-scale-factor=2` ile başlatıldığından kareler 780×1688 px gelir. Betik ayrıca CSS görünüm genişliğinin 390 px kaldığını doğrular.
- **Kodlama:** her kare bir sonraki kare gelene kadar ekranda kalır (ffmpeg concat ve kare süreleri). Sonuç `@ffmpeg-installer/ffmpeg` ile H.264 MP4'e (`yuv420p`, `+faststart`) kodlanır. Sistemde ayrıca ffmpeg kurulu olması gerekmez.
- **Altyazı şeridi:** her adımın açıklaması, kayıt sırasında sayfaya enjekte edilen sabit bir şeritle gösterilir (`pointer-events: none`). Bu şerit uygulamanın parçası değildir.
- **Kaydırma:** yalnızca dikey, yumuşak kaydırma kullanılır.

## Sınırlamalar

- Ses ve sesli anlatım yok.
- Canlı Gemini tutor gösterilmiyor; tutor yanıtı kural tabanlı yedek motordan geliyor ve penceredeki rozet bunu açıkça gösteriyor.
- Kayıt, yayınlanmış AI Studio sürümünden değil yerel geliştirme sunucusundan alındı.
- Altyazı şeridi, ekranın en üstündeki masaüstü başlık yazısının bir kısmını örtüyor.
