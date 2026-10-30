# HUMAN.exe — Tasarım Belgesi

Bu belge, HUMAN.exe'nin görsel yaklaşımını, Google Stitch'te hazırlanan ekranları ve bu ekranların uygulamaya nasıl aktarıldığını açıklar. Görsel stil yalnızca sunum katmanıdır; karar mantığı (`src/utils/rules.ts`, `src/data/scenarioData.ts`) tasarımdan bağımsızdır.

## Tasarım dosyaları

| Dosya | İçerik |
|---|---|
| [`docs/design/stitch-canvas.png`](docs/design/stitch-canvas.png) | Google Stitch tuvali: "HUMAN OS" tasarım sistemi ve 3 mobil ekran |
| [`public/assets/aistudio/Image_7_59a9cf5d.markdown`](public/assets/aistudio/Image_7_59a9cf5d.markdown) | Stitch'ten dışa aktarılan "HUMAN OS" tasarım sistemi (renk, tipografi, boşluk belirteçleri ve stil kuralları) |
| [`docs/design/app-s1-onboarding.png`](docs/design/app-s1-onboarding.png) | Uygulama: profil ekranı |
| [`docs/design/app-s2-d1-tutor.png`](docs/design/app-s2-d1-tutor.png) | Uygulama: D1 karar ekranı ve açık tutor penceresi |
| [`docs/design/app-s3-d1-consequence.png`](docs/design/app-s3-d1-consequence.png) | Uygulama: D1 sonuç ekranı (riskli dal) |
| [`docs/design/app-s2-d2-decision.png`](docs/design/app-s2-d2-decision.png) | Uygulama: D2 kanıt kartları, ASSIST.exe ve seçenekler |
| [`docs/design/app-mobile-d1-tutor.png`](docs/design/app-mobile-d1-tutor.png) | Uygulama, 390×844 mobil: D1 ve açık tutor (demo videosundan kare) |
| [`docs/design/app-mobile-report.png`](docs/design/app-mobile-report.png) | Uygulama, 390×844 mobil: rapor ekranı (demo videosundan kare) |
| [`docs/demo/HUMAN-exe-demo.mp4`](docs/demo/HUMAN-exe-demo.mp4) | 60 sn mobil demo videosu |

**Stitch projesi:** https://stitch.withgoogle.com/projects/3511043973186749017

Masaüstü ekran görüntüleri (`app-s*.png`) ~1220 px genişlikte ve Tutor düğmesi düzeltmesinden önce alındı. Mobil kareler demo videosundan alındı; üstlerindeki lacivert altyazı şeridi videoya eklenmiştir, uygulamanın parçası değildir.

## Tasarım yaklaşımı: Windows 95/98

Tasarım sistemi ("HUMAN OS") 1990'ların sonundaki masaüstü işletim sistemlerinin dilini kullanır:

- **Renkler:** masaüstü zemini `#008080` (teal), etkin başlık çubuğu `#000080` → `#1084D0` geçişi, pencere gövdesi `#C0C0C0`, çalışma alanları `#FFFFFF`.
- **Biçim:** köşe yuvarlatması yok; her kap, düğme ve giriş alanında sol üstten beyaz, sağ alttan `#808080`/`#000000` çift tonlu 3B kabartma veya çökme kenarı.
- **Tipografi:** `MS Sans Serif, Tahoma, Arial` 10–11 px; terminal ve kod alanlarında `Courier New`.
- **Pencere metaforu:** her işlevsel alan bir pencere veya dosyadır: `INCIDENT.LOG`, `EVIDENCE/`, `ASSIST.exe`, `JUSTIFY.dlg`, `TUTOR.hlp`, `REPORT.txt`.
- **Görev çubuğu:** altta sabit; `Başlat` menüsü, etkin pencere düğmesi ve sistem tepsisindeki **simüle saat**.

