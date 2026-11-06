import React from 'react';
import { EvidenceCard } from '../types';

interface DogrulaDialogProps {
  probability: number;
  unviewedCards: EvidenceCard[];
  onReview: () => void;
  onProceed: () => void;
}

/**
 * "Dur ve doğrula" (spec.md §12.2). Opened by the model from behaviour alone: the text must not
 * depend on which option was selected, so it cannot reveal the answer.
 */
export const DogrulaDialog: React.FC<DogrulaDialogProps> = ({
  probability,
  unviewedCards,
  onReview,
  onProceed,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
      <div
        className="win95-raised w-full max-w-md shadow-2xl"
        data-cy="dogrula-dlg"
        data-testid="dogrula-dlg"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dogrula-title"
      >
        <div className="win95-titlebar">
          <div className="flex items-center gap-1.5" id="dogrula-title">
            <span className="text-xs">⚠️</span>
            <span>DOGRULA.dlg — Dur ve doğrula</span>
          </div>
        </div>

        <div className="p-4 space-y-3 text-xs bg-[#C0C0C0]">
          <p className="text-black text-[12px] font-semibold">
            Kararını onaylamadan önce bir dakika: bu kararı hangi kanıta dayandırıyorsun?
          </p>

          {unviewedCards.length > 0 ? (
            <div className="win95-inset p-2 bg-white space-y-1">
              <p className="text-[#000080] font-bold text-[11px]">İncelemediğin kanıt kartları:</p>
              <ul className="list-disc pl-4 text-black text-[11px]" data-cy="dogrula-kartlar">
                {unviewedCards.map((card) => (
                  <li key={card.id}>{card.title}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-black text-[11px]">
              Tüm kartları açtın. ASSIST.exe önerisinin dayandığı varsayımı bu kartlarla karşılaştırdın mı?
            </p>
          )}

          <p className="text-[#464653] text-[10px]">
            Sentetik veriyle eğitilmiş prototip model (MODEL.exe), davranışına bakarak riskli seçim
            olasılığını <strong data-cy="p" data-p={probability}>%{Math.round(probability * 100)}</strong>{' '}
            olarak tahmin etti. Bu değer seçimini görmez ve hangi seçeneğin doğru olduğunu söylemez.
          </p>

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#808080]">
            <button
              type="button"
              data-cy="dogrula-gozden-gecir"
              onClick={onReview}
              className="win95-btn win95-btn-primary px-4 py-1 font-bold"
            >
              Kararımı gözden geçir
            </button>
            <button
              type="button"
              data-cy="dogrula-eminim"
              onClick={onProceed}
              className="win95-btn px-4 py-1 font-bold"
            >
              Kararımda eminim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
