---
license: mit
library_name: onnx
tags: [tabular-classification, sklearn, education, synthetic-data]
---

# human-exe-risky-choice-onnx (v2.0.0-prototip)

> **Sentetik veriyle eğitilmiş teknik prototip.** Gerçek oyuncu verisi yoktur (0 gerçek oturum).
> Ödevin en az 15 gerçek oturum şartı **karşılanmamıştır**. Aşağıdaki metrikler gerçek oyuncu
> performansı değildir.

## Amaç
HUMAN.exe oyununda oyuncu `Kararı Onayla`ya bastığında, davranış özelliklerinden seçilen seçeneğin
**riskli (bayraklı) seçenek olma olasılığını** (`p_riskli_secim`) tahmin eder. `p >= 0.5` ise
oyun `DOGRULA.dlg` penceresini açar. Seçilen seçenek girdi değildir.

Model "körü körüne onay" ölçmez: D3'te riskli seçenek ASSIST.exe önerisine karşı çıkmaktır ve
oyuncunun niyeti ya da kanıtı okuyup okumadığı etikette yer almaz.

## Model
`StandardScaler` + `LogisticRegression` (`class_weight="balanced"`, scikit-learn 1.9.1,
`random_state=42`) → ONNX. Girdi: `input`, float32, `[N, 8]`. Çıktı: `probabilities`,
`[N, 2]`, indeks 1 riskli sınıftır. Özellik sırası `config.json` içindedir; tanımlar: `data/SOZLUK.md`.

`class_weight` olasılıkları kalibre etmez; `p` gerçek bir sıklık olarak yorumlanmamalıdır.

**Çıkarılan girdi:** `secim_degisikligi`, oturum bazlı sonuç görülmeden önce çıkarıldı. Önceki modelde
fikir değiştirmek riski yükseltiyordu; bu, `DOGRULA.dlg` sonrası kararını gerçekten gözden geçiren
oyuncuyu cezalandırırdı ve üretici kuralda böyle bir etki yoktu. Sütun CSV'de durur, modele girmez.

## Veri
Tümü `kaynak=sentetik`, 225 satır / 75 oturum:
- `uretim_turu=manuel-rastgele`: 45 satır / 15 oturum. Elle ve rastgele
  cevaplarla oluşturuldu. Oyuncu davranışı değildir.
- `uretim_turu=algoritmik-sentetik`: 180 satır / 60 oturum. `scripts/veri_uret.py`
  (tohum 20261106) ile şu varsayımdan üretildi: "kanıt inceleyen ve zaman ayıran oyuncu daha az
  riskli seçer". Model bu varsayımı geri bulur; varsayımın doğruluğunu kanıtlamaz.

## Metrikler
Oturum bazlı %70 / %30 bölme (`GroupShuffleSplit`, tohum 42), eğitim ile test arasında ortak oturum
sayısı 0. Eşikler: ROC-AUC >= 0.7, recall >= 0.6, dengeli doğruluk > 0.5.

| Ölçüm | Değer |
|---|---|
| Test ROC-AUC (23 oturum, 69 satır) | 0.7898 |
| Test ROC-AUC %95 aralığı (oturum bootstrap) | [0.6349, 0.9097] |
| Test recall (riskli) | 0.85 |
| Test dengeli doğruluk | 0.7311 |
| Oturum bazlı 5 katlı CV ROC-AUC | 0.7751 |
| Test, algoritmik alt küme ROC-AUC | 0.877 |
| Test, manuel alt küme ROC-AUC | 0.7259 |
| ONNX ↔ sklearn en büyük fark | 5.94e-08 |

Bu skorlar yalnızca üretici kuralın ne ölçüde geri bulunduğunu gösterir. Gerçek oyuncu üzerinde
geçerlilik kanıtı değildir. Eşik bu verinin bir bölümü daha önce görüldükten sonra korunmuştur;
`class_weight` kararı önceki satır bazlı denemeden gelir, bu nedenle skor iyimser olabilir.

## Sınırlar
- Gerçek veri şartı karşılanmadı; üretim kullanımı için uygun değildir.
- Manuel satırlar hızlı (medyan 2,9 sn), algoritmik satırlar yavaştır (medyan yaklaşık 32 sn); süre
  üretim türünü de ele verir. Model çok hızlı oyuncu için bir tahminde bulunurken bu kaymadan etkilenir.
- Tek senaryo, üç karar için üretilmiştir; başka oyuna taşınamaz.
- Süre, sekmeden ayrılmayı ayırt edemez; kart açmak okumak anlamına gelmez.

## Kullanılmaması gereken durumlar
Kişi, öğrenci veya çalışan değerlendirmesi; not verme; işe alım; gerçek olay yönetimi ya da klinik
kararlar. Çıktı yetkinlik ölçmez, yalnızca oyundaki bir uyarıyı tetikler.

## Sürüm
Yayın, sabitlenmiş commit ve geri dönüş: GitHub deposundaki `RELEASE.md`.
