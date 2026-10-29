import React from 'react';

interface ConfirmRestartDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmRestartDialog: React.FC<ConfirmRestartDialogProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/40">
      <div
        className="win95-raised w-full max-w-sm shadow-2xl"
        data-cy="restart-confirm-dlg"
        data-testid="restart-confirm-dlg"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="restart-confirm-title"
      >
        {/* Titlebar */}
        <div className="win95-titlebar">
          <div className="flex items-center gap-1.5" id="restart-confirm-title">
            <span className="text-xs">⚠️</span>
            <span>HUMAN.exe — Oturumu Sıfırla</span>
          </div>
          <button className="win95-title-btn" onClick={onCancel} aria-label="Kapat">
            ✕
          </button>
        </div>

        {/* Dialog Body */}
        <div className="p-4 space-y-3 text-xs bg-[#C0C0C0]">
          <div className="flex items-start gap-3">
            <div className="text-2xl select-none">❗</div>
            <p className="text-black text-[11px] leading-relaxed">
              Oturumu sıfırlamak istediğinize emin misiniz? Profiliniz, kararlarınız, gerekçeleriniz ve
              risk bayrakları silinecek.
            </p>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#808080]">
            <button
              data-cy="restart-confirm-yes"
              data-testid="restart-confirm-yes"
              onClick={onConfirm}
              className="win95-btn win95-btn-primary px-5 py-1 font-bold"
            >
              Evet, sıfırla
            </button>
            <button
              data-cy="restart-confirm-no"
              data-testid="restart-confirm-no"
              onClick={onCancel}
              className="win95-btn px-5 py-1 font-bold"
            >
              Hayır
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
