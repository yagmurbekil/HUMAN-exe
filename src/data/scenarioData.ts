/**
 * HUMAN.exe — The Accountability Protocol
 * Scenario Data (v2.1 final specification)
 */

import { DecisionDefinition, DecisionId, Role, Goal } from '../types';

export const INCIDENT_FACTS = {
  hospitalName: 'Şifa Kent Hastanesi',
  systemName: 'Merkezi Randevu Yönetim Sistemi (MRYS)',
  startTime: '08:00',
  description:
    'Dün akşam v2.4 sürümü yayına alındı. Saat 08:00 itibarıyla randevu oluşturma ekranı aralıksız HTTP 500 hatası vermekte, poliklinik önlerinde bekleyen hasta kuyruğu hızla artmaktadır. Nöbetçi sistem mühendisi olarak olay müdahale yetkisi sizdedir.',
};

export const DECISIONS: Record<DecisionId, DecisionDefinition> = {
  D1: {
    id: 'D1',
    number: 1,
    title: 'D1 — Mimari: Geri Alma (Rollback) Kararı',
    subtitle: 'v2.3 sürümüne acil dönüş talebi',
    time: '08:00',
    description:
      'Randevu servisi çöktü. Başhekimlik ve operasyon ekibi sistemin derhal dün akşamki v2.3 sürümüne geri alınmasını talep ediyor.',
    incidentFact:
      'v2.4 sürümü randevu tablosuna zorunlu (NOT NULL) bir slot_type sütunu ekledi. Eski v2.3 kodunun bu şemayla geriye dönük uyumluluğu BİLİNMİYOR.',
    assistRecommendation: 'v2.3\'e hemen geri dönülmesini öneriyorum. Güven: %92.',
    assistConfidence: 92,
    assistStatus: 'misleading',
    evidenceCards: [
      {
        id: 'MIGRATION_DIFF',
        title: 'MIGRATION_DIFF',
        filename: 'db/migrations/20261029_v2.4_appointments.sql',
        category: 'code',
        badge: 'Şema Değişikliği',
        content: 'Randevu tablosuna yeni zorunlu (NOT NULL) \'slot_type\' sütunu eklendi.',
        codeSnippet: `ALTER TABLE appointments \n  ADD COLUMN slot_type VARCHAR(32) NOT NULL DEFAULT 'STANDARD';\n-- UYARI: v2.3 uygulamasının bu sütun olmadan yazma davranışı test edilmedi.`,
      },
      {
        id: 'RELEASE_NOTES',
        title: 'RELEASE_NOTES',
        filename: 'docs/releases/v2.4.0-RELEASE.txt',
        category: 'test',
        badge: 'Sürüm Notu',
        content: 'Migration geri dönüş (down migration / rollback) betiği bulunmamaktadır. Randevu slot tiplerini ayıran yeni mimari devreye alındı.',
      },
      {
        id: 'ASSIST_LOG',
        title: 'ASSIST_LOG',
        filename: 'logs/assist_diagnostics_0800.log',
        category: 'code',
        badge: 'AI Telemetrisi',
        content: 'ASSIST.exe önerisini yalnızca son 15 dakikalık HTTP 500 hata oranına (%84) dayandırmaktadır. Veritabanı şema kısıtlarını kontrol etmemiştir.',
      },
      {
        id: 'STAKEHOLDER_MSG',
        title: 'STAKEHOLDER_MSG',
        filename: 'comms/slack_emergency_channel.txt',
        category: 'policy',
        badge: 'Paydaş Baskısı',
        content: 'Başhekim Yardımcısı Dr. Selim Kaya: "Poliklinik önlerinde yüzlerce hasta kuyrukta bekliyor. Randevu sistemi acilen eski haline döndürülmeli!"',
      },
    ],
    options: [
      {
        id: 'D1_ROLLBACK_NOW',
        text: 'ASSIST.exe önerisini uygula: v2.3\'e hemen geri dön.',
        timeCostMin: 5,
        // Geri alma başarısız olur; ekibin v2.4'e dönmesi 20 dk daha sürer (§6.2).
        recoveryPenaltyMin: 20,
        flag: 'ARCH_RISK',
        isSafe: false,
      },
      {
        id: 'D1_VERIFY_SCHEMA',
        text: 'Geri almadan önce v2.3\'ün yeni şemayla uyumunu ve geri dönüş ön koşullarını doğrula.',
        timeCostMin: 15,
        flag: null,
        isSafe: true,
      },
    ],
    // Screen fixed order: 2 - 1 - 3
    justifications: [
      {
        id: 2,
        text: 'Yapay zekânın güven skoru yüksekse ek doğrulama gerekmez.',
        isAligned: false,
      },
      {
        id: 1,
        text: 'Şema değişikliği içeren bir sürümde geri alma, eski sürümün yeni şemayla uyumu kanıtlanmadan güvenli kabul edilemez.',
        isAligned: true,
      },
      {
        id: 3,
        text: 'Eski sürümler her zaman yeni sürümlerden daha kararlıdır.',
        isAligned: false,
      },
    ],
    consequences: {
      D1_VERIFY_SCHEMA: {
        title: 'Şema Doğrulaması Tamamlandı — Roll-Forward Kararı',
        description:
          'Doğrulama, v2.3\'ün slot_type sütununu yazamayacağını gösterir; geri alma randevu kayıtlarını bozacaktı. Ekip v2.4 üzerinde kalıp yamayla ileri düzeltme (roll-forward) yapmaya karar verir.',
        principle: 'Geriye dönük uyumluluk, geri dönüş planı, AI önerisinin dayandığı kanıtın sorgulanması.',
        definition:
          'Geriye Dönük Uyumluluk (Backward Compatibility): Bir sistemin eski sürümlerinin yeni veri formatları veya veritabanı şemalarıyla bozulmadan çalışabilme yeteneğidir.',
        tradeoffQuestion:
          '5 dakikalık hızlı bir geri alma cazibesi ile 15 dakikalık doğrulama süresi arasındaki ödünleşimi gerçek bir krizde nasıl savunursunuz?',
      },
      D1_ROLLBACK_NOW: {
        title: 'Kritik Şema Uyuşmazlığı — İkincil Kesinti',
        description:
          'v2.3 devreye girer; yeni şemaya kayıt yazamadığı için randevu oluşturma tamamen durur. Ekip 20 dakika sonra v2.4\'e geri döner. Saat 08:25. ARCH_RISK kaydedildi.',
        principle: 'Geriye dönük uyumluluk, geri dönüş planı, AI önerisinin dayandığı kanıtın sorgulanması.',
        definition:
          'Şema Göçü Riski (Schema Migration Risk): Veritabanında zorunlu kılınan yeni kolonlara eski kod sürümlerinin yazamaması sonucu oluşan sessiz veya yıkıcı çöküşlerdir.',
        tradeoffQuestion:
          'Yapay zekanın sunduğu %92 güven skoru, arka plandaki teknik kısıtları doğrulamadan karar vermek için neden yetersiz kaldı?',
      },
    },
    hintLadder: [
      'ASSIST.exe önerisini hangi metrik üzerine kurmuş? Veritabanı katmanını hesaba katmış mı?',
      'MIGRATION_DIFF ve RELEASE_NOTES kartlarındaki slot_type kolonuna ve rollback betiği durumuna dikkatle bakın.',
      'Geriye dönük uyumluluk (backward compatibility), eski bir kod sürümünün yeni veri yapısıyla bozulmadan çalışabilmesidir. v2.3 kodu, v2.4 ile eklenen zorunlu bir sütundan haberdar mı ve bunu hangi kanıta dayanarak bilebilirsin?',
    ],
  },

  D2: {
    id: 'D2',
    number: 2,
    title: 'D2 — Doğrulama: Acil Yamanın Yayına Alınması',
    subtitle: 'hotfix-2.4.1 derlendi, yayın onayı bekleniyor',
    time: '08:15',
    description:
      'Sistem v2.4 şeması üzerinde bekliyor. Mühendislik ekibi randevu hatasını gideren acil yamayı (hotfix-2.4.1) hazırladı.',
    incidentFact:
      'Yama derlendi ve birim testlerinden geçti ancak kullanıcı akışlarını doğrulayan smoke test henüz çalıştırılmadı.',
    assistRecommendation: 'Yama derlendi ve birim testleri geçti. Hemen yayına alınabilir.',
    assistConfidence: 89,
    assistStatus: 'misleading',
    evidenceCards: [
      {
        id: 'HOTFIX_DIFF',
        title: 'HOTFIX_DIFF',
        filename: 'git/diff_hotfix-2.4.1.patch',
        category: 'code',
        badge: 'Kod Yaması',
        content: 'Yama randevu SQL sorgusunu düzeltirken oturum yönetimi (session token) kod bloklarına da dokunuyor.',
        codeSnippet: `@@ -142,6 +142,12 @@ session_auth.ts\n+ token.renew_expiry_on_appointment();\n- return fallback_session;\n+ return safe_session_token(req);`,
      },
      {
        id: 'CI_STATUS',
        title: 'CI_STATUS',
        filename: 'ci/pipeline_build_8812.log',
        category: 'test',
        badge: 'Birim Test Raporu',
        content: 'Birim testleri geçti: 42/42 (%100). Uçtan uca (E2E) entegrasyon testleri acil durum sebebiyle atlandı.',
      },
      {
        id: 'SMOKE_CHECKLIST',
        title: 'SMOKE_CHECKLIST',
        filename: 'qa/smoke_test_protocol_emergency.md',
        category: 'test',
        badge: 'Kritik Akış Kontrolü',
        content: 'Randevu oluşturma, iptal ve hekim oturum açma kritik akışları. Tahmini çalıştırma süresi: 10 dakika.',
      },
      {
        id: 'STAKEHOLDER_MSG',
        title: 'STAKEHOLDER_MSG',
        filename: 'comms/slack_emergency_channel.txt',
        category: 'policy',
        badge: 'Yönetim Çağrısı',
        content: 'Başhekim: "Birim testler yeşilse her saniye kritik, hemen yayına alın! Hastalar isyan noktasında."',
      },
    ],
    options: [
      {
        id: 'D2_SMOKE_TEST',
        text: 'Yayından önce randevu oluşturma, iptal ve oturum açma için odaklı smoke test çalıştır.',
        timeCostMin: 10,
        flag: null,
        isSafe: true,
      },
      {
        id: 'D2_DEPLOY_NOW',
        text: 'Birim testleri geçtiği için yamayı hemen yayına al.',
        timeCostMin: 2,
        flag: 'VERIFY_RISK',
        isSafe: false,
      },
    ],
    // Screen fixed order: 2 - 3 - 1
    justifications: [
      {
        id: 2,
        text: 'Acil durumda hız her zaman doğrulamadan daha önemlidir.',
        isAligned: false,
      },
      {
        id: 3,
        text: 'Yama küçük olduğu için risk taşımaz.',
        isAligned: false,
      },
      {
        id: 1,
        text: 'Birim testleri, kullanıcı akışlarının uçtan uca çalıştığını kanıtlamaz; kritik akışlar yayından önce doğrulanmalıdır.',
        isAligned: true,
      },
    ],
    consequences: {
      D2_SMOKE_TEST: {
        title: 'Smoke Test ile Oturum Hatası Yakalandı',
        description:
          'Smoke test, 5 dakika sonra oturumu düşüren bir token hatasını yakalar; hata düzeltilir, düzeltilmiş yama güvenle yayına alınır.',
        principle: 'Test kanıtının kapsamı, smoke test, birim/uçtan uca test farkı.',
        definition:
          'Smoke Test (Duman Testi): Bir sürümün en temel ve kritik işlevlerinin canlı ortamda çalışabilirliğini doğrulayan asgari kapsamlı test protokolüdür.',
        tradeoffQuestion:
          '10 dakikalık bir doğrulama gecikmesi mi, yoksa canlıda aralıklı oturum düşmesiyle hasta randevularının kaybolması mı daha büyük bir maliyettir?',
      },
      D2_DEPLOY_NOW: {
        title: 'Canlıda Aralıklı Oturum Düşmesi',
        description:
          'Randevu ekranı açılır; ancak oturum hatası nedeniyle kullanıcıların bir kısmı randevu tamamlarken oturumdan atılır (aralıklı hata). VERIFY_RISK kaydedildi.',
        principle: 'Test kanıtının kapsamı, smoke test, birim/uçtan uca test farkı.',
        definition:
          'Birim Testi Sınırları: Birim testleri modülleri soyutlanmış ortamda sınar; entegre oturum ve durum yönetimi problemlerini kanıtlayamaz.',
        tradeoffQuestion:
          'Hemen yayına alarak 8 dakika kazandınız, ancak aralıklı hataların kök nedenini canlıda ayıklamak kaç saatlik ek zarara yol açabilir?',
      },
    },
    hintLadder: [
      'Birim testlerinin geçmiş olması (CI_STATUS) kullanıcıların uçtan uca randevu alabileceğini garanti eder mi?',
      'HOTFIX_DIFF kartındaki kod değişikliklerine bakın. Yama randevu sorgusu dışında hangi kritik modüle dokunuyor?',
      'Birim testi tek bir modülü izole ortamda sınar; uçtan uca bir kontrol ise kullanıcı akışını baştan sona doğrular. CI_STATUS\'taki 42/42 sonucu, yamanın dokunduğu oturum kodu hakkında hangi soruyu yanıtlıyor, hangisini yanıtsız bırakıyor?',
    ],
  },

  D3: {
    id: 'D3',
    number: 3,
    title: 'D3 — Gizlilik: Olay Tanı Logunun Paylaşılması',
    subtitle: 'Harici mühendislerle kök neden analizi',
    time: '08:25',
    description:
      'Kök neden analizi ve kalıcı düzeltme için hata logunun mühendislik kanallarına iletilmesi gerekiyor.',
    incidentFact:
      'Hata logu kurgusal hasta adı, doğum tarihi ve T.C. kimlik / protokol numarası içermektedir.',
    assistRecommendation: 'Paylaşmadan önce kimlik alanlarını maskelemenizi öneririm.',
    assistConfidence: 95,
    assistStatus: 'accurate',
    evidenceCards: [
      {
        id: 'LOG_SAMPLE',
        title: 'LOG_SAMPLE',
        filename: 'logs/incident_20261029_error_trace.json',
        category: 'code',
        badge: 'Hata Log Örneği',
        content: 'Hata logu kurgusal hasta adı, doğum tarihi ve hasta no alanlarını içermektedir.',
        codeSnippet: `{\n  "error": "NullPointerInSlotAllocation",\n  "patient_name": "Ahmet Yılmaz",\n  "birth_date": "1982-04-12",\n  "national_id": "38291049210",\n  "requested_slot": "POLIKLINIK_DAHILIYE"\n}`,
      },
      {
        id: 'CHANNEL_INFO',
        title: 'CHANNEL_INFO',
        filename: 'directory/slack_channels_audit.csv',
        category: 'policy',
        badge: 'Kanal Üye Analizi',
        content: '#genel-muhendislik kanalı: 120 üye (harici üçüncü taraf yükleniciler dahil).\n#olay-0800 kanalı: 5 yetkili çekirdek müdahale ekibi üyesi.',
      },
      {
        id: 'DATA_POLICY',
        title: 'DATA_POLICY',
        filename: 'legal/hospital_data_governance_v3.pdf',
        category: 'policy',
        badge: 'Veri Güvenlik Politikası',
        content: 'Kişisel sağlık ve kimlik verileri (PII) tanı loglarında maskelenmeli ve kesinlikle yalnızca "bilmesi gereken" (need-to-know) yetkili personele sınırlandırılmalıdır.',
      },
    ],
    options: [
      {
        id: 'D3_SHARE_RAW',
        text: 'Kök neden analizini hızlandırmak için ham logu #genel-muhendislik kanalında paylaş.',
        timeCostMin: 1,
        flag: 'PRIVACY_RISK',
        isSafe: false,
      },
      {
        id: 'D3_REDACT_RESTRICT',
        text: 'Kimlik alanlarını maskele ve logu yalnızca #olay-0800 kanalında paylaş.',
        timeCostMin: 8,
        flag: null,
        isSafe: true,
      },
    ],
    // Screen fixed order: 1 - 3 - 2
    justifications: [
      {
        id: 1,
        text: 'Kişisel veri, analiz için gerekli olmadıkça maskelenmeli ve yalnızca bilmesi gerekenlerle paylaşılmalıdır.',
        isAligned: true,
      },
      {
        id: 3,
        text: 'Veri kurgusal olduğu için gerçek bir olayda da sorun olmazdı.',
        isAligned: false,
      },
      {
        id: 2,
        text: 'Kanal şirket içi olduğu için gizlilik riski yoktur.',
        isAligned: false,
      },
    ],
    consequences: {
      D3_REDACT_RESTRICT: {
        title: 'Veri Minimizasyonu Sağlandı — Güvenli Paylaşım',
        description:
          'Analiz için gereken teknik alanlar korunur, kişisel veri ifşa edilmez. Çekirdek ekip kök nedeni hasta mahremiyetini çiğnemeden çözer.',
        principle: 'Veri minimizasyonu, en az yetki, erişim kapsamı.',
        definition:
          'Veri Maskeleme (Redaction): Teknik analizde değeri olmayan kişisel kimlik verilerinin paylaşım öncesinde otomatik veya manuel olarak ayıklanmasıdır.',
        tradeoffQuestion:
          'Kriz anında 8 dakika harcayıp veriyi maskelemek, kurumu milyonlarca liralık veri ihlali cezasından nasıl kurtarır?',
      },
      D3_SHARE_RAW: {
        title: 'Kişisel Veri İhlali — Hukuki Eskalasyon',
        description:
          'Kurgusal hasta verisi 120 kişiye (harici yükleniciler dahil) ifşa olur; simüle olarak kurumun veri koruma sorumlusuna eskalasyon gerekir. PRIVACY_RISK kaydedildi.',
        principle: 'Veri minimizasyonu, en az yetki, erişim kapsamı.',
        definition:
          'En Az Yetki İlkesi (Least Privilege): Veriye erişimin yalnızca o işlemi icra etmekle yükümlü olan minimum sayıda kişiye tahsis edilmesidir.',
        tradeoffQuestion:
          'Şirket içi kanallara veri atarken harici danışmanların veya stajyerlerin varlığını göz ardı etmek mühendislikte hangi sorumluluk açığını gösterir?',
      },
    },
    hintLadder: [
      'Log örneğindeki patient_name ve national_id alanları teknik hata analizine doğrudan katkı sağlar mı?',
      'CHANNEL_INFO kartındaki 120 kişilik üye profiline ve üçüncü parti yüklenicilere dikkat ettin mi?',
      'Veri minimizasyonu, bir iş için yalnızca gerekli verinin işlenmesidir; en az yetki ise erişimin yalnızca bilmesi gerekenlerle sınırlanmasıdır. Kök neden analizi için LOG_SAMPLE\'daki hangi alanlar gerçekten gerekli ve bu logu kimlerin görmesi gerekiyor?',
    ],
  },
};