Bu stil, öğrencinin "işletim sisteminin operatörü" olduğu hissini verir ve AI asistanını (ASSIST.exe) sıradan bir program penceresi olarak konumlandırır: önerisi bir karar değil, incelenecek bir girdidir.

Uygulamada stiller `src/index.css` içindeki `win95-*` yardımcı sınıfları (`win95-raised`, `win95-inset`, `win95-titlebar`, `win95-btn`, `win95-groupbox`, `win95-tab`) ve Tailwind ile uygulanır.

## Mobil öncelikli düzen

Gerçek bir masaüstündeki serbest sürüklenen pencereler mobilde kullanılamaz; bu yüzden uygulama **tek odak pencereli** bir düzen kullanır:

- Bir anda tek ana pencere gösterilir (profil, karar, sonuç veya rapor); genişlik ekrana uyar (`w-full`, en fazla `max-w-2xl`–`max-w-4xl`).
- Görev çubuğu ekranın altına sabittir; içerik altta boşluk bırakır.
- Tutor penceresi sağ altta yüzen bir panel olarak açılır, mobilde ekran genişliğinin %94'ünü geçmez.
- `JUSTIFY.dlg` ve sıfırlama onayı yarı saydam arka planlı, ortalanmış modal pencerelerdir.
- Kanıt kartları sekmeler hâlinde gösterilir; role göre sabitlenen kart ilk sekmede "SABİTLENDİ" etiketi taşır.
- Üstteki masaüstü kısayol satırı (`Sistem`, `INCIDENT.LOG`, `TUTOR.hlp`) dar ekranlarda başlığın altına kayar (`flex-wrap`). Önceden 360–390 px'te ekranın sağından taşıyordu ve `TUTOR.hlp` düğmesi görünmüyordu.

Mobil düzen Cypress ile 360×640 ve 390×844 görünümlerinde doğrulanır: yatay kaydırma olmaması, üst `TUTOR.hlp` düğmesinin ve karar penceresinin ekran içinde kalması (`cypress/e2e/responsive.cy.ts`). Mobil görünüm [`app-mobile-d1-tutor.png`](docs/design/app-mobile-d1-tutor.png), [`app-mobile-report.png`](docs/design/app-mobile-report.png) ve [demo videosunda](docs/demo/HUMAN-exe-demo.mp4) görülebilir.

## Stitch ekranları ve uygulamadaki karşılıkları

Stitch tuvalinde ([`stitch-canvas.png`](docs/design/stitch-canvas.png)) tasarım sistemi paneline ek olarak **üç mobil ekran** bulunur:

| Stitch ekranı | Stitch'te gösterilen | Uygulamadaki karşılığı |
|---|---|---|
| **USER SETUP** | `Setup.exe` penceresi: deneyim seviyesi, mühendislik rolü ve sorumluluk/öğrenme odağı radyo grupları; terminal tarzı başlık; alt görev çubuğu | S1 Profil — [`app-s1-onboarding.png`](docs/design/app-s1-onboarding.png), `OnboardingWindow.tsx` |
| **INCIDENT DESKTOP** | Kritik hata penceresi, ölçüm kutucukları, terminal günlüğü, ASSIST.exe öneri penceresi, iki seçenekli karar paneli, MSN tarzı Sokratik sohbet penceresi | S2 Karar — [`app-s2-d1-tutor.png`](docs/design/app-s2-d1-tutor.png), [`app-s2-d2-decision.png`](docs/design/app-s2-d2-decision.png), `IncidentDecisionWindow.tsx`, `TutorWindow.tsx` |
| **SYSTEM REPORT** | `Incident_Report.exe`: manifesto, üç kritik karar listesi, teknik sonuçlar tablosu, pedagojik not defteri, yeniden başlat düğmesi | S4 Rapor — [`app-mobile-report.png`](docs/design/app-mobile-report.png), `ReportWindow.tsx` |

