import { expect, test } from 'vitest';
import { abilityScore, blendedScore, scaledScore } from '../src/engine/scoring.ts';
import { DIFFICULTY_MIX } from '../src/content/blueprint.ts';

const itemsFor = (mix: number[], rightPerLevel: number[]) =>
  mix.flatMap((n, i) => Array.from({ length: n }, (_, k) => ({ difficulty: i + 1, correct: k < rightPerLevel[i] })));

test('extremes', () => {
  const all = [...itemsFor(DIFFICULTY_MIX.s1, DIFFICULTY_MIX.s1), ...itemsFor(DIFFICULTY_MIX['s2-hard'], DIFFICULTY_MIX['s2-hard'])];
  expect(abilityScore(all, 'hard')).toBe(170);
  expect(abilityScore(all.map((x) => ({ ...x, correct: false })), 'hard')).toBeLessThanOrEqual(140);
});

test('route caps apply', () => {
  const all = [...itemsFor(DIFFICULTY_MIX.s1, DIFFICULTY_MIX.s1), ...itemsFor(DIFFICULTY_MIX['s2-easy'], DIFFICULTY_MIX['s2-easy'])];
  expect(abilityScore(all, 'easy')).toBeLessThanOrEqual(152);
});

test('user scenario: Q S1 9/12 -> hard 6/15 is credited for the harder questions', () => {
  // S1 misses: the d5, one d4, one d3. Hard S2: all three d3 right, three of six d4 right, no d5.
  const items = [...itemsFor(DIFFICULTY_MIX.s1, [1, 2, 5, 1, 0]), ...itemsFor(DIFFICULTY_MIX['s2-hard'], [0, 0, 3, 3, 0])];
  const adj = abilityScore(items, 'hard');
  const count = scaledScore('hard', 9, 6);
  console.log({ count, adj, final: blendedScore(count, adj) });
  expect(adj).toBeGreaterThan(count);
});
