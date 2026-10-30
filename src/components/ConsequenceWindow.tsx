import React from 'react';
import { ConsequenceDetail, DecisionId, Flag, Level } from '../types';

interface ConsequenceWindowProps {
  decisionId: DecisionId;
  decisionNumber: number;
  consequence: ConsequenceDetail;
  flagIncurred: Flag | null;
  clock: string;
  level: Level | null;
  onContinue: () => void;
  onOpenTutor: () => void;
}

export const ConsequenceWindow: React.FC<ConsequenceWindowProps> = ({
  decisionId,
  decisionNumber,
  consequence,
  flagIncurred,
  clock,
  level,
  onContinue,
  onOpenTutor,
}) => {
  const isFinalDecision = decisionId === 'D3';

  return (
    <div
      className="win95-raised w-full max-w-xl mx-auto shadow-2xl overflow-hidden"
      data-testid="consequence-window"
      data-cy="consequence-window"
    >
      {/* Titlebar */}
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs">⚡</span>
          <span>
            HUMAN.exe — Teknik Sonuç &amp; İlke Analizi [D{decisionNumber}/3]
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenTutor}
            className="win95-title-btn win95-title-btn-label"
            title="Tutor ile Sonucu Değerlendir"
            data-cy="titlebar-tutor-btn"
          >
            💬 Tutor
          </button>
          <button className="win95-title-btn" aria-label="Minimize">_</button>
          <button className="win95-title-btn" aria-label="Close">✕</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 text-xs">
        {/* Outcome Header Banner */}
        <div
          className={`p-3 border ${
            flagIncurred
              ? 'bg-[#FFF0F0] border-[#C00000] text-[#900000]'
              : 'bg-[#F0FFF0] border-[#008000] text-[#006000]'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-[12px] mb-1">
            <span className="flex items-center gap-1.5">
              <span>{flagIncurred ? '⚠️ RİSKLİ EYLEM' : '🛡️ GÜVENLİ MÜDAHALE'}</span>
              <span>— {consequence.title}</span>
            </span>
            <span
              className="font-mono text-[11px] bg-white px-2 py-0.5 border border-current"
              data-cy="consequence-clock"
            >
              Yeni Saat: {clock}
            </span>
          </div>
          <p className="text-black text-[11px] leading-relaxed">
            {consequence.description}
          </p>

          {flagIncurred && (
            <div className="mt-2 pt-2 border-t border-[#FFC0C0] text-[10px] font-bold text-red-700 flex items-center gap-1">
              <span>🚩 SİSTEME EKLENEN RİSK BAYRAĞI:</span>
              <span className="font-mono bg-white px-1.5 py-0.5 border border-red-400">
                {flagIncurred}
              </span>
            </div>
          )}
        </div>

        {/* Engineering Principle Card */}
        <div className="win95-groupbox bg-[#EAEAEA]">
          <span className="win95-legend text-[#000080]">Mühendislik İlkesi</span>
          <p className="text-black text-[11px] mt-1 font-medium">
            {consequence.principle}
          </p>
        </div>

        {/* Level-based personalization: Beginner Definition */}
        {level === 'beginner' && consequence.definition && (
          <div className="win95-inset p-3 bg-[#FFFFE1] border border-[#808080] space-y-1">
            <div className="font-bold text-[#000080] text-[11px] flex items-center gap-1">
              <span>📖</span>
              <span>Kavram Tanımı (Başlangıç Seviyesi Özel)</span>
            </div>
            <p className="text-black text-[11px] leading-relaxed">
              {consequence.definition}
            </p>
          </div>
        )}

        {/* Level-based personalization: Advanced Trade-off Question */}
        {level === 'advanced' && consequence.tradeoffQuestion && (
          <div className="win95-inset p-3 bg-[#F0F4FF] border border-[#4060C0] space-y-1">
            <div className="font-bold text-[#000080] text-[11px] flex items-center gap-1">
              <span>🧠</span>
              <span>Ödünleşim (Trade-off) Analizi (İleri Seviye Özel)</span>
            </div>
            <p className="text-black text-[11px] leading-relaxed italic">
              {consequence.tradeoffQuestion}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between border-t border-[#808080]">
          <span className="text-[10px] text-[#464653]">
            {isFinalDecision
              ? 'Tüm kararlar tamamlandı. Nihai hesap verebilirlik raporuna geçebilirsiniz.'
              : `D${decisionNumber + 1} kararına geçmeye hazır.`}
          </span>
          <button
            data-cy="continue-btn"
            data-testid="continue-btn"
            onClick={onContinue}
            className="win95-btn win95-btn-primary px-6 py-1.5 font-bold"
          >
            {isFinalDecision ? 'Nihai Raporu Görüntüle (REPORT.txt) →' : `Devam Et (D${decisionNumber + 1}) →`}
          </button>
        </div>
      </div>
    </div>
  );
};
