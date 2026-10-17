import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, perms, mean, stdev, gcd } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// DI data (t3-q2h-dA): employees of Company Q by department
const DEPTS = ['Engineering', 'Sales', 'Operations', 'Finance', 'Research'];
const EMP = [240, 180, 300, 80, 200];
const PCT_F = [35, 55, 40, 50, 48];
const PCT_G = [70, 20, 15, 65, 60];

/** Index of the option closest to v (must be within 1e-6), else -1. */
const nearest = (opts: number[], v: number) => {
  let bi = -1;
  let bd = Infinity;
  opts.forEach((o, i) => {
    const d = Math.abs(o - v);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  });
  return bd < 1e-6 ? bi : -1;
};

export const set: QuestionSet = {
  testId: 't3',
  measure: 'quant',
  key: 's2-hard',
  passages: [],
  dataSets: [
    {
      id: 't3-q2h-dA',
      charts: [
        {
          kind: 'table',
          title: 'Employees of Company Q, by Department',
          columns: ['Department', 'Number of employees', 'Percent who are female', 'Percent who hold a graduate degree'],
          rows: DEPTS.map((d, i) => [d, EMP[i], `${PCT_F[i]}%`, `${PCT_G[i]}%`]),
          note: 'Each of the 1,000 employees of Company Q works in exactly one of the five departments.',
        },
      ],
    },
  ],
  questions: [
    // 1 ─ QC
    {
      id: 't3-q2h-01',
      type: 'qc',
      difficulty: 4,
      topic: 'data.statistics',
      info: 'List L consists of 10 numbers that are not all equal. List M consists of the 10 numbers in L together with two additional numbers, each equal to the average (arithmetic mean) of the numbers in L.',
      quantityA: 'The standard deviation of the numbers in M',
      quantityB: 'The standard deviation of the numbers in L',
      answer: 1,
      explanation: r`The two added numbers equal the mean of L, so M has the same mean as L, and each added number has a deviation of 0. M therefore has the same sum of squared deviations as L, spread over 12 numbers instead of 10, so its standard deviation is smaller (by a factor of $\sqrt{\frac{10}{12}}$). Quantity B is greater.`,
      traps: [
        { option: 2, trap: 'wrong-formula', why: 'Adding numbers equal to the mean leaves the mean unchanged, but not the standard deviation: values at the mean add no spread while increasing the count.' },
        { option: 3, trap: 'd-trap', why: 'The specific numbers in L are unknown, but the effect of adding values at the mean is the same for every list whose standard deviation is positive.' },
      ],
      verify: () => {
        const lists = [
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          [-4, -4, 0, 0, 0, 2.5, 3, 7, 11, 20],
          [0.1, 0.2, 0.2, 0.5, 0.9, 1.3, 1.3, 1.4, 2.2, 3],
          [5, 5, 5, 5, 5, 5, 5, 5, 5, 6],
          [-100, 0, 0, 0, 0, 0, 0, 0, 0, 100],
        ];
        return qcCompare(
          lists.map((L) => {
            const m = mean(L);
            return [stdev([...L, m, m]), stdev(L)] as [number, number];
          }),
        );
      },
    },
    // 2 ─ QC
    {
      id: 't3-q2h-02',
      type: 'qc',
      difficulty: 5,
      topic: 'geo.triangles',
      info: r`Triangle $T$ has two sides of lengths 6 and 10, and the area of $T$ is 24.`,
      quantityA: r`The length of the third side of $T$`,
      quantityB: r`$8$`,
      answer: 3,
      explanation: r`Take the side of length 10 as the base; an area of 24 means the height to that base is 4.8. The side of length 6 joins one end of the base to the opposite vertex, so that vertex is $\sqrt{6^{2} - 4.8^{2}} = 3.6$ units horizontally from that end, either toward the other end of the base or away from it. Toward: the third side is $\sqrt{6.4^{2} + 4.8^{2}} = 8$ (a 6-8-10 right triangle). Away: the third side is $\sqrt{13.6^{2} + 4.8^{2}} = \sqrt{208} \approx 14.4$. The relationship cannot be determined.`,
      traps: [
        { option: 2, trap: 'ignored-constraint', why: r`Spotting the 6-8-10 right triangle (area $\frac{1}{2}(6)(8) = 24$) and stopping; an obtuse triangle with the same two sides and the same area has third side $\sqrt{208}$.` },
      ],
      verify: () => {
        // angle t between the sides 6 and 10: area = 30 sin t; find both solutions by bisection
        const area = (t: number) => 30 * Math.sin(t);
        const solve = (lo: number, hi: number) => {
          const sLo = Math.sign(area(lo) - 24);
          for (let k = 0; k < 200; k++) {
            const mid = (lo + hi) / 2;
            if (Math.sign(area(mid) - 24) === sLo) lo = mid;
            else hi = mid;
          }
          return (lo + hi) / 2;
        };
        const third = (t: number) => Math.sqrt(36 + 100 - 120 * Math.cos(t));
        return qcCompare([
          [third(solve(1e-9, Math.PI / 2)), 8],
          [third(solve(Math.PI / 2, Math.PI - 1e-9)), 8],
        ]);
      },
    },
    // 3 ─ QC
    {
      id: 't3-q2h-03',
      type: 'qc',
      difficulty: 4,
      topic: 'data.combinatorics',
      info: r`Five people, $P$, $Q$, $R$, $S$, and $T$, are to be seated in a row of five chairs.`,
      quantityA: r`The number of seating arrangements in which $P$ and $Q$ are <b>not</b> seated next to each other`,
      quantityB: r`The number of seating arrangements in which $R$ is <b>not</b> seated in either end chair`,
      answer: 2,
      explanation: r`There are $5! = 120$ arrangements in all. A: treating $P$ and $Q$ as one block gives $4! = 24$ arrangements, times 2 for the order within the block, so 48 have them adjacent and $120 - 48 = 72$ do not. B: $R$ takes one of the 3 middle chairs and the others fill the remaining 4 chairs in $4! = 24$ ways, so $3 \times 24 = 72$. The quantities are equal.`,
      traps: [
        { option: 0, trap: 'calc-slip', why: r`Forgetting that the block can be $PQ$ or $QP$ gives $120 - 24 = 96$ for Quantity A.` },
        { option: 1, trap: 'calc-slip', why: r`Excluding only one end chair for $R$ gives $120 - 24 = 96$ for Quantity B.` },
      ],
      verify: () => {
        const ps = perms(['P', 'Q', 'R', 'S', 'T']);
        const a = ps.filter((p) => Math.abs(p.indexOf('P') - p.indexOf('Q')) !== 1).length;
        const b = ps.filter((p) => p.indexOf('R') !== 0 && p.indexOf('R') !== 4).length;
        return qcCompare([[a, b]]);
      },
    },
    // 4 ─ QC
    {
      id: 't3-q2h-04',
      type: 'qc',
      difficulty: 3,
      topic: 'arith.exponents-roots',
      quantityA: r`$\frac{2^{20} + 2^{18}}{2^{19} - 2^{17}}$`,
      quantityB: r`$3$`,
      answer: 0,
      explanation: r`Factor out the smallest power in each part: the numerator is $2^{18}(2^{2} + 1) = 5 \cdot 2^{18}$ and the denominator is $2^{17}(2^{2} - 1) = 3 \cdot 2^{17}$. The fraction equals $\frac{5 \cdot 2}{3} = \frac{10}{3} \approx 3.33$, which is greater than 3.`,
      traps: [
        { option: 1, trap: 'calc-slip', why: r`Dropping the extra factor of 2 from $\frac{2^{18}}{2^{17}}$ gives $\frac{5}{3}$, which is less than 3.` },
      ],
      verify: () => qcCompare([[(2 ** 20 + 2 ** 18) / (2 ** 19 - 2 ** 17), 3]]),
    },
    // 5 ─ QC
    {
      id: 't3-q2h-05',
      type: 'qc',
      difficulty: 5,
      topic: 'geo.solids',
      info: r`A right circular cylinder has radius $r$ and height $h$. The volume of the cylinder, in cubic units, is numerically equal to its total surface area (including both bases), in square units.`,
      quantityA: r`$r + h$`,
      quantityB: r`$8$`,
      answer: 3,
      explanation: r`$\pi r^{2}h = 2\pi r^{2} + 2\pi rh$ simplifies to $rh = 2r + 2h$, or $(r - 2)(h - 2) = 4$. If $r = h = 4$, then $r + h = 8$ (equal). If $r = 3$ and $h = 6$, then $r + h = 9$ (A greater). The relationship cannot be determined. (In fact $r + h \geq 8$ always, with equality only when $r = h = 4$.)`,
      traps: [
        { option: 0, trap: 'ignored-constraint', why: r`Testing only pairs such as $r = 3, h = 6$ or $r = 6, h = 3$ (sum 9) and missing the equality case $r = h = 4$.` },
      ],
      verify: () => {
        const cases: [number, number][] = [];
        for (const rad of range(2.05, 30, 0.05)) {
          // g(h) = volume - surface area; g(0) < 0, find its root in h by bisection
          const g = (h: number) => Math.PI * rad * rad * h - (2 * Math.PI * rad * rad + 2 * Math.PI * rad * h);
          let lo = 0;
          let hi = 1e5;
          if (g(hi) < 0) continue;
          for (let k = 0; k < 200; k++) {
            const mid = (lo + hi) / 2;
            if (g(mid) < 0) lo = mid;
            else hi = mid;
          }
          cases.push([rad + (lo + hi) / 2, 8]);
        }
        return qcCompare(cases);
      },
    },
    // 6 ─ PS
    {
      id: 't3-q2h-06',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'arith.integers',
      stem: r`The positive integer $k$ has exactly 6 positive divisors, and $2k$ has exactly 8 positive divisors. Which of the following could be the value of $k$?<br><i>Indicate all such values.</i>`,
      options: ['12', '18', '20', '32', '45', '50', '52'],
      answer: [0, 2, 6],
      explanation: r`Write $k = 2^{a}m$ with $m$ odd. Then $k$ has $(a + 1)d$ divisors and $2k$ has $(a + 2)d$ divisors, where $d$ is the number of divisors of $m$. From $(a + 1)d = 6$ and $(a + 2)d = 8$, subtracting gives $d = 2$ (so $m$ is an odd prime) and $a = 2$. Thus $k = 4p$ for an odd prime $p$: $12 = 4 \cdot 3$, $20 = 4 \cdot 5$, and $52 = 4 \cdot 13$. The others have 6 divisors, but their doubles have 9 (18, 50), 7 (32), or 12 (45) divisors.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`18 has 6 divisors, but $36 = 2^{2} \cdot 3^{2}$ has $3 \times 3 = 9$, not 8.` },
        { option: 3, trap: 'wrong-formula', why: r`$32 = 2^{5}$ has 6 divisors; doubling only raises the exponent to 6, giving 7 divisors.` },
      ],
      verify: () => {
        const d = (n: number) => range(1, n).filter((x) => n % x === 0).length;
        return indicesWhere([12, 18, 20, 32, 45, 50, 52], (k) => d(k) === 6 && d(2 * k) === 8);
      },
    },
    // 7 ─ PS
    {
      id: 't3-q2h-07',
      type: 'numeric',
      difficulty: 5,
      topic: 'data.probability',
      stem: 'A fair six-sided die with faces numbered 1 through 6 is rolled three times. What is the probability that the greatest of the three numbers rolled is exactly 5?<br><i>Give your answer as a fraction.</i>',
      answer: { kind: 'fraction', num: 61, den: 216 },
      explanation: r`The greatest roll is at most 5 with probability $\left(\frac{5}{6}\right)^{3} = \frac{125}{216}$, and at most 4 with probability $\left(\frac{4}{6}\right)^{3} = \frac{64}{216}$. The greatest roll is exactly 5 when it is at most 5 but not at most 4: $\frac{125 - 64}{216} = \frac{61}{216}$. (Counting only "exactly one 5" gives $\frac{48}{216}$, which misses outcomes with two or three 5s.)`,
      verify: () => {
        let n = 0;
        for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) if (Math.max(a, b, c) === 5) n++;
        return n / 216;
      },
    },
    // 8 ─ PS
    {
      id: 't3-q2h-08',
      type: 'mc-single',
      difficulty: 3,
      topic: 'geo.circles',
      stem: r`Points $A$ and $B$ lie on a circle with center $O$ and radius 6, and $\angle AOB = 120^{\circ}$. What is the area of the region bounded by chord $\overline{AB}$ and the minor arc $AB$?`,
      options: [r`$12\pi - 9\sqrt{3}$`, r`$12\pi - 18\sqrt{3}$`, r`$12\pi - 18$`, r`$24\pi - 9\sqrt{3}$`, r`$36\pi - 9\sqrt{3}$`],
      answer: 0,
      explanation: r`The sector has area $\frac{120}{360}\pi(6^{2}) = 12\pi$. In triangle $AOB$, the altitude from $O$ bisects the $120^{\circ}$ angle, forming two 30-60-90 triangles with hypotenuse 6, so the altitude is 3 and $AB = 6\sqrt{3}$. The triangle’s area is $\frac{1}{2}(6\sqrt{3})(3) = 9\sqrt{3}$, so the region’s area is $12\pi - 9\sqrt{3}$.`,
      traps: [
        { option: 2, trap: 'wrong-formula', why: r`$\frac{1}{2}(6)(6) = 18$ is the triangle’s area only when $\angle AOB = 90^{\circ}$.` },
        { option: 1, trap: 'calc-slip', why: r`Using the radius 6 instead of the altitude 3 as the triangle’s height gives $\frac{1}{2}(6\sqrt{3})(6) = 18\sqrt{3}$.` },
      ],
      verify: () => {
        // chord at distance 6cos(60) = 3 from O; integrate the circle's height above the line y = 3
        const half = Math.sqrt(36 - 9);
        const N = 20000;
        const h = (2 * half) / N;
        const f = (x: number) => Math.sqrt(Math.max(0, 36 - x * x)) - 3;
        let s = 0;
        for (let i = 0; i <= N; i++) s += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * f(-half + i * h);
        const area = (s * h) / 3;
        const pi = Math.PI, s3 = Math.sqrt(3);
        return nearest([12 * pi - 9 * s3, 12 * pi - 18 * s3, 12 * pi - 18, 24 * pi - 9 * s3, 36 * pi - 9 * s3], area);
      },
    },
    // 9 ─ PS
    {
      id: 't3-q2h-09',
      type: 'mc-multi',
      difficulty: 5,
      topic: 'alg.functions',
      stem: r`The function $f$ is defined by $f(x) = ax + b$, where $a$ and $b$ are constants, and $f(f(x)) = 9x + 8$ for all numbers $x$. Which of the following could be the value of $f(4)$?<br><i>Indicate all such values.</i>`,
      options: ['−16', '−14', '−4', '2', '14', '16'],
      answer: [0, 4],
      explanation: r`$f(f(x)) = a(ax + b) + b = a^{2}x + (a + 1)b$. Matching coefficients, $a^{2} = 9$ and $(a + 1)b = 8$. If $a = 3$, then $b = 2$ and $f(4) = 14$. If $a = -3$, then $-2b = 8$, so $b = -4$ and $f(4) = -12 - 4 = -16$. Both functions work, so $f(4)$ can be 14 or $-16$. (Checking only $a = 3$ misses the negative case.)`,
      traps: [
        { option: 5, trap: 'wrong-formula', why: r`Treating the constant term of $f(f(x))$ as $2b$ gives $b = 4$ and $f(4) = 16$; the constant term is $ab + b$, which is $4b$ when $a = 3$, so $b = 2$.` },
        { option: 2, trap: 'misread', why: r`$-4$ is the value of $b$ when $a = -3$, not $f(4)$.` },
      ],
      verify: () => {
        const vals = new Set<number>();
        for (const a of range(-10, 10, 0.5))
          for (const b of range(-20, 20, 0.5)) {
            const f = (x: number) => a * x + b;
            if ([0, 1, 2, -3].every((x) => Math.abs(f(f(x)) - (9 * x + 8)) < 1e-9)) vals.add(f(4));
          }
        return indicesWhere([-16, -14, -4, 2, 14, 16], (v) => vals.has(v));
      },
    },
    // 10 ─ DI
    {
      id: 't3-q2h-10',
      type: 'numeric',
      dataSetId: 't3-q2h-dA',
      difficulty: 3,
      topic: 'data.interpretation',
      stem: 'What percent of all the employees of Company Q hold a graduate degree?',
      suffix: '%',
      answer: { kind: 'decimal', value: 42.1 },
      explanation: r`Graduate-degree holders: $0.70(240) + 0.20(180) + 0.15(300) + 0.65(80) + 0.60(200) = 168 + 36 + 45 + 52 + 120 = 421$ of the 1,000 employees, or 42.1%. (Averaging the five department percents gives 46%, which ignores the departments’ different sizes.)`,
      verify: () => {
        const g = EMP.reduce((acc, n, i) => acc + (n * PCT_G[i]) / 100, 0);
        const all = EMP.reduce((a, b) => a + b, 0);
        return (g / all) * 100;
      },
    },
    // 11 ─ DI
    {
      id: 't3-q2h-11',
      type: 'mc-single',
      dataSetId: 't3-q2h-dA',
      difficulty: 4,
      topic: 'data.interpretation',
      stem: r`Company Q plans to hire $n$ new employees for Sales, each of whom holds a graduate degree, so that exactly 28 percent of the employees in Sales will hold a graduate degree. If no current employees leave, what is the value of $n$?`,
      options: ['8', '14', '18', '20', '24'],
      answer: 3,
      explanation: r`Sales now has $0.20 \times 180 = 36$ graduate-degree holders. After hiring, $\frac{36 + n}{180 + n} = 0.28$, so $36 + n = 50.4 + 0.28n$, $0.72n = 14.4$, and $n = 20$. Check: $\frac{56}{200} = 28\%$.`,
      traps: [
        { option: 1, trap: 'ignored-constraint', why: r`Taking 8% of the current 180 employees ($14.4 \approx 14$) ignores that the new hires also enlarge the department.` },
        { option: 0, trap: 'misread', why: '8 is the change in percentage points, not a number of employees.' },
      ],
      verify: () => {
        const i = DEPTS.indexOf('Sales');
        const g = (EMP[i] * PCT_G[i]) / 100;
        const n = range(0, 1000).find((k) => (g + k) * 100 === 28 * (EMP[i] + k)) ?? NaN;
        return indexOfValue([8, 14, 18, 20, 24], n);
      },
    },
    // 12 ─ DI
    {
      id: 't3-q2h-12',
      type: 'mc-multi',
      dataSetId: 't3-q2h-dA',
      difficulty: 5,
      topic: 'data.interpretation',
      stem: 'Based on the table, which of the following statements must be true?<br><i>Indicate all such statements.</i>',
      options: [
        'At least 12 of the female employees in Engineering hold a graduate degree.',
        'More than half of the female employees in Finance hold a graduate degree.',
        'At most 37.5 percent of the female employees in Operations hold a graduate degree.',
      ],
      answer: [0, 2],
      explanation: r`In a department with $N$ employees, $F$ of them female and $G$ with graduate degrees, the number $X$ of female graduate-degree holders satisfies $F + G - N \leq X \leq \min(F, G)$. Engineering: $F = 84$, $G = 168$, $N = 240$, so $X \geq 12$; statement 1 must be true. Finance: $F = 40$, $G = 52$, $N = 80$, so $X$ can be as small as 12, which is less than half of 40; statement 2 need not be true. Operations: $F = 120$, $G = 45$, so $X \leq 45$, and $\frac{45}{120} = 37.5\%$; statement 3 must be true.`,
      traps: [
        { option: 1, trap: 'misread', why: 'Finance’s two percents (50% and 65%) sum to more than 100%, which forces an overlap of at least 12 people, but not an overlap of more than 20.' },
      ],
      verify: () => {
        const range4 = (name: string) => {
          const i = DEPTS.indexOf(name);
          const N = EMP[i], F = (N * PCT_F[i]) / 100, G = (N * PCT_G[i]) / 100;
          return { F, xs: range(0, N).filter((x) => x <= F && x <= G && F - x + (G - x) + x <= N) };
        };
        const eng = range4('Engineering');
        const fin = range4('Finance');
        const ops = range4('Operations');
        const statements = [
          eng.xs.every((x) => x >= 12),
          fin.xs.every((x) => x > fin.F / 2),
          ops.xs.every((x) => x / ops.F <= 0.375 + 1e-12),
        ];
        return indicesWhere(statements, (s) => s);
      },
    },
    // 13 ─ PS
    {
      id: 't3-q2h-13',
      type: 'mc-single',
      difficulty: 4,
      topic: 'alg.sequences',
      stem: r`For each positive integer $n$, $t_{n} = \frac{1}{n(n + 1)}$. What is the least positive integer $k$ for which $t_{1} + t_{2} + t_{3} + \cdots + t_{k} > 0.95$?`,
      options: ['19', '20', '21', '39', '95'],
      answer: 1,
      explanation: r`Since $\frac{1}{n(n + 1)} = \frac{1}{n} - \frac{1}{n + 1}$, the sum telescopes to $1 - \frac{1}{k + 1} = \frac{k}{k + 1}$. Then $\frac{k}{k + 1} > \frac{19}{20}$ gives $20k > 19k + 19$, so $k > 19$. At $k = 19$ the sum is exactly 0.95, which is not greater than 0.95, so the least $k$ is 20.`,
      traps: [
        { option: 0, trap: 'ignored-constraint', why: r`At $k = 19$ the sum equals $\frac{19}{20} = 0.95$ exactly; the inequality is strict.` },
      ],
      verify: () => {
        // exact rational running sum p/q; stop when p/q > 19/20
        let p = 0;
        let q = 1;
        for (let n = 1; n <= 1000; n++) {
          const m = n * (n + 1);
          let np = p * m + q;
          let nq = q * m;
          const g = gcd(np, nq);
          np /= g;
          nq /= g;
          p = np;
          q = nq;
          if (20 * p > 19 * q) return indexOfValue([19, 20, 21, 39, 95], n);
        }
        return -1;
      },
    },
    // 14 ─ PS
    {
      id: 't3-q2h-14',
      type: 'numeric',
      difficulty: 4,
      topic: 'arith.percents',
      stem: 'A vendor raised the price of a product by 25 percent, and as a result the number of units sold per week fell by 36 percent. At the new price, by what percent would the number of units sold per week have to increase from its reduced level for weekly revenue to return to its original amount?',
      suffix: '%',
      answer: { kind: 'decimal', value: 25 },
      explanation: r`Revenue is price times units. After the changes, revenue is $1.25 \times 0.64 = 0.80$ of the original. To restore it at the new price, units must be multiplied by $\frac{1}{0.80} = 1.25$, an increase of 25%. (Check with numbers: price \$10 to \$12.50, units 100 to 64; restoring \$1,000 needs 80 units, and $\frac{80 - 64}{64} = 25\%$.) Answers such as 11 (from $36 - 25$) or 56.25 (restoring the original unit count) are traps.`,
      verify: () => {
        const p0 = 10, u0 = 100;
        const p1 = p0 * 1.25, u1 = u0 * (1 - 0.36);
        const uNeeded = (p0 * u0) / p1;
        return ((uNeeded - u1) / u1) * 100;
      },
    },
    // 15 ─ PS
    {
      id: 't3-q2h-15',
      type: 'mc-single',
      difficulty: 5,
      topic: 'alg.coordinate',
      stem: r`In the $xy$-plane, how many points $(x, y)$ with integer coordinates satisfy both $y \geq x^{2} - 5$ and $y \leq 3 - |x|$?`,
      options: ['19', '23', '24', '27', '29'],
      answer: 4,
      explanation: r`A column at integer $x$ contains points only if $x^{2} - 5 \leq 3 - |x|$, that is, $|x|^{2} + |x| - 8 \leq 0$, which for integers means $|x| \leq 2$. Count the integers $y$ in each column: $x = 0$: $-5 \leq y \leq 3$ (9 points); $x = \pm 1$: $-4 \leq y \leq 2$ (7 points each); $x = \pm 2$: $-1 \leq y \leq 1$ (3 points each). The total is $9 + 14 + 6 = 29$.`,
      traps: [
        { option: 0, trap: 'assumed-positive', why: r`Counting only the columns with $x \geq 0$ ($9 + 7 + 3 = 19$) ignores the symmetric columns $x = -1$ and $x = -2$.` },
        { option: 1, trap: 'calc-slip', why: r`Stopping at $|x| \leq 1$ ($9 + 14 = 23$); the curves cross at $|x| \approx 2.37$, so the columns $x = \pm 2$ still contain points.` },
      ],
      verify: () => {
        let n = 0;
        for (let x = -20; x <= 20; x++) for (let y = -40; y <= 40; y++) if (y >= x * x - 5 && y <= 3 - Math.abs(x)) n++;
        return indexOfValue([19, 23, 24, 27, 29], n);
      },
    },
  ],
};
