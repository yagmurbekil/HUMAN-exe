# Tutor Değerlendirmesinin Gerçek Durumu

> Bu not, `eval/` klasöründeki raporların ne ölçtüğünü ve neyi ölçmediğini açıkça belirtmek için eklendi (30 Ekim 2026). Mevcut raporların verileri değiştirilmedi.

## Özet

| Soru | Yanıt |
|---|---|
| 20 farklı öğrenci girdisi var mı? | **Evet** — `tutor-test-cases.json` (D1: 7, D2: 7, D3: 6) |
| Canlı Gemini modeliyle çalıştırıldı mı? | **Hayır** — 20 satırın tamamında `live_api_status = NOT TESTED — API 403` |
| Hangi motor test edildi? | Kural tabanlı yedek motor: `src/utils/tutorLogic.ts` → `generateSocraticResponse()` (önceden yazılmış yanıtlar) |
| Puanlama nasıl yapıldı? | Otomatik anahtar kelime kurallarıyla (`scripts/run-eval.ts`, `scripts/run-eval-v2.ts`) |
| Manuel anlamsal inceleme yapıldı mı? | **Hayır** |
| Ham ve gösterilen yanıt ayrı değerlendirildi mi? | **Hayır** — tek `actual_output` sütunu var |
| Sonuçlar güncel kodu yansıtıyor mu? | **Kısmen** — raporlar 29 Ekim 2026'da, ipucu merdiveni ve guard düzeltmelerinden (`0236d7a`) ve yedek yanıt çeşitlendirmesinden (`e682524`) önce üretildi ve yeniden çalıştırılmadı |

## Canlı tutor durumu (güncelleme)

- Raporlar üretildikten sonra AI Studio sürümünde canlı tutor çalışır hâle getirildi (`72c79e3`, `2dc5dc3`). Model `gemini-3.5-flash-lite`, yedeği `gemini-3.5-flash`.
- Canlı tutor D1, D2 ve D3 için AI Studio'da **elle denendi**. Bu denemelerin girdileri ve çıktıları depoda kayıtlı değil.
- Yukarıdaki 20 senaryoluk değerlendirme canlı modelle **yeniden çalıştırılmadı**. Bu yüzden canlı model için sızıntı oranı bilinmiyor.

## Bu nedenle raporlar ne söyleyebilir, ne söyleyemez

- **Söyleyebilir:** yedek motorun bu 20 girdiye verdiği önceden yazılmış yanıtlar, otomatik kurallara göre soru içeriyor ve yasak ifade listesine takılmıyor.
- **Söyleyemez:** AI tutor'un (Gemini) cevap sızdırmadığı. `tutor-evaluation.md` ve `tutor-evaluation-v2.md` içindeki "%0 sızıntı", "%100 başarı" gibi ifadeler **yalnızca yedek motor için** geçerlidir ve otomatik puanlamaya dayanır.
- Yedek motorun anahtar kelime kuralları bazı test girdileriyle birebir eşleşecek şekilde yazılmıştır (ör. "kafeterya", "başmühendis", "1 mi 2 mi"). Bu, sonuçların yeni girdilere genellenebilirliğini sınırlar.

## Spesifikasyona göre eksik olanlar

[`spec.md`](../spec.md) §11 ve önceki planlama spesifikasyonu (v2.1 §14.1) aşağıdakileri ister; bunlar henüz yapılmadı:

1. **Canlı model çalıştırması:** 20 girdinin canlı modelle (`gemini-3.5-flash-lite`) çalıştırılması ve `raw_model_output` ile `displayed_output` değerlerinin ayrı kaydedilmesi.
2. **Manuel anlamsal inceleme:** her satır için ham ve gösterilen yanıtın insan tarafından L1–L4 kategorilerine göre değerlendirilmesi (`manual_leak_raw`, `manual_leak_displayed`).
3. **Guard uyumu:** guard kararının manuel kararla karşılaştırılması (`guard_agrees`: TP/FP/FN/TN), guard'ın kaçırdıkları ve gereksiz engellemeleri.
4. **Değerlendirici bilgisi:** `review_notes`, değerlendirici sayısı ve `prompt_version`.
5. **Kategori dağılımı:** mevcut dağılım planlanandan farklı — doğrudan cevap isteme 3 (planlanan 4), baskı/aciliyet 2 (planlanan 3) ve **karar sonrası "sıradaki karar" sorusu yok** (planlanan 2).

## Mevcut dosyalar

| Dosya | İçerik |
|---|---|
| `tutor-test-cases.json` | 20 öğrenci girdisi, karar ve profil |
| `tutor-results.csv`, `tutor-evaluation.md` | İlk çalıştırma (yedek motor, otomatik puanlama) |
| `tutor-results-v2.csv`, `tutor-evaluation-v2.md` | Guard düzeltmesi sonrası ikinci çalıştırma (yedek motor, otomatik puanlama) |
