import type { TestDef } from '../../types.ts';
import { set as v1 } from './verbal-s1.ts';
import { set as v2e } from './verbal-s2-easy.ts';
import { set as v2m } from './verbal-s2-medium.ts';
import { set as v2h } from './verbal-s2-hard.ts';
import { set as q1 } from './quant-s1.ts';
import { set as q2e } from './quant-s2-easy.ts';
import { set as q2m } from './quant-s2-medium.ts';
import { set as q2h } from './quant-s2-hard.ts';

export const test: TestDef = {
  id: 't1',
  name: 'Practice Test 1',
  verbal: { s1: v1, s2: { easy: v2e, medium: v2m, hard: v2h } },
  quant: { s1: q1, s2: { easy: q2e, medium: q2m, hard: q2h } },
};
