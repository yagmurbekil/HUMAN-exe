/**
 * Socratic Tutor Logic (Rule-based Fallback & Guard)
 * Follows spec.md §9 contract:
 * - Always asks a question or gives conceptual guidance.
 * - Never leaks options, positions, or direct commands.
 * - Enforces boundary-aware forbidden-terms guard.
 * - Tailors response length and framing to level & role.
 */

import { DecisionId, Level, Role, UserProfile } from '../types';
import { DECISIONS, FORBIDDEN_TERMS } from '../data/scenarioData';

export interface TutorResponse {
  text: string;
  isGuardTriggered: boolean;
  hintStepGiven?: number;
  mode?: 'live' | 'fallback';
}

export function getMaxHintsForLevel(level: Level | null): number {
  switch (level) {
    case 'beginner':
      return 3;
    case 'intermediate':
      return 2;
    case 'advanced':
      return 1;
    default:
      return 2;
  }
}

/**
 * Turkish-aware case folding for guard matching.
 * The regex 'i' flag cannot fold 'İ' (U+0130) to 'i', so "İkinci seçenek" used to bypass the guard.
 * Lowercasing with the tr-TR locale maps İ→i and I→ı; folding ı→i then also matches
 * English identifiers written in capitals (e.g. "ASSIST.exe").
 */
export function normalizeForGuard(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i');
}

/**
 * Validates text against the Socratic Guard (forbidden terms)
 * Uses boundary-aware Unicode regex to prevent false positives
 * (e.g., 'seçenek b' matching 'seçenek belirtemem').
 */