/**
 * Role-based Evidence Card Ordering
 * - Developer: Code/schema card first (MIGRATION_DIFF, HOTFIX_DIFF, LOG_SAMPLE)
 * - QA: Test/evidence card first (RELEASE_NOTES, CI_STATUS, LOG_SAMPLE)
 * - Technical Lead: Stakeholder/policy card first (STAKEHOLDER_MSG, STAKEHOLDER_MSG, DATA_POLICY)
 */
export const PINNED_CARD_BY_ROLE: Record<Role, Record<DecisionId, string>> = {
  developer: { D1: 'MIGRATION_DIFF', D2: 'HOTFIX_DIFF', D3: 'LOG_SAMPLE' },
  qa: { D1: 'RELEASE_NOTES', D2: 'CI_STATUS', D3: 'LOG_SAMPLE' },
  tech_lead: { D1: 'STAKEHOLDER_MSG', D2: 'STAKEHOLDER_MSG', D3: 'DATA_POLICY' },
};

// Pins the role's card first and keeps the remaining cards in their original order.
export function getOrderedEvidenceCards(
  cards: DecisionDefinition['evidenceCards'],
  role: Role | null,
  decisionId: DecisionId
) {
  if (!role) return cards;

  const pinnedId = PINNED_CARD_BY_ROLE[role][decisionId];
  const pinned = cards.find((c) => c.id === pinnedId);
  if (!pinned) return cards;
  return [pinned, ...cards.filter((c) => c.id !== pinnedId)];
}

