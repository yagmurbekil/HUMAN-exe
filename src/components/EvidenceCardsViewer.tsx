import React, { useState } from 'react';
import { EvidenceCard, Level } from '../types';
import { GLOSSARY } from '../data/scenarioData';

interface EvidenceCardsViewerProps {
  cards: EvidenceCard[];
  level: Level | null;
  pinnedCardId?: string;
}

export const EvidenceCardsViewer: React.FC<EvidenceCardsViewerProps> = ({
  cards,
  level,
}) => {
  const [activeCardId, setActiveCardId] = useState<string>(cards[0]?.id || '');
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<string | null>(null);

  // Fallback to first if active not in cards
  const currentCard = cards.find((c) => c.id === activeCardId) || cards[0];

  const renderTextWithGlossary = (text: string) => {
    // Check for glossary matches
    const terms = ['rollback', 'schema migration', 'smoke test', 'redaction', 'PII'];
    const lower = text.toLowerCase();

    const matchedTerm = terms.find((t) => lower.includes(t.toLowerCase()));
    if (!matchedTerm) return <span>{text}</span>;

    const termDef = GLOSSARY[matchedTerm];

    if (level === 'beginner') {
      return (
        <div className="space-y-2">
          <p>{text}</p>
          <div className="bg-[#FFFFE1] border border-[#808080] p-2 text-[10px] text-black">
            <span className="font-bold text-[#000080]">ℹ Sözlük Tanımı — {termDef.term}: </span>
            <span>{termDef.explanation}</span>
          </div>
        </div>
      );
    }

    // Intermediate / Advanced: show [?] helper
    return (
      <div>
        <p className="inline">{text} </p>
        <button
          type="button"
          onClick={() =>
            setActiveGlossaryTerm(activeGlossaryTerm === matchedTerm ? null : matchedTerm)
          }
          className="inline-flex items-center justify-center w-4 h-4 bg-[#C0C0C0] border border-[#000000] text-[9px] font-bold text-[#000080] hover:bg-white cursor-pointer ml-1"
          title="Kavramı Açıkla"
          aria-label={`Kavram Açıklaması: ${matchedTerm}`}
        >
          ?
        </button>

        {activeGlossaryTerm === matchedTerm && (
          <div className="mt-2 bg-[#FFFFE1] border border-[#000000] p-2 text-[10px] shadow-md">
            <div className="flex justify-between items-center font-bold text-[#000080] mb-1">
              <span>{termDef.term}</span>
              <button
                type="button"
                onClick={() => setActiveGlossaryTerm(null)}
                className="text-black hover:text-red-600 px-1 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-black">{termDef.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-[#000080] flex items-center gap-1">
          <span>📁</span>
          <span>EVIDENCE/ — Kanıt Klasörü (İnceleme Zorunludur)</span>
        </span>
        <span className="text-[10px] text-[#464653]">
          Kartlar rolünüze göre sıralandı
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[#808080] pt-1">
        {cards.map((card, idx) => {
          const isActive = card.id === (currentCard?.id || '');
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveCardId(card.id)}
              className={`win95-tab text-xs flex items-center gap-1 ${
                isActive ? 'win95-tab-active font-bold text-black' : 'text-gray-700 hover:text-black'
              }`}
            >
              <span>{card.category === 'code' ? '📄' : card.category === 'test' ? '🧪' : '📑'}</span>
              <span>{card.title}</span>
              {idx === 0 && (
                <span className="text-[9px] bg-[#000080] text-white px-1 ml-0.5 font-normal">
                  SABİTLENDİ
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Card Content Viewer */}
      {currentCard && (
        <div className="win95-inset p-3 bg-white space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-[#C0C0C0] pb-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#000080]">
              <span>📄</span>
              <span className="font-bold">{currentCard.filename}</span>
            </div>
            <span className="bg-[#EAEAEA] border border-[#808080] px-1.5 py-0.5 text-[10px] text-[#333333]">
              {currentCard.badge}
            </span>
          </div>

          <div className="text-[11px] text-black">
            {renderTextWithGlossary(currentCard.content)}
          </div>

          {currentCard.codeSnippet && (
            <div className="mt-2">
              <div className="bg-[#2B2B2B] text-gray-300 px-2 py-0.5 text-[10px] font-mono border-t border-l border-r border-[#808080]">
                SOURCE CODE / DIFF / PAYLOAD
              </div>
              <pre className="win95-inset-dark p-2 text-[10px] leading-tight overflow-x-auto whitespace-pre font-mono">
                <code>{currentCard.codeSnippet}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
