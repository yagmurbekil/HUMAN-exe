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

**Uygulama (Google AI Studio):** https://ai.studio/apps/8ce3ebbb-ef1a-4b5d-93c8-f8b75ee4c822
**Demo videosu:** https://youtube.com/shorts/xGhg52Bi7zU · dosya: [`docs/demo/HUMAN-exe-demo.mp4`](docs/demo/HUMAN-exe-demo.mp4) — 60,9 sn, 390×844 mobil görünüm, otomatik tarayıcı kaydı, **sessiz** (altyazılı). Video, canlı tutor eklenmeden önce yerel sunucudan kaydedildi; tutor yedek modda görünür. Yeniden üretim: [`docs/demo/README.md`](docs/demo/README.md).

---

## Ödev 7 — The Primer v2: küçük model (sentetik prototip)

> **Gerçek veri şartı karşılanmadı.** Projede 0 gerçek oyuncu oturumu vardır. Model yalnızca sentetik veriyle eğitilmiş bir **teknik prototiptir**; metrikleri gerçek oyuncu performansı değildir.

Oyuncu `Kararı Onayla`ya bastığında küçük bir lojistik regresyon, davranış özelliklerinden seçilen seçeneğin **riskli olma olasılığını** (`p_riskli_secim`) tahmin eder. `p >= 0.5` ise `DOGRULA.dlg` açılır ve incelenmemiş kanıt kartlarını listeler. Seçilen seçenek girdi değildir. Aynı sahnede betikli acele oyuncu uyarı alır (p≈0.74), kartları inceleyip tutor kullanan betikli oyuncu almaz (p≈0.06).

| | |
|---|---|
| Spec, metrik, kapılar, sapmalar | [`spec.md` §12](spec.md) |
| Veri | [`data/oturumlar.csv`](data/oturumlar.csv), [`data/SOZLUK.md`](data/SOZLUK.md) |
| Model | [`model/`](model/) (`model.onnx`, `config.json`, model kartı, `eval_raporu.json`) |
| Yayın, rollback, ödünleşim | [`RELEASE.md`](RELEASE.md) |
| Parite | [`tests/parite.py`](tests/parite.py), [`tests/parite.json`](tests/parite.json) |
| Demo | [`docs/demo/HUMAN-exe-model-demo.mp4`](docs/demo/HUMAN-exe-model-demo.mp4) (64 sn, sessiz, betikli oyuncular) |
| Sınav tasarımı | [`SINAV_TASARIMI.md`](SINAV_TASARIMI.md) |

**Modeli yeniden üretmek (3 komut):**

```bash
py -3.13 -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python train.py --sentetik-prototip
```

`--sentetik-prototip` olmadan `train.py` bilerek durur: üretim modu en az 15 gerçek oturum ister. Prototip modu teknik kapıyı atlayamaz ve çıktıyı `2.0.0-prototip` olarak etiketler. Algoritmik satırları yeniden üretmek için: `.venv/Scripts/python scripts/veri_uret.py` (tohum 20261106; kural betiğin başında).

**Veri:** 225 satır, 75 oturum, tümü `kaynak=sentetik`: 45 satır `uretim_turu=manuel-rastgele` (elle, rastgele cevaplarla), 180 satır `uretim_turu=algoritmik-sentetik`.

**Metrikler (oturum bazlı test, 23 oturum, 69 satır, yalnız sentetik veri):** ROC-AUC 0.7898 (eşik ≥ 0.70), %95 aralık 0.63–0.91, recall 0.85 (≥ 0.60), dengeli doğruluk 0.73, oturum bazlı 5 katlı CV ROC-AUC 0.78, ONNX farkı 5.9e-08. Teknik kapı açık, **gerçek veri kapısı kapalı**.

**Bu sonuçlar ne anlama gelir?** Model üretici varsayımını geri buluyor; gerçek oyunculara genellenemez. Güven aralığının alt ucu 0.70'in altında. Parite testi modelin üç ortamda aynı hesaplandığını kanıtlar (doğrulama), doğru olduğunu değil (geçerleme). `DOGRULA.dlg` manuel satırların %96'sında açılır; pratikte hızlı oyuncuyu uyaran bir sezgiseldir. Model "körü körüne onay" ölçmez. Ayrıntılar ve tüm sapmalar: [`spec.md` §12.6](spec.md).

**Senaryo gözlemi:** Satırlar oluşturulurken seçeneklerin fazla bariz olduğu görüldü: "doğrula, test et, maskele" seçenekleri kanıt okumadan ayırt edilebiliyor. Bir sonraki sürümde güvenli seçeneğin de maliyetli olduğu daha dengeli ikilemler gerekir.

---

