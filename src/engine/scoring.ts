// Estimated scaled scores. ETS's formula is not public: these tables are calibrated to anchors in PLAN.md §10
// and to the user's own PowerPrep data (Q 10+15 hard -> ~168; V 4+11 easy -> ~146).
import type { Tier } from '../types.ts';

/** S1 correct (out of 12) -> S2 tier. */
export const ROUTING = { hardMin: 8, mediumMin: 5 };

export function routeTier(s1Correct: number): Tier {
  if (s1Correct >= ROUTING.hardMin) return 'hard';
  if (s1Correct >= ROUTING.mediumMin) return 'medium';
  return 'easy';
}

// index = total correct (S1 + S2), 0..27
const HARD = [140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 159, 160, 161, 163, 164, 165, 166, 168, 169, 170];
const MEDIUM = [133, 134, 135, 136, 137, 139, 140, 141, 142, 144, 145, 146, 147, 149, 150, 151, 153, 155, 156, 157, 158, 160, 161, 161, 161, 161, 161, 161];
const EASY = [130, 130, 131, 132, 133, 134, 136, 137, 138, 139, 140, 141, 143, 144, 145, 146, 148, 149, 151, 152, 152, 152, 152, 152, 152, 152, 152, 152];

export const SCORE_TABLES: Record<Tier, number[]> = { hard: HARD, medium: MEDIUM, easy: EASY };

export function scaledScore(tier: Tier, s1Correct: number, s2Correct: number): number {
  const total = Math.max(0, Math.min(27, s1Correct + s2Correct));
  return SCORE_TABLES[tier][total];
}

/** Highest score each S2 route can reach (as on the real section-adaptive GRE). */
export const ROUTE_CAP: Record<Tier, number> = { easy: 152, medium: 161, hard: 170 };

/**
 * Difficulty-adjusted score: Rasch ability estimate from every item's difficulty label and outcome.
 * Difficulty labels were authored as score bands (d1≈145, d2≈150, d3≈156, d4≈162, d5≈167), so ability θ
 * (in logits, item b = difficulty − 3) maps to 156 + 5.5·θ. A N(0, 2²) prior keeps all-right/all-wrong finite.
 */
export function abilityScore(items: { difficulty: number; correct: boolean }[], tier: Tier): number {
  const grad = (t: number) => items.reduce((s, it) => s + (it.correct ? 1 : 0) - 1 / (1 + Math.exp(-(t - (it.difficulty - 3)))), 0) - t / 4;
  let lo = -8, hi = 8;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (grad(mid) > 0) lo = mid;
    else hi = mid;
  }
  const score = Math.round(156 + 5.5 * ((lo + hi) / 2));
  return Math.max(130, Math.min(ROUTE_CAP[tier], 170, score));
}

/** Final estimate: average of the count-based table and the difficulty-adjusted score. */
export function blendedScore(countBased: number, adjusted: number): number {
  if (countBased <= 130) return 130;
  return Math.max(130, Math.min(170, Math.round((countBased + adjusted) / 2)));
}

// Approximate ETS percentile ranks (recent published tables, rounded). Labeled "approx." in the UI.
const VERBAL_PCT: Record<number, number> = {
  170: 99, 169: 99, 168: 98, 167: 98, 166: 97, 165: 96, 164: 94, 163: 93, 162: 91, 161: 89, 160: 86, 159: 84, 158: 81,
  157: 78, 156: 74, 155: 70, 154: 66, 153: 62, 152: 58, 151: 53, 150: 49, 149: 44, 148: 40, 147: 35, 146: 31, 145: 27,
  144: 23, 143: 20, 142: 17, 141: 14, 140: 11, 139: 9, 138: 7, 137: 5, 136: 4, 135: 3, 134: 2, 133: 1, 132: 1, 131: 0, 130: 0,
};
const QUANT_PCT: Record<number, number> = {
  170: 96, 169: 93, 168: 91, 167: 89, 166: 86, 165: 84, 164: 81, 163: 79, 162: 76, 161: 73, 160: 70, 159: 67, 158: 64,
  157: 61, 156: 58, 155: 54, 154: 51, 153: 47, 152: 44, 151: 40, 150: 37, 149: 33, 148: 30, 147: 27, 146: 24, 145: 21,
  144: 18, 143: 15, 142: 13, 141: 11, 140: 9, 139: 7, 138: 5, 137: 4, 136: 3, 135: 2, 134: 2, 133: 1, 132: 1, 131: 0, 130: 0,
};

export function percentile(measure: 'verbal' | 'quant', score: number): number {
  return (measure === 'verbal' ? VERBAL_PCT : QUANT_PCT)[score] ?? 0;
}
