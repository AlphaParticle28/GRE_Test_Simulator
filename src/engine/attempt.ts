// Attempt lifecycle: section order, routing, navigation, time accounting. Functions mutate the attempt in place
// (the store clones/persists around them).
import type { Attempt, AttemptMode, Measure, Question, Response, SectionKey, SectionState, TestDef, Tier } from '../types.ts';
import { indexOf, setFor } from '../content/index.ts';
import { isCorrect } from './grading.ts';
import { routeTier } from './scoring.ts';

export const DURATIONS: Record<SectionKey, number> = { V1: 18 * 60_000, V2: 23 * 60_000, Q1: 21 * 60_000, Q2: 26 * 60_000 };

/** The 6 valid orders: AWA (skipped) first, then V/Q in any order with S2 after S1 of the same measure. */
export const VALID_ORDERS: SectionKey[][] = [
  ['V1', 'V2', 'Q1', 'Q2'],
  ['V1', 'Q1', 'V2', 'Q2'],
  ['V1', 'Q1', 'Q2', 'V2'],
  ['Q1', 'Q2', 'V1', 'V2'],
  ['Q1', 'V1', 'Q2', 'V2'],
  ['Q1', 'V1', 'V2', 'Q2'],
];

export const measureOf = (k: SectionKey): Measure => (k[0] === 'V' ? 'verbal' : 'quant');
export const partOf = (k: SectionKey): 1 | 2 => (k[1] === '1' ? 1 : 2);

function uid(): string {
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function createAttempt(test: TestDef, mode: AttemptMode, opts: { bonus?: { measure: Measure; tier: Tier }; isRetake?: boolean } = {}): Attempt {
  let order: SectionKey[];
  if (mode === 'full') order = VALID_ORDERS[Math.floor(Math.random() * VALID_ORDERS.length)];
  else if (mode === 'verbal') order = ['V1', 'V2'];
  else if (mode === 'quant') order = ['Q1', 'Q2'];
  else order = [opts.bonus!.measure === 'verbal' ? 'V2' : 'Q2'];
  const now = Date.now();
  const a: Attempt = {
    id: uid(),
    testId: test.id,
    mode,
    bonus: opts.bonus,
    createdAt: now,
    updatedAt: now,
    order,
    sectionIdx: 0,
    phase: 'intro',
    sections: {},
    status: 'in-progress',
    suspensions: [],
    disputed: [],
    notes: {},
    isRetake: opts.isRetake,
  };
  ensureSection(a, test);
  return a;
}

export function currentKey(a: Attempt): SectionKey | undefined {
  return a.order[a.sectionIdx];
}

export function currentSection(a: Attempt): SectionState | undefined {
  const k = currentKey(a);
  return k ? a.sections[k] : undefined;
}

/** Number correct in a completed section (disputed questions count as correct). */
export function sectionCorrect(a: Attempt, test: TestDef, sec: SectionState, countDisputed = true): number {
  const idx = indexOf(test);
  return sec.questionIds.filter((id) => {
    const info = idx.get(id);
    return info && (isCorrect(info.q, sec.responses[id]) || (countDisputed && a.disputed.includes(id)));
  }).length;
}

/** Create the state for the current section if it doesn't exist yet (S2 tier is decided here). */
export function ensureSection(a: Attempt, test: TestDef): SectionState | undefined {
  const key = currentKey(a);
  if (!key) return undefined;
  if (a.sections[key]) return a.sections[key];
  const measure = measureOf(key);
  const part = partOf(key);
  let tier: Tier | undefined;
  if (part === 2) {
    if (a.bonus) tier = a.bonus.tier;
    else {
      const s1 = a.sections[measure === 'verbal' ? 'V1' : 'Q1'];
      // routing uses the raw S1 result at the time (disputes made later cannot change the route)
      tier = routeTier(s1 ? sectionCorrect(a, test, s1, false) : 0);
    }
  }
  const set = setFor(test, measure, part, tier);
  const sec: SectionState = {
    key,
    measure,
    part,
    tier,
    questionIds: set.questions.map((q) => q.id),
    status: 'not-started',
    durationMs: DURATIONS[key],
    remainingMs: DURATIONS[key],
    currentQ: 0,
    responses: {},
    marked: {},
    seen: {},
    timeMs: {},
    visits: {},
    history: {},
    answeredAtMs: {},
  };
  a.sections[key] = sec;
  return sec;
}

export function startSection(a: Attempt, test: TestDef): void {
  const sec = ensureSection(a, test);
  if (!sec) return;
  sec.status = 'in-progress';
  a.phase = 'question';
  visit(sec, 0);
}

function visit(sec: SectionState, i: number) {
  sec.currentQ = i;
  const id = sec.questionIds[i];
  sec.seen[id] = true;
  sec.visits[id] = (sec.visits[id] ?? 0) + 1;
}

export function goTo(a: Attempt, i: number): void {
  const sec = currentSection(a);
  if (!sec || i < 0 || i >= sec.questionIds.length) return;
  a.phase = 'question';
  if (i !== sec.currentQ) visit(sec, i);
}

export function setResponse(a: Attempt, qid: string, r: Response): void {
  const sec = currentSection(a);
  if (!sec || sec.status !== 'in-progress') return;
  sec.responses[qid] = r;
  const t = sec.durationMs - sec.remainingMs;
  (sec.history[qid] ??= []).push({ t, r });
  if (sec.history[qid].length > 60) sec.history[qid].splice(0, sec.history[qid].length - 60);
  sec.answeredAtMs[qid] = t;
}

export function toggleMark(a: Attempt): void {
  const sec = currentSection(a);
  if (!sec) return;
  const id = sec.questionIds[sec.currentQ];
  sec.marked[id] = !sec.marked[id];
}

/** Advance time by dt ms. Returns true if the section just expired. */
export function tick(a: Attempt, dt: number): boolean {
  const sec = currentSection(a);
  if (!sec || sec.status !== 'in-progress' || (a.phase !== 'question' && a.phase !== 'review')) return false;
  const used = Math.min(dt, sec.remainingMs);
  sec.remainingMs -= used;
  if (a.phase === 'question') {
    const id = sec.questionIds[sec.currentQ];
    sec.timeMs[id] = (sec.timeMs[id] ?? 0) + used;
  }
  if (sec.remainingMs <= 0) {
    endSection(a, 'time');
    return true;
  }
  return false;
}

/** End the current section (time expired or Exit Section). */
export function endSection(a: Attempt, reason: 'time' | 'exit'): void {
  const sec = currentSection(a);
  if (!sec) return;
  sec.status = 'done';
  sec.endedReason = reason;
  if (reason === 'time') {
    sec.remainingMs = 0;
    a.phase = 'timeup';
  } else {
    moveToNextSection(a);
  }
}

/** From 'timeup' (or after exit): go to the next section intro, or finish the attempt. */
export function moveToNextSection(a: Attempt): void {
  if (a.sectionIdx + 1 >= a.order.length) {
    a.phase = 'done';
    a.status = 'completed';
    a.completedAt = Date.now();
    return;
  }
  a.sectionIdx += 1;
  a.phase = 'intro';
}

export function questionsOf(test: TestDef, sec: SectionState): Question[] {
  const idx = indexOf(test);
  return sec.questionIds.map((id) => idx.get(id)!.q);
}
