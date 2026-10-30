# Ödev 6 — Teslim Kontrol Listesi

Durum etiketleri:
- **VERIFIED** — gereksinim karşılanıyor ve kanıtı depoda doğrulandı.
- **PARTIAL** — bir kısmı var, eksik kalan kısım "Eksik" sütununda yazıyor.
- **MISSING** — yapılmadı veya kanıtı yok.

Kontrol tarihi: 30 Ekim 2026 · Dal: `fix/critical-review-issues` (son push edilen commit `e7066fc`; belgeler, demo ve Tutor düğmesi düzeltmesi henüz commit edilmedi).

## Ödev gereksinimleri

| # | Gereksinim | Durum | Kanıt | Eksik |
|---|---|---|---|---|
| 1 | Kişiselleştirilmiş etkileşimli öğrenme deneyimi | **VERIFIED** | `src/components/OnboardingWindow.tsx`, `src/data/scenarioData.ts` (`PINNED_CARD_BY_ROLE`, `GOAL_CONFIG`), `src/utils/tutorLogic.ts` (`getMaxHintsForLevel`), `cypress/e2e/onboarding.cy.ts`, `cypress/e2e/regression.cy.ts` | Profil değişmezliği ve ODAK rozeti için otomatik test yok |
| 2 | Üç onboarding sorusu: seviye, rol, hedef | **VERIFIED** | `src/components/OnboardingWindow.tsx`, `cypress/e2e/onboarding.cy.ts`, `docs/design/app-s1-onboarding.png` | — |
| 3 | Tek kurgusal hastane yazılım olayı | **VERIFIED** | `src/data/scenarioData.ts` (`INCIDENT_FACTS`), [`spec.md` §4](spec.md#4-senaryo) | — |
| 4 | Üç mühendislik kararı: mimari, test, gizlilik | **VERIFIED** | `src/data/scenarioData.ts` (`DECISIONS.D1/D2/D3`), `cypress/e2e/paths.cy.ts` | — |
| 5 | Seçimlere göre en az iki son | **VERIFIED** | `src/utils/rules.ts` (`getEnding`), `src/components/ReportWindow.tsx`, `cypress/e2e/paths.cy.ts` (PATH-1 `SAFE_RECOVERY`, PATH-2..8 `UNSAFE_RECOVERY`) | — |
| 6 | Cevabı vermeden ipucu veren Sokratik AI tutor | **PARTIAL** | `server.ts` (`/api/tutor`, sistem istemi), `src/components/TutorWindow.tsx`, `src/utils/tutorLogic.ts`, `cypress/e2e/regression.cy.ts` (ipucu sızıntısı, guard), `cypress/e2e/tutor.cy.ts` | Canlı Gemini hiç çalışmadı (HTTP 403); sızdıran model yanıtıyla guard E2E testi (AE5) yok; karar sonrası açıklama modu yok |
| 7 | Beş test edilebilir kabul örneği ve durum diyagramı | **VERIFIED** | [`spec.md` §10](spec.md#10-kabul-örnekleri) (AE1–AE7), [`flow.mmd`](flow.mmd) (Mermaid sözdizimi `mermaid.parse` ile doğrulandı) | AE5'in otomatik testi yok |
| 8 | Google Stitch tasarımı, en az 3 mobil ekran | **VERIFIED** | `docs/design/stitch-canvas.png` (USER SETUP, INCIDENT DESKTOP, SYSTEM REPORT + tasarım sistemi), `public/assets/aistudio/Image_7_59a9cf5d.markdown`, [`DESIGN.md`](DESIGN.md), Stitch projesi: https://stitch.withgoogle.com/projects/3511043973186749017 | Stitch bağlantısının herkese açık olup olmadığı kontrol edilmedi |
| 9 | Çalışan Google AI Studio uygulaması | **PARTIAL** | `metadata.json` (AI Studio uygulama tanımı), yerelde `npm run dev` ile çalışıyor ve 35 Cypress testi geçiyor; `docs/demo/HUMAN-exe-demo.mp4` çalışan uygulamadan kaydedildi | Yayınlanmış AI Studio bağlantısı depoda yok; canlı Gemini çağrısı çalışmadı |
| 10 | 20 farklı öğrenci yanıtıyla değerlendirme | **PARTIAL** | `eval/tutor-test-cases.json` (20 girdi), `eval/tutor-results-v2.csv`, `eval/tutor-evaluation-v2.md`, [`eval/EVALUATION_STATUS.md`](eval/EVALUATION_STATUS.md) | Yalnızca kural tabanlı yedek motor ve otomatik puanlama; canlı model, manuel anlamsal inceleme, ham ve gösterilen yanıt ayrımı ve guard FN/FP analizi yok; sonuçlar son düzeltmelerden önce üretildi |
| 11 | Tüm yolları kapsayan Cypress E2E testleri | **VERIFIED** | `cypress/e2e/paths.cy.ts` (8/8 yol), `cypress/e2e/rules.cy.ts`, `cypress/fixtures/paths.json`; son çalıştırma 35/35 geçti ([README › Testler](README.md#testler)) | Yedek mod rozeti, `JUSTIFY.dlg` Esc/arka plan davranışı ve tablet görünümü için test yok |
| 12 | Bir gerçek kullanıcı değerlendirmesi | **MISSING** | — | Oturum yapılmadı; `eval/real-user.md` yok |
| 13 | 60 saniyelik demo videosu | **VERIFIED** | `docs/demo/HUMAN-exe-demo.mp4` (60,9 sn, 780×1688, H.264; ffmpeg ile süre ve çözünürlük doğrulandı, kareleri incelendi), `docs/demo/README.md`, `scripts/record-demo.ts` | Ses ve sesli anlatım yok (altyazılı); yerel sunucudan ve yedek tutor moduyla kaydedildi |
| 14 | Bilinçli olarak dışlanan 3 özelliği belgeleyen README | **VERIFIED** | [`README.md` › Bilinçli olarak dışlanan üç özellik](README.md#bilinçli-olarak-dışlanan-üç-özellik) | — |

## Teslim dosyaları

| Dosya | Durum | Not |
|---|---|---|
| `spec.md` | **VERIFIED** | v2.2, uygulanan davranışa göre güncellendi |
| `flow.mmd` | **VERIFIED** | `spec.md` §9 ile tutarlı |
| `README.md` | **VERIFIED** | Yeni |
| `DESIGN.md` | **VERIFIED** | Yeni; görseller `docs/design/` altında |
| `eval/EVALUATION_STATUS.md` | **VERIFIED** | Yeni; eval raporlarının başına uyarı notu eklendi |
| `IMPLEMENTATION_CHECKLIST.md` | — | v2.1 planlama belgesi; güncellenmedi |
| `docs/demo/` | **VERIFIED** | Demo videosu ve yeniden üretim talimatı |
| Yayın bağlantısı | **MISSING** | AI Studio yayınından sonra README'ye eklenmeli |

## Teslimden önce yapılması gerekenler

1. Gerçek kullanıcı oturumunu yap ve gözlemleri `eval/real-user.md` dosyasına yaz.
2. Uygulamayı AI Studio'da yayınla, mobil bağlantıyı README'ye ekle.
3. Mümkünse canlı Gemini erişimini aç ve 20 girdiyi canlı modelle yeniden çalıştırıp manuel anlamsal incelemeyi yap. Mümkün değilse bu sınırlamayı teslimde açıkça belirt.
4. Teslim tarihini ders platformundan teyit et.
5. Bu belgeleri commit edip push et; PR #1'i gözden geçirip `main` dalına merge et.
