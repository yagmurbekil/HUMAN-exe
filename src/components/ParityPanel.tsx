import React, { useState } from 'react';
import { FEATURE_ORDER, Features } from '../utils/telemetry';
import { predictRisk, RiskPrediction } from '../utils/riskModel';

const EMPTY = Object.fromEntries(FEATURE_ORDER.map((name) => [name, '0'])) as Record<keyof Features, string>;

/** `?parite=1`: exposes the in-app ONNX inference to the differential test (spec.md AE9). */
export const ParityPanel: React.FC = () => {
  const [values, setValues] = useState(EMPTY);
  const [result, setResult] = useState<RiskPrediction | null>(null);
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    setResult(null);
    try {
      const features = Object.fromEntries(
        FEATURE_ORDER.map((name) => [name, Number(values[name])])
      ) as Features;
      setResult(await predictRisk(features));
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="min-h-screen bg-[#008080] p-3 flex justify-center">
      <div className="win95-raised w-full max-w-md self-start" data-cy="parity-panel">
        <div className="win95-titlebar">
          <span>MODEL.exe — Parite Testi</span>
        </div>
        <div className="p-3 space-y-2 text-xs bg-[#C0C0C0]">
          {FEATURE_ORDER.map((name) => (
            <label key={name} className="flex items-center justify-between gap-2 text-black">
              <span className="font-mono text-[11px]">{name}</span>
              <input
                data-cy={`f-${name}`}
                type="text"
                inputMode="decimal"
                value={values[name]}
                onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
                className="win95-inset w-28 px-2 py-1 bg-white text-black text-right font-mono"
              />
            </label>
          ))}
          <button type="button" data-cy="hesapla" onClick={run} className="win95-btn win95-btn-primary w-full">
            Hesapla
          </button>
          <div className="win95-inset-dark p-2 font-mono text-[12px]">
            p = <span data-cy="p">{result ? result.p.toFixed(8) : '—'}</span>
          </div>
          {result && (
            <p className="text-[10px] text-black" data-cy="model-kaynak">
              Kaynak: {result.source} · sürüm {result.version} · eşik {result.threshold}
            </p>
          )}
          {error && <p className="text-[10px] text-[#C00000]">{error}</p>}
        </div>
      </div>
    </div>
  );
};
