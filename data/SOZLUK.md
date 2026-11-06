# Veri Sözlüğü — `data/oturumlar.csv`

Her satır bir kararın **onaylandığı an**ı anlatır; bir oturum 3 satırdır. Bu dosyada gerçek oyuncu satırı yoktur. Model tanımı ve eşik: [`spec.md` §12](../spec.md).

Şema, uygulamanın veri toplama modunun (`?veri=1`, `src/utils/telemetry.ts`) ürettiği şemadır.

## Sütunlar

| Sütun | Tür | Birim / değerler | Anlamı | Model girdisi mi? |
|---|---|---|---|---|
| `oturum_id` | metin | 12 hane onaltılık | Her oturumda rastgele üretilen kimlik (`crypto.getRandomValues`). Oyuncuyla eşleştirilemez. | Hayır |
| `karar_id` | metin | `D1`, `D2`, `D3` | Hangi karar | Hayır (yerine `karar_no`) |
| `seviye` | tam sayı | 0 Başlangıç, 1 Orta, 2 İleri | Oyuncunun girişte seçtiği deneyim seviyesi | **Evet** (1) |
| `karar_no` | tam sayı | 1, 2, 3 | Kararın sırası | **Evet** (2) |
| `karar_suresi_sn` | ondalık | saniye, 0,1 hassasiyet | Karar ekranının açılmasından `Kararı Onayla`ya basılmasına kadar geçen süre. Tutor'da geçen süre de dahildir. | **Evet** (3) |
| `kart_orani` | ondalık | 0–1, 0,001 hassasiyet | Açılan **farklı** kanıt kartı sayısı / o karardaki toplam kart sayısı (D1: 4, D2: 4, D3: 3). Ekran açılınca gösterilen sabitlenmiş kart açılmış sayılır, bu yüzden en düşük değer 1/kart sayısıdır. | **Evet** (4) |
| `tutor_acildi` | 0/1 | — | Karar onaylanmadan önce bu kararda tutor penceresi en az bir kez açık mıydı | **Evet** (5) |
| `ipucu_sayisi` | tam sayı | 0–3 | Bu kararda kullanılan hazır ipucu basamağı sayısı | **Evet** (6) |
| `secim_degisikligi` | tam sayı | ≥ 0 | İlk seçimden sonra iki seçenek arasında kaç kez geçiş yapıldı | Hayır (çıkarıldı, `spec.md` §12.1) |
| `onceki_riskli` | tam sayı | 0–2 | Aynı oturumdaki önceki kararlarda yapılan riskli seçim sayısı | **Evet** (7) |
| `onceki_uyumsuz` | tam sayı | 0–2 | Aynı oturumdaki önceki kararlarda seçilen ilkeyle uyumsuz gerekçe sayısı | **Evet** (8) |
| `riskli_secim` | 0/1 | — | **Etiket.** Seçilen seçenek riskli (bayraklı) ise 1: `D1_ROLLBACK_NOW`, `D2_DEPLOY_NOW`, `D3_SHARE_RAW` | Hedef |
| `kaynak` | metin | `gercek`, `sentetik` | `gercek` yalnızca gerçek bir kişinin oyunu oynadığı satırlar içindir. Bu dosyada **hiç yoktur**; tüm satırlar `sentetik` | Hayır |
| `uretim_turu` | metin | `manuel-rastgele`, `algoritmik-sentetik`, `oyun-oturumu` | Satırın nasıl üretildiği. `oyun-oturumu` bu dosyada yoktur | Hayır |
| `uygulama_surumu` | metin | `manuel-1`, `sentetik-1`, `3.0.0-veri` | Satırı üreten kaynağın sürümü | Hayır |

Girdi sırası (`model/config.json` → `features`): `seviye, karar_no, karar_suresi_sn, kart_orani, tutor_acildi, ipucu_sayisi, onceki_riskli, onceki_uyumsuz`.

## Veri kaynağı ve sınırları

**Bu dosyada gerçek oyuncu verisi yoktur (0 gerçek oturum).** 225 satırın tamamı `kaynak=sentetik`.

- **`uretim_turu=manuel-rastgele` (45 satır, 15 oturum):** Elle ve rastgele cevaplarla oluşturuldu; oyun gerçekten oynanarak elde edilmedi. Oyuncu davranışı değildir. Neredeyse hiç kart açılmadığı için `kart_orani` kararda sabittir, `ipucu_sayisi` her satırda 0'dır.
- **`uretim_turu=algoritmik-sentetik` (180 satır, 60 oturum):** `scripts/veri_uret.py` ile üretildi, tohum 20261106. Kural betiğin başında yazılıdır ve bir varsayımdır: "kanıt inceleyen ve zaman ayıran oyuncu daha az riskli seçer".

## Bilinçli olarak toplanmayanlar (KVKK)

Ad, e-posta, cihaz kimliği, IP adresi, konum, tarayıcı bilgisi ve zaman damgası **toplanmaz**. Rol ve öğrenme hedefi de modele girmez; amaç kişiyi değil, karar anındaki davranışı modellemektir. Veri, oyuncunun kendi tarayıcısında (`localStorage`) tutulur, hiçbir sunucuya gönderilmez ve yalnızca oyuncunun indirdiği CSV dosyasıyla aktarılır.

## Bilinen sınırlar

- `karar_suresi_sn`, oyuncu sekmeden ayrılsa da saymaya devam eder.
- `kart_orani`, bir kartın ne kadar okunduğunu değil, yalnızca açılıp açılmadığını ölçer.
- Veri toplama modunda "Dur ve doğrula" müdahalesi kapalıdır. Böylece etiketler modelin kendi müdahalesinden etkilenmez.
- Süre üretim türünü de ele verir: manuel satırların medyanı 2,9 sn, algoritmik satırların yaklaşık 32 sn.
