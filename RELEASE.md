# RELEASE — human-exe-blind-accept-onnx

| Alan | Değer |
|---|---|
| Sürüm | `v2.0` (`model/config.json` → `version: 2.0.0`) |
| Model reposu | https://huggingface.co/yagmurbekil/human-exe-blind-accept-onnx |
| Sabitlenmiş commit | `HF_COMMIT_BEKLIYOR` |
| Tüketici URL'si | `https://huggingface.co/yagmurbekil/human-exe-blind-accept-onnx/resolve/HF_COMMIT_BEKLIYOR/model.onnx` |

Tüketiciler `main` dalını değil bu commit'i kullanır (`src/utils/riskModel.ts` → `HF_COMMIT`). Böylece Hub'a yeni dosya yüklemek canlı uygulamayı değiştirmez; sürüm değişikliği her zaman kod incelemesinden geçen bir commit'tir (Sommerville Bl. 25, konfigürasyon yönetimi).

## v2.0'da ne değişti

İlk yayın. Önceki sürümde (`v2.2` kural tabanlı oyun) model yoktu: uyum yalnızca seviye, rol ve hedefe bağlıydı. `v2.0` ile oyuncunun davranışından `p_kor_onay` hesaplanır ve eşik geçilirse `DOGRULA.dlg` açılır.

**Eval kapısı geçmişi (seed 42, eşikler `spec.md` §12.4):**

| Deneme | Değişiklik | ROC-AUC | Recall | Sonuç |
|---|---|---|---|---|
| 1 | `LogisticRegression` varsayılan | 0.7310 | **0.5238** | Kapı kapalı, artefakt yazılmadı |
| 2 | `class_weight="balanced"` | 0.7330 | 0.7619 | Kapı açık |

Eşik düşürülmedi, sentetik veri değiştirilmedi. Sınıf dengesizliği (riskli satırlar yaklaşık %32) için model ayarı değişti. Bu ayar aynı test kümesi görüldükten sonra yapıldığından test skoru iyimser olabilir. Gerçek satırlar üzerindeki test AUC'si 0.5083'tür (16 satır); ayrıntı model kartında.

## Geri alma (rollback)

Önceki model sürümü olmadığı için `v2.0` sorun çıkarırsa geri dönüş noktası modelsiz oyundur:

1. `src/utils/riskModel.ts` içinde `isModelEnabled` sonucunu kapat ya da `HF_COMMIT` değerini bir önceki sürümün commit'ine al.
2. Uygulamayı yeniden yayınla. Hub'da hiçbir şey silinmez: eski commit URL'leri çalışmaya devam eder.
3. Model indirilemezse veya 3 sn içinde yanıt vermezse oyun zaten pencere açmadan devam eder; bu davranış `cypress/e2e/model.cy.ts` ile test edilir.

Sonraki sürümlerde (`v2.1` ve sonrası) geri alma tek satırlık `HF_COMMIT` değişikliğidir.

## Yeni sürümü güvenle devreye alma

Bu adımlar sonraki sürümler için **plandır**, henüz uygulanmadı. Oyunun sunucuya veri göndermemesi temel kısıttır; bu yüzden ölçümler oyuncunun tarayıcısında kalır ve yalnızca gönüllü olarak indirilen CSV ile toplanır.

1. **Shadow (gölge):** Yeni model mevcut modelle birlikte tarayıcıda yüklenir, ikisi de aynı girdiyi skorlar, ama pencere kararını yalnızca eski model verir. Veri toplama modundaki CSV'ye iki olasılık da yazılır. Bir hafta veya 30 oturum sonunda kararların ne kadar ayrıştığı ve yeni modelin AUC'si karşılaştırılır.
2. **Canary (%5):** Oturum kimliğinin özetine göre oturumların %5'i yeni modeli kullanır. Kritik gösterge pencere oranıdır: yeni modelde `DOGRULA.dlg` kararların %60'ından fazlasında açılıyorsa oyuncuyu yoran bir uyarıya dönmüştür ve durdurulur.
3. **Progressive rollout (%25 → %50 → %100):** Her adımda en az 20 oturum beklenir. Pencere oranı, `Kararımı gözden geçir` oranı ve JavaScript hataları kontrol edilir. Eşik aşılırsa önceki `HF_COMMIT`'e dönülür.

Her aday önce aynı eval kapısından ve parite testinden geçer (Breck vd., 2017).

## Mimari dağıtım kararı ve ödünleşim matrisi

**Karar:** birincil tüketici tarayıcı (`onnxruntime-web`), ikinci tüketici kendi Express sunucumuz (`POST /api/risk`, yalnızca parite doğrulaması için).

| Soru | Tarayıcı (`onnxruntime-web`) — **seçildi** | Cihaz içi mobil (Expo) | Kendi sunucumuz (`/api/risk`) |
|---|---|---|---|
| **1. İnternet ve gecikme** | İlk açılışta model ve WASM iner (model 613 bayt, WASM CDN'den yaklaşık 10 MB). Sonra skorlama ağsızdır. | İnternetsiz çalışır, ilk indirme gecikmesi yoktur. | Her istekte ağ gecikmesi var, ağ yoksa çalışmaz. |
| **2. Veri cihazdan çıkar mı?** | **Çıkmaz.** Davranış verisi oyuncuda kalır; KVKK açısından en temiz seçenek. | Çıkmaz. | Çıkar: davranış sunucuya gider, işleme ve saklama için gerekçe gerekir. |
| **3. Model gizli kalır mı?** | Hayır. `model.onnx` herkese açık; zaten açık Hub reposunda. | Hayır, paketten çıkarılabilir. | Evet, dosya istemciye inmez; ama çok sayıda istekle davranışı tersine mühendislikle taklit edilebilir. |
| **HUMAN.exe için sonuç** | Model sır değil, veri ise kişiseldir; gizlilik öncelikli. | Oyun web tabanlı; ayrı uygulama kapsam dışı. | Bonus parite için kullanılır; oyun buna bağımlı değildir. |

**Risk:** WASM CDN'den (jsDelivr) gelir. CDN kapalıysa veya kurum ağı engellerse model çalışmaz, oyun model olmadan devam eder.

**Sunucu notu:** `/api/risk` yerel olarak Cypress ile test edildi. AI Studio'daki canlı dağıtımda çalıştığı doğrulanmadı.

## Doğrulama

```bash
.venv/Scripts/python tests/eval_kapisi.py
.venv/Scripts/python tests/parite.py --kontrol
npm run test:cypress
```

## Kaynaklar

- Amershi vd. (2019), *Software Engineering for Machine Learning: A Case Study*
- Shankar vd. (2022), *Operationalizing Machine Learning: An Interview Study* (Velocity, Validation, Versioning)
- Breck vd. (2017), *The ML Test Score*
- Mitchell vd. (2019), *Model Cards for Model Reporting*
- Sommerville, *Software Engineering* (10. baskı), Bl. 8 ve Bl. 25
- Hugging Face Hub belgeleri (`revision`, `resolve` URL), ONNX Runtime, `skl2onnx`
