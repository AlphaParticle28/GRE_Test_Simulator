// Builds the score report + error log for an attempt, and cross-attempt aggregates for the dashboard.
import type { Attempt, Measure, Question, Response, SectionKey, SectionState, TestDef, Tier, Trap, HistoryEntry, VocabEntry } from '../types.ts';
import { indexOf, type QInfo } from '../content/index.ts';
import { answerStatus, isCorrect, partialInfo, pickedOptions } from './grading.ts';
import { abilityScore, blendedScore, percentile, scaledScore } from './scoring.ts';

export type Outcome = 'correct' | 'wrong' | 'omitted';

export interface Diagnosis {
  code: 'not-reached' | 'omitted' | 'timeout-blank' | 'time-pressure' | 'rushed' | 'over-invested' | 'changed-away' | 'trap' | 'partial' | 'slow-correct' | 'changed-to-correct';
  label: string;
  detail?: string;
  severity: 'bad' | 'warn' | 'good';
}

export interface QResult {
  id: string;
  sectionKey: SectionKey;
  sectionIdx: number;
  measure: Measure;
  part: 1 | 2;
  tier?: Tier;
  pos: number; // 1-based within section
  info: QInfo;
  q: Question;
  response: Response | undefined;
  outcome: Outcome;
  /** correct OR disputed */
  credited: boolean;
  disputed: boolean;
  timeMs: number;
  targetMs: number;
  visits: number;
  marked: boolean;
  seen: boolean;
  history: HistoryEntry[];
  diagnoses: Diagnosis[];
  traps: Trap[];
  partial: string | null;
}

export interface SectionSummary {
  key: SectionKey;
  idx: number;
  measure: Measure;
  part: 1 | 2;
  tier?: Tier;
  correct: number;
  total: number;
  answered: number;
  timeUsedMs: number;
  durationMs: number;
  endedReason?: 'time' | 'exit';
}

export interface MeasureScore {
  measure: Measure;
  s1: number;
  s2: number;
  tier: Tier;
  scaled: number;
  /** Score from the raw-count table alone. */
  countBased: number;
  /** Score from the difficulty-aware ability estimate. */
  adjusted: number;
  percentile: number;
}

export interface Stat {
  key: string;
  n: number;
  correct: number;
  timeMs: number;
}

export interface AttemptReport {
  attempt: Attempt;
  test: TestDef;
  sections: SectionSummary[];
  results: QResult[];
  scores: Partial<Record<Measure, MeasureScore>>;
  byType: Stat[];
  byTopic: Stat[];
  byDifficulty: Stat[];
  tcBlanks: { blank: number; n: number; correct: number }[];
  qcBias: { pickedDWrongly: number; missedD: number; dQuestions: number };
  vocab: VocabEntry[];
}

export const TYPE_LABEL: Record<Question['type'], string> = {
  tc: 'Text Completion',
  se: 'Sentence Equivalence',
  'rc-single': 'Reading Comp (single)',
  'rc-multi': 'Reading Comp (select all)',
  'rc-select': 'Select-in-Passage',
  qc: 'Quantitative Comparison',
  'mc-single': 'Multiple Choice (one)',
  'mc-multi': 'Multiple Choice (one or more)',
  numeric: 'Numeric Entry',
};

export function typeKey(r: QResult): string {
  const q = r.q;
  if (q.type === 'tc') return `TC ${q.blanks.length}-blank`;
  if (q.type === 'rc-single' && q.topic.startsWith('cr.')) return 'Critical Reasoning';
  if ('dataSetId' in q && q.dataSetId) return 'Data Interpretation';
  return TYPE_LABEL[q.type];
}

