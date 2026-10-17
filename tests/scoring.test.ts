import { describe, expect, test } from 'vitest';
import { routeTier, scaledScore, SCORE_TABLES, percentile } from '../src/engine/scoring.ts';
import { TIERS } from '../src/types.ts';

describe('scoring', () => {
  test('tables are monotonic non-decreasing and within 130-170', () => {
    for (const t of TIERS) {
      const tab = SCORE_TABLES[t];
      expect(tab).toHaveLength(28);
      tab.forEach((v, i) => {
        expect(v).toBeGreaterThanOrEqual(130);
        expect(v).toBeLessThanOrEqual(170);
        if (i) expect(v).toBeGreaterThanOrEqual(tab[i - 1]);
      });
    }
  });
  test('harder route never scores lower for the same total', () => {
    for (let n = 0; n <= 27; n++) {
      expect(SCORE_TABLES.hard[n]).toBeGreaterThanOrEqual(SCORE_TABLES.medium[n]);
      expect(SCORE_TABLES.medium[n]).toBeGreaterThanOrEqual(SCORE_TABLES.easy[n]);
    }
  });
  test('PLAN anchors', () => {
    expect(scaledScore('hard', 12, 15)).toBe(170);
    expect(scaledScore('hard', 10, 15)).toBe(168);
    expect(scaledScore('hard', 10, 12)).toBe(164);
    expect(scaledScore('hard', 9, 10)).toBe(160);
    expect(scaledScore('hard', 8, 7)).toBe(155);
    expect(scaledScore('hard', 8, 3)).toBe(151);
    expect(scaledScore('medium', 7, 15)).toBe(161);
    expect(scaledScore('medium', 7, 12)).toBe(157);
    expect(scaledScore('medium', 6, 9)).toBe(151);
    expect(scaledScore('medium', 5, 6)).toBe(146);
    expect(scaledScore('medium', 5, 0)).toBe(139);
    expect(scaledScore('easy', 4, 15)).toBe(152);
    expect(scaledScore('easy', 4, 11)).toBe(146);
    expect(scaledScore('easy', 3, 8)).toBe(141);
    expect(scaledScore('easy', 2, 3)).toBe(134);
    expect(scaledScore('easy', 0, 1)).toBe(130);
  });
  test('user calibration points', () => {
    expect(scaledScore(routeTier(10), 10, 15)).toBeGreaterThanOrEqual(167);
    const v = scaledScore(routeTier(4), 4, 11);
    expect(v).toBeGreaterThanOrEqual(145);
    expect(v).toBeLessThanOrEqual(147);
  });
  test('routing thresholds', () => {
    expect(routeTier(12)).toBe('hard');
    expect(routeTier(8)).toBe('hard');
    expect(routeTier(7)).toBe('medium');
    expect(routeTier(5)).toBe('medium');
    expect(routeTier(4)).toBe('easy');
    expect(routeTier(0)).toBe('easy');
  });
  test('percentiles exist for every score', () => {
    for (let s = 130; s <= 170; s++) {
      expect(percentile('verbal', s)).toBeGreaterThanOrEqual(0);
      expect(percentile('quant', s)).toBeGreaterThanOrEqual(0);
    }
    expect(percentile('verbal', 150)).toBeLessThan(percentile('verbal', 160));
  });
});
