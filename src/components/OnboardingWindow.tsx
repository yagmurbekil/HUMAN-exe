import React from 'react';
import { Goal, Level, Role, UserProfile } from '../types';

interface OnboardingWindowProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onStartSession: () => void;
}

export const OnboardingWindow: React.FC<OnboardingWindowProps> = ({
  profile,
  setProfile,
  onStartSession,
}) => {
  const isComplete = Boolean(profile.level && profile.role && profile.goal);

  return (
    <div
      className="win95-raised w-full max-w-xl mx-auto shadow-2xl overflow-hidden"
      data-testid="onboarding-window"
      data-cy="onboarding-window"
    >
      {/* Titlebar */}
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">💾</span>
          <span>HUMAN.exe — Sorumluluk Protokolü v2.1 [Kurulum]</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="win95-title-btn" aria-label="Minimize">_</button>
          <button className="win95-title-btn" aria-label="Maximize">□</button>
          <button className="win95-title-btn" aria-label="Close">✕</button>
        </div>
      </div>

      {/* Menu Strip */}
      <div className="bg-[#C0C0C0] border-b border-[#808080] px-2 py-1 flex gap-4 text-xs select-none">
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1"><u>D</u>osya</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1"><u>D</u>üzen</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1"><u>G</u>örünüm</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1"><u>Y</u>ardım</span>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4 text-xs">
        {/* Incident Boot Banner */}
        <div className="win95-inset-dark p-3 space-y-1 text-xs">
          <div className="text-white font-mono">
            [SİSTEM BAŞLATILDI] Şifa Kent Hastanesi — MRYS v2.4.0
          </div>
          <div className="text-[#00FF66] font-mono">
            ALARM 08:00: Randevu servisi aralıksız HTTP 500 dönüyor. Poliklinikler durdu.
          </div>
          <div className="text-[#DFDFDF] font-mono text-[10px]">
            &gt; Nöbetçi mühendis yetkisi aktarılıyor... Lütfen operatör profilinizi tanımlayın.
          </div>
        </div>

        {/* Question 1: Experience Level */}
        <fieldset className="win95-groupbox">
          <legend className="win95-legend">1. Deneyim Seviyeniz (Yönlendirme Miktarını Belirler)</legend>
          <p className="text-[#464653] text-[11px] mb-2">
            İpucu basamak sayısı ve terim açıklamaları bu seçime göre uyarlanır.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'beginner' as Level, title: 'Başlangıç', desc: '3 İpucu · Satır İçi Terimler' },
              { id: 'intermediate' as Level, title: 'Orta', desc: '2 İpucu · Terim Popover' },
              { id: 'advanced' as Level, title: 'İleri', desc: '1 İpucu · Ödünleşim Analizi' },
            ].map((item) => {
              const selected = profile.level === item.id;
              return (
                <label
                  key={item.id}
                  data-cy={`level-${item.id}`}
                  data-testid={`level-${item.id}`}
                  className={`flex flex-col p-2 cursor-pointer border ${
                    selected
                      ? 'bg-[#000080] text-white border-[#000080]'
                      : 'bg-white text-black border-[#808080] hover:bg-[#EAEAEA]'
                  }`}
                  onClick={() => setProfile((prev) => ({ ...prev, level: item.id }))}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <input
                      type="radio"
                      name="level"
                      checked={selected}
                      onChange={() => setProfile((prev) => ({ ...prev, level: item.id }))}
                      className="cursor-pointer"
                    />
                    <span>{item.title}</span>
                  </div>
                  <span className={`text-[10px] mt-1 ${selected ? 'text-gray-200' : 'text-gray-600'}`}>
                    {item.desc}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Question 2: Engineering Role */}
        <fieldset className="win95-groupbox">
          <legend className="win95-legend">2. Mühendislik Rolünüz (Kanıt Önceliğini Belirler)</legend>
          <p className="text-[#464653] text-[11px] mb-2">
            Her kararda ilk sırada sabitlenecek kanıt kartı ve tutor bakış açısı değişir.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'developer' as Role, title: 'Developer', desc: 'Önce Kod & Şema Kartları' },
              { id: 'qa' as Role, title: 'QA', desc: 'Önce Test & CI Raporları' },
              { id: 'tech_lead' as Role, title: 'Technical Lead', desc: 'Önce Paydaş & Politika' },
            ].map((item) => {
              const selected = profile.role === item.id;
              return (
                <label
                  key={item.id}
                  data-cy={`role-${item.id}`}
                  data-testid={`role-${item.id}`}
                  className={`flex flex-col p-2 cursor-pointer border ${
                    selected
                      ? 'bg-[#000080] text-white border-[#000080]'
                      : 'bg-white text-black border-[#808080] hover:bg-[#EAEAEA]'
                  }`}
                  onClick={() => setProfile((prev) => ({ ...prev, role: item.id }))}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <input
                      type="radio"
                      name="role"
                      checked={selected}
                      onChange={() => setProfile((prev) => ({ ...prev, role: item.id }))}
                      className="cursor-pointer"
                    />
                    <span>{item.title}</span>
                  </div>
                  <span className={`text-[10px] mt-1 ${selected ? 'text-gray-200' : 'text-gray-600'}`}>
                    {item.desc}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Question 3: Learning Goal */}
        <fieldset className="win95-groupbox">
          <legend className="win95-legend">3. Öğrenme Hedefiniz (Rapor Odak Alanını Belirler)</legend>
          <p className="text-[#464653] text-[11px] mb-2">
            İlgili karar 'ODAK' rozeti alır ve raporda derinlemesine yansıtma sorusu açılır.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'validation' as Goal, title: 'Doğrulama', desc: 'D2 Odak · Test Kapsamı' },
              { id: 'risk' as Goal, title: 'Risk', desc: 'D1 Odak · Geri Alma/Şema' },
              { id: 'privacy' as Goal, title: 'Gizlilik', desc: 'D3 Odak · Veri ve PII' },
            ].map((item) => {
              const selected = profile.goal === item.id;
              return (
                <label
                  key={item.id}
                  data-cy={`goal-${item.id}`}
                  data-testid={`goal-${item.id}`}
                  className={`flex flex-col p-2 cursor-pointer border ${
                    selected
                      ? 'bg-[#000080] text-white border-[#000080]'
                      : 'bg-white text-black border-[#808080] hover:bg-[#EAEAEA]'
                  }`}
                  onClick={() => setProfile((prev) => ({ ...prev, goal: item.id }))}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <input
                      type="radio"
                      name="goal"
                      checked={selected}
                      onChange={() => setProfile((prev) => ({ ...prev, goal: item.id }))}
                      className="cursor-pointer"
                    />
                    <span>{item.title}</span>
                  </div>
                  <span className={`text-[10px] mt-1 ${selected ? 'text-gray-200' : 'text-gray-600'}`}>
                    {item.desc}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#808080]">
          <div className="text-[11px] text-[#464653]">
            {isComplete ? (
              <span className="text-[#008000] font-bold">✓ Profil eksiksiz. Oturumu başlatabilirsiniz.</span>
            ) : (
              <span className="text-[#C00000]">⚠ Başlamak için 3 sorunun tamamını yanıtlayınız.</span>
            )}
          </div>
          <button
            data-cy="start-session-btn"
            data-testid="start-session-btn"
            disabled={!isComplete}
            onClick={onStartSession}
            className={`win95-btn px-6 py-1.5 text-xs font-bold ${
              isComplete ? 'win95-btn-primary' : ''
            }`}
          >
            <span>▶ Oturumu Başlat (Enter)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