export const TOPIC_LABEL: Record<string, string> = {
  'arith.integers': 'Integers & number properties', 'arith.exponents-roots': 'Exponents & roots', 'arith.fractions-decimals': 'Fractions & decimals',
  'arith.percents': 'Percents', 'arith.ratios-rates': 'Ratios, rates & work', 'alg.linear': 'Linear equations', 'alg.quadratics': 'Quadratics',
  'alg.inequalities-abs': 'Inequalities & absolute value', 'alg.functions': 'Functions & symbols', 'alg.coordinate': 'Coordinate geometry',
  'alg.sequences': 'Sequences', 'alg.word-problems': 'Algebra word problems', 'geo.lines-angles': 'Lines & angles', 'geo.triangles': 'Triangles',
  'geo.polygons': 'Polygons & quadrilaterals', 'geo.circles': 'Circles', 'geo.solids': '3-D solids', 'data.statistics': 'Statistics',
  'data.probability': 'Probability', 'data.combinatorics': 'Counting & combinatorics', 'data.distributions': 'Distributions',
  'data.interpretation': 'Data interpretation', 'tc.1blank': 'TC 1-blank', 'tc.2blank': 'TC 2-blank', 'tc.3blank': 'TC 3-blank', se: 'Sentence equivalence',
  'rc.main-idea': 'RC: main idea / purpose', 'rc.detail': 'RC: detail', 'rc.inference': 'RC: inference', 'rc.function': 'RC: function of a part',
  'rc.vocab-in-context': 'RC: vocabulary in context', 'rc.attitude': "RC: author's attitude", 'rc.structure': 'RC: structure',
  'rc.select-in-passage': 'RC: select-in-passage', 'cr.strengthen': 'CR: strengthen', 'cr.weaken': 'CR: weaken', 'cr.assumption': 'CR: assumption',
  'cr.paradox': 'CR: paradox', 'cr.evaluate': 'CR: evaluate', 'cr.boldface': 'CR: boldface', 'cr.inference': 'CR: inference',
};

export const TRAP_LABEL: Record<string, string> = {
  reversal: 'Reversal (opposite meaning)', 'too-extreme': 'Too extreme', 'out-of-scope': 'Out of scope', partial: 'Half right',
  'wrong-shade': 'Wrong shade of meaning', 'synonym-pair-trap': 'Synonym pair that does not fit', 'calc-slip': 'Calculation slip',
  'assumed-integer': 'Assumed integers', 'assumed-positive': 'Assumed positive', 'ignored-constraint': 'Ignored a constraint', misread: 'Misread the question',
  'd-trap': 'QC: answered (D) / missed (D)', 'unit-error': 'Units / form error', 'wrong-formula': 'Wrong formula or method',
};

const sec2s = (ms: number) => Math.round(ms / 1000);

function diagnose(r: Omit<QResult, 'diagnoses'>, sec: SectionState): Diagnosis[] {
  const d: Diagnosis[] = [];
  const st = answerStatus(r.q, r.response);
  const answeredAt = sec.answeredAtMs[r.id];
  if (r.outcome !== 'correct') {
    if (!r.seen) d.push({ code: 'not-reached', label: 'Never reached', detail: 'You did not get to this question before the section ended.', severity: 'bad' });
    else if (st === 'none') {
      if (sec.endedReason === 'time') d.push({ code: 'timeout-blank', label: 'Left blank at time-out', detail: 'Always enter a guess — there is no penalty for wrong answers.', severity: 'bad' });
      else d.push({ code: 'omitted', label: 'Left blank', detail: 'There is no penalty for guessing; never leave a question blank.', severity: 'bad' });
    }
    if (st !== 'none') {
      if (answeredAt !== undefined && answeredAt > sec.durationMs - 60_000)
        d.push({ code: 'time-pressure', label: 'Time-pressure answer', detail: 'Answered in the final minute of the section.', severity: 'warn' });
      else if (r.timeMs < 20_000)
        d.push({ code: 'rushed', label: 'Rushed', detail: `Only ${sec2s(r.timeMs)}s spent — likely a guess or a careless read.`, severity: 'warn' });
      if (r.timeMs > 2 * r.targetMs)
        d.push({ code: 'over-invested', label: 'Over-invested', detail: `${sec2s(r.timeMs)}s spent (target ≈ ${sec2s(r.targetMs)}s) and still missed — a cue to guess and move on sooner.`, severity: 'bad' });
      const hadCorrect = r.history.some((h) => isCorrect(r.q, h.r));
      if (hadCorrect) d.push({ code: 'changed-away', label: 'Changed a right answer', detail: 'At some point you had the correct answer selected, then changed it.', severity: 'bad' });
      for (const t of r.traps) d.push({ code: 'trap', label: `Trap: ${TRAP_LABEL[t.trap] ?? t.trap}`, detail: t.why, severity: 'bad' });
      if (r.partial) d.push({ code: 'partial', label: 'Partly right', detail: r.partial, severity: 'warn' });
    }
  } else {
    if (r.timeMs > 2 * r.targetMs) d.push({ code: 'slow-correct', label: 'Correct but slow', detail: `${sec2s(r.timeMs)}s (target ≈ ${sec2s(r.targetMs)}s). Look for a faster method.`, severity: 'warn' });
    const hadWrongAnswered = r.history.some((h) => answerStatus(r.q, h.r) === 'answered' && !isCorrect(r.q, h.r));
    if (hadWrongAnswered) d.push({ code: 'changed-to-correct', label: 'Fixed on review', detail: 'You changed a wrong answer to the right one.', severity: 'good' });
  }
  return d;
}