Uygulamaya ek olarak Stitch'te ayrı bir ekranı olmayan **S3 Sonuç** ekranı ([`app-s3-d1-consequence.png`](docs/design/app-s3-d1-consequence.png), `ConsequenceWindow.tsx`) ve `JUSTIFY.dlg` modalı (`JustifyModal.tsx`) eklenmiştir.

### Stitch'ten uygulamaya bilinçli değişiklikler

Stitch ekranları erken bir keşif sürümüdür; içerik spesifikasyona göre değiştirildi:

- **Senaryo:** Stitch'te veritabanı bağlantı havuzu tükenmesi ve önbellek temizleme seçeneği vardır; uygulamada spesifikasyondaki şema migration'ı, acil yama ve log paylaşımı kararları kullanılır.
- **Onboarding seçenekleri:** Stitch'teki Junior/Mid/Staff seviyeleri, Backend/SRE/Sağlık Bilişim Mimarı rolleri ve farklı odaklar yerine Başlangıç/Orta/İleri, Developer/QA/Technical Lead ve Doğrulama/Risk/Gizlilik kullanılır.
- **Puan yok:** Stitch raporundaki "Sorumluluk Puanı 94/100" uygulanmadı; puanlama kapsam dışıdır. Rapor yalnızca tetiklenen risk bayraklarını ve gerekçe uyumunu gösterir.
- **Masaüstü simgeleri:** Stitch'teki üst simge şeridi yerine üstte kısayol düğmeleri (`Sistem`, `INCIDENT.LOG`, `TUTOR.hlp`) ve altta görev çubuğu kullanılır.
- **Tutor:** Stitch'teki "Socrates_Bot" sohbet penceresi `TUTOR.hlp` olarak uygulandı; ipucu merdiveni ve mod rozeti (`CANLI AI` / `KURAL TABANLI YEDEK`) eklendi.

## MSN Messenger tarzı tutor

`TUTOR.hlp`, tek kişilik bir sohbet penceresidir: başlık şeridinde "Tutor (Danışman)" kimliği ve durum satırı, mod rozeti, ipucu merdiveni çubuğu, mesaj balonları (tutor sola, öğrenci sağa), "düşünüyor" göstergesi ve alt kısımda metin kutusu + `Gönder`. Gerçek bir ürünün logosu veya marka öğesi kullanılmaz; yalnızca dönem estetiği taklit edilir.

## Görsel düzeltmeler

- **Başlık çubuğundaki "💬 Tutor" düğmesi** (karar ve sonuç pencereleri): eski ekran görüntülerinde ([`app-s2-d1-tutor.png`](docs/design/app-s2-d1-tutor.png), [`app-s3-d1-consequence.png`](docs/design/app-s3-d1-consequence.png)) metin, simge durumuna küçültme düğmesinin üzerine taşıyordu.
  - **Neden:** katmansız `.win95-title-btn` kuralı (`width: 16px`), Tailwind v4'ün katmanlı `w-auto px-1.5 bg-[…]` sınıflarını eziyordu.
  - **Çözüm:** etikete göre genişleyen `.win95-title-btn-label` sınıfı eklendi (`src/index.css`).
  - **Test:** `regression.cy.ts`, 390 ve 1280 px'te düğmenin taşmadığını ve yanındaki düğmeyle çakışmadığını kontrol ediyor.
- **Mobil üst kısayol satırı:** dar ekranda alt satıra kayıyor (bkz. Mobil öncelikli düzen).

## Bilinen görsel sorunlar

- Tutor paneli masaüstü genişliğinde karar penceresinin sağ kısmını örtüyor.
- Aynı kökten gelen sorun: `.win95-btn` kuralı da Tailwind boyut sınıflarını eziyor (ör. üst kısayol düğmelerindeki `text-[10px] py-0.5`). Görsel bir çakışmaya yol açmıyor, ama bu düğmeler tasarlanandan biraz büyük görünüyor.
- Gövde metni 10–11 px; erişilebilirlik için hedeflenen ≥ 16 px karşılanmıyor. WCAG kontrast oranları ölçülmedi.
