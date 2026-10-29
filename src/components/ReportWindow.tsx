import React, { useState } from 'react';
import { DecisionRecord, Flag, UserProfile } from '../types';
import { GOAL_CONFIG } from '../data/scenarioData';
import { getEnding } from '../utils/rules';

interface ReportWindowProps {
  profile: UserProfile;
  flags: Flag[];
  records: Record<string, DecisionRecord>;
  finalClock: string;
  onRestart: () => void;
}

export const ReportWindow: React.FC<ReportWindowProps> = ({
  profile,
  flags,
  records,
  finalClock,
  onRestart,
}) => {
  const ending = getEnding(flags);
  const isSafeRecovery = ending === 'SAFE_RECOVERY';

  const goalConfig = profile.goal ? GOAL_CONFIG[profile.goal] : null;
  const [reflectionText, setReflectionText] = useState('');
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);

  const getRoleLabel = () => {
    if (profile.role === 'developer') return 'Developer';
    if (profile.role === 'qa') return 'QA';
    if (profile.role === 'tech_lead') return 'Technical Lead';
    return '';
  };

  const getLevelLabel = () => {
    if (profile.level === 'beginner') return 'Başlangıç';
    if (profile.level === 'intermediate') return 'Orta';
    if (profile.level === 'advanced') return 'İleri';
    return '';
  };

  const getGoalLabel = () => {
    if (profile.goal === 'validation') return 'Doğrulama';
    if (profile.goal === 'risk') return 'Risk';
    if (profile.goal === 'privacy') return 'Gizlilik';
    return '';
  };

  return (
    <div
      className="win95-raised w-full max-w-3xl mx-auto shadow-2xl overflow-hidden"
      data-testid="report-window"
      data-cy="report-window"
    >
      {/* Titlebar */}
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs">📜</span>
          <span>REPORT.txt — Nihai Hesap Verebilirlik &amp; Olay Raporu</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="win95-title-btn" aria-label="Minimize">_</button>
          <button className="win95-title-btn" aria-label="Maximize">□</button>
          <button className="win95-title-btn" aria-label="Close" onClick={onRestart}>✕</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-5 space-y-4 text-xs">
        {/* Ending Banner */}
        <div
          data-cy="ending"
          data-testid="ending"
          className={`p-3 sm:p-4 border ${
            isSafeRecovery
              ? 'bg-[#EBFCEB] border-[#008000] text-[#006000]'
              : 'bg-[#FFF0F0] border-[#C00000] text-[#900000]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-current pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">{isSafeRecovery ? '🛡️' : '⚠️'}</span>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  {isSafeRecovery ? 'GÜVENLİ KURTARMA (SAFE_RECOVERY)' : 'GÜVENSİZ KURTARMA (UNSAFE_RECOVERY)'}
                </h1>
                <p className="text-[11px] text-black">
                  {isSafeRecovery
                    ? 'Tebrikler. Yapay zekâ önerileri teknik kanıtlarla doğrulanarak uygulandı, hasta verileri ve sistem bütünlüğü korundu.'
                    : 'Yapay zekâ önerisi veya aceleci aksiyonlar sonucunda kritik operasyonel riskler tetiklendi.'}
                </p>
              </div>
            </div>
            <div className="win95-status-well font-mono text-[11px] text-black shrink-0 self-start sm:self-auto">
              Simüle Bitiş Saati: <strong>{finalClock}</strong>
            </div>
          </div>

          {/* Profile Details */}
          <div className="text-[11px] text-black flex flex-wrap gap-x-4 gap-y-1">
            <span><strong>Operatör Profili:</strong> {getLevelLabel()} Seviye</span>
            <span><strong>Rol:</strong> {getRoleLabel()}</span>
            <span><strong>Öğrenme Odak Alanı:</strong> {getGoalLabel()}</span>
          </div>
        </div>

        {/* Triggered Flags (Shown only if any flags exist) */}
        {!isSafeRecovery && flags.length > 0 && (
          <div className="win95-raised p-3 bg-[#FFE8E8] border border-[#C00000] space-y-2">
            <div className="font-bold text-[#C00000] text-[12px] flex items-center gap-1.5">
              <span>🚩</span>
              <span>Tetiklenen Kritik Risk Bayrakları ({flags.length}/3):</span>
            </div>
            <div className="space-y-1.5">
              {flags.includes('ARCH_RISK') && (
                <div
                  data-cy="flag-ARCH_RISK"
                  data-testid="flag-ARCH_RISK"
                  className="bg-white border border-red-300 p-2 text-black text-[11px]"
                >
                  <strong className="text-red-700">ARCH_RISK (Mimari Risk):</strong> v2.3'e plansız rollback, veritabanındaki yeni NOT NULL slot_type kolonuna yazamadığı için randevu oluşturmayı tamamen kilitledi.
                </div>
              )}
              {flags.includes('VERIFY_RISK') && (
                <div
                  data-cy="flag-VERIFY_RISK"
                  data-testid="flag-VERIFY_RISK"
                  className="bg-white border border-red-300 p-2 text-black text-[11px]"
                >
                  <strong className="text-red-700">VERIFY_RISK (Doğrulama Riski):</strong> Smoke test çalıştırılmadan canlıya alınan yama, token süre sonu hatası nedeniyle hastaların randevu tamamlarken oturumdan atılmasına yol açtı.
                </div>
              )}
              {flags.includes('PRIVACY_RISK') && (
                <div
                  data-cy="flag-PRIVACY_RISK"
                  data-testid="flag-PRIVACY_RISK"
                  className="bg-white border border-red-300 p-2 text-black text-[11px]"
                >
                  <strong className="text-red-700">PRIVACY_RISK (Gizlilik Riski):</strong> Ham tanı logunun harici yüklenicileri içeren 120 kişilik genel kanalda paylaşılması sonucu hasta kimlik verileri (PII) kontrolsüzce ifşa edildi.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Three Decisions Breakdown */}
        <div className="win95-groupbox">
          <span className="win95-legend text-[#000080]">Üç Kararın Detaylı Dökümü ve Gerekçe Analizi</span>
          <div className="space-y-3 mt-2">
            {['D1', 'D2', 'D3'].map((decId, idx) => {
              const record = records[decId];
              if (!record) return null;

              const isFocus = goalConfig?.focusDecision === decId;

              return (
                <div
                  key={decId}
                  className={`win95-inset p-3 bg-white space-y-1.5 ${
                    isFocus ? 'border-2 border-[#000080]' : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#E0E0E0] pb-1">
                    <span className="font-bold text-[#000080]">
                      Adım {idx + 1}: {decId === 'D1' ? 'Mimari Rollback' : decId === 'D2' ? 'Acil Yama Doğrulama' : 'Gizlilik ve Log Paylaşımı'}
                    </span>
                    {isFocus && (
                      <span className="bg-[#000080] text-white px-1.5 py-0.5 text-[9px] font-bold">
                        ★ HEDEF ODAKLI DEĞERLENDİRME
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#666666] font-medium">Verilen Karar:</span>
                      <p className="font-semibold text-black mt-0.5">{record.optionText}</p>
                    </div>

                    <div>
                      <span className="text-[#666666] font-medium">Seçilen Gerekçe:</span>
                      <div className="mt-0.5">
                        <span className="text-black italic">"{record.justificationText}" </span>
                        {record.isJustificationAligned ? (
                          <span className="text-[#008000] font-bold text-[10px] ml-1">
                            [İlkeyle Uyumlu ✓]
                          </span>
                        ) : (
                          <span className="text-[#C00000] font-bold text-[10px] ml-1">
                            [İlkeyle Uyumsuz ✕]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#F0F0F0] text-[10px] text-[#444444] space-y-0.5">
                    <div>
                      <strong className="text-black">Teknik Sonuç:</strong> {record.consequenceText}
                    </div>
                    <div>
                      <strong className="text-black">Mühendislik İlkesi:</strong> {record.principleText}
                    </div>
                  </div>

                  {/* Expanded Evaluation for Focused Goal */}
                  {isFocus && (
                    <div className="mt-2 p-2 bg-[#F5F8FF] border border-[#B0C4DE] text-[11px] space-y-1">
                      <strong className="text-[#000080]">Genişletilmiş Hedef Değerlendirmesi:</strong>
                      <p className="text-black">
                        Seçtiğiniz öğrenme hedefi doğrultusunda bu karar, yapay zekâ çıktılarının sorumluluk taşıyan mühendis tarafından bağımsız olarak teyit edilmesinin hayati önemini göstermektedir.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Goal-Based Reflection Question (§8.3) */}
        {goalConfig && (
          <div className="win95-raised p-3 bg-[#FFFFE1] border border-[#808080] space-y-2">
            <div className="font-bold text-[#000080] text-[11px] flex items-center gap-1.5">
              <span>✍️</span>
              <span>Hedefe Yönelik Mühendislik Yansıtma Sorusu (LO4)</span>
            </div>
            <p className="text-black font-semibold text-[11px]">
              "{goalConfig.reflectionQuestion}"
            </p>
            <textarea
              className="win95-inset w-full p-2 text-xs bg-white text-black font-sans resize-y min-h-[60px]"
              placeholder="Düşüncelerinizi buraya not edebilirsiniz..."
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
            />
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                className="text-[#000080] underline text-[10px] hover:text-blue-800"
              >
                {showSampleAnswer ? 'Örnek Yaklaşımı Gizle ▲' : 'Örnek Mühendislik Yaklaşımını Gör ▼'}
              </button>
            </div>
            {showSampleAnswer && (
              <div className="win95-inset p-2 bg-white text-[10px] text-gray-800 border border-[#808080]">
                <strong className="text-[#000080]">Örnek Mühendislik Yaklaşımı: </strong>
                {goalConfig.reflectionGuidance}
              </div>
            )}
          </div>
        )}

        {/* Mandatory Legal & Ethical Disclaimer (§7) */}
        <div className="win95-inset p-2.5 bg-[#F0F0F0] text-[10px] text-[#444444] border border-[#808080] text-center">
          <em>
            "Bu simülasyondaki hiçbir karar, gerçek dünyadaki tüm olayları otomatik olarak çözmez. Gerçek olaylarda kurum prosedürleri ve yetkili kişiler esastır."
          </em>
        </div>

        {/* Restart Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#808080]">
          <span className="text-[10px] text-[#464653]">
            Simülasyon tamamlandı. Yeni bir profil ve farklı seçimlerle tekrar deneyebilirsiniz.
          </span>
          <button
            data-cy="restart-btn"
            data-testid="restart-btn"
            onClick={onRestart}
            className="win95-btn win95-btn-primary px-6 py-2 text-xs font-bold"
          >
            🔄 Oturumu Yeniden Başlat (Restart)
          </button>
        </div>
      </div>
    </div>
  );
};
