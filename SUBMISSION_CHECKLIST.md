# Ödev 6 — Teslim Kontrol Listesi

Durum etiketleri:
- **VERIFIED** — gereksinim karşılanıyor ve kanıtı depoda doğrulandı.
- **PARTIAL** — bir kısmı var, eksik kalan kısım "Eksik" sütununda yazıyor.
- **MISSING** — yapılmadı veya kanıtı yok.

Kontrol tarihi: 2 Kasım 2026 · Temel: `main` (`2dc5dc3`, AI Studio canlı tutor commit'leri dahil).

## Ödev gereksinimleri

| # | Gereksinim | Durum | Kanıt | Eksik |
|---|---|---|---|---|
| 1 | Kişiselleştirilmiş etkileşimli öğrenme deneyimi | **VERIFIED** | `src/components/OnboardingWindow.tsx`, `src/data/scenarioData.ts` (`PINNED_CARD_BY_ROLE`, `GOAL_CONFIG`), `src/utils/tutorLogic.ts` (`getMaxHintsForLevel`), `cypress/e2e/onboarding.cy.ts`, `cypress/e2e/regression.cy.ts` | Profil değişmezliği ve ODAK rozeti için otomatik test yok |
| 2 | Üç onboarding sorusu: seviye, rol, hedef | **VERIFIED** | `src/components/OnboardingWindow.tsx`, `cypress/e2e/onboarding.cy.ts`, `docs/design/app-s1-onboarding.png` | — |
| 3 | Tek kurgusal hastane yazılım olayı | **VERIFIED** | `src/data/scenarioData.ts` (`INCIDENT_FACTS`), [`spec.md` §4](spec.md#4-senaryo) | — |
| 4 | Üç mühendislik kararı: mimari, test, gizlilik | **VERIFIED** | `src/data/scenarioData.ts` (`DECISIONS.D1/D2/D3`), `cypress/e2e/paths.cy.ts` | — |
| 5 | Seçimlere göre en az iki son | **VERIFIED** | `src/utils/rules.ts` (`getEnding`), `src/components/ReportWindow.tsx`, `cypress/e2e/paths.cy.ts` (PATH-1 `SAFE_RECOVERY`, PATH-2..8 `UNSAFE_RECOVERY`) | — |
| 6 | Cevabı vermeden ipucu veren Sokratik AI tutor | **PARTIAL** | `server.ts` (`/api/tutor`, sistem istemi), `src/components/TutorWindow.tsx`, `src/utils/tutorLogic.ts`, `cypress/e2e/regression.cy.ts` (ipucu sızıntısı, guard), `cypress/e2e/tutor.cy.ts` | Canlı tutor (`gemini-3.5-flash-lite`, yedek `gemini-3.5-flash`) AI Studio'da D1–D3 için yalnızca elle denendi, kaydı yok; canlı model için otomatik test ve sızıntı ölçümü yok; sızdıran model yanıtıyla guard E2E testi (AE5) yok; karar sonrası açıklama modu yok |
| 7 | Beş test edilebilir kabul örneği ve durum diyagramı | **VERIFIED** | [`spec.md` §10](spec.md#10-kabul-örnekleri) (AE1–AE7), [`flow.mmd`](flow.mmd) (Mermaid sözdizimi `mermaid.parse` ile doğrulandı) | AE5'in otomatik testi yok |
| 8 | Google Stitch tasarımı, en az 3 mobil ekran | **VERIFIED** | `docs/design/stitch-canvas.png` (USER SETUP, INCIDENT DESKTOP, SYSTEM REPORT + tasarım sistemi), `public/assets/aistudio/Image_7_59a9cf5d.markdown`, [`DESIGN.md`](DESIGN.md), Stitch projesi: https://stitch.withgoogle.com/projects/3511043973186749017 | Stitch bağlantısının herkese açık olup olmadığı kontrol edilmedi |
| 9 | Çalışan Google AI Studio uygulaması | **VERIFIED** | Yayın: https://ai.studio/apps/8ce3ebbb-ef1a-4b5d-93c8-f8b75ee4c822 ([README](README.md)), `metadata.json`; yerelde `npm run dev` ile çalışıyor ve Cypress testleri geçiyor | Canlı tutor ve mobil tarayıcıda açılış kullanıcı tarafından doğrulandı; yayın bağlantısı bu kontrolde ayrıca açılmadı |
| 10 | 20 farklı öğrenci yanıtıyla değerlendirme | **PARTIAL** | `eval/tutor-test-cases.json` (20 girdi), `eval/tutor-results-v2.csv`, `eval/tutor-evaluation-v2.md`, [`eval/EVALUATION_STATUS.md`](eval/EVALUATION_STATUS.md) | Yalnızca kural tabanlı yedek motor ve otomatik puanlama (o sırada canlı model HTTP 403 veriyordu); canlı modelle tekrar, manuel anlamsal inceleme, ham ve gösterilen yanıt ayrımı ve guard FN/FP analizi yok; sonuçlar son düzeltmelerden önce üretildi |
| 11 | Tüm yolları kapsayan Cypress E2E testleri | **VERIFIED** | `cypress/e2e/paths.cy.ts` (8/8 yol), `cypress/e2e/rules.cy.ts`, `cypress/fixtures/paths.json`; son çalıştırma sonuçları [README › Testler](README.md#testler) | `JUSTIFY.dlg` Esc/arka plan davranışı ve tablet görünümü için test yok |
| 12 | Bir gerçek kullanıcı değerlendirmesi | **MISSING** | — | Oturum yapılmadı; `eval/real-user.md` yok |
| 13 | 60 saniyelik demo videosu | **VERIFIED** | `docs/demo/HUMAN-exe-demo.mp4` (60,9 sn, 780×1688, H.264; ffmpeg ile süre ve çözünürlük doğrulandı, kareleri incelendi), `docs/demo/README.md`, `scripts/record-demo.ts` | Ses ve sesli anlatım yok (altyazılı); canlı tutor eklenmeden önce yerel sunucudan kaydedildi, videoda tutor yedek modda. YouTube: https://youtube.com/shorts/xGhg52Bi7zU |
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
| Yayın ve demo bağlantıları | **VERIFIED** | README'nin başında |

## Teslimden önce yapılması gerekenler

1. Gerçek kullanıcı oturumunu yap ve gözlemleri `eval/real-user.md` dosyasına yaz.
2. 20 girdiyi canlı modelle yeniden çalıştır; ham ve gösterilen yanıtları kaydedip manuel anlamsal incelemeyi yap.
3. İsteğe bağlı: demo videosunu canlı tutor görünecek şekilde yeniden kaydet.

---

# Ödev 7 — The Primer v2

Kontrol tarihi: 6 Kasım 2026. Teslim formu: https://forms.gle/pr9QVEfLJuaFiXw39

| # | Gereksinim | Durum | Kanıt | Eksik |
|---|---|---|---|---|
| 1 | Spec, eval eşiği, 3 kabul örneği (eğitimden önce) | **VERIFIED** | `spec.md` §12 (commit `bf58914`, eğitimden önce) | — |
| 2 | En az 15 gerçek oturum, sözlük, `kaynak` | **PARTIAL** | `data/oturumlar.csv`, `data/SOZLUK.md` | 15 oturumun hepsi tek kişi, rastgele cevap; 3 farklı oyuncu yok. Belgelerde açıkça yazıldı |
| 3 | Tekrarlanabilir eğitim ve eval kapısı | **VERIFIED** | `train.py`, `tests/eval_kapisi.py` (4/4) | Yalnız bu makinede denendi |
| 4 | `model.onnx`, `config.json`, model kartı | **VERIFIED** | `model/` | — |
| 5 | HF reposu, commit'e sabit URL, `RELEASE.md` | **PARTIAL** | `RELEASE.md`, `scripts/hf_yayinla.py` | Model henüz Hugging Face'e yüklenmedi: `hf auth login` gerekiyor |
| 6 | Uygulamada çıkarım, davranış değişikliği | **VERIFIED** | `src/utils/riskModel.ts`, `DogrulaDialog.tsx`, `cypress/e2e/model.cy.ts` | Canlı AI Studio sürümüne eşitlenmeli |
| 7 | Diferansiyel test ve regresyon | **VERIFIED** | `tests/parite.py`, `tests/parite.json`, Cypress 57/57 | — |
| 8 | 60–90 sn demo, iki oyuncu | **VERIFIED** | `docs/demo/HUMAN-exe-model-demo.mp4` (64 sn, 780×1688) | Sessiz; YouTube bağlantısı henüz yok |
| 9 | Sınav tasarımı | **VERIFIED** | `SINAV_TASARIMI.md` | Taslak ajan tarafından yazıldı, sahibi tarafından gözden geçirilmeli |
| 10 | Ajan kullanımı beyanı | **VERIFIED** | README sonu | — |
| B | Bonus: kendi sunucuda tüketici | **PARTIAL** | `server.ts` `/api/risk`, `model.cy.ts` | Yerelde parite geçti; canlı dağıtımda doğrulanmadı |
