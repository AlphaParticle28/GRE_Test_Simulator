// Helpers for writing independent `verify()` functions in quant content.

/** QC result for one concrete case: 0 = A > B, 1 = B > A, 2 = equal. */
export function qcOne(a: number, b: number, eps = 1e-9): 0 | 1 | 2 {
  if (Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b))) return 2;
  return a > b ? 0 : 1;
}

/**
 * QC result over many cases (each case = [quantityA, quantityB]).
 * Returns 0/1/2 if every case agrees, else 3 (cannot be determined).
 * Brute-force all values allowed by the problem's constraints (include edge cases: 0, negatives, fractions).
 */
export function qcCompare(cases: Array<[number, number]>): 0 | 1 | 2 | 3 {
  if (cases.length === 0) throw new Error('qcCompare: no cases');
  const first = qcOne(cases[0][0], cases[0][1]);
  for (const [a, b] of cases) if (qcOne(a, b) !== first) return 3;
  return first;
}

/** Inclusive integer range. */
export function range(lo: number, hi: number, step = 1): number[] {
  const out: number[] = [];
  for (let x = lo; step > 0 ? x <= hi + 1e-12 : x >= hi - 1e-12; x += step) out.push(Math.round(x * 1e9) / 1e9);
  return out;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function isPrime(n: number): boolean {
  if (n < 2 || !Number.isInteger(n)) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

export function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

/** n choose k */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return Math.round(c);
}

/** n P k */
export function perm(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let p = 1;
  for (let i = 0; i < k; i++) p *= n - i;
  return p;
}

export function round(x: number, places = 0): number {
  const f = 10 ** places;
  return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f;
}

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

export function mean(xs: number[]): number {
  return sum(xs) / xs.length;
}

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Population standard deviation. */
export function stdev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/** All k-element combinations of an array. */
export function combos<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [h, ...t] = arr;
  return [...combos(t, k - 1).map((c) => [h, ...c]), ...combos(t, k)];
}

/** All permutations of an array. */
export function perms<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
}

/** Index of the option value that equals `value` (within tolerance); -1 if none. Use for mc-single verify(). */
export function indexOfValue(optionValues: number[], value: number, eps = 1e-9): number {
  return optionValues.findIndex((v) => Math.abs(v - value) <= eps * Math.max(1, Math.abs(v)));
}

/** Indices of the option values satisfying a predicate (sorted). Use for mc-multi verify(). */
export function indicesWhere<T>(optionValues: T[], pred: (v: T) => boolean): number[] {
  return optionValues.map((v, i) => (pred(v) ? i : -1)).filter((i) => i >= 0);
}