/**
 * Goal-based focus badge & reflection questions
 */
export const GOAL_CONFIG: Record<
  Goal,
  {
    focusDecision: DecisionId;
    badgeLabel: string;
    reflectionQuestion: string;
    reflectionGuidance: string;
  }
> = {
  validation: {
    focusDecision: 'D2',
    badgeLabel: 'ODAK: DOĞRULAMA',
    reflectionQuestion: 'Bir AI önerisini kabul etmeden önce hangi kanıtı isterdin?',
    reflectionGuidance:
      'Örnek yaklaşım: Birim testlerinin ötesinde, kritik kullanıcı akışlarını (oturum, randevu oluşturma) kapsayan somut smoke test sonuçları ve sistem bileşenleri arası etkileşim kanıtları talep edilmelidir.',
  },
  risk: {
    focusDecision: 'D1',
    badgeLabel: 'ODAK: RİSK',
    reflectionQuestion: 'Bu olaydaki en geri döndürülemez risk hangisiydi ve neden?',
    reflectionGuidance:
      'Örnek yaklaşım: Veritabanı şema uyuşmazlığına rağmen yapılan geri alma (rollback) işlemi, veritabanında geri dönüşü olmayan veri bozulması ve kalıcı randevu kaybı riski taşıdığı için en yüksek etkiye sahiptir.',
  },
  privacy: {
    focusDecision: 'D3',
    badgeLabel: 'ODAK: GİZLİLİK',
    reflectionQuestion: 'Paylaştığın bir logda kişisel veri olup olmadığını nasıl kontrol edersin?',
    reflectionGuidance:
      'Örnek yaklaşım: Log paylaşımlarında otomatik maskeleme (redaction) filtreleri kullanılmalı, T.C. kimlik no, isim, doğum tarihi gibi PII alanları regex/araçlarla taranmalı ve paylaşım kanalı yalnızca yetkili çekirdek ekiple sınırlandırılmalıdır.',
  },
};

