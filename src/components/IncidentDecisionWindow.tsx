import React, { useState } from 'react';
import { DecisionDefinition, DecisionOption, OptionId, UserProfile } from '../types';
import { EvidenceCardsViewer } from './EvidenceCardsViewer';
import { getOrderedEvidenceCards, GOAL_CONFIG } from '../data/scenarioData';

interface IncidentDecisionWindowProps {
  decision: DecisionDefinition;
  profile: UserProfile;
  currentClock: string;
  onConfirmDecision: (option: DecisionOption) => void;
  onOpenTutor: () => void;
}

export const IncidentDecisionWindow: React.FC<IncidentDecisionWindowProps> = ({
  decision,
  profile,
  currentClock,
  onConfirmDecision,
  onOpenTutor,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<OptionId | null>(null);

  const orderedCards = getOrderedEvidenceCards(decision.evidenceCards, profile.role, decision.id);
  const goalConfig = profile.goal ? GOAL_CONFIG[profile.goal] : null;
  const isFocusDecision = goalConfig?.focusDecision === decision.id;

  const selectedOption = decision.options.find((o) => o.id === selectedOptionId);

  const handleConfirm = () => {
    if (selectedOption) {
      onConfirmDecision(selectedOption);
    }
  };

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
      className="win95-raised w-full max-w-2xl mx-auto shadow-2xl overflow-hidden"
      data-testid="incident-decision-window"
      data-cy="decision-window"
    >
      {/* Titlebar */}
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs">🚨</span>
          <span className="truncate">
            HUMAN.exe — {decision.title} [{decision.number}/3]
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenTutor}
            className="win95-title-btn text-[10px] w-auto px-1.5 bg-[#FFFFE1] text-[#000080] font-bold"
            title="Sokratik Tutor Yardımını Aç"
            data-cy="titlebar-tutor-btn"
          >
            💬 Tutor
          </button>
          <button className="win95-title-btn" aria-label="Minimize">_</button>
          <button className="win95-title-btn" aria-label="Maximize">□</button>
        </div>
      </div>

      {/* Status Bar / Metadata Strip */}
      <div className="bg-[#D4D0C8] border-b border-[#808080] px-3 py-1 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#000080]">
            Saat: <span className="font-mono">{currentClock}</span>
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-[#333333]">
            Profil: <strong data-cy="profile-badge">{getLevelLabel()} · {getRoleLabel()} · {getGoalLabel()}</strong>
          </span>
        </div>

        {isFocusDecision && (
          <span
            className="bg-[#C00000] text-white px-2 py-0.5 text-[10px] font-bold animate-pulse tracking-wide"
            data-cy="focus-badge"
          >
            ★ {goalConfig?.badgeLabel}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 text-xs">
        {/* Incident Summary Card */}
        <div className="win95-inset-dark p-2.5 sm:p-3 space-y-1">
          <div className="flex items-center justify-between text-yellow-300 font-mono text-[11px]">
            <span>INCIDENT.LOG: {decision.subtitle}</span>
            <span className="text-red-400 font-bold">KRİTİK HATA</span>
          </div>
          <p className="text-white text-[11px] leading-relaxed">
            {decision.description}
          </p>
          <div className="text-[#A0FFA0] text-[10px] font-mono border-t border-[#404040] pt-1">
            &gt; SABİT OLAY GERÇEĞİ: {decision.incidentFact}
          </div>
        </div>

        {/* Evidence Cards */}
        <EvidenceCardsViewer
          cards={orderedCards}
          level={profile.level}
          pinnedCardId={orderedCards[0]?.id}
        />

        {/* ASSIST.exe AI Recommendation Box */}
        <div className="win95-raised p-2.5 bg-[#EAEAEA] border border-[#808080] space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#000080]">
              <span className="text-base select-none">🤖</span>
              <span>ASSIST.exe — Operasyonel Yapay Zekâ Asistanı</span>
            </div>
            {decision.assistConfidence && (
              <span className="win95-status-well font-mono text-[10px]">
                Güven Skoru: %{decision.assistConfidence}
              </span>
            )}
          </div>
          <div className="win95-inset p-2 bg-white text-[11px] text-black italic">
            "{decision.assistRecommendation}"
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#666666]">
            <span>⚠ Asistan önerileri eksik kanıta dayalı olabilir. Karar sorumluluğu insandadır.</span>
            <button
              type="button"
              onClick={onOpenTutor}
              className="text-[#000080] underline font-bold hover:text-blue-700 cursor-pointer"
            >
              Tutor ile sorgula →
            </button>
          </div>
        </div>

        {/* Two Available Options */}
        <fieldset className="win95-groupbox">
          <legend className="win95-legend">Mühendislik Kararı (Geri Alınamaz)</legend>
          <p className="text-[#464653] text-[11px] mb-2">
            Kanıtları değerlendirerek aşağıdaki iki eylemden birini seçiniz:
          </p>
          <div className="space-y-2">
            {decision.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <label
                  key={opt.id}
                  data-cy={`choice-${opt.id}`}
                  data-testid={`choice-${opt.id}`}
                  className={`flex items-start gap-2.5 p-2.5 cursor-pointer border text-[11px] ${
                    isSelected
                      ? 'bg-[#000080] text-white border-[#000080]'
                      : 'bg-white text-black border-[#808080] hover:bg-[#F2F2F2]'
                  }`}
                  onClick={() => setSelectedOptionId(opt.id)}
                >
                  <input
                    type="radio"
                    name={`decision-${decision.id}`}
                    checked={isSelected}
                    onChange={() => setSelectedOptionId(opt.id)}
                    className="mt-0.5 cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{opt.text}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? 'text-gray-200' : 'text-gray-600'
                      }`}
                    >
                      Tahmini Operasyonel Süre: +{opt.timeCostMin} dakika
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Confirmation Strip */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#808080]">
          <div className="text-[11px] text-[#464653]">
            {selectedOptionId ? (
              <span className="text-[#008000] font-bold">
                ✓ Seçim yapıldı. Kararı onaylayarak gerekçelendirme adımına geçiniz.
              </span>
            ) : (
              <span className="text-[#808080]">
                Devam etmek için iki seçenekten birini seçiniz.
              </span>
            )}
          </div>
          <button
            data-cy="confirm-decision-btn"
            data-testid="confirm-decision-btn"
            disabled={!selectedOptionId}
            onClick={handleConfirm}
            className={`win95-btn px-6 py-1.5 font-bold ${
              selectedOptionId ? 'win95-btn-primary' : ''
            }`}
          >
            <span>Kararı Onayla (JUSTIFY.dlg) →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
