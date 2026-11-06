/**
 * Behaviour telemetry for the risky-choice model (spec.md §12, data/SOZLUK.md)
 *
 * One row per committed decision. No personal data: no name, e-mail, device id, IP,
 * location or timestamp. The session id is random and cannot be linked to a player.
 * Rows stay in the player's browser (localStorage) until they download the CSV themselves.
 */

import { DecisionDefinition, DecisionId, DecisionOption, Level } from '../types';

export const APP_VERSION = '3.0.0-veri';
const STORE_KEY = 'humanexe.oturumlar.v1';

/** Model input order — must match model/config.json `features`. */
export const FEATURE_ORDER = [
  'seviye',
  'karar_no',
  'karar_suresi_sn',
  'kart_orani',
  'tutor_acildi',
  'ipucu_sayisi',
  'onceki_riskli',
  'onceki_uyumsuz',
] as const;

export type FeatureName = (typeof FEATURE_ORDER)[number];
export type Features = Record<FeatureName, number>;

/** Recorded for analysis but not a model input: spec.md §12.1 explains why it was removed. */
export type RecordedFeatures = Features & { secim_degisikligi: number };

/** Measured on the decision screen up to the moment "Kararı Onayla" is pressed. */
export interface DecisionBehaviour {
  durationSec: number;
  viewedCardIds: string[];
  selectionChanges: number;
}

export interface SessionRow extends RecordedFeatures {
  oturum_id: string;
  karar_id: DecisionId;
  riskli_secim: 0 | 1;
  kaynak: 'gercek' | 'sentetik';
  uretim_turu: 'oyun-oturumu' | 'manuel-rastgele' | 'algoritmik-sentetik';
  uygulama_surumu: string;
}

export const CSV_COLUMNS: (keyof SessionRow)[] = [
  'oturum_id',
  'karar_id',
  ...FEATURE_ORDER,
  'secim_degisikligi',
  'riskli_secim',
  'kaynak',
  'uretim_turu',
  'uygulama_surumu',
];

const LEVEL_CODE: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };

const MODE_KEY = 'humanexe.veriModu';

/** On via `?veri=1` or the Start menu switch (remembered in this browser, e.g. inside the AI Studio frame). */
export function isDataCollectionMode(search: string = window.location.search): boolean {
  if (new URLSearchParams(search).get('veri') === '1') return true;
  try {
    return localStorage.getItem(MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDataCollectionPreference(on: boolean) {
  try {
    if (on) localStorage.setItem(MODE_KEY, '1');
    else localStorage.removeItem(MODE_KEY);
  } catch {
    /* ignore */
  }
}

export function newSessionId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildFeatures(args: {
  level: Level | null;
  decision: DecisionDefinition;
  behaviour: DecisionBehaviour;
  tutorOpened: boolean;
  hintsUsed: number;
  priorRisky: number;
  priorMisaligned: number;
}): RecordedFeatures {
  const totalCards = args.decision.evidenceCards.length || 1;
  const viewed = new Set(args.behaviour.viewedCardIds).size;
  return {
    seviye: args.level ? LEVEL_CODE[args.level] : 1,
    karar_no: args.decision.number,
    karar_suresi_sn: Math.round(args.behaviour.durationSec * 10) / 10,
    kart_orani: Math.round((viewed / totalCards) * 1000) / 1000,
    tutor_acildi: args.tutorOpened ? 1 : 0,
    ipucu_sayisi: args.hintsUsed,
    secim_degisikligi: args.behaviour.selectionChanges,
    onceki_riskli: args.priorRisky,
    onceki_uyumsuz: args.priorMisaligned,
  };
}

export function buildRow(
  sessionId: string,
  decisionId: DecisionId,
  features: RecordedFeatures,
  option: DecisionOption
): SessionRow {
  return {
    oturum_id: sessionId,
    karar_id: decisionId,
    ...features,
    riskli_secim: option.flag ? 1 : 0,
    kaynak: 'gercek', // only rows from a person genuinely playing the game
    uretim_turu: 'oyun-oturumu',
    uygulama_surumu: APP_VERSION,
  };
}

/* ---- Browser storage (per device; never sent anywhere) ---- */

export function loadStoredRows(): SessionRow[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as SessionRow[]) : [];
  } catch {
    return [];
  }
}

export function appendStoredRows(rows: SessionRow[]): SessionRow[] {
  const all = [...loadStoredRows(), ...rows];
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked (private mode): rows of this session can still be downloaded
  }
  return all;
}

export function clearStoredRows() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
}

export function toCsv(rows: SessionRow[]): string {
  const lines = rows.map((r) => CSV_COLUMNS.map((c) => String(r[c])).join(','));
  return [CSV_COLUMNS.join(','), ...lines].join('\n') + '\n';
}

export function countSessions(rows: SessionRow[]): number {
  return new Set(rows.map((r) => r.oturum_id)).size;
}

export function downloadCsv(rows: SessionRow[], filename = 'oturumlar.csv') {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