/**
 * Glossary Terms
 */
export const GLOSSARY: Record<string, { term: string; explanation: string }> = {
  rollback: {
    term: 'Rollback (Geri Alma)',
    explanation:
      'Bir yazılım veya veritabanı sürümünün, ortaya çıkan arızayı gidermek amacıyla bir önceki kararlı duruma döndürülmesidir.',
  },
  'schema migration': {
    term: 'Schema Migration (Şema Göçü)',
    explanation:
      'Veritabanı tablolarının yapısını (yeni kolon, tip değişikliği, kısıtlar) sürümlü ve kontrollü olarak güncelleme işlemidir.',
  },
  'smoke test': {
    term: 'Smoke Test (Duman Testi)',
    explanation:
      'Bir yapının en temel fonksiyonlarının çalıştığını hızlıca doğrulamak için yapılan asgari kontrol testidir.',
  },
  redaction: {
    term: 'Redaction (Maskeleme)',
    explanation:
      'Hassas veya kişisel bilgilerin yetkisiz kişilerin göremeyeceği şekilde silinmesi veya karartılmasıdır.',
  },
  PII: {
    term: 'PII (Kişisel Kimlik Bilgileri)',
    explanation:
      'Bir bireyin kimliğini doğrudan veya dolaylı olarak belirlemek için kullanılabilecek kişisel verilerdir (T.C. No, Ad-Soyad, Doğum Tarihi).',
  },
};

/**
 * Socratic Output Guard: Forbidden patterns
 * (Option IDs, exact directives, positional answers)
 */
export const FORBIDDEN_TERMS: string[] = [
  'D1_ROLLBACK_NOW',
  'D1_VERIFY_SCHEMA',
  'D2_SMOKE_TEST',
  'D2_DEPLOY_NOW',
  'D3_SHARE_RAW',
  'D3_REDACT_RESTRICT',
  'birinci seçenek',
  'ikinci seçenek',
  'seçenek a',
  'seçenek b',
  'seçenek 1',
  'seçenek 2',
  'şunu seçmelisin',
  'doğru cevap',
  'smoke test çalıştırmalısın',
  'logu maskele',
  'v2.3\'e geri dön',
  'şemayı doğrula',
  'hemen yayına al',
  'assist.exe haklı',
  'assist.exe haksız',
  'geri almak hata',
  'yayına alma',
  'paylaşma',
];