function stat(map: Map<string, Stat>, key: string, r: QResult) {
  const s = map.get(key) ?? { key, n: 0, correct: 0, timeMs: 0 };
  s.n++;
  if (r.outcome === 'correct') s.correct++;
  s.timeMs += r.timeMs;
  map.set(key, s);
}

export function buildReport(a: Attempt, test: TestDef): AttemptReport {
  const idx = indexOf(test);
  const results: QResult[] = [];
  const sections: SectionSummary[] = [];
  a.order.forEach((key, sIdx) => {
    const sec = a.sections[key];
    if (!sec || sec.status === 'not-started') return;
    const targetMs = sec.durationMs / sec.questionIds.length;
    let correct = 0, answered = 0;
    sec.questionIds.forEach((id, i) => {
      const info = idx.get(id);
      if (!info) return;
      const q = info.q;
      const response = sec.responses[id];
      const st = answerStatus(q, response);
      const ok = isCorrect(q, response);
      const outcome: Outcome = ok ? 'correct' : st === 'none' ? 'omitted' : 'wrong';
      const disputed = a.disputed.includes(id);
      if (ok || disputed) correct++;
      if (st !== 'none') answered++;
      const picked = ok ? [] : pickedOptions(q, response);
      const traps = (q.traps ?? []).filter((t) => picked.some((p) => p.option === t.option && (q.type !== 'tc' || p.blank === t.blank)));
      const base = {
        id, sectionKey: key, sectionIdx: sIdx, measure: sec.measure, part: sec.part, tier: sec.tier, pos: i + 1, info, q, response, outcome,
        credited: ok || disputed, disputed, timeMs: sec.timeMs[id] ?? 0, targetMs, visits: sec.visits[id] ?? 0, marked: !!sec.marked[id],
        seen: !!sec.seen[id], history: sec.history[id] ?? [], traps, partial: ok ? null : partialInfo(q, response),
      };
      results.push({ ...base, diagnoses: diagnose(base, sec) });
    });
    sections.push({
      key, idx: sIdx, measure: sec.measure, part: sec.part, tier: sec.tier, correct, total: sec.questionIds.length, answered,
      timeUsedMs: sec.durationMs - sec.remainingMs, durationMs: sec.durationMs, endedReason: sec.endedReason,
    });
  });

  const scores: Partial<Record<Measure, MeasureScore>> = {};
  if (a.mode !== 'bonus') {
    for (const m of ['verbal', 'quant'] as const) {
      const s1 = sections.find((s) => s.measure === m && s.part === 1);
      const s2 = sections.find((s) => s.measure === m && s.part === 2);
      if (s1 && s2 && s2.tier && a.sections[s2.key]?.status === 'done') {
        const countBased = scaledScore(s2.tier, s1.correct, s2.correct);
        const adjusted = abilityScore(results.filter((r) => r.measure === m).map((r) => ({ difficulty: r.q.difficulty, correct: r.credited })), s2.tier);
        const scaled = blendedScore(countBased, adjusted);
        scores[m] = { measure: m, s1: s1.correct, s2: s2.correct, tier: s2.tier, scaled, countBased, adjusted, percentile: percentile(m, scaled) };
      }
    }
  }

  const byType = new Map<string, Stat>(), byTopic = new Map<string, Stat>(), byDiff = new Map<string, Stat>();
  const tcBlanks = [0, 1, 2].map((blank) => ({ blank, n: 0, correct: 0 }));
  const qcBias = { pickedDWrongly: 0, missedD: 0, dQuestions: 0 };
  const vocab = new Map<string, VocabEntry>();
  for (const r of results) {
    stat(byType, typeKey(r), r);
    stat(byTopic, r.q.topic, r);
    stat(byDiff, `d${r.q.difficulty}`, r);
    if (r.q.type === 'tc' && r.q.blanks.length > 1 && r.response?.kind === 'blanks') {
      r.q.answer.forEach((ans, b) => {
        tcBlanks[b].n++;
        if ((r.response as { values: (number | null)[] }).values[b] === ans) tcBlanks[b].correct++;
      });
    }
    if (r.q.type === 'qc') {
      const pick = r.response?.kind === 'choice' ? r.response.value : null;
      if (r.q.answer === 3) {
        qcBias.dQuestions++;
        if (pick !== null && pick !== 3) qcBias.missedD++;
      } else if (pick === 3) qcBias.pickedDWrongly++;
    }
    if ((r.q.type === 'tc' || r.q.type === 'se') && r.outcome !== 'correct') {
      for (const v of r.q.vocab ?? []) vocab.set(v.word.toLowerCase(), v);
      const words = r.q.type === 'tc' ? r.q.answer.map((a2, b) => (r.q as { blanks: string[][] }).blanks[b][a2]) : r.q.answer.map((a2) => (r.q as { options: string[] }).options[a2]);
      for (const w of words) if (!vocab.has(w.toLowerCase())) vocab.set(w.toLowerCase(), { word: w, meaning: '' });
    }
  }
  return {
    attempt: a, test, sections, results, scores,
    byType: [...byType.values()],
    byTopic: [...byTopic.values()].sort((x, y) => x.correct / x.n - y.correct / y.n || y.n - x.n),
    byDifficulty: [...byDiff.values()].sort((x, y) => x.key.localeCompare(y.key)),
    tcBlanks: tcBlanks.filter((b) => b.n > 0),
    qcBias,
    vocab: [...vocab.values()].sort((x, y) => x.word.localeCompare(y.word)),
  };
}

export function resultsCsv(rep: AttemptReport): string {
  const esc = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const head = ['Section', 'Measure', 'S2 level', 'Q#', 'Type', 'Topic', 'Difficulty', 'Outcome', 'Time (s)', 'Visits', 'Marked', 'Diagnosis', 'My tag', 'My note', 'Question ID'];
  const rows = rep.results.map((r) => [
    `${r.sectionIdx + 1}`, r.measure, r.tier ?? '', r.pos, typeKey(r), TOPIC_LABEL[r.q.topic] ?? r.q.topic, r.q.difficulty,
    r.disputed ? 'disputed' : r.outcome, Math.round(r.timeMs / 1000), r.visits, r.marked ? 'yes' : '', r.diagnoses.map((d) => d.label).join('; '),
    rep.attempt.notes[r.id]?.tag ?? '', rep.attempt.notes[r.id]?.text ?? '', r.id,
  ]);
  return [head, ...rows].map((row) => row.map(esc).join(',')).join('\r\n');
}
