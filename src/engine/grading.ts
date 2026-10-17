// Correctness, answer status and display formatting for every question type (ETS rules: no partial credit).
import type { Question, Response, NumericAnswer } from '../types.ts';

export const LETTERS = 'ABCDEFGHIJ';
export const ROMAN = ['i', 'ii', 'iii'];

export function emptyResponse(q: Question): Response {
  switch (q.type) {
    case 'tc':
      return { kind: 'blanks', values: q.blanks.map(() => null) };
    case 'se':
    case 'rc-multi':
    case 'mc-multi':
      return { kind: 'multi', values: [] };
    case 'rc-select':
      return { kind: 'sentence', value: null };
    case 'numeric':
      return q.answer.kind === 'fraction' ? { kind: 'fraction', num: '', den: '' } : { kind: 'numeric', text: '' };
    default:
      return { kind: 'choice', value: null };
  }
}

/** Parse what the user typed in a numeric box. Returns null if not a valid number. */
export function parseNumeric(text: string): number | null {
  const t = text.replace(/,/g, '').trim();
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  return parseFloat(t);
}

export function parseInteger(text: string): number | null {
  const t = text.replace(/,/g, '').trim();
  if (!/^-?\d+$/.test(t)) return null;
  return parseInt(t, 10);
}

function numericValue(a: NumericAnswer): number {
  return a.kind === 'decimal' ? a.value : a.num / a.den;
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

export type AnswerStatus = 'answered' | 'incomplete' | 'none';

export function answerStatus(q: Question, r: Response | undefined): AnswerStatus {
  if (!r) return 'none';
  switch (r.kind) {
    case 'choice':
      return r.value === null ? 'none' : 'answered';
    case 'sentence':
      return r.value === null ? 'none' : 'answered';
    case 'blanks': {
      const n = r.values.filter((v) => v !== null).length;
      return n === 0 ? 'none' : n < r.values.length ? 'incomplete' : 'answered';
    }
    case 'multi': {
      if (r.values.length === 0) return 'none';
      if (q.type === 'se' && r.values.length < 2) return 'incomplete';
      if (q.type === 'mc-multi' && q.exactly && r.values.length < q.exactly) return 'incomplete';
      return 'answered';
    }
    case 'numeric':
      return r.text.trim() === '' ? 'none' : 'answered';
    case 'fraction': {
      const a = r.num.trim() !== '', b = r.den.trim() !== '';
      return !a && !b ? 'none' : a && b ? 'answered' : 'incomplete';
    }
  }
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);

export function isCorrect(q: Question, r: Response | undefined): boolean {
  if (!r) return false;
  switch (q.type) {
    case 'tc':
      return r.kind === 'blanks' && r.values.length === q.answer.length && r.values.every((v, i) => v === q.answer[i]);
    case 'se':
    case 'rc-multi':
    case 'mc-multi':
      return r.kind === 'multi' && sameSet(r.values, q.answer);
    case 'rc-select':
      return r.kind === 'sentence' && r.value !== null && r.value.p === q.answer.p && r.value.s === q.answer.s;
    case 'numeric': {
      const target = numericValue(q.answer);
      if (r.kind === 'numeric') {
        const v = parseNumeric(r.text);
        return v !== null && close(v, target);
      }
      if (r.kind === 'fraction') {
        const n = parseInteger(r.num), d = parseInteger(r.den);
        return n !== null && d !== null && d !== 0 && close(n / d, target);
      }
      return false;
    }
    default:
      return r.kind === 'choice' && r.value === q.answer;
  }
}

/** Partial-understanding details for multi-part questions (analytics only; scoring is all-or-nothing). */
export function partialInfo(q: Question, r: Response | undefined): string | null {
  if (!r) return null;
  if (q.type === 'tc' && r.kind === 'blanks' && q.blanks.length > 1) {
    const right = r.values.map((v, i) => v === q.answer[i]);
    const n = right.filter(Boolean).length;
    if (n > 0 && n < right.length) return `Blanks right: ${right.map((ok, i) => `(${ROMAN[i]}) ${ok ? '✓' : '✗'}`).join(' ')}`;
  }
  if ((q.type === 'se' || q.type === 'rc-multi' || q.type === 'mc-multi') && r.kind === 'multi' && r.values.length) {
    const ans = new Set(q.answer);
    const hit = r.values.filter((v) => ans.has(v)).length;
    const extra = r.values.length - hit;
    const missing = q.answer.length - hit;
    if (hit > 0 && (extra || missing)) {
      if (q.type === 'se') return `1 of 2 correct${extra ? ' (one wrong pick)' : ''}`;
      return `${hit} right, ${missing} missed, ${extra} extra`;
    }
  }
  return null;
}

export function formatAnswerKey(q: Question): string {
  switch (q.type) {
    case 'tc':
      return q.answer.map((a, i) => (q.blanks.length > 1 ? `(${ROMAN[i]}) ` : '') + q.blanks[i][a]).join('; ');
    case 'se':
      return q.answer.map((a) => `${LETTERS[a]} (${q.options[a]})`).join(', ');
    case 'rc-multi':
    case 'mc-multi':
      return q.answer.map((a) => LETTERS[a]).join(', ');
    case 'rc-select':
      return `Paragraph ${q.answer.p + 1}, sentence ${q.answer.s + 1}`;
    case 'numeric':
      return q.answer.kind === 'decimal' ? String(q.answer.value) : `${q.answer.num}/${q.answer.den}`;
    case 'qc':
      return LETTERS[q.answer];
    default:
      return LETTERS[q.answer];
  }
}

export function formatResponse(q: Question, r: Response | undefined): string {
  if (!r || answerStatus(q, r) === 'none') return '—';
  switch (r.kind) {
    case 'blanks':
      return r.values.map((v, i) => (q.type === 'tc' && q.blanks.length > 1 ? `(${ROMAN[i]}) ` : '') + (v === null ? '—' : q.type === 'tc' ? q.blanks[i][v] : '?')).join('; ');
    case 'multi':
      return [...r.values].sort((a, b) => a - b).map((v) => (q.type === 'se' ? `${LETTERS[v]} (${q.options[v]})` : LETTERS[v])).join(', ');
    case 'sentence':
      return r.value ? `Paragraph ${r.value.p + 1}, sentence ${r.value.s + 1}` : '—';
    case 'numeric':
      return r.text;
    case 'fraction':
      return `${r.num || '?'}/${r.den || '?'}`;
    case 'choice':
      return r.value === null ? '—' : LETTERS[r.value];
  }
}

/** A response that is graded correct (used by e2e tests and the dev hook). */
export function correctResponse(q: Question): Response {
  switch (q.type) {
    case 'tc':
      return { kind: 'blanks', values: [...q.answer] };
    case 'se':
    case 'rc-multi':
    case 'mc-multi':
      return { kind: 'multi', values: [...q.answer] };
    case 'rc-select':
      return { kind: 'sentence', value: { ...q.answer } };
    case 'numeric':
      return q.answer.kind === 'decimal' ? { kind: 'numeric', text: String(q.answer.value) } : { kind: 'fraction', num: String(q.answer.num), den: String(q.answer.den) };
    default:
      return { kind: 'choice', value: q.answer };
  }
}

/** A response that is graded wrong. */
export function wrongResponse(q: Question): Response {
  switch (q.type) {
    case 'tc':
      return { kind: 'blanks', values: q.answer.map((a, i) => (a + 1) % q.blanks[i].length) };
    case 'se':
      return { kind: 'multi', values: [0, 1, 2, 3, 4, 5].filter((i) => !q.answer.includes(i)).slice(0, 2) };
    case 'rc-multi':
    case 'mc-multi':
      return { kind: 'multi', values: q.options.map((_, i) => i).filter((i) => !q.answer.includes(i)).slice(0, 1).concat(q.answer.length === q.options.length ? [] : []) };
    case 'rc-select':
      return { kind: 'sentence', value: { p: q.answer.p, s: q.answer.s === 0 ? 1 : 0 } };
    case 'numeric':
      return { kind: 'numeric', text: '-987654' };
    case 'qc':
      return { kind: 'choice', value: (q.answer + 1) % 4 };
    default:
      return { kind: 'choice', value: (q.answer + 1) % q.options.length };
  }
}

/** The option indices the user picked (for trap matching). For TC returns [blank, option] pairs. */
export function pickedOptions(q: Question, r: Response | undefined): { option: number; blank?: number }[] {
  if (!r) return [];
  if (r.kind === 'choice' && r.value !== null) return [{ option: r.value }];
  if (r.kind === 'multi') return r.values.map((option) => ({ option }));
  if (r.kind === 'blanks') return r.values.flatMap((v, blank) => (v === null || (q.type === 'tc' && q.answer[blank] === v) ? [] : [{ option: v, blank }]));
  return [];
}
