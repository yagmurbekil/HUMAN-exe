# HUMAN.exe — The Accountability Protocol
## SE Primer Spesifikasyonu (v2.2 — uygulanan sürüm · v3.0 model eki: §12)

> Bu belge bir öğrenme simülasyonunun spesifikasyonudur; gerçek operasyonel, tıbbi veya hukuki tavsiye içermez. Tüm kişiler, sistemler ve veriler kurgusaldır.

---

## 0. Belge durumu

| Alan | Değer |
|---|---|
| Sürüm | v2.2 — `fix/critical-review-issues` dalındaki uygulamayı yansıtır |
| Önceki sürüm | v2.1 (planlama spesifikasyonu; kopyası `public/assets/aistudio/spec_2d37a200.md`) |
| Durum diyagramı | [`flow.mmd`](flow.mmd) |
| İlgili belgeler | [`README.md`](README.md), [`DESIGN.md`](DESIGN.md), [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md), [`eval/EVALUATION_STATUS.md`](eval/EVALUATION_STATUS.md) |
| Teslim tarihi | Ders platformundan teyit edilecek (ödev slaytındaki tarih alanı boş) |

**v2.1'den sapmalar (uygulamada gerçekte olan):**
- Ayrı bir `START` ekranı yoktur; uygulama doğrudan `PROFILE` ekranıyla açılır.
- Yeniden başlatma `START` yerine `PROFILE`'a döner ve her giriş noktasında onay penceresi açar (`RESTART_CONFIRM`).
- Tutor'un karar sonrası açıklama modu (v2.1 §9.4) uygulanmadı; sonuç ekranında da karar öncesi kurallarla yanıt verir.
- Sunucu, soru işareti içermeyen canlı model yanıtlarını da guard tetiklenmiş sayar (v2.1'den daha katı).
- Gövde metni çoğunlukla 10–11 px'tir; v2.1 §11'deki "≥ 16 px gövde metni" hedefi karşılanmıyor.
- Görsel stil bu sürümde mobil uyarlamalı tek odak pencereli Win95 masaüstüdür; ayrıntı [`DESIGN.md`](DESIGN.md).

---

## 1. Problem

Yazılım mühendisliği öğrencileri, yapay zekânın ürettiği operasyonel önerileri kanıtı, belirsizliği ve sorumluluğu sorgulamadan kabul edebilir. HUMAN.exe, kurgusal bir hastane randevu sistemi olayında öğrencinin bir AI önerisini **kanıta dayanarak değerlendirmesini, kararını gerekçelendirmesini ve sonucun sorumluluğunu üstlenmesini** öğretir. Amaç AI'ı reddetmek değil, **doğrulamadan uygulamamaktır**: ASSIST.exe D1 ve D2'de eksik kanıta dayanır, D3'te doğru öneride bulunur.

## 2. Hedef kitle ve öğrenme hedefleri

Başlangıç ve orta seviye yazılım mühendisliği öğrencileri ("İleri" seviye daha az yönlendirmeyle aynı senaryoyu oynatır).

| Kod | Öğrenme hedefi | Uygulamada ölçüldüğü yer |
|---|---|---|
| LO1 | Geri almadan önce eksik doğrulama adımını (şema uyumluluğu) tanımlar. | D1 seçimi + gerekçe uyumu |
| LO2 | Test edilmemiş yamayı yayına almanın riskini gerekçelendirir. | D2 seçimi + gerekçe uyumu |
| LO3 | Loglardaki kişisel veri riskini tanır ve paylaşımı sınırlar. | D3 seçimi + gerekçe uyumu |
| LO4 | Kararın sorumluluğunun insanda kaldığını ifade eder. | Rapordaki hedefe özel yansıtma sorusu (serbest metin, kaydedilmez) |

## 3. Kapsam

**Kapsam içi:** mobil uyarlamalı web uygulaması (React + Vite, Express sunucu); 3 onboarding sorusu; tek kurgusal olay; 3 karar; her kararda kanıt kartları, ASSIST.exe önerisi, 2 seçenek, `JUSTIFY.dlg` gerekçe penceresi ve sonuç ekranı; 2 son; Sokratik tutor (`TUTOR.hlp`); final rapor; Türkçe arayüz, İngilizce retro sistem etiketleri.

**Bilinçli olarak dışlanan üç özellik** (gerekçeleri [`README.md`](README.md)):
1. Hesap / giriş sistemi
2. İkinci bölüm / senaryo
3. Gerçek hasta verisi veya gerçek hastane sistemi entegrasyonu

**Diğer kapsam dışı:** oturum kalıcılığı (sayfa yenilenince profil ekranına dönülür), native mobil uygulama, puanlama/liderlik tablosu, çok dilli arayüz, LLM çıktısının dallanmayı veya sonu etkilemesi, gerçek sistemlerde otonom değişiklik.

## 4. Senaryo

Kurgusal "Şifa Kent Hastanesi" randevu sistemi (MRYS). Saat **08:00**. Dün akşam yayına alınan `v2.4`, randevu tablosuna zorunlu (`NOT NULL`) `slot_type` sütunu ekledi; `v2.3`'ün bu şemayla uyumu bilinmiyor. Acil yama `hotfix-2.4.1` smoke test edilmedi. Tanı logu kurgusal hasta kimlik alanları içeriyor. Öğrenci nöbetçi mühendistir. İçerik kaynağı: `src/data/scenarioData.ts`.

## 5. Karar modeli (deterministik)

Kurallar UI'dan bağımsız olarak `src/utils/rules.ts` içindedir. Her riskli seçim tam olarak bir bayrak ekler. Saat, seçilen seçeneğin süre maliyeti (ve varsa kurtarma cezası) önceki saate eklenerek ilerler; hiçbir yolda geri gitmez.

| Karar | Ekran sırası | `option_id` | Süre | Bayrak |
|---|---|---|---|---|
| D1 Mimari | 1 | `D1_ROLLBACK_NOW` — ASSIST önerisini uygula, v2.3'e dön | +5 dk +20 dk kurtarma | `ARCH_RISK` |
| | 2 | `D1_VERIFY_SCHEMA` — geri almadan önce şema uyumunu doğrula | +15 dk | — |
| D2 Doğrulama | 1 | `D2_SMOKE_TEST` — odaklı smoke test çalıştır | +10 dk | — |
| | 2 | `D2_DEPLOY_NOW` — birim testleri geçti, hemen yayına al | +2 dk | `VERIFY_RISK` |
| D3 Gizlilik | 1 | `D3_SHARE_RAW` — ham logu 120 kişilik kanalda paylaş | +1 dk | `PRIVACY_RISK` |
| | 2 | `D3_REDACT_RESTRICT` — maskele, 5 kişilik kanalda paylaş | +8 dk | — |

**Her karar akışı:** kanıt kartları → (isteğe bağlı tutor) → seçenek → `Kararı Onayla` (geri alınamaz) → `JUSTIFY.dlg` (3 gerekçe; uyumlu olanın konumu D1: 2., D2: 3., D3: 1.; X devre dışı, arka plan tıklaması kapatmaz) → sonuç ekranı → `Devam`. Gerekçe sonu etkilemez; raporda "İlkeyle Uyumlu / Uyumsuz" olarak gösterilir.

**Yol tablosu** (beklenen değerler `cypress/fixtures/paths.json`):

| Yol | Seçimler | Bayraklar | Son | Saat (D1 / D2 / D3) |
|---|---|---|---|---|
| PATH-1 | VERIFY · SMOKE · REDACT | — | SAFE_RECOVERY | 08:15 / 08:25 / 08:33 |
| PATH-2 | VERIFY · SMOKE · RAW | PRIVACY | UNSAFE_RECOVERY | 08:15 / 08:25 / 08:26 |
| PATH-3 | VERIFY · DEPLOY · REDACT | VERIFY | UNSAFE_RECOVERY | 08:15 / 08:17 / 08:25 |
| PATH-4 | VERIFY · DEPLOY · RAW | VERIFY, PRIVACY | UNSAFE_RECOVERY | 08:15 / 08:17 / 08:18 |
| PATH-5 | ROLLBACK · SMOKE · REDACT | ARCH | UNSAFE_RECOVERY | 08:25 / 08:35 / 08:43 |
| PATH-6 | ROLLBACK · SMOKE · RAW | ARCH, PRIVACY | UNSAFE_RECOVERY | 08:25 / 08:35 / 08:36 |
| PATH-7 | ROLLBACK · DEPLOY · REDACT | ARCH, VERIFY | UNSAFE_RECOVERY | 08:25 / 08:27 / 08:35 |
| PATH-8 | ROLLBACK · DEPLOY · RAW | ARCH, VERIFY, PRIVACY | UNSAFE_RECOVERY | 08:25 / 08:27 / 08:28 |

## 6. Sonlar ve rapor

- `SAFE_RECOVERY` ⇔ bayrak sayısı 0; aksi hâlde `UNSAFE_RECOVERY` (`getEnding`).
- Rapor (`ReportWindow.tsx`): son başlığı, simüle bitiş saati, profil, **yalnızca tetiklenen** bayraklar ve açıklamaları, her karar için seçim / gerekçe / uyum / sonuç / ilke, hedefe göre genişletilmiş karar kutusu, yansıtma sorusu + "örnek yaklaşım", sabit uyarı metni ("Bu simülasyondaki hiçbir karar, gerçek dünyadaki tüm olayları otomatik olarak çözmez…"), `Yeniden Başlat`.

## 7. Kişiselleştirme

Profil kararları, seçenekleri, bayrakları, saati ve sonu **değiştirmez**; yalnızca aşağıdaki davranışları değiştirir.

| Boyut | Değer | Uygulamadaki davranış |
|---|---|---|
| Seviye | Başlangıç | 3 ipucu basamağı; kanıt kartlarında sözlük terimleri satır içinde; sonuçta "Kavram Tanımı" kutusu; canlı tutor ≤ 80 kelime |
| | Orta | 2 ipucu basamağı; terimler açıklama düğmesiyle; canlı tutor ≤ 60 kelime |
| | İleri | 1 ipucu basamağı; sonuçta "Ödünleşim (Trade-off)" sorusu; canlı tutor ≤ 40 kelime |
| Rol | Developer | Sabitlenen kart: D1 `MIGRATION_DIFF`, D2 `HOTFIX_DIFF`, D3 `LOG_SAMPLE` |
| | QA | D1 `RELEASE_NOTES`, D2 `CI_STATUS`, D3 `LOG_SAMPLE`; yedek tutor yanıtına "test kapsamı" çerçevesi eklenir |
| | Technical Lead | D1/D2 `STAKEHOLDER_MSG`, D3 `DATA_POLICY`; yedek tutor yanıtına "ekip koordinasyonu" çerçevesi eklenir |
| Hedef | Doğrulama / Risk / Gizlilik | ODAK rozeti ve raporda genişletilmiş kutu: D2 / D1 / D3; hedefe özel yansıtma sorusu |

## 8. Sokratik tutor (`TUTOR.hlp`)

- **Hazır ipucu merdiveni:** deterministik, seviyeye göre 3/2/1 basamak. Basamaklar seçenek adı, eylem buyruğu veya ASSIST.exe hakkında doğru/yanlış yargısı içermez; 3. basamak bir kavramı tanımlayıp soruyla biter.
- **Serbest metin:** istemci `POST /api/tutor` çağırır; sunucu (`server.ts`) API anahtarını ortam değişkeninden okur (`GEMINI_API_KEY`, `GEMINI_API_KEY2`, `API_KEY`) ve `gemini-3.5-flash-lite` modelini Sokratik sistem istemiyle çağırır. 503 yanıtında 2 kez artan beklemeyle yeniden dener (403/429'da denemez); birincil model başarısız olursa `gemini-3.5-flash` denenir. Yanıt JSON'unda `model` alanı yanıtı gerçekten veren modeli gösterir.
- **Yanıt kaynağı:** guard'a takılmayan ve soru içeren model yanıtı `mode: "live"` olarak döner ve rozet `CANLI AI` olur. Yanıt guard'a takılırsa veya soru içermezse yerine ipucu basamağı gösterilir, `mode: "fallback"` döner ve rozet `KURAL TABANLI YEDEK` olur. Rozet, ilk gerçek canlı yanıta kadar `KURAL TABANLI YEDEK` kalır.
- **Guard** (`checkForbiddenGuard`): `FORBIDDEN_TERMS` listesi, kelime sınırı duyarlı ve Türkçe büyük/küçük harf (`İ`, `ı`) duyarlı eşleşme. **Tamamlayıcı bir önlemdir; sızıntı olmadığının kanıtı değildir** (çekimli veya dolaylı ifadeleri kaçırabilir).
- **Yedek mod:** anahtar yoksa, iki model de hata verirse veya 8 sn içinde yanıt gelmezse istemci kural tabanlı motoru (`generateSocraticResponse`) kullanır; rozet `KURAL TABANLI YEDEK`. Genel yanıtlar, öğrencinin o karardaki soru sayısına göre farklı Sokratik sorular arasında döner. Dallanma ve son LLM çıktısından bağımsızdır.
- Tutor `JUSTIFY.dlg` açıkken açılamaz; karar değişince sohbet geçmişi sıfırlanır.

## 9. Durum makinesi

Durumlar: `PROFILE`, `D{n}_DECIDE`, `D{n}_JUSTIFY` (modal), `D{n}_CONSEQUENCE`, `REPORT` (`SAFE_RECOVERY` | `UNSAFE_RECOVERY`), `RESTART_CONFIRM` (onay penceresi). Diyagram: [`flow.mmd`](flow.mmd).

- `PROFILE → D1_DECIDE`: yalnızca üç profil alanı seçiliyse.
- Onaylanan karar değiştirilemez (seçim ekranı kapanır; tarayıcı geçmişinde durum tutulmaz).
- `RESTART_CONFIRM`: rapordaki `Yeniden Başlat` ve X düğmesi ile Başlat menüsündeki "Oturumu Sıfırla" açar; `Evet` tüm bağlamı (profil, seçimler, gerekçeler, bayraklar, saat, ipuçları) temizleyip `PROFILE`'a döner, `Hayır` mevcut durumu korur.
- Sayfa yenileme → `PROFILE` (kalıcılık yok).

## 10. Kabul örnekleri

Seçiciler `data-cy` öznitelikleridir. "Otomatik test" sütunu yalnızca gerçekten var olan Cypress testlerini gösterir.

| Kod | Given / When / Then | Otomatik test |
|---|---|---|
| **AE1** Onboarding | *Given* yeni oturum, *when* yalnızca seviye ve rol seçilir, *then* `Başlat` devre dışıdır; *when* Başlangıç · QA · Gizlilik seçilip başlatılır, *then* D1 ekranında profil rozeti "Başlangıç · QA · Gizlilik" ve ilk kanıt sekmesi `RELEASE_NOTES` olur. | `onboarding.cy.ts` (sözlük ve ODAK rozeti henüz doğrulanmıyor) |
| **AE2** D1 riskli dal | *Given* D1, *when* `D1_ROLLBACK_NOW` seçilip onaylanır, *then* `JUSTIFY.dlg` açılır ve gerekçe seçilmeden `Tamam` devre dışıdır; *when* gerekçe onaylanır, *then* sonuç ekranında saat 08:25 ve `ARCH_RISK` görünür. | `regression.cy.ts` (saat), `paths.cy.ts` PATH-5..8 (bayrak) |
| **AE3** Tam güvenli yol | *When* VERIFY · SMOKE · REDACT seçilir, *then* rapor `SAFE_RECOVERY`, bayrak listesi boş, bitiş saati 08:33. | `paths.cy.ts` PATH-1 |
| **AE4** Yalnızca gizlilik riski | *Given* D1 ve D2 güvenli, *when* D3'te `D3_SHARE_RAW` seçilir, *then* rapor `UNSAFE_RECOVERY` ve yalnızca `PRIVACY_RISK` gösterir. | `paths.cy.ts` PATH-2 |
| **AE5** Tutor cevap sızdırmaz | *Given* D2 onaylanmamış ve canlı mod, *when* model yanıtı yasak bir ifade içerir, *then* `tutor-output` o ifadeyi göstermez, yerine soru içeren ipucu basamağı gelir. | **Yok** — guard birim düzeyinde `regression.cy.ts` ile test ediliyor; sızdıran stub'lı E2E testi eksik |
| **AE6** Sıfırlama onayı | *When* Başlat menüsünden "Oturumu Sıfırla" seçilir, *then* onay penceresi açılır; `Hayır` oturumu korur, `Evet` profil ekranına döner. | `regression.cy.ts` |
| **AE7** Saat geri gitmez | *When* `D1_ROLLBACK_NOW` ardından `D2_DEPLOY_NOW` seçilir, *then* saat 08:25 → 08:27 olur. | `regression.cy.ts`, `rules.cy.ts` |

**Ek kriterler ve durumları:** 360×640 ve 390×844'te yatay kaydırma yok (`responsive.cy.ts`); `JUSTIFY.dlg` açıkken tutor düğmesi devre dışı (`tutor.cy.ts`); API hatasında yedek mod rozeti ve değişen yedek yanıtlar (`regression.cy.ts`); profil değişmezliği (aynı seçimler farklı profillerde aynı son) ve `JUSTIFY.dlg` için Esc/arka plan davranışı için otomatik test **yok**.

## 11. Değerlendirme

- Cypress: 6 spec, 39 test; sonuçlar ve çalıştırma koşulları [`README.md`](README.md#testler).
- Tutor değerlendirmesi: `eval/` altındaki 20 senaryo **yalnızca kural tabanlı yedek motorla ve otomatik anahtar kelime puanlamasıyla** çalıştırıldı (o sırada canlı Gemini HTTP 403 veriyordu). Canlı tutor sonradan AI Studio'da D1–D3 için elle denendi; 20 senaryonun canlı modelle tekrarı ve manuel anlamsal inceleme yapılmadı. Ayrıntı: [`eval/EVALUATION_STATUS.md`](eval/EVALUATION_STATUS.md).
- 60 sn demo: [`docs/demo/HUMAN-exe-demo.mp4`](docs/demo/HUMAN-exe-demo.mp4) (otomatik tarayıcı kaydı, sessiz).
- Gerçek kullanıcı değerlendirmesi: yapılmadı (bkz. [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md)).

---

## 12. Model eki (Ödev 7 — The Primer v2): Körü körüne onay riski

> Bu bölüm **eğitimden önce** yazılmıştır (4 Kasım 2026). Eşik ve metrik eğitim sonuçları görüldükten sonra değiştirilmez; değişirse sürüm notunda gerekçesiyle belirtilir.

### 12.1 Problem ve model gereksinimi

v2.2'deki uyum sabit kurallara dayanır (seviye, rol, hedef). v3.0'da uyumun bir kısmı oyuncunun **o andaki davranışından** öğrenen küçük bir modele bağlanır.

**Soru:** *"Bu oyuncu bu kararı kanıtları incelemeden, ASSIST.exe'ye ya da hıza güvenerek mi veriyor?"* Bu, otomasyon yanlılığının (automation bias) davranışsal bir göstergesidir.

- **Model:** ikili sınıflandırıcı, `StandardScaler` + `LogisticRegression` (`random_state=42`), `sklearn → ONNX`.
- **Çıktı:** `p_kor_onay` ∈ [0, 1], seçilen seçeneğin riskli (bayraklı) olma olasılığı.
- **Etiket (`riskli_secim`):** seçilen seçeneğin `flag` alanı doluysa 1 (`D1_ROLLBACK_NOW`, `D2_DEPLOY_NOW`, `D3_SHARE_RAW`), değilse 0.
- **Çalışma anı:** oyuncu `Kararı Onayla`ya bastığı an, `JUSTIFY.dlg` açılmadan önce.
- **Sızıntı kuralı:** seçilen seçeneğin kimliği veya metni **girdi değildir**. Model yalnızca davranışa bakar; cevabı bilmez.

**Girdiler** (sıra `model/config.json` sözleşmesindeki sıradır; tanım ve birimler: [`data/SOZLUK.md`](data/SOZLUK.md)):

| # | Özellik | Açıklama |
|---|---|---|
| 1 | `seviye` | 0 Başlangıç, 1 Orta, 2 İleri |
| 2 | `karar_no` | 1, 2, 3 |
| 3 | `karar_suresi_sn` | Karar ekranının açılmasından onaya kadar geçen süre |
| 4 | `kart_orani` | Açılan farklı kanıt kartı / o karardaki toplam kart |
| 5 | `tutor_acildi` | Bu kararda tutor açıldı mı (0/1) |
| 6 | `ipucu_sayisi` | Bu kararda kullanılan hazır ipucu sayısı |
| 7 | `secim_degisikligi` | Seçenekler arasında geçiş sayısı (ilk seçimden sonraki değişiklikler) |
| 8 | `onceki_riskli` | Bu oturumdaki önceki kararlarda yapılan riskli seçim sayısı |
| 9 | `onceki_uyumsuz` | Önceki kararlarda ilkeyle uyumsuz gerekçe sayısı |

### 12.2 Oyunun davranışını nasıl değiştirir

- `p_kor_onay ≥ karar_esigi` (`config.json`, başlangıç değeri 0.5) ise `JUSTIFY.dlg`'den önce **`DOGRULA.dlg` — "Dur ve doğrula"** penceresi açılır:
  - incelenmemiş kanıt kartlarını listeler,
  - tutor'dan bir Sokratik soru gösterir,
  - iki düğme sunar: `Kararımı gözden geçir` (karar ekranına döner, seçim korunur) ve `Kararımda eminim` (`JUSTIFY.dlg`'ye geçer).
- `p_kor_onay < karar_esigi` ise akış v2.2'deki gibidir.
- Pencere **seçime göre değil davranışa göre** açılır. Doğru seçeneği gösterecek bir ipucu içermez; yalnızca doğrulama davranışını teşvik eder.
- Kararlar, 8 yol, bayraklar, saat ve sonlar değişmez (`src/utils/rules.ts`). Model yalnızca bu ek pencerenin açılıp açılmayacağına karar verir.
- **Veri toplama modunda** (`?veri=1`) müdahale kapalıdır; aksi hâlde model kendi eğitim verisini etkilerdi.

### 12.3 Veri

- Her karar bir satır: `data/oturumlar.csv`. Sütunlar: `oturum_id`, `karar_id`, 9 girdi, `riskli_secim`, `kaynak` (`gercek` | `sentetik`), `uygulama_surumu`.
- **Gerçek veri:** en az **15 gerçek oturum** (≥ 45 satır), en az 3 farklı oyuncu. Veri toplama modu oturum sonunda satırları tarayıcıda biriktirir ve CSV olarak indirtir; sunucuya hiçbir şey gönderilmez.
- **KVKK:** ad, e-posta, cihaz kimliği, IP, konum, zaman damgası toplanmaz. `oturum_id` her oturumda rastgele üretilir; oyuncuyla eşleştirilemez.
- **Sentetik veri** serbesttir; üretici kural ve tohum README'de yazılıdır, satırlar `kaynak=sentetik` ile işaretlenir.

### 12.4 Eval metriği ve kabul eşiği (altın standart)

| Kural | Değer |
|---|---|
| Bölme | Katmanlı (stratified) %70 eğitim / %30 test, `random_state=42` |
| **Birincil metrik** | Test kümesinde **ROC-AUC ≥ 0.70** |
| İkincil metrik | Riskli sınıf için duyarlılık (recall, eşik 0.5) **≥ 0.60** |
| Taban karşılaştırması | Dengeli doğruluk (balanced accuracy), her zaman çoğunluk sınıfını tahmin eden taban modelden (0.50) yüksek olmalı |
| Veri kapısı | En az 15 gerçek oturum yoksa eğitim durur |
| ONNX eşdeğerliği | ONNX ve sklearn olasılıkları arasındaki fark ≤ `1e-4` |

Kurallardan biri sağlanmazsa `train.py` sıfırdan farklı çıkış koduyla durur ve `model/model.onnx` yazılmaz. **Eşiği geçmeyen model yayınlanmaz.** Metrikler `model/config.json`'a yazılır. Ayrıca yalnızca gerçek satırlardan oluşan test alt kümesinin metrikleri de raporlanır; sentetik veri sonucu şişirebilir.

### 12.5 Yeni kabul örnekleri

| Kod | Given / When / Then | Otomatik test |
|---|---|---|
| **AE8** Model davranışı değiştirir | *Given* model yüklü ve veri toplama modu kapalı, *when* oyuncu tek kanıt kartını açıp 5 sn içinde onaylar ve `p_kor_onay ≥ karar_esigi` olur, *then* `JUSTIFY.dlg`'den önce `DOGRULA.dlg` açılır ve incelenmemiş kartları listeler; *when* aynı karar tüm kartlar incelenip tutor kullanılarak verilir ve `p_kor_onay < karar_esigi` olur, *then* doğrudan `JUSTIFY.dlg` açılır. | `cypress/e2e/model.cy.ts` |
| **AE9** Parite (diferansiyel test) | *Given* `tests/parite.json` içindeki 5 referans girdi ve Python test kahininin (`tests/parite.py`) olasılıkları, *when* aynı girdiler uygulamadaki `onnxruntime-web` çıkarımına verilir, *then* her girdide `|p_uygulama − p_python| < 1e-4` olur. | `cypress/e2e/model.cy.ts` (tarayıcı ve `/api/risk`), `tests/parite.py` |
| **AE10** Eval kapısı | *Given* test kümesinde ROC-AUC < 0.70 veya gerçek oturum sayısı < 15, *when* `python train.py` çalıştırılır, *then* betik sıfırdan farklı çıkış koduyla durur ve `model/model.onnx` oluşturulmaz. | `tests/eval_kapisi.py` |

**Regresyon:** v2.2'nin 39 Cypress testi model devreye girdikten sonra da geçmelidir. 8 yol testi (`paths.cy.ts`) model açıkken çalışır; `DOGRULA.dlg` açılırsa oyuncu kararını korur. Sabit tıklama dizileri kullanan diğer testlerde model kapalıdır (`cypress/support/e2e.ts`).

### 12.6 Uygulama sonucu ve plandan sapmalar

- **Gerçek veri hedefi kısmen karşılandı.** 15 oturum (45 satır) toplandı, ancak **hepsini tek kişi (geliştirici) rastgele cevaplarla oynadı**; §12.3'teki "en az 3 farklı oyuncu" şartı karşılanmadı. Satırlar uygulamadan geldiği için `kaynak=gercek` olarak kaldı, ama gerçek kullanıcı davranışını temsil etmez.
- **Sentetik veri eklendi:** 60 oturum, 180 satır (`scripts/veri_uret.py`, tohum 20261106). Gerçek satırlarda `kart_orani` hiç değişmediği için model, kanıt inceleme davranışını bu satırlardan öğrenemezdi.
- **Eval kapısı ilk denemede durdu** (recall 0.5238 < 0.60). Eşik değiştirilmedi; sınıf dengesizliği için `class_weight="balanced"` eklendi. Ayrıntı: [`RELEASE.md`](RELEASE.md).
- **Geçerleme zayıftır.** Karışık test ROC-AUC 0.7330; gerçek test satırlarında (16 satır) 0.5083. Parite, modelin her ortamda aynı hesaplandığını gösterir (doğrulama); gerçek oyuncu davranışını öğrendiğini göstermez (geçerleme).
