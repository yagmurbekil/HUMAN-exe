# Sizinle Uyumlanan Sınav Tasarımı

**Ana fikir:** Tanım sormak ezberi ölçer. Bu yüzden sorunun merkezine, tüm testleri geçtiği hâlde yanlış olan bir sistem koydum. Öğrenci ancak doğrulama ile geçerlemeyi gerçekten ayırabiliyorsa soruyu çözebilir. Sınav öğrenciyle de uyumlanır: öğrenci b şıkkında hangi kavramı yanlış kullanırsa c şıkkında onu savunmak zorunda kalır.

## Soru (90 dakika, kapalı kitap, 100 puan)

Bir hastanenin triyaj uygulamasında, hastanın acil sınıfını tahmin eden küçük bir model kullanılıyor. Ekip modeli Python'da eğitip ONNX'e çevirdi ve tarayıcıda çalıştırdı. Ekibin elindeki kanıtlar:

- 300 girdilik diferansiyel testte Python ve tarayıcı olasılıkları arasındaki en büyük fark `3e-6`, tolerans `1e-4`.
- Geçen sürümün çıktılarını kayıt altına alan 50 testin hepsi geçiyor.
- Test kümesinde ROC-AUC 0.91. Eşik 0.85 idi.
- Eğitim verisinin %80'i, bir mühendisin yazdığı kuraldan üretilmiş sentetik veri.

Yayından iki hafta sonra hemşireler, yaşlı hastaların sistematik olarak düşük önceliğe atandığını bildiriyor.

**a) (20p)** Yukarıdaki dört kanıtın her birini doğrulama (verification) veya geçerleme (validation) olarak sınıflandırın ve gerekçenizi tek cümleyle yazın. Hangisi "modeli doğru mu kurduk", hangisi "doğru modeli mi kurduk" sorusuna yanıt veriyor?

**b) (25p)** Diferansiyel test kusursuz geçtiği hâlde hata neden yakalanamadı? Bu testte test kahini (oracle) kimdir ve kahinin kendisi yanlışsa test ne söyler? Toleransı `1e-4`'ten `1e-9`'a indirmek sorunu çözer mi?

**c) (20p)** Ekip "50 regresyon testi geçti, yani davranış doğru" diyor. Bu cümledeki hatayı karakterizasyon testinin ne ölçtüğünü açıklayarak gösterin. Hata düzeltildiğinde bu testlere ne olur, bu kötü bir şey midir?

**d) (20p)** Bu hatayı yayından önce yakalayacak tek bir ek test tasarlayın: girdi, beklenen sonuç, kabul eşiği ve bu eşiği **neden veriyi görmeden önce** yazmanız gerektiği.

**e) (15p)** Düzeltilmiş modeli hastaneye nasıl açarsınız? Gölge dağıtımın hastane bağlamında canary'den neden önce gelmesi gerektiğini ve geri alma için neyi hazır tutacağınızı yazın.

## Beklediğim temel kavramlar

- Diferansiyel test **yalnızca iki uygulamanın birbirine uyduğunu** gösterir: bu doğrulamadır. İkisi de aynı yanlışı yapabilir.
- Kahin Python modelidir ve gerçeğin kendisi değildir. Tolerans sayısal farkı ölçer, modelin anlamını ölçmez; bu yüzden toleransı sıkmak hiçbir şey çözmez.
- Regresyon testi "dünkü gibi mi" sorusunu yanıtlar, "doğru mu" sorusunu değil. Karakterizasyon testi hatayı da kaydeder; hata düzeltilince kırılması beklenir ve bu iyi bir işarettir.
- Asıl sorun geçerlemededir: sentetik kural yaşlı hastaları yeterince temsil etmiyor, toplu AUC alt grubu gizliyor. Doğru ek test, gerçek veride yaş grubuna göre duyarlılık kapısıdır.
- Eşik önceden yazılmazsa sonuca göre uydurulur.

## Çeldiriciler

- "Toleransı sıkalım": sayısal doğruluğu anlamsal doğrulukla karıştırır.
- "Daha çok test girdisi ekleyelim": 3.000 girdi de aynı kahine bakar.
- "AUC 0.91 olduğuna göre model iyi": toplu metrik, alt grup hatasını örter.
- "Regresyon testleri kırılırsa hata vardır": kırılma düzeltmenin kanıtı da olabilir.

## Neden bu soru?

HUMAN.exe'yi geliştirirken aynı tuzakla karşılaştım: Python, tarayıcı ve sunucu 1e-4 toleransla birebir uyuştu, ama bu modelin gerçek oyuncu davranışını öğrendiğini kanıtlamadı. Gerçek satırlardaki test AUC'si 0.51 çıktı. Parite doğrulamaydı, geçerleme değildi.