## Kurulum

Paket yöneticisi olarak **npm** kullanılır; tek kilit dosyası `package-lock.json`'dır.

Doğrulanan ortam: Windows 11, Node.js 24.22.1, npm 11.17.0.

```bash
npm ci
```

İsteğe bağlı canlı tutor için `.env.example` dosyasını `.env` olarak kopyalayıp `GEMINI_API_KEY` değerini girin (sunucu sırasıyla `GEMINI_API_KEY`, `GEMINI_API_KEY2`, `API_KEY` değişkenlerini okur; AI Studio anahtarı kendi gizli değişkenlerinden sağlar). Anahtar yoksa tutor otomatik olarak kural tabanlı yedek moda geçer; oyunun geri kalanı anahtarsız çalışır. `.env` dosyaları `.gitignore` ile depo dışında tutulur.

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
| `npm run demo:model` | Ödev 7 iki oyunculu demoyu kaydeder (`npm run dev` çalışıyor olmalı) |
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
 └─ serbest metin → POST /api/tutor (server.ts; istemcide 8 sn zaman aşımı)
                     ├─ anahtar var → gemini-3.5-flash-lite + Sokratik sistem istemi
                     │                 (503'te 2 kez artan beklemeli yeniden deneme; 403/429'da denemez)
                     │                 başarısızsa → gemini-3.5-flash (aynı kurallar)
                     │                 → guard (checkForbiddenGuard) + soru kontrolü
                     │                    ├─ geçerse → mode: "live", model: yanıt veren model
                     │                    └─ takılırsa → ipucu basamağı, mode: "fallback"
                     └─ anahtar yok / iki model de hata / zaman aşımı
                        → istemci: generateSocraticResponse (kural tabanlı yedek; tekrar eden
                          sorulara farklı Sokratik sorularla yanıt verir)
