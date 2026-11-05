---
license: mit
library_name: onnx
tags: [tabular-classification, sklearn, education]
---

# human-exe-blind-accept-onnx (v2.0.0)

## Amaç
HUMAN.exe oyununda oyuncu `Kararı Onayla`ya bastığında, davranışına bakarak seçiminin riskli olma
olasılığını (`p_kor_onay`) tahmin eder. `p >= 0.5` ise oyun `DOGRULA.dlg` penceresini açar.
Seçilen seçenek modele girdi değildir. Eğitim amaçlıdır.

## Model
`StandardScaler` + `LogisticRegression` (scikit-learn 1.9.1, `random_state=42`) → ONNX.
Girdi: `input`, float32, `[N, 9]`. Çıktı: `probabilities`, `[N, 2]`, indeks 1 riskli sınıftır.
Özellik sırası `config.json` içindedir; tanımlar: `data/SOZLUK.md`.

## Veri
- 45 satır / 15 oturum `kaynak=gercek`, 180 satır / 60 oturum `kaynak=sentetik`.
- **Gerçek satırların sınırı:** 15 oturumun tamamı tek kişi (geliştirici) tarafından, hızlı ve
  rastgele cevaplarla oynandı; 3 farklı oyuncu hedefi karşılanmadı. Bu satırlar gerçek kullanıcı
  davranışını temsil etmez. Neredeyse hiç kanıt kartı açılmadığı için `kart_orani` bu satırlarda
  değişmez, `ipucu_sayisi` hep 0'dır.
- **Sentetik satırlar** `scripts/veri_uret.py` (tohum 20261106) ile bir varsayımdan üretildi:
  "kanıt inceleyen ve zaman ayıran oyuncu daha az riskli seçer". Model bu varsayımı öğrenir.

## Metrikler (kabul: ROC-AUC >= 0.7, recall >= 0.6, dengeli doğruluk > 0.5)
| Ölçüm | Değer |
|---|---|
| Test kümesi (%30, gerçek + sentetik) ROC-AUC | 0.733 |
| Test kümesi recall (riskli) | 0.7619 |
| Test kümesi dengeli doğruluk | 0.6788 |
| Oturum bazlı 5 katlı CV ROC-AUC (tüm veri) | 0.7791 |
| Yalnız gerçek satırlarla eğitilen modelin oturum bazlı CV ROC-AUC'si | 0.7976 |
| Test kümesindeki gerçek satırlar (16 satır) ROC-AUC | 0.5083 |
| ONNX ↔ sklearn en büyük fark | 6.77e-08 |

Karışık test skoru büyük ölçüde sentetik kuralın geri bulunmasını gösterir; gerçek oyuncu üzerinde
geçerlilik kanıtı değildir. Gerçek satır sayısı küçük olduğundan o satırlardaki skorlar güvenilir değildir.

## Sınırlar
- Tek senaryo, üç karar için üretilmiştir; başka oyuna veya senaryoya taşınamaz.
- Satırlar bağımsız değildir: aynı oturumun kararları birbirini etkiler.
- Süre, sekmeden ayrılmayı ayırt edemez; kart açmak okumak anlamına gelmez.

## Kullanılmaması gereken durumlar
Kişi, öğrenci veya çalışan değerlendirmesi; not verme; işe alım; gerçek olay yönetimi ya da klinik
kararlar. Çıktı oyuncunun yetkinliğini ölçmez, yalnızca oyundaki bir uyarının açılmasını tetikler.

## Sürüm
Yayın, sabitlenmiş commit ve geri dönüş: GitHub deposundaki `RELEASE.md`.
