# HUMAN.exe — The Accountability Protocol

Kurgusal bir hastane randevu sistemi olayında, yapay zekâ asistanının (ASSIST.exe) önerilerini **kanıta dayanarak değerlendirmeyi, kararı gerekçelendirmeyi ve sorumluluğu üstlenmeyi** öğreten, Windows 95/98 görünümlü etkileşimli bir yazılım mühendisliği simülasyonu. SE Primer ("Yazılım Mühendisliği, Oynanan Bir Kitap") ödevi için hazırlanmıştır.

> Tüm kişiler, sistemler ve veriler kurgusaldır. Bu bir öğrenme simülasyonudur; gerçek operasyonel, tıbbi veya hukuki tavsiye değildir.

| Belge | İçerik |
|---|---|
| [`spec.md`](spec.md) | Uygulanan spesifikasyon, karar modeli, kabul örnekleri |
| [`flow.mmd`](flow.mmd) | Durum diyagramı (Mermaid) |
| [`DESIGN.md`](DESIGN.md) | Tasarım yaklaşımı, Stitch ekranları |
| [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md) | Ödev gereksinimlerinin durumu ve kanıtları |
| [`eval/EVALUATION_STATUS.md`](eval/EVALUATION_STATUS.md) | Tutor değerlendirmesinin gerçek durumu |