```

- API anahtarı yalnızca sunucuda, ortam değişkeninden okunur; depoda anahtar yoktur.
- Guard, kelime sınırı ve Türkçe `İ/ı` duyarlı bir yasak ifade listesidir. **Tamamlayıcı bir önlemdir; cevap sızdırılmadığının kanıtı değildir.**
- Penceredeki rozet yanıtın gerçek kaynağını gösterir: `CANLI AI` yalnızca guard'a takılmamış canlı model yanıtında görünür; guard devreye girdiğinde, API hata verdiğinde veya henüz canlı yanıt gelmediğinde `KURAL TABANLI YEDEK` görünür.
- Tutor `JUSTIFY.dlg` açıkken açılamaz; karar değişince sohbet sıfırlanır.
- Dallanma ve son, LLM çıktısından tamamen bağımsızdır (`src/utils/rules.ts`).

## Testler

Cypress: 8 spec dosyası, 57 test (`cypress/e2e/`). LLM çağrıları `cy.intercept` ile stub'lanır; testler gerçek model kalitesini ölçmez.

| Spec | Test | Kapsam |
|---|---|---|
| `model.cy.ts` | 15 | Python, tarayıcı ve sunucu paritesi (5 referans, tolerans 1e-4), `DOGRULA.dlg` davranışı, model inmezse oyunun sürmesi, veri modunda modelin kapalı olması |
| `data-collection.cy.ts` | 3 | Veri satırları, kişisel veri olmaması, menü anahtarı |
| `onboarding.cy.ts` | 2 | Profil doğrulaması, profil rozeti, QA için sabitlenen kart |
| `paths.cy.ts` | 8 | 8 karar yolunun son, bayrak ve adım adım saati; onaylı yeniden başlatma |
| `regression.cy.ts` | 20 | Yedek tutor'un tekrar eden sorulara farklı yanıt vermesi, ipucu sızıntısı, guard `İ` ve yanlış pozitif, rol × karar kanıt sırası, saatin geri gitmemesi, tutor sıfırlama, sıfırlama onayı, başlık çubuğundaki Tutor düğmesinin çakışmaması (390 ve 1280 px) |
| `responsive.cy.ts` | 4 | 360×640 ve 390×844'te yatay kaydırma yok; üst `TUTOR.hlp` düğmesi ve karar penceresi 360/390 px ekranın içinde |
| `rules.cy.ts` | 3 | Kural modülü: 8 yolun bayrak, son ve saati (`cypress/fixtures/paths.json`) |
| `tutor.cy.ts` | 2 | İpucu merdiveni, stub'lı canlı yanıt, `JUSTIFY.dlg` açıkken tutor kilidi |

**Son yerel çalıştırma (6 Kasım 2026):** `npm run lint` ✔, `npm run build` ✔, Cypress **57/57 geçti** (Electron, headless; API anahtarsız), `tests/veri_kontrol.py` 10/10, `tests/eval_kapisi.py` 9/9, `tests/parite.py --kontrol` geçti (en büyük fark 4.5e-09). `paths.cy.ts` model açıkken çalışır; canlı Gemini Cypress'te stub'lanır.

**Otomatik testi olmayanlar:** sızdıran model yanıtıyla guard E2E testi (AE5), profil değişmezliği, `JUSTIFY.dlg` için Esc/arka plan davranışı, tablet görünümü.

## Tutor değerlendirmesi

`eval/` altında 20 senaryoluk iki rapor vardır (`tutor-evaluation.md`, `tutor-evaluation-v2.md`). **Bunlar canlı AI değerlendirmesi değildir:** raporlar canlı Gemini henüz çalışmazken (HTTP 403) üretildi; tüm senaryolar kural tabanlı yedek motorla çalıştırılıp otomatik anahtar kelime kurallarıyla puanlandı. Canlı tutor daha sonra AI Studio'da D1, D2 ve D3 için elle denendi, ancak 20 senaryo canlı modelle yeniden çalıştırılmadı ve manuel anlamsal inceleme yapılmadı. Ayrıntı ve eksik alanlar: [`eval/EVALUATION_STATUS.md`](eval/EVALUATION_STATUS.md).

## Bilinçli olarak dışlanan üç özellik

1. **Hesap / giriş sistemi** — Kimlik doğrulama, geliştirme süresini öğrenme döngüsünden alır ve gereksiz kişisel veri toplar. Tek oturumluk bir simülasyon için değer katmaz; bu yüzden oturum kalıcılığı da yoktur.
2. **İkinci bölüm / senaryo** — Öncelik, tek senaryonun eksiksiz, test edilebilir ve değerlendirilebilir bir öğrenme döngüsü olmasıdır. Tek senaryoda 8 yolun tamamı Cypress ile test edilebiliyor.
3. **Gerçek hasta verisi / gerçek hastane sistemi entegrasyonu** — Gizlilik zararı ve uyumluluk riski doğurur. Öğrenme hedefi kurgusal veriyle tam olarak karşılanır; loglardaki tüm kimlik bilgileri uydurmadır.

## Sınırlamalar

- **Canlı tutor yalnızca elle denendi:** AI Studio'da D1–D3 için `gemini-3.5-flash-lite` yanıtları alındı; bu denemelerin kaydı depoda yok ve canlı model için otomatik test yoktur. Ücretsiz katman kotası (429) veya yoğunluk (503) durumunda tutor yedek moda düşer.
- **Model prototiptir:** gerçek veri şartı karşılanmadı (0 gerçek oturum); üretim modu bu yüzden model üretmez.
- **Tutor değerlendirmesi** (20 senaryo) yalnızca yedek motor ve otomatik puanlamayla yapıldı; canlı modelle tekrarı ve manuel inceleme eksik.
- İstemci 8 sn sonra yedek moda geçer; sunucudaki yeniden denemeler ve ikinci model bu süreyi aşarsa öğrenci yedek yanıtı görür.
- **Gerçek kullanıcı değerlendirmesi** yapılmadı.
- **Demo videosu sessizdir** ve canlı tutor eklenmeden önce yerel sunucudan kaydedildi; videoda tutor yedek modda.
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

## Yapay zekâ araçlarının kullanımı

- **Claude Code:** spec taslağı, kod, Cypress testleri, `train.py`, parite betikleri, belgeler ve demo kayıt betikleri ajan tarafından yazıldı. Hedefi önce ajan önerdi; denetimde hedefin ölçtüğü şeyle uyuşmadığı görülünce "riskli seçenek seçimi" olarak düzelttik.
- **Google AI Studio (Gemini):** uygulamanın ilk iskeleti ve yayını; canlı tutor için model adı, yeniden deneme ve rozet düzeltmeleri.
- **Google Stitch:** arayüz taslağı ve tasarım sistemi.
- **Benim yaptıklarım:** ödev kararları ve teslim sırası; 45 satırlık manuel-rastgele veriyi oluşturmak; denetimden sonra verinin sentetik etiketlenmesine, hedef değişikliğine ve oturum bazlı bölmeye karar vermek; canlı tutoru AI Studio'da çalıştırıp D1–D3 için denemek; tutor düğmesi çakışması gibi sorunları fark edip düzelttirmek; senaryonun fazla bariz olduğu gözlemi.
- Ajan çıktısında yakalanan hatalar: ipucu merdiveninin cevabı sızdırması, sabit saat, recall kapısında duran ilk model; ayrıca manuel satırların ilk başta `gercek` etiketlenmesi ve satır bazlı bölme sızıntısı.
