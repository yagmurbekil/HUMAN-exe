/**
 * Deterministic scenario rules (spec.md §6–§7)
 * Pure functions, independent of the UI layer (AC-14).
 */

import { DecisionOption, Ending, Flag } from '../types';

export const START_CLOCK = '08:00';

export function addMinutes(clock: string, minutes: number): string {
  const [h, m] = clock.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Simulated minutes an option consumes: its own cost plus any recovery penalty. */
export function getElapsedMinutes(option: DecisionOption): number {
  return option.timeCostMin + (option.recoveryPenaltyMin ?? 0);
}

/** Clock after committing an option, accumulated from the previous clock. */
export function getClockAfterDecision(previousClock: string, option: DecisionOption): string {
  return addMinutes(previousClock, getElapsedMinutes(option));
}

export function getEnding(flags: Flag[]): Ending {
  return flags.length === 0 ? 'SAFE_RECOVERY' : 'UNSAFE_RECOVERY';
}