**Yayınlanmış uygulama bağlantısı:** henüz bu depoda yok (bkz. [Sınırlamalar](#sınırlamalar)).
**Demo videosu:** [`docs/demo/HUMAN-exe-demo.mp4`](docs/demo/HUMAN-exe-demo.mp4) — 60,9 sn, 390×844 mobil görünüm, otomatik tarayıcı kaydı, **sessiz** (altyazılı). Yeniden üretim: [`docs/demo/README.md`](docs/demo/README.md).

---

## Kurulum

Paket yöneticisi olarak **npm** kullanılır; tek kilit dosyası `package-lock.json`'dır.

Doğrulanan ortam: Windows 11, Node.js 24.22.1, npm 11.17.0.

```bash
npm ci
```

İsteğe bağlı canlı tutor için `.env.example` dosyasını `.env` olarak kopyalayıp `GEMINI_API_KEY` değerini girin. Anahtar yoksa tutor otomatik olarak kural tabanlı yedek moda geçer; oyunun geri kalanı anahtarsız çalışır. `.env` dosyaları `.gitignore` ile depo dışında tutulur.

> npm 11, paketlerin kurulum betiklerini varsayılan olarak çalıştırmaz. Cypress çalıştırılabilir dosyası makinede yoksa `npx cypress install` ile indirilebilir.

## npm komutları

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Express sunucusunu ve Vite geliştirme ara katmanını başlatır: http://localhost:3000 |
| `npm run build` | Üretim derlemesi (`dist/`) |
| `npm start` | Sunucuyu başlatır; `NODE_ENV=production` ortam değişkeni ayarlıysa `dist/` klasörünü sunar, değilse `dev` ile aynı davranır |
| `npm run lint` | TypeScript kontrolü (`tsc --noEmit`) |
| `npm run test:cypress` | Tüm Cypress testlerini headless çalıştırır — **önce `npm run dev` çalışıyor olmalı** (`baseUrl: http://localhost:3000`) |
| `npm run cypress:open` | Cypress arayüzü |
| `npx tsx scripts/test-guard-regression.ts` | Guard ve yedek tutor regresyon betiği |
| `npm run demo:record` | 60 sn demo videosunu yeniden kaydeder (`npm run dev` çalışıyor olmalı; yerel Chrome gerekir) — bkz. [`docs/demo/README.md`](docs/demo/README.md) |

## Oyun akışı

1. **Profil:** seviye (Başlangıç / Orta / İleri), rol (Developer / QA / Technical Lead), öğrenme hedefi (Doğrulama / Risk / Gizlilik). Üçü seçilmeden başlatılamaz.
2. **Üç karar:** D1 Mimari (geri alma), D2 Doğrulama (acil yama), D3 Gizlilik (log paylaşımı). Her kararda kanıt kartları, ASSIST.exe önerisi ve iki seçenek vardır.
3. **Onay ve gerekçe:** `Kararı Onayla` geri alınamaz; ardından `JUSTIFY.dlg` penceresinde üç gerekçeden biri seçilir.
4. **Sonuç:** simüle sonuç, mühendislik ilkesi, güncel saat ve (riskliyse) risk bayrağı.
5. **Rapor:** `SAFE_RECOVERY` (bayrak yok) veya `UNSAFE_RECOVERY`; tetiklenen bayraklar, gerekçe uyumu, yansıtma sorusu.
6. **Yeniden başlatma:** onay penceresiyle profil ekranına döner.

8 yolun tamamı ve beklenen saatleri: [`spec.md` §5](spec.md#5-karar-modeli-deterministik). Simüle saat seçimlerin süre maliyetleri toplanarak ilerler (08:00 başlangıç).

## Kişiselleştirme

Profil kararları ve sonu değiştirmez; öğrenme davranışını değiştirir.

| Boyut | Değişen davranış |
|---|---|
| Seviye | İpucu basamağı sayısı (3/2/1), sözlük terimlerinin satır içi ya da düğmeyle gösterilmesi, sonuçta tanım (Başlangıç) veya ödünleşim sorusu (İleri), canlı tutor kelime sınırı |
| Rol | Her kararda ilk sıraya sabitlenen kanıt kartı (ör. Technical Lead için D3'te `DATA_POLICY`), yedek tutor çerçevesi |
| Hedef | ODAK rozeti alan karar, raporda genişletilmiş değerlendirme, yansıtma sorusu |

## Tutor mimarisi

```
TutorWindow (istemci)
 ├─ "İpucu İste"  → scenarioData.hintLadder (deterministik, seviyeye göre sınırlı)
 └─ serbest metin → POST /api/tutor (server.ts, 8 sn zaman aşımı)
                     ├─ GEMINI_API_KEY var → gemini-3.8-flash + Sokratik sistem istemi
                     │                       → guard (checkForbiddenGuard) + soru kontrolü
                     │                       → takılırsa ipucu basamağı gösterilir
                     └─ anahtar yok / hata / zaman aşımı
                        → istemci: generateSocraticResponse (kural tabanlı yedek)
```

- API anahtarı yalnızca sunucuda tutulur.
- Guard, kelime sınırı ve Türkçe `İ/ı` duyarlı bir yasak ifade listesidir. **Tamamlayıcı bir önlemdir; cevap sızdırılmadığının kanıtı değildir.**
- Penceredeki rozet hangi modun kullanıldığını gösterir: `CANLI AI` veya `KURAL TABANLI YEDEK`.
- Tutor `JUSTIFY.dlg` açıkken açılamaz; karar değişince sohbet sıfırlanır.
- Dallanma ve son, LLM çıktısından tamamen bağımsızdır (`src/utils/rules.ts`).

## Testler

Cypress: 6 spec dosyası, 35 test (`cypress/e2e/`). LLM çağrıları `cy.intercept` ile stub'lanır; testler gerçek model kalitesini ölçmez.

| Spec | Test | Kapsam |
|---|---|---|
| `onboarding.cy.ts` | 2 | Profil doğrulaması, profil rozeti, QA için sabitlenen kart |
| `paths.cy.ts` | 8 | 8 karar yolunun son, bayrak ve adım adım saati; onaylı yeniden başlatma |
| `regression.cy.ts` | 16 | İpucu sızıntısı, guard `İ` ve yanlış pozitif, rol × karar kanıt sırası, saatin geri gitmemesi, tutor sıfırlama, sıfırlama onayı, başlık çubuğundaki Tutor düğmesinin çakışmaması (390 ve 1280 px) |
| `responsive.cy.ts` | 4 | 360×640 ve 390×844'te yatay kaydırma yok; üst `TUTOR.hlp` düğmesi ve karar penceresi 360/390 px ekranın içinde |
| `rules.cy.ts` | 3 | Kural modülü: 8 yolun bayrak, son ve saati (`cypress/fixtures/paths.json`) |
| `tutor.cy.ts` | 2 | İpucu merdiveni, stub'lı canlı yanıt, `JUSTIFY.dlg` açıkken tutor kilidi |

**Son yerel çalıştırma (30 Ekim 2026, çalışma kopyası `e7066fc` + Tutor düğmesi ve başlık düzeltmeleri):** `npm run lint` ✔, `npm run build` ✔, Cypress **35/35 geçti** (Electron, headless; sunucu API anahtarsız, `/api/health` → `hasKey: false`). Yeni 4 test, düzeltmeler geri alındığında başarısız oluyor ve düzeltmelerle geçiyor.

**Otomatik testi olmayanlar:** sızdıran model yanıtıyla guard E2E testi (AE5), yedek mod rozeti, profil değişmezliği, `JUSTIFY.dlg` için Esc/arka plan davranışı, tablet görünümü.

## Tutor değerlendirmesi

`eval/` altında 20 senaryoluk iki rapor vardır (`tutor-evaluation.md`, `tutor-evaluation-v2.md`). **Bunlar canlı AI değerlendirmesi değildir:** canlı Gemini çağrısı HTTP 403 döndüğü için tüm senaryolar kural tabanlı yedek motorla çalıştırılmış ve otomatik anahtar kelime kurallarıyla puanlanmıştır. Manuel anlamsal inceleme yapılmamıştır. Ayrıntı ve eksik alanlar: [`eval/EVALUATION_STATUS.md`](eval/EVALUATION_STATUS.md).

## Bilinçli olarak dışlanan üç özellik

1. **Hesap / giriş sistemi** — Kimlik doğrulama, geliştirme süresini öğrenme döngüsünden alır ve gereksiz kişisel veri toplar. Tek oturumluk bir simülasyon için değer katmaz; bu yüzden oturum kalıcılığı da yoktur.
2. **İkinci bölüm / senaryo** — Öncelik, tek senaryonun eksiksiz, test edilebilir ve değerlendirilebilir bir öğrenme döngüsü olmasıdır. Tek senaryoda 8 yolun tamamı Cypress ile test edilebiliyor.
3. **Gerçek hasta verisi / gerçek hastane sistemi entegrasyonu** — Gizlilik zararı ve uyumluluk riski doğurur. Öğrenme hedefi kurgusal veriyle tam olarak karşılanır; loglardaki tüm kimlik bilgileri uydurmadır.

## Sınırlamalar

- **Canlı Gemini API test edilmedi** (AI Studio projesinde HTTP 403). `gemini-3.8-flash` model kimliği gerçek bir çağrıyla doğrulanmadı.
- **Yayınlanmış Google AI Studio bağlantısı** bu depoda kayıtlı değil.
- **Tutor değerlendirmesi** yalnızca yedek motor ve otomatik puanlamayla yapıldı; manuel inceleme eksik.
- **Gerçek kullanıcı değerlendirmesi** yapılmadı.
- **Demo videosu sessizdir** ve yayınlanmış sürümden değil yerel sunucudan kaydedildi; tutor yedek modda.
- Tutor'un karar sonrası açıklama modu yok; sonuç ekranında da karar öncesi kurallarla yanıt verir.
- Gövde metni çoğunlukla 10–11 px; erişilebilirlik hedefi (≥ 16 px) karşılanmıyor.
- Oturum kalıcılığı yok; sayfa yenilenince profil ekranına dönülür.

## Proje yapısı

```
server.ts                  Express + /api/tutor (Gemini proxy) + /api/health
src/data/scenarioData.ts   Senaryo, kanıt kartları, ipuçları, yasak ifadeler
src/utils/rules.ts         Saat ve son kuralları (UI'dan bağımsız)
src/utils/tutorLogic.ts    Guard ve kural tabanlı yedek tutor
src/components/            Desktop, Onboarding, Karar, JUSTIFY, Sonuç, Rapor, Tutor, onay penceresi
cypress/                   E2E testleri ve fixture
eval/                      Tutor test senaryoları ve raporları
scripts/                   Değerlendirme, guard regresyon ve demo kayıt (record-demo.ts) betikleri
docs/design/               Stitch ve uygulama ekran görüntüleri
docs/demo/                 60 sn demo videosu ve yeniden üretim talimatı
public/assets/aistudio/    AI Studio'ya yüklenen spec (v2.1) ve Stitch tasarım sistemi dışa aktarımı
```
