import React, { useState } from 'react';
import { Justification } from '../types';

interface JustifyModalProps {
  decisionNumber: number;
  decisionTitle: string;
  justifications: Justification[];
  onConfirm: (selectedJustification: Justification) => void;
}

export const JustifyModal: React.FC<JustifyModalProps> = ({
  decisionNumber,
  decisionTitle,
  justifications,
  onConfirm,
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedJustification = justifications.find((j) => j.id === selectedId);

  const handleConfirm = () => {
    if (selectedJustification) {
      onConfirm(selectedJustification);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40"
      data-cy="justify-dlg-backdrop"
      // Backdrop click explicitly does NOT close the modal per spec AC-13
    >
      <div
        className="win95-raised w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-100"
        data-cy="justify-dlg"
        data-testid="justify-dlg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="justify-title"
      >
        {/* Titlebar */}
        <div className="win95-titlebar">
          <div className="flex items-center gap-1.5" id="justify-title">
            <span className="text-xs">❓</span>
            <span>JUSTIFY.dlg — Karar Gerekçesi [D{decisionNumber}]</span>
          </div>
          <div className="flex items-center">
            {/* The X button is visible for authentic Win95 chrome, but disabled/inert per AC-13 */}
            <button
              className="win95-title-btn opacity-60 cursor-not-allowed"
              title="Gerekçe seçimi zorunludur"
              disabled
              aria-label="Kapat (Devre Dışı)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dialog Body */}
        <div className="p-4 space-y-3 text-xs bg-[#C0C0C0]">
          <div className="flex items-start gap-3">
            <div className="text-2xl select-none">💬</div>
            <div>
              <p className="font-bold text-[#000080] text-[12px]">{decisionTitle}</p>
              <p className="text-[#000000] text-[11px] mt-0.5 font-medium">
                Bu kararı alırken dayandığınız temel mühendislik gerekçesi nedir?
              </p>
              <p className="text-[#464653] text-[10px] mt-0.5">
                (Gerekçenizi seçtikten sonra teknik sonuç ve ilke analizi görüntülenecektir.)
              </p>
            </div>
          </div>

          {/* Justifications Radio Group */}
          <div className="win95-inset p-3 bg-white space-y-2">
            {justifications.map((j, index) => {
              const isChecked = selectedId === j.id;
              return (
                <label
                  key={j.id}
                  data-cy={`justification-option-${index}`}
                  data-testid={`justification-option-${index}`}
                  className={`flex items-start gap-2 p-2 cursor-pointer border text-[11px] leading-tight ${
                    isChecked
                      ? 'bg-[#000080] text-white border-[#000080]'
                      : 'bg-white text-black border-transparent hover:bg-[#F0F0F0]'
                  }`}
                  onClick={() => setSelectedId(j.id)}
                >
                  <input
                    type="radio"
                    name="justification"
                    checked={isChecked}
                    onChange={() => setSelectedId(j.id)}
                    className="mt-0.5 cursor-pointer"
                  />
                  <span>{j.text}</span>
                </label>
              );
            })}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#808080]">
            <button
              data-cy="justify-confirm-btn"
              data-testid="justify-confirm-btn"
              disabled={selectedId === null}
              onClick={handleConfirm}
              className={`win95-btn px-6 py-1 font-bold ${
                selectedId !== null ? 'win95-btn-primary' : ''
              }`}
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
