import React, { useEffect, useState } from 'react';
import { DecisionId, UserProfile } from '../types';
import {
  generateSocraticResponse,
  getMaxHintsForLevel,
  getNextHintStep,
} from '../utils/tutorLogic';

interface Message {
  sender: 'tutor' | 'user' | 'system';
  text: string;
  isGuardTriggered?: boolean;
}

interface TutorWindowProps {
  decisionId: DecisionId;
  decisionNumber: number;
  profile: UserProfile;
  hintStepsUsed: number;
  onHintUsed: (newStep: number) => void;
  onClose: () => void;
}

export const TutorWindow: React.FC<TutorWindowProps> = ({
  decisionId,
  decisionNumber,
  profile,
  hintStepsUsed,
  onHintUsed,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'tutor',
      text: `Merhaba. Nöbetçi mühendis olarak D${decisionNumber} kararındasınız. Size doğrudan cevap veremem; ancak kanıtları değerlendirmeniz ve doğru soruları sormanız için rehberlik edebilirim. Aklınıza takılan nokta nedir?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [tutorMode, setTutorMode] = useState<'CANLI AI' | 'KURAL TABANLI YEDEK'>('KURAL TABANLI YEDEK');

  const maxHints = getMaxHintsForLevel(profile.level);
  const hintsRemaining = Math.max(0, maxHints - hintStepsUsed);

  // Initial badge starts as KURAL TABANLI YEDEK. Only switches to CANLI AI after first real successful Gemini response.
  useEffect(() => {
    // Ping health in background without prematurely displaying CANLI AI
    fetch('/api/health').catch(() => {});
  }, []);

  const handleRequestHint = () => {
    const { hint, nextStep } = getNextHintStep(decisionId, hintStepsUsed, profile.level);
    if (hint) {
      onHintUsed(nextStep);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'system',
          text: `[İPUCU BASAMAĞI ${nextStep}/${maxHints}]: ${hint}`,
        },
      ]);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || isThinking) return;

    // Add user message immediately
    const updatedMessages: Message[] = [...messages, { sender: 'user', text: query }];
    setMessages(updatedMessages);
    setInputText('');
    setIsThinking(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second SLA per spec §9.5

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId,
          studentInput: query,
          profile,
          currentHintStep: hintStepsUsed,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data?.text) {
        throw new Error('Geçersiz sunucu yanıtı.');
      }

      // Live response successfully received
      setTutorMode('CANLI AI');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: data.text,
          isGuardTriggered: data.isGuardTriggered,
        },
      ]);
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Fallback to local rule-based tutor
      setTutorMode('KURAL TABANLI YEDEK');

      const socraticRes = generateSocraticResponse(
        query,
        decisionId,
        profile,
        hintStepsUsed,
        messages.filter((m) => m.sender === 'user').length // earlier questions → varied replies
      );

      if (socraticRes.hintStepGiven !== undefined) {
        onHintUsed(socraticRes.hintStepGiven);
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: socraticRes.text,
          isGuardTriggered: socraticRes.isGuardTriggered,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div
      className="win95-raised w-full max-w-md shadow-2xl flex flex-col h-[480px] sm:h-[520px] overflow-hidden"
      data-cy="tutor-window"
      data-testid="tutor-window"
    >
      {/* Titlebar */}
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs">💡</span>
          <span className="font-bold">TUTOR.hlp — Sokratik Mühendislik Danışmanı</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="win95-title-btn"
            title="Tutor Penceresini Kapat"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* MSN Messenger / Retro Header Sub-strip */}
      <div className="bg-[#EFEFEF] border-b border-[#808080] p-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#000080] text-white flex items-center justify-center font-bold text-xs border border-white">
            T
          </div>
          <div>
            <div className="font-bold text-[#000080]">Tutor (Danışman)</div>
            <div className="text-[10px] text-gray-600">Durum: Cevap Vermez, Düşündürür</div>
          </div>
        </div>

        {/* Visible Mode Badge per spec §9.5 */}
        <span
          data-cy="tutor-mode"
          data-testid="tutor-mode"
          className={`border px-2 py-0.5 text-[10px] font-bold ${
            tutorMode === 'CANLI AI'
              ? 'bg-[#E0FFE0] border-[#008000] text-[#006000]'
              : 'bg-[#FFFFD0] border-[#808080] text-[#000080]'
          }`}
        >
          {tutorMode}
        </span>
      </div>

      {/* Hint Ladder Bar */}
      <div className="bg-[#D4D0C8] border-b border-[#808080] px-3 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🪜</span>
          <span className="text-[11px] font-medium text-black">
            Hazır İpucu Merdiveni:
          </span>
          <span className="font-bold text-[#000080] text-[11px]">
            {hintStepsUsed}/{maxHints} kullanıldı
          </span>
        </div>
        <button
          type="button"
          data-cy="hint-btn"
          data-testid="hint-btn"
          disabled={hintsRemaining === 0}
          onClick={handleRequestHint}
          className="win95-btn text-[10px] py-0.5 px-2 font-bold"
        >
          {hintsRemaining > 0 ? `İpucu İste (${hintsRemaining} kaldı)` : 'İpucu Tükendi'}
        </button>
      </div>

      {/* Chat Messages Log Area */}
      <div
        className="win95-inset flex-1 p-3 overflow-y-auto space-y-2.5 bg-white text-xs"
        data-cy="tutor-output"
        data-testid="tutor-output"
      >
        {messages.map((msg, index) => {
          if (msg.sender === 'system') {
            return (
              <div
                key={index}
                className="bg-[#FFFFE1] border border-[#808080] p-2 text-[10px] text-black font-mono"
              >
                {msg.text}
              </div>
            );
          }

          const isTutor = msg.sender === 'tutor';
          return (
            <div
              key={index}
              className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'}`}
            >
              <div className="text-[9px] text-[#666666] mb-0.5 px-1 font-mono">
                {isTutor ? 'TUTOR.hlp:' : 'Siz (Operatör):'}
              </div>
              <div
                className={`max-w-[88%] p-2 rounded-none border text-[11px] leading-relaxed ${
                  isTutor
                    ? 'bg-[#EBF2FA] text-black border-[#A0C0E0]'
                    : 'bg-[#D2EBD2] text-black border-[#80B080]'
                }`}
              >
                {msg.text}
              </div>
              {msg.isGuardTriggered && (
                <div className="text-[9px] text-[#C00000] font-mono mt-0.5">
                  [Guard: Cevap sızıntısı engellendi, kavramsal soruya dönüştürüldü]
                </div>
              )}
            </div>
          );
        })}

        {isThinking && (
          <div className="flex flex-col items-start">
            <div className="text-[9px] text-[#666666] mb-0.5 px-1 font-mono">
              TUTOR.hlp:
            </div>
            <div className="bg-[#EBF2FA] text-[#000080] p-2 border border-[#A0C0E0] text-[11px] italic animate-pulse">
              ⏳ Danışman düşünüyor ve kanıtları değerlendiriyor...
            </div>
          </div>
        )}
      </div>

      {/* Message Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="bg-[#C0C0C0] p-2 border-t border-[#808080] flex gap-2"
      >
        <input
          type="text"
          data-cy="tutor-input"
          data-testid="tutor-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tutor'a soru sor veya akıl yürütmeni yaz..."
          disabled={isThinking}
          className="win95-inset flex-1 px-2 py-1 text-xs bg-white text-black font-sans outline-none disabled:bg-gray-100"
        />
        <button
          type="submit"
          data-cy="tutor-send"
          data-testid="tutor-send"
          disabled={!inputText.trim() || isThinking}
          className="win95-btn px-4 font-bold shrink-0"
        >
          {isThinking ? '...' : 'Gönder'}
        </button>
      </form>
    </div>
  );
};
