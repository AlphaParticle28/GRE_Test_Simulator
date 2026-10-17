// Dev/e2e-only demo test assembled from the reference samples (not real practice content).
import type { Measure, Question, QuestionSet, SetKey, TestDef } from '../types.ts';
import { samplePassages, sampleDataSets, sampleVerbal, sampleQuant } from './samples.ts';
import { ID_CODE } from './blueprint.ts';

function build(measure: Measure, key: SetKey, n: number): QuestionSet {
  const pool: Question[] = measure === 'verbal' ? sampleVerbal : sampleQuant;
  const questions = Array.from({ length: n }, (_, i) => {
    const q = pool[i % pool.length];
    return { ...q, id: `demo-${measure[0]}${ID_CODE[key]}-${String(i + 1).padStart(2, '0')}` } as Question;
  });
  return { testId: 'demo', measure, key, passages: samplePassages, dataSets: sampleDataSets, questions };
}

export const demoTest: TestDef = {
  id: 'demo',
  name: 'Demo Test (samples)',
  verbal: { s1: build('verbal', 's1', 12), s2: { easy: build('verbal', 's2-easy', 15), medium: build('verbal', 's2-medium', 15), hard: build('verbal', 's2-hard', 15) } },
  quant: { s1: build('quant', 's1', 12), s2: { easy: build('quant', 's2-easy', 15), medium: build('quant', 's2-medium', 15), hard: build('quant', 's2-hard', 15) } },
};
