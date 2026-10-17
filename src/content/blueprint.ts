// Exact section blueprints. The validator enforces these; content agents must follow them.
import type { Difficulty, Measure, QType, SetKey } from '../types.ts';

export interface Slot {
  /** Allowed question types for this position. */
  types: QType[];
  /** For TC slots: number of blanks. */
  blanks?: 1 | 2 | 3;
  /** Questions sharing a group letter must share the same passageId (verbal) or dataSetId (quant DI). */
  group?: 'A' | 'B' | 'C' | 'DI';
  /** Topic must start with this prefix. */
  topicPrefix?: string;
}

const RC: QType[] = ['rc-single', 'rc-multi', 'rc-select'];
const PS: QType[] = ['mc-single', 'mc-multi', 'numeric'];

const tc = (blanks: 1 | 2 | 3): Slot => ({ types: ['tc'], blanks, topicPrefix: `tc.${blanks}blank` });
const se: Slot = { types: ['se'], topicPrefix: 'se' };
const rcA: Slot = { types: RC, group: 'A', topicPrefix: 'rc.' };
const rcB: Slot = { types: RC, group: 'B', topicPrefix: 'rc.' };
const crC: Slot = { types: ['rc-single'], group: 'C', topicPrefix: 'cr.' };
const qc: Slot = { types: ['qc'] };
const ps: Slot = { types: PS };
const di: Slot = { types: PS, group: 'DI', topicPrefix: 'data.interpretation' };

export const VERBAL_S1: Slot[] = [tc(1), tc(2), tc(2), tc(3), rcA, rcA, rcA, se, se, rcB, rcB, crC];
export const VERBAL_S2: Slot[] = [tc(1), tc(1), tc(2), tc(2), tc(3), rcA, rcA, rcA, rcA, se, se, se, rcB, rcB, crC];
export const QUANT_S1: Slot[] = [qc, qc, qc, qc, ps, ps, ps, ps, di, di, ps, ps];
export const QUANT_S2: Slot[] = [qc, qc, qc, qc, qc, ps, ps, ps, ps, di, di, di, ps, ps, ps];

export function blueprintFor(measure: Measure, key: SetKey): Slot[] {
  if (measure === 'verbal') return key === 's1' ? VERBAL_S1 : VERBAL_S2;
  return key === 's1' ? QUANT_S1 : QUANT_S2;
}

/** Exact count of questions at each difficulty 1..5 (index 0 = difficulty 1). */
export const DIFFICULTY_MIX: Record<SetKey, [number, number, number, number, number]> = {
  s1: [1, 2, 6, 2, 1],
  's2-easy': [4, 6, 5, 0, 0],
  's2-medium': [0, 3, 7, 5, 0],
  's2-hard': [0, 0, 3, 6, 6],
};

/** Minimum counts of PS-style types within a quant set (DI questions count too). */
export const QUANT_TYPE_MINIMUMS: Record<'s1' | 's2', Partial<Record<QType, number>>> = {
  s1: { numeric: 2, 'mc-multi': 1, 'mc-single': 3 },
  s2: { numeric: 2, 'mc-multi': 1, 'mc-single': 4 },
};

/** Passage word-count ranges by group. */
export const PASSAGE_WORDS: Record<'A' | 'B' | 'C', [number, number]> = {
  A: [250, 480],
  B: [100, 250],
  C: [40, 160],
};

export const ID_CODE: Record<SetKey, string> = { s1: '1', 's2-easy': '2e', 's2-medium': '2m', 's2-hard': '2h' };

/** Expected question id: t1-v1-03, t2-q2h-15 */
export function expectedId(testId: string, measure: Measure, key: SetKey, index: number): string {
  return `${testId}-${measure === 'verbal' ? 'v' : 'q'}${ID_CODE[key]}-${String(index + 1).padStart(2, '0')}`;
}

export const SET_FILE: Record<SetKey, string> = {
  s1: 's1',
  's2-easy': 's2-easy',
  's2-medium': 's2-medium',
  's2-hard': 's2-hard',
};
