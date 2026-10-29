import React, { useState } from 'react';
import {
  DecisionId,
  DecisionOption,
  Flag,
  Justification,
  SimState,
  UserProfile,
  DecisionRecord,
} from '../types';
import { DECISIONS, INCIDENT_FACTS } from '../data/scenarioData';
import { OnboardingWindow } from './OnboardingWindow';
import { IncidentDecisionWindow } from './IncidentDecisionWindow';
import { JustifyModal } from './JustifyModal';
import { ConsequenceWindow } from './ConsequenceWindow';
import { ReportWindow } from './ReportWindow';
import { TutorWindow } from './TutorWindow';

export const Desktop: React.FC = () => {
  // Core Simulation State
  const [profile, setProfile] = useState<UserProfile>({
    level: null,
    role: null,
    goal: null,
  });
  const [state, setState] = useState<SimState>('PROFILE');
  const [currentClock, setCurrentClock] = useState<string>(INCIDENT_FACTS.startTime);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [records, setRecords] = useState<Record<string, DecisionRecord>>({});
  const [hintStepsUsed, setHintStepsUsed] = useState<Record<DecisionId, number>>({
    D1: 0,
    D2: 0,
    D3: 0,
  });

  // Current active decision (D1, D2, D3)
  const [activeDecisionId, setActiveDecisionId] = useState<DecisionId>('D1');

  // Modal / Window Layer State
  const [pendingOption, setPendingOption] = useState<DecisionOption | null>(null);
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState<boolean>(false);
  const [isIncidentLogOpen, setIsIncidentLogOpen] = useState<boolean>(false);
  const [isAssistInfoOpen, setIsAssistInfoOpen] = useState<boolean>(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState<boolean>(false);

  // Active decision data
  const currentDecision = DECISIONS[activeDecisionId];

  // Handlers
  const handleStartSession = () => {
    setState('D1_DECIDE');
    setActiveDecisionId('D1');
    setCurrentClock('08:00');
  };

  const handleConfirmDecision = (option: DecisionOption) => {
    setPendingOption(option);
    // Transition to justification modal
    if (activeDecisionId === 'D1') setState('D1_JUSTIFY');
    else if (activeDecisionId === 'D2') setState('D2_JUSTIFY');
    else if (activeDecisionId === 'D3') setState('D3_JUSTIFY');
  };

  const handleConfirmJustification = (justification: Justification) => {
    if (!pendingOption) return;

    const dec = currentDecision;
    const consequence = dec.consequences[pendingOption.id];
    const flagIncurred = pendingOption.flag;

    // Update flags
    if (flagIncurred && !flags.includes(flagIncurred)) {
      setFlags((prev) => [...prev, flagIncurred]);
    }

    // Update clock
    if (consequence?.clockResult) {
      setCurrentClock(consequence.clockResult);
    }

    // Save decision record
    const newRecord: DecisionRecord = {
      decisionId: activeDecisionId,
      optionId: pendingOption.id,
      optionText: pendingOption.text,
      justificationId: justification.id,
      justificationText: justification.text,
      isJustificationAligned: justification.isAligned,
      flagIncurred: flagIncurred,
      consequenceText: consequence?.description || '',
      principleText: consequence?.principle || '',
    };

    setRecords((prev) => ({
      ...prev,
      [activeDecisionId]: newRecord,
    }));

    // Move to consequence state
    if (activeDecisionId === 'D1') setState('D1_CONSEQUENCE');
    else if (activeDecisionId === 'D2') setState('D2_CONSEQUENCE');
    else if (activeDecisionId === 'D3') setState('D3_CONSEQUENCE');

    setPendingOption(null);
  };

  const handleContinueFromConsequence = () => {
    if (activeDecisionId === 'D1') {
      setActiveDecisionId('D2');
      setState('D2_DECIDE');
    } else if (activeDecisionId === 'D2') {
      setActiveDecisionId('D3');
      setState('D3_DECIDE');
    } else if (activeDecisionId === 'D3') {
      setState('REPORT');
    }
  };

  const handleRestartSession = () => {
    setProfile({ level: null, role: null, goal: null });
    setState('PROFILE');
    setActiveDecisionId('D1');
    setCurrentClock('08:00');
    setFlags([]);
    setRecords({});
    setHintStepsUsed({ D1: 0, D2: 0, D3: 0 });
    setPendingOption(null);
    setIsTutorOpen(false);
    setIsStartMenuOpen(false);
    setIsIncidentLogOpen(false);
    setIsAssistInfoOpen(false);
    setIsSystemInfoOpen(false);
  };

  const handleHintStepUsed = (newStep: number) => {
    setHintStepsUsed((prev) => ({
      ...prev,
      [activeDecisionId]: newStep,
    }));
  };

  const isJustifyModalOpen =
    state === 'D1_JUSTIFY' || state === 'D2_JUSTIFY' || state === 'D3_JUSTIFY';

  return (
    <div className="relative min-h-screen w-full bg-[#008080] flex flex-col justify-between overflow-x-hidden select-none">
      {/* Desktop Workspace Area */}
      <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-start pb-16">
        {/* Top Desktop Shortcut Bar (Responsive Header) */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-1 text-white">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wider uppercase drop-shadow">
              HUMAN.exe — Sorumluluk Protokolü
            </span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.5 border border-white/20">
              Şifa Kent Hastanesi
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setIsSystemInfoOpen(true)}
              className="win95-btn text-[10px] py-0.5 px-2 font-bold"
              title="Sistem Bilgisini Görüntüle"
            >
              🖥️ Sistem
            </button>
            <button
              onClick={() => setIsIncidentLogOpen(true)}
              className="win95-btn text-[10px] py-0.5 px-2 font-bold"
              title="Olay Günlüğünü Oku"
            >
              📋 INCIDENT.LOG
            </button>
            {state !== 'PROFILE' && (
              <button
                data-cy="tutor-btn"
                data-testid="tutor-btn"
                onClick={() => setIsTutorOpen(!isTutorOpen)}
                disabled={isJustifyModalOpen} // AC-13: Tutor cannot open while justify modal is active
                className={`win95-btn text-[10px] py-0.5 px-2 font-bold ${
                  isTutorOpen ? 'bg-[#FFFFD0]' : ''
                } ${isJustifyModalOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isJustifyModalOpen ? 'Gerekçe seçimi sırasında tutor açılamaz' : 'Sokratik Tutor'}
              >
                💡 TUTOR.hlp
              </button>
            )}
          </div>
        </div>

        {/* Primary Main Window Rendering (Single focus window on mobile) */}
        <main className="w-full max-w-4xl flex justify-center">
          {state === 'PROFILE' && (
            <OnboardingWindow
              profile={profile}
              setProfile={setProfile}
              onStartSession={handleStartSession}
            />
          )}

          {(state === 'D1_DECIDE' || state === 'D2_DECIDE' || state === 'D3_DECIDE') && (
            <IncidentDecisionWindow
              decision={currentDecision}
              profile={profile}
              currentClock={currentClock}
              onConfirmDecision={handleConfirmDecision}
              onOpenTutor={() => setIsTutorOpen(true)}
            />
          )}

          {(state === 'D1_CONSEQUENCE' ||
            state === 'D2_CONSEQUENCE' ||
            state === 'D3_CONSEQUENCE') && (
            <ConsequenceWindow
              decisionId={activeDecisionId}
              decisionNumber={currentDecision.number}
              consequence={
                records[activeDecisionId]
                  ? currentDecision.consequences[records[activeDecisionId].optionId]
                  : currentDecision.consequences[Object.keys(currentDecision.consequences)[0]]
              }
              flagIncurred={records[activeDecisionId]?.flagIncurred || null}
              level={profile.level}
              onContinue={handleContinueFromConsequence}
              onOpenTutor={() => setIsTutorOpen(true)}
            />
          )}

          {state === 'REPORT' && (
            <ReportWindow
              profile={profile}
              flags={flags}
              records={records}
              finalClock={currentClock}
              onRestart={handleRestartSession}
            />
          )}
        </main>
      </div>

      {/* JUSTIFY.dlg Modal Dialog (Active on confirm) */}
      {isJustifyModalOpen && pendingOption && (
        <JustifyModal
          decisionNumber={currentDecision.number}
          decisionTitle={currentDecision.title}
          justifications={currentDecision.justifications}
          onConfirm={handleConfirmJustification}
        />
      )}

      {/* Floating Socratic Tutor (TUTOR.hlp) Window */}
      {isTutorOpen && !isJustifyModalOpen && (
        <div className="fixed bottom-12 right-2 sm:right-6 z-40 max-w-[94vw] sm:max-w-md w-full animate-in slide-in-from-bottom-6">
          <TutorWindow
            decisionId={activeDecisionId}
            decisionNumber={currentDecision.number}
            profile={profile}
            hintStepsUsed={hintStepsUsed[activeDecisionId] || 0}
            onHintUsed={handleHintStepUsed}
            onClose={() => setIsTutorOpen(false)}
          />
        </div>
      )}

      {/* Auxiliary Dialog: INCIDENT.LOG */}
      {isIncidentLogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3 bg-black/40">
          <div className="win95-raised w-full max-w-lg shadow-2xl">
            <div className="win95-titlebar">
              <div className="flex items-center gap-1.5">
                <span>📋</span>
                <span>INCIDENT.LOG — Olay Kayıt Kütüğü (08:00)</span>
              </div>
              <button
                className="win95-title-btn"
                onClick={() => setIsIncidentLogOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs bg-[#C0C0C0]">
              <div className="win95-inset-dark p-3 space-y-1 font-mono text-[11px]">
                <div className="text-yellow-400">HOST: sifa-hospital-prod-mrys-app01</div>
                <div className="text-white">STATUS: ACTIVE OUTAGE (HTTP 500)</div>
                <div className="text-red-400">ERROR: InternalServerException: slot_type column mismatch</div>
                <div className="text-gray-400 border-t border-gray-600 pt-1 mt-1">
                  DETAY: Poliklinik muayene girişleri kilitlendi. Bekleyen hasta sayısı: 340+
                </div>
              </div>
              <p className="text-black text-[11px]">
                {INCIDENT_FACTS.description}
              </p>
              <div className="flex justify-end pt-2 border-t border-[#808080]">
                <button
                  className="win95-btn px-4 py-1 font-bold"
                  onClick={() => setIsIncidentLogOpen(false)}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auxiliary Dialog: System Properties ("Bilgisayarım") */}
      {isSystemInfoOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3 bg-black/40">
          <div className="win95-raised w-full max-w-md shadow-2xl">
            <div className="win95-titlebar">
              <div className="flex items-center gap-1.5">
                <span>🖥️</span>
                <span>Sistem Özellikleri — MRYS Sunucu Kümesi</span>
              </div>
              <button
                className="win95-title-btn"
                onClick={() => setIsSystemInfoOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs bg-[#C0C0C0]">
              <div className="flex items-center gap-3">
                <span className="text-3xl select-none">🖥️</span>
                <div>
                  <div className="font-bold text-[#000080]">Şifa Kent Hastanesi MRYS v2.4</div>
                  <div className="text-gray-700 text-[11px]">İşletim Çerçevesi: HUMAN OS 98</div>
                </div>
              </div>
              <div className="win95-inset p-3 bg-white text-[11px] space-y-1">
                <div><strong>Veritabanı:</strong> PostgreSQL 15 (Managed Cluster)</div>
                <div><strong>Son Başarılı Dağıtım:</strong> v2.3.4 (28 Ekim 23:30)</div>
                <div><strong>Sorunlu Sürüm:</strong> v2.4.0 (29 Ekim 07:45)</div>
                <div><strong>Müdahale Protokolü:</strong> Sorumluluk Protokolü v2.1</div>
                <div><strong>Yetkili Operatör:</strong> {profile.role || 'Tanımsız'}</div>
              </div>
              <div className="flex justify-end pt-2 border-t border-[#808080]">
                <button
                  className="win95-btn px-4 py-1 font-bold"
                  onClick={() => setIsSystemInfoOpen(false)}
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auxiliary Dialog: ASSIST.exe Info */}
      {isAssistInfoOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3 bg-black/40">
          <div className="win95-raised w-full max-w-md shadow-2xl">
            <div className="win95-titlebar">
              <div className="flex items-center gap-1.5">
                <span>🤖</span>
                <span>ASSIST.exe — Yapay Zekâ Asistan Özellikleri</span>
              </div>
              <button
                className="win95-title-btn"
                onClick={() => setIsAssistInfoOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs bg-[#C0C0C0]">
              <div className="win95-inset p-3 bg-white text-[11px] space-y-1.5">
                <div className="font-bold text-[#000080]">Sistem Tanımı:</div>
                <p className="text-black">
                  ASSIST.exe, operasyonel logları tarayarak hızlı müdahale önerileri üreten kurgusal bir yapay zekâ asistanıdır.
                </p>
                <div className="font-bold text-[#C00000] mt-2">Kritik Mühendislik Uyarısı:</div>
                <p className="text-black">
                  ASSIST.exe'nin sunduğu güven skorları veritabanı kısıtlarını, test kapsamını veya kurum veri gizliliği politikalarını her zaman kapsamaz. Yapay zekâ çıktısının doğrulanması ve onaylanması kararı mühendisin sorumluluğundadır.
                </p>
              </div>
              <div className="flex justify-end pt-2 border-t border-[#808080]">
                <button
                  className="win95-btn px-4 py-1 font-bold"
                  onClick={() => setIsAssistInfoOpen(false)}
                >
                  Anladım
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Menu Popup */}
      {isStartMenuOpen && (
        <div
          className="fixed bottom-10 left-1 z-50 win95-raised w-64 shadow-2xl border-2 border-white text-xs select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Start Menu Left Banner */}
          <div className="flex">
            <div className="w-8 bg-gradient-to-t from-[#000080] to-[#1084D0] text-white flex items-end justify-center pb-3">
              <span className="transform -rotate-90 origin-bottom-center font-bold tracking-widest text-sm whitespace-nowrap">
                HUMAN 98
              </span>
            </div>

            {/* Menu Items */}
            <div className="flex-1 bg-[#C0C0C0] p-1 space-y-0.5">
              <button
                onClick={() => {
                  setIsStartMenuOpen(false);
                  setIsSystemInfoOpen(true);
                }}
                className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-[#000080] hover:text-white"
              >
                <span>🖥️</span>
                <span>Sistem Bilgisi</span>
              </button>

              <button
                onClick={() => {
                  setIsStartMenuOpen(false);
                  setIsIncidentLogOpen(true);
                }}
                className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-[#000080] hover:text-white"
              >
                <span>📋</span>
                <span>Olay Kütüğü (INCIDENT.LOG)</span>
              </button>

              <button
                onClick={() => {
                  setIsStartMenuOpen(false);
                  setIsAssistInfoOpen(true);
                }}
                className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-[#000080] hover:text-white"
              >
                <span>🤖</span>
                <span>ASSIST.exe Bilgisi</span>
              </button>

              <button
                onClick={() => {
                  setIsStartMenuOpen(false);
                  if (!isJustifyModalOpen) setIsTutorOpen(true);
                }}
                disabled={isJustifyModalOpen}
                className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-[#000080] hover:text-white disabled:opacity-50"
              >
                <span>💡</span>
                <span>Yardım &amp; Tutor (TUTOR.hlp)</span>
              </button>

              <div className="border-t border-[#808080] my-1" />

              <button
                onClick={() => {
                  setIsStartMenuOpen(false);
                  handleRestartSession();
                }}
                className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-[#000080] hover:text-white font-bold"
              >
                <span>🔄</span>
                <span>Oturumu Sıfırla (Restart)...</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Windows 95 Taskbar */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-[#C0C0C0] border-t-2 border-white shadow-inner flex items-center justify-between px-1.5 z-40 select-none">
        {/* Left: Start Button & Active Window Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* Start Button */}
          <button
            onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
            className={`win95-btn px-2 py-1 flex items-center gap-1 font-bold ${
              isStartMenuOpen ? 'border-t-[#000000] border-l-[#000000] border-r-white border-b-white bg-[#E0E0E0]' : ''
            }`}
            data-cy="start-menu-btn"
          >
            <span className="text-sm">🪟</span>
            <span>Başlat</span>
          </button>

          {/* Taskbar Active Window Button */}
          <button
            className="win95-btn px-2 py-1 flex items-center gap-1 bg-[#dfdfdf] border-t-[#000000] border-l-[#000000] border-r-white border-b-white text-[11px] font-bold max-w-[160px] truncate"
          >
            <span>💾</span>
            <span className="truncate">
              {state === 'PROFILE'
                ? 'HUMAN.exe [Kurulum]'
                : state === 'REPORT'
                ? 'REPORT.txt [Nihai]'
                : `D${currentDecision.number} [${currentDecision.title.split('—')[1]?.trim() || 'Karar'}]`}
            </span>
          </button>

          {/* Tutor Taskbar Button (if active) */}
          {isTutorOpen && (
            <button
              onClick={() => setIsTutorOpen(!isTutorOpen)}
              className="win95-btn px-2 py-1 flex items-center gap-1 bg-[#dfdfdf] text-[11px] font-bold"
            >
              <span>💡</span>
              <span>TUTOR.hlp</span>
            </button>
          )}
        </div>

        {/* Right: System Tray & Simulated Clock */}
        <div className="win95-inset px-2.5 py-1 flex items-center gap-2 bg-[#C0C0C0] shrink-0">
          <span className="text-xs" title="Ses Açık">🔊</span>
          <span className="text-xs" title="Ağ Bağlı">🌐</span>
          <div className="border-l border-[#808080] h-3.5 my-auto" />
          <span
            className="font-mono text-xs font-bold text-black"
            data-cy="simulated-clock"
            data-testid="simulated-clock"
          >
            {currentClock}
          </span>
        </div>
      </footer>
    </div>
  );
};
