// Content lookup helpers.
import type { DataSet, Measure, Passage, Question, QuestionSet, SetKey, TestDef, Tier } from '../types.ts';

export interface QInfo {
  q: Question;
  set: QuestionSet;
  measure: Measure;
  setKey: SetKey;
  passage?: Passage;
  dataSet?: DataSet;
  /** 0-based position within its set */
  pos: number;
}

const cache = new WeakMap<TestDef, Map<string, QInfo>>();

export function setsOf(test: TestDef): QuestionSet[] {
  const out: QuestionSet[] = [];
  for (const m of ['verbal', 'quant'] as const) {
    const mc = test[m];
    out.push(mc.s1, mc.s2.easy, mc.s2.medium, mc.s2.hard);
  }
  return out;
}

export function indexOf(test: TestDef): Map<string, QInfo> {
  let idx = cache.get(test);
  if (idx) return idx;
  idx = new Map();
  for (const set of setsOf(test)) {
    set.questions.forEach((q, pos) => {
      const passage = 'passageId' in q ? set.passages.find((p) => p.id === q.passageId) : undefined;
      const dataSet = 'dataSetId' in q && q.dataSetId ? set.dataSets.find((d) => d.id === q.dataSetId) : undefined;
      idx!.set(q.id, { q, set, measure: set.measure, setKey: set.key, passage, dataSet, pos });
    });
  }
  cache.set(test, idx);
  return idx;
}

export function setFor(test: TestDef, measure: Measure, part: 1 | 2, tier?: Tier): QuestionSet {
  const mc = test[measure];
  return part === 1 ? mc.s1 : mc.s2[tier ?? 'medium'];
}

export function tierLabel(t: Tier): string {
  return t === 'easy' ? 'Easier' : t === 'medium' ? 'Medium' : 'Harder';
}