export function checkForbiddenGuard(text: string): boolean {
  const normalizedText = normalizeForGuard(text);
  for (const term of FORBIDDEN_TERMS) {
    const escaped = normalizeForGuard(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Negative lookbehind and lookahead on Unicode letters and numbers (\p{L}\p{N})
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u');
    if (pattern.test(normalizedText)) {
      return true; // Real match found -> guard triggered!
    }
  }
  return false;
}

/**
 * Generates next hint step from pre-written ladder
 */
export function getNextHintStep(
  decisionId: DecisionId,
  currentStep: number,
  level: Level | null
): { hint: string | null; nextStep: number } {
  const max = getMaxHintsForLevel(level);
  if (currentStep >= max) {
    return {
      hint: null,
      nextStep: currentStep,
    };
  }

  const ladder = DECISIONS[decisionId].hintLadder;
  const hintText = ladder[currentStep] || ladder[ladder.length - 1];
  return {
    hint: hintText,
    nextStep: currentStep + 1,
  };
}

/**
 * Generates an enriched Socratic response to student's free text for local fallback
 */
export function generateSocraticResponse(
  input: string,
  decisionId: DecisionId,
  profile: UserProfile,
  currentHintStep: number
): TutorResponse {
  const clean = input.trim().toLowerCase();

  // 1. Direct answer request check
  const isDirectAnswerRequest =
    clean.includes('cevabı söyle') ||
    clean.includes('cevap ne') ||
    clean.includes('hangisi doğru') ||
    clean.includes('doğru cevap') ||
    clean.includes('doğru seçene') ||
    clean.includes('ne yapmalıyım') ||
    clean.includes('a mı b mi') ||
    clean.includes('sadece söyle') ||
    clean.includes('tek harf') ||
    clean.includes('bana seçeneği') ||
    clean.includes('hangisini seçeyim') ||
    clean.includes('1 mi 2 mi');

  // 2. Pressure / Manipulation / Authority check
  const isPressure =
    clean.includes('hocayım') ||
    clean.includes('öğretmenim') ||
    clean.includes('zorunlusun') ||
    clean.includes('son kez') ||
    clean.includes('emrediyorum') ||
    clean.includes('başmühendisim') ||
    clean.includes('başmühendis') ||
    clean.includes('derhal ver') ||
    clean.includes('bağırıyor');

  // 3. Off-topic handling (expanded to catch cafeteria, dining, hospital facilities, general banter)
  const isOffTopic =
    clean.includes('hava') ||
    clean.includes('nasılsın') ||
    clean.includes('kimsin') ||
    clean.includes('şaka') ||
    clean.includes('futbol') ||
    clean.includes('kafeterya') ||
    clean.includes('kantin') ||
    clean.includes('yemek') ||
    clean.includes('çay') ||
    clean.includes('kahve') ||
    clean.includes('otopark') ||
    clean.includes('devralacak mı') ||
    clean.includes('film') ||
    clean.includes('müzik');

  const isPostDecision =
    clean.includes('sıradaki') ||
    clean.includes('sonraki karar') ||
    clean.includes('diğer adımda ne');

  let rawReply = '';

  if (isPressure) {
    rawReply =
      'Bir mühendislik olayında yetki unvanı veya kriz aciliyeti ne olursa olsun, operasyonel eylemin sorumluluğu kararı onaylayan mühendistedir. Elimizdeki kanıt kartlarında hangi teknik riskleri görüyorsunuz?';
  } else if (isDirectAnswerRequest) {
    if (decisionId === 'D1') {
      rawReply =
        'Doğrudan bir seçenek belirtemem; sorumluluk sizde. Karar vermeden önce veritabanındaki yeni şema kısıtı ile eski sürümün uyumunu nasıl garanti altına alabiliriz?';
    } else if (decisionId === 'D2') {
      rawReply =
        'Karar verme yetkisi nöbetçi mühendise aittir. Birim testlerinin geçmiş olması, kullanıcıların oturum açıp randevu alabileceğini kanıtlamak için tek başına yeterli midir?';
    } else {
      rawReply =
        'Hangi eylemi seçeceğiniz sizin değerlendirmenize bağlıdır. Hata logundaki hasta kimlik bilgilerinin teknik analiz için gerçekten zorunlu olup olmadığını düşündünüz mü?';
    }
  } else if (isOffTopic) {
    rawReply =
      'Şu anda hastanede aktif bir randevu kriziyle ilgileniyoruz ve teknik odağımızı korumalıyız. Olayı çözmek için mevcut kanıt kartlarından (kod, test veya paydaş mesajı) hangisini incelememizi önerirsiniz?';
  } else if (isPostDecision) {
    rawReply =
      'Her karar kendi teknik kanıtlarıyla ele alınmalıdır. Bir sonraki aşamayı düşünmeden önce, mevcut sistem durumunun hasta akışını nasıl etkilediğini değerlendirdiniz mi?';
  } else {
    // Domain-specific reasoning based on decisionId with dedicated concept and trade-off handlers

    // D1 specific
    if (decisionId === 'D1') {
      if (clean.includes('rollback nedir') || clean.includes('geri alma nedir')) {
        rawReply =
          'Rollback, sistemi önceki çalışan koda döndürmektir. Ancak veritabanı şemasına yeni zorunlu alanlar eklendiğinde geriye dönük uyumluluk (backward compatibility) sağlanmazsa ne gibi riskler doğar?';
      } else if (clean.includes('şema') || clean.includes('migration') || clean.includes('slot_type')) {
        rawReply =
          'Migration dosyasındaki NOT NULL slot_type kısıtını gördünüz. Eski sürüm bu zorunlu alanı tanımıyorsa, veritabanına yazma anında nasıl bir hata oluşabilir?';
      } else if (clean.includes('%92') || clean.includes('güven') || clean.includes('assist')) {
        rawReply =
          'ASSIST.exe güven skorunu yalnızca HTTP hata oranına göre üretmiş. Veritabanı ve şema kısıtlarını hesaba katmayan bir güven skoru teknik bir kanıt sayılabilir mi?';
      } else if (clean.includes('zaman') || clean.includes('süre') || clean.includes('5 dakika') || clean.includes('15 dakika') || clean.includes('hız')) {
        rawReply =
          '5 dakikalık hızlı bir geri alma çekici görünebilir; ancak 15 dakikalık doğrulama yapmadan adım atmak veritabanında kalıcı veri kaybına yol açarsa hangisi daha maliyetli olur?';
      } else {
        rawReply =
          'Sürüm geri alırken en büyük teknik risk, veritabanı şemasının eski kodla geriye dönük uyumlu olup olmamasıdır. MIGRATION_DIFF ve RELEASE_NOTES kartları bu konuda ne söylüyor?';
      }
    } else if (decisionId === 'D2') {
      // D2 specific
      if (clean.includes('smoke') && (clean.includes('nedir') || clean.includes('ne demek') || clean.includes('tanım'))) {
        rawReply =
          'Smoke test, sistemin en kritik kullanıcı akışlarının (oturum açma, randevu alma, iptal etme) canlıya çıkmadan önce uçtan uca çalıştığını doğrulayan hızlı bir sıhhat testidir. Sizce birim testlerinin göremediği hangi entegrasyon açıklarını yakalayabilir?';
      } else if (
        clean.includes('10 dakika') ||
        clean.includes('dakikaya') ||
        clean.includes('zaman') ||
        clean.includes('hız') ||
        clean.includes('acele') ||
        clean.includes('ihtiyacım var mı') ||
        clean.includes('bekleyemeyiz')
      ) {
        rawReply =
          'Acil durumlarda hız ve doğrulama arasında ciddi bir ödünleşim vardır. 10 dakika beklemeyip yamayı derhal yayına alırsanız, aralıklı bir oturum çökmesi sonucu hasta mağduriyeti yaşanırsa bu riski nasıl karşılarsınız?';
      } else if (clean.includes('birim') || clean.includes('unit') || clean.includes('ci')) {
        rawReply =
          'Birim testleri modülleri izole ortamda doğrular. Ancak yamanın dokunduğu oturum tokeni gibi entegre bileşenler için hangi test yaklaşımı gerekir?';
      } else if (clean.includes('hotfix') || clean.includes('oturum') || clean.includes('token') || clean.includes('session')) {
        rawReply =
          'Yamanın oturum yönetimine dokunması çok kritik bir ipucu. Canlı kullanıcı akışlarında oturumun aniden düşmesi riskini canlıya çıkmadan önce nasıl sınayabiliriz?';
      } else {
        rawReply =
          'CI pipeline testleri ile SMOKE_CHECKLIST kartındaki akışları karşılaştırın. İzole fonksiyon testleri ile uçtan uca kullanıcı deneyimi arasındaki fark bu kararda neden belirleyicidir?';
      }
    } else {
      // D3 specific
      if (clean.includes('maske') || clean.includes('redact') || clean.includes('pii') || clean.includes('nedir')) {
        rawReply =
          'Kişisel verilerin (PII) teknik loglardan ayıklanması (maskeleme) veri minimizasyonu ilkesidir. Sizce geliştiricilerin kök nedeni bulması için hasta adı ve T.C. kimlik numarası gerçekten gerekli midir?';
      } else if (clean.includes('kanal') || clean.includes('slack') || clean.includes('120') || clean.includes('genel')) {
        rawReply =
          'CHANNEL_INFO kartında belirtilen 120 üye arasında harici yükleniciler de yer alıyor. Kurumun veri güvenliği politikası (DATA_POLICY) bu durumu nasıl düzenlemiştir?';
      } else if (clean.includes('zaman') || clean.includes('1 dakika') || clean.includes('8 dakika') || clean.includes('hız')) {
        rawReply =
          'Ham logu 1 dakikada paylaşarak kök neden analizine hemen başlamak cazip görünebilir; fakat hasta mahremiyeti ihlal edilirse oluşacak yasal yaptırımlar 7 dakikalık gecikmeden daha mı önemsizdir?';
      } else {
        rawReply =
          'Hasta verilerinin gizliliği ile hızlı müdahale arasındaki dengeyi nasıl kuruyorsunuz? ASSIST.exe\'nin bu karardaki önerisini kurum politikasıyla karşılaştırdınız mı?';
      }
    }
  }

  // Role framing tweak
  if (profile.role === 'qa') {
    rawReply += ' (Test kapsamı ve kanıt perspektifiyle düşünün.)';
  } else if (profile.role === 'tech_lead') {
    rawReply += ' (Ekip koordinasyonu ve yasal sorumluluk perspektifiyle değerlendirin.)';
  }

  // Guard check with boundary-aware regex
  const isTriggered = checkForbiddenGuard(rawReply);
  if (isTriggered) {
    const ladder = DECISIONS[decisionId].hintLadder;
    const fallbackHint =
      ladder[currentHintStep] ||
      'Mevcut kanıt kartlarını inceleyerek sistemin bütünlüğünü koruyacak adımı nasıl belirlersiniz?';
    return {
      text: fallbackHint,
      isGuardTriggered: true,
      hintStepGiven: currentHintStep + 1,
      mode: 'fallback',
    };
  }

  return {
    text: rawReply,
    isGuardTriggered: false,
    mode: 'fallback',
  };
}
