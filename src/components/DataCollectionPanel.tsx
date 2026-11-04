import React, { useEffect, useState } from 'react';
import {
  SessionRow,
  clearStoredRows,
  countSessions,
  downloadCsv,
  loadStoredRows,
} from '../utils/telemetry';

interface DataCollectionPanelProps {
  sessionSaved: boolean;
}

/**
 * Shown under REPORT.txt in data-collection mode (?veri=1).
 * Rows live only in this browser until the player downloads the CSV and hands it over.
 */
export const DataCollectionPanel: React.FC<DataCollectionPanelProps> = ({ sessionSaved }) => {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setRows(loadStoredRows());
  }, [sessionSaved]);

  const sessions = countSessions(rows);

  return (
    <div
      className="win95-raised w-full max-w-3xl mx-auto mt-3 shadow-2xl"
      data-cy="data-panel"
      data-testid="data-panel"
    >
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5">
          <span>💾</span>
          <span>VERI.exe — Veri Toplama Modu</span>
        </div>
      </div>
      <div className="p-3 space-y-2 text-xs bg-[#C0C0C0]">
        <p className="text-black text-[11px]">
          Bu tarayıcıda kaydedilen oturum: <strong data-cy="data-session-count">{sessions}</strong> · karar satırı:{' '}
          <strong data-cy="data-row-count">{rows.length}</strong>
        </p>
        <p className="text-[#464653] text-[10px]">
          Ad, e-posta, cihaz kimliği, konum veya zaman bilgisi toplanmaz. Oturum kimliği rastgeledir. Veriler
          hiçbir sunucuya gönderilmez; yalnızca aşağıdaki düğmeyle indirdiğiniz dosyada bulunur.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            className="win95-btn win95-btn-primary"
            data-cy="data-download"
            disabled={rows.length === 0}
            onClick={() => downloadCsv(rows)}
          >
            ⬇ oturumlar.csv indir
          </button>
          {!confirmClear ? (
            <button type="button" className="win95-btn" onClick={() => setConfirmClear(true)} disabled={rows.length === 0}>
              Kayıtları temizle…
            </button>
          ) : (
            <>
              <button
                type="button"
                className="win95-btn"
                data-cy="data-clear-confirm"
                onClick={() => {
                  clearStoredRows();
                  setRows([]);
                  setConfirmClear(false);
                }}
              >
                Evet, sil
              </button>
              <button type="button" className="win95-btn" onClick={() => setConfirmClear(false)}>
                Vazgeç
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
