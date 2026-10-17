import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, combos, gcd } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// DI data (t2-q1-dA): cones sold by Frostline Creamery (thousands), by season
const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
const CONES_2023 = [16, 40, 90, 54];
const CONES_2024 = [24, 45, 120, 51];
// Summer 2024 cones by flavor (percent)
const FLAVOR = [
  { label: 'Vanilla', value: 40 },
  { label: 'Chocolate', value: 25 },
  { label: 'Strawberry', value: 20 },
  { label: 'Other', value: 15 },
];

export const set: QuestionSet = {
  testId: 't2',
  measure: 'quant',
  key: 's1',
  passages: [],
  dataSets: [
    {
      id: 't2-q1-dA',
      charts: [
        {
          kind: 'bar',
          title: 'Ice Cream Cones Sold by Frostline Creamery, by Season, 2023 and 2024 (in thousands)',
          categories: SEASONS,
          series: [
            { name: '2023', values: CONES_2023 },
            { name: '2024', values: CONES_2024 },
          ],
          xLabel: 'Season',
          yLabel: 'Thousands of cones',
          yMin: 0,
          yMax: 140,
          yStep: 20,
          showValues: true,
        },
        {
          kind: 'pie',
          title: 'Ice Cream Cones Sold by Frostline Creamery in Summer 2024, by Flavor',
          slices: FLAVOR,
          labelMode: 'percent',
        },
      ],
    },
  ],
  questions: [
    // 1 ─ QC
    {
      id: 't2-q1-01',
      type: 'qc',
      difficulty: 2,
      topic: 'arith.exponents-roots',
      quantityA: r`$\sqrt{48} + \sqrt{27}$`,
      quantityB: r`$\sqrt{147}$`,
      answer: 2,
      explanation: r`Simplify each root: $\sqrt{48} = 4\sqrt{3}$ and $\sqrt{27} = 3\sqrt{3}$, so Quantity A is $7\sqrt{3}$. Quantity B is $\sqrt{147} = \sqrt{49 \cdot 3} = 7\sqrt{3}$. The quantities are equal.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`Treating $\sqrt{48} + \sqrt{27}$ as $\sqrt{75}$, which is less than $\sqrt{147}$. Square roots do not add that way.` },
      ],
      verify: () => {
        // compare the squares: (sqrt48 + sqrt27)^2 = 48 + 27 + 2*sqrt(48*27)
        const aSq = 48 + 27 + 2 * Math.sqrt(48 * 27);
        return qcCompare([
          [Math.sqrt(48) + Math.sqrt(27), Math.sqrt(147)],
          [aSq, 147],
        ]);
      },
    },
    // 2 ─ QC
    {
      id: 't2-q1-02',
      type: 'qc',
      difficulty: 3,
      topic: 'geo.triangles',
      info: r`In triangle $JKL$, the measure of $\angle J$ is $30^{\circ}$ greater than the measure of $\angle K$, and the measure of $\angle L$ is twice the measure of $\angle K$.`,
      quantityA: r`$JK$`,
      quantityB: r`$KL$`,
      answer: 0,
      explanation: r`Let $\angle K = k$. Then $k + (k + 30) + 2k = 180$, so $k = 37.5$, giving $\angle J = 67.5^{\circ}$ and $\angle L = 75^{\circ}$. In a triangle, the longer side is opposite the larger angle. $JK$ is opposite $\angle L$ ($75^{\circ}$) and $KL$ is opposite $\angle J$ ($67.5^{\circ}$), so $JK > KL$.`,
      traps: [
        { option: 1, trap: 'misread', why: r`Pairing each side with an angle at one of its endpoints (for example, $KL$ with $\angle L$) instead of with the opposite angle.` },
        { option: 3, trap: 'd-trap', why: 'The angle conditions fix the shape of the triangle, so the ratio of any two sides is determined even though no lengths are given.' },
      ],
      verify: () => {
        let K = NaN;
        for (const k of range(0.5, 90, 0.5)) if (Math.abs(k + (k + 30) + 2 * k - 180) < 1e-9) K = k;
        const J = K + 30;
        const rad = (d: number) => (d * Math.PI) / 180;
        // place J at (0,0), K at (1,0); L is where the rays at angles J and 180-K meet
        const dJ = [Math.cos(rad(J)), Math.sin(rad(J))];
        const dK = [-Math.cos(rad(K)), Math.sin(rad(K))];
        // solve t*dJ = (1,0) + s*dK
        const det = dJ[0] * -dK[1] - -dK[0] * dJ[1];
        const t = (1 * -dK[1] - -dK[0] * 0) / det;
        const L = [t * dJ[0], t * dJ[1]];
        const JK = 1;
        const KL = Math.hypot(L[0] - 1, L[1]);
        return qcCompare([[JK, KL]]);
      },
    },
    // 3 ─ QC
    {
      id: 't2-q1-03',
      type: 'qc',
      difficulty: 3,
      topic: 'alg.inequalities-abs',
      info: r`$|x + 1| = 2|x - 2|$`,
      quantityA: r`$x$`,
      quantityB: r`$3$`,
      answer: 3,
      explanation: r`Either $x + 1 = 2(x - 2)$ or $x + 1 = -2(x - 2)$. The first gives $x = 5$; the second gives $3x = 3$, so $x = 1$. Both check: $|6| = 2|3|$ and $|2| = 2|-1|$. Since $5 > 3$ but $1 < 3$, the relationship cannot be determined.`,
      traps: [
        { option: 0, trap: 'd-trap', why: r`Dropping the absolute-value bars and solving only $x + 1 = 2(x - 2)$ gives just $x = 5$; the case $x + 1 = -2(x - 2)$ gives $x = 1$.` },
      ],
      verify: () => {
        const sols = range(-50, 50, 0.25).filter((x) => Math.abs(Math.abs(x + 1) - 2 * Math.abs(x - 2)) < 1e-12);
        return qcCompare(sols.map((x) => [x, 3] as [number, number]));
      },
    },
    // 4 ─ QC
    {
      id: 't2-q1-04',
      type: 'qc',
      difficulty: 4,
      topic: 'data.statistics',
      info: 'The average (arithmetic mean) of seven different positive integers is 20.',
      quantityA: 'The greatest possible value of the median of the seven integers',
      quantityB: '33',
      answer: 1,
      explanation: r`The sum is $7 \cdot 20 = 140$. To make the median $m$ (the 4th integer) as large as possible, make the other six as small as the conditions allow: the three smallest are 1, 2, and 3, and the three largest are $m + 1$, $m + 2$, and $m + 3$. Then $6 + m + (3m + 6) = 140$, so $4m = 128$ and $m = 32$. Check: $1, 2, 3, 32, 33, 34, 35$ has sum 140. The greatest possible median is 32, which is less than 33.`,
      traps: [
        { option: 0, trap: 'ignored-constraint', why: r`If repeated values were allowed, the list $1, 1, 2, 34, 34, 34, 34$ (sum 140) would give a median of 34 — but the integers must be different.` },
      ],
      verify: () => {
        // depth-first search over all strictly increasing 7-tuples of positive integers with sum 140
        let best = 0;
        const pick = (count: number, prev: number, left: number, fourth: number) => {
          if (count === 7) {
            if (left === 0) best = Math.max(best, fourth);
            return;
          }
          const k = 7 - count; // values still to choose, each larger than the previous one
          for (let v = prev + 1; k * v + (k * (k - 1)) / 2 <= left; v++) {
            if (count === 6 && v !== left) continue;
            pick(count + 1, v, left - v, count === 3 ? v : fourth);
          }
        };
        pick(0, 0, 140, 0);
        return qcCompare([[best, 33]]);
      },
    },
    // 5 ─ PS
    {
      id: 't2-q1-05',
      type: 'mc-single',
      difficulty: 1,
      topic: 'arith.percents',
      stem: 'A community garden harvested 240 kilograms of tomatoes and donated 35 percent of the harvest to a food bank. How many kilograms of the harvest were NOT donated?',
      options: ['84', '96', '120', '144', '156'],
      answer: 4,
      explanation: r`The part not donated is $100\% - 35\% = 65\%$ of the harvest: $0.65 \times 240 = 156$ kilograms.`,
      traps: [
        { option: 0, trap: 'misread', why: r`$84 = 0.35 \times 240$ is the amount that WAS donated.` },
      ],
      verify: () => indexOfValue([84, 96, 120, 144, 156], 240 - (240 * 35) / 100),
    },
    // 6 ─ PS numeric
    {
      id: 't2-q1-06',
      type: 'numeric',
      difficulty: 3,
      topic: 'alg.word-problems',
      stem: 'On highways, a delivery van travels 18 miles per gallon of fuel; in city driving, it travels 12 miles per gallon. One day the van traveled a total of 270 miles and used exactly 17 gallons of fuel. How many of the 270 miles were city driving?',
      suffix: 'miles',
      answer: { kind: 'decimal', value: 72 },
      explanation: r`Let $c$ be the city miles, so $270 - c$ are highway miles. Fuel: $\frac{270 - c}{18} + \frac{c}{12} = 17$. Multiply by 36: $2(270 - c) + 3c = 612$, so $540 + c = 612$ and $c = 72$. Check: $198 \div 18 = 11$ gallons and $72 \div 12 = 6$ gallons, for 17 in all. (Entering 198 answers for highway miles instead.)`,
      verify: () => {
        for (let c = 0; c <= 270; c++) if (Math.abs((270 - c) / 18 + c / 12 - 17) < 1e-9) return c;
        return NaN;
      },
    },
    // 7 ─ PS multi
    {
      id: 't2-q1-07',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'arith.integers',
      stem: r`The product of the positive integers $p$ and $q$ is 360, and the greatest common divisor of $p$ and $q$ is 6. Which of the following could be the value of $p + q$?<br><i>Indicate all such values.</i>`,
      options: ['38', '39', '42', '46', '66', '77'],
      answer: [2, 4],
      explanation: r`Write $p = 6a$ and $q = 6b$, where $a$ and $b$ have no common factor greater than 1. Then $36ab = 360$, so $ab = 10$, and the coprime pairs are $\{1, 10\}$ and $\{2, 5\}$. These give $\{p, q\} = \{6, 60\}$ (sum 66) or $\{12, 30\}$ (sum 42). Other factor pairs of 360, such as $18 \times 20$ (gcd 2), $15 \times 24$ (gcd 3), $10 \times 36$ (gcd 2), and $5 \times 72$ (gcd 1), break the gcd condition.`,
      traps: [
        { option: 0, trap: 'ignored-constraint', why: r`$18 \times 20 = 360$, but $\gcd(18, 20) = 2$, not 6.` },
        { option: 1, trap: 'ignored-constraint', why: r`$15 \times 24 = 360$, but $\gcd(15, 24) = 3$, not 6.` },
      ],
      verify: () => {
        const sums = new Set<number>();
        for (let p = 1; p <= 360; p++) {
          if (360 % p !== 0) continue;
          const q = 360 / p;
          if (gcd(p, q) === 6) sums.add(p + q);
        }
        return indicesWhere([38, 39, 42, 46, 66, 77], (s) => sums.has(s));
      },
    },
    // 8 ─ PS geometry
    {
      id: 't2-q1-08',
      type: 'mc-single',
      difficulty: 3,
      topic: 'geo.circles',
      stem: r`In the figure above, points $A$, $B$, and $C$ lie on the circle with center $O$, the radius of the circle is 6, and the measure of $\angle ACB$ is $35^{\circ}$. What is the length of minor arc $AB$?`,
      figure: {
        kind: 'svg',
        svg: '<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg"><circle cx="240" cy="160" r="120" fill="none" stroke="black" stroke-width="2"/><line x1="198.96" y1="47.24" x2="171.17" y2="258.3" stroke="black" stroke-width="2"/><line x1="198.96" y1="47.24" x2="308.83" y2="258.3" stroke="black" stroke-width="2"/><circle cx="240" cy="160" r="3" fill="black" stroke="black"/><text x="148" y="284" font-size="14" font-style="italic">A</text><text x="316" y="284" font-size="14" font-style="italic">B</text><text x="188" y="38" font-size="14" font-style="italic">C</text><text x="222" y="166" font-size="14" font-style="italic">O</text><text x="211" y="126" font-size="14" text-anchor="middle">35°</text></svg>',
      },
      options: [r`$\frac{7\pi}{6}$`, r`$\frac{7\pi}{3}$`, r`$\frac{7\pi}{2}$`, r`$\frac{14\pi}{3}$`, r`$\frac{29\pi}{3}$`],
      answer: 1,
      explanation: r`An inscribed angle is half the central angle that intercepts the same arc, so $\angle AOB = 2 \times 35^{\circ} = 70^{\circ}$. The minor arc is $\frac{70}{360}$ of the circumference: $\frac{70}{360} \times 2\pi(6) = \frac{7}{36} \times 12\pi = \frac{7\pi}{3}$.`,
      traps: [
        { option: 0, trap: 'wrong-formula', why: r`Using $35^{\circ}$ as the central angle gives $\frac{35}{360} \times 12\pi = \frac{7\pi}{6}$; the central angle is twice the inscribed angle.` },
        { option: 4, trap: 'misread', why: r`$\frac{29\pi}{3}$ is the major arc ($290^{\circ}$), not the minor arc.` },
      ],
      verify: () => {
        // find the central angle t (radians) for which the inscribed angle at a point C on the major arc is 35 degrees
        const R = 6;
        const inscribed = (t: number) => {
          const A = [R * Math.cos(-t / 2), R * Math.sin(-t / 2)];
          const B = [R * Math.cos(t / 2), R * Math.sin(t / 2)];
          const C = [R * Math.cos(Math.PI + 0.4), R * Math.sin(Math.PI + 0.4)];
          const u = [A[0] - C[0], A[1] - C[1]];
          const v = [B[0] - C[0], B[1] - C[1]];
          return (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]))) * 180) / Math.PI;
        };
        let lo = 0.01, hi = 3;
        for (let i = 0; i < 200; i++) {
          const mid = (lo + hi) / 2;
          if (inscribed(mid) < 35) lo = mid;
          else hi = mid;
        }
        const arc = R * lo;
        return indexOfValue([7 * Math.PI / 6, 7 * Math.PI / 3, 7 * Math.PI / 2, 14 * Math.PI / 3, 29 * Math.PI / 3], arc, 1e-7);
      },
    },
    // 9 ─ DI
    {
      id: 't2-q1-09',
      type: 'mc-single',
      dataSetId: 't2-q1-dA',
      difficulty: 2,
      topic: 'data.interpretation',
      stem: 'How many thousand chocolate cones did Frostline Creamery sell in summer 2024?',
      options: ['18', '22.5', '24', '30', '48'],
      answer: 3,
      explanation: r`The bar graph shows 120 thousand cones sold in summer 2024, and the circle graph shows that 25% of them were chocolate. $0.25 \times 120 = 30$ thousand.`,
      traps: [
        { option: 1, trap: 'misread', why: r`$22.5 = 0.25 \times 90$ uses the 2023 summer bar instead of the 2024 bar.` },
        { option: 2, trap: 'misread', why: r`$24 = 0.20 \times 120$ uses the strawberry slice, not the chocolate slice.` },
      ],
      verify: () => {
        const summer = CONES_2024[SEASONS.indexOf('Summer')];
        const choc = FLAVOR.find((a) => a.label === 'Chocolate')!.value / FLAVOR.reduce((s, a) => s + a.value, 0);
        return indexOfValue([18, 22.5, 24, 30, 48], summer * choc);
      },
    },
    // 10 ─ DI numeric
    {
      id: 't2-q1-10',
      type: 'numeric',
      dataSetId: 't2-q1-dA',
      difficulty: 3,
      topic: 'data.interpretation',
      stem: 'The strawberry cones that Frostline Creamery sold in summer 2024 made up what percent of all the cones it sold in 2024?',
      suffix: '%',
      answer: { kind: 'decimal', value: 10 },
      explanation: r`Strawberry cones in summer 2024: $0.20 \times 120 = 24$ thousand. Total cones in 2024: $24 + 45 + 120 + 51 = 240$ thousand. $\frac{24}{240} = 10\%$. (Answering 20 gives the percent of summer 2024 cones only, not of all 2024 cones.)`,
      verify: () => {
        const total = CONES_2024.reduce((s, v) => s + v, 0);
        const summer = CONES_2024[SEASONS.indexOf('Summer')];
        const straw = FLAVOR.find((a) => a.label === 'Strawberry')!.value / 100;
        return ((summer * straw) / total) * 100;
      },
    },
    // 11 ─ PS coordinate
    {
      id: 't2-q1-11',
      type: 'mc-single',
      difficulty: 3,
      topic: 'alg.coordinate',
      stem: r`In the $xy$-plane, the lines $y = 2x + 3$ and $y = -x + 9$ intersect at point $P$. What is the area of the triangle whose vertices are $P$ and the $x$-intercepts of the two lines?`,
      options: ['21', '31.5', '36.75', '42', '73.5'],
      answer: 2,
      explanation: r`Setting $2x + 3 = -x + 9$ gives $x = 2$, so $P = (2, 7)$. The $x$-intercepts are $x = -\frac{3}{2}$ (first line) and $x = 9$ (second line), so the base along the $x$-axis is $9 - (-1.5) = 10.5$. The height is the $y$-coordinate of $P$, 7. Area $= \frac{1}{2}(10.5)(7) = 36.75$.`,
      traps: [
        { option: 4, trap: 'wrong-formula', why: r`$73.5 = 10.5 \times 7$ forgets the factor $\frac{1}{2}$.` },
        { option: 1, trap: 'calc-slip', why: r`$31.5 = \frac{1}{2}(9)(7)$ measures the base from the origin to 9, ignoring that the first line crosses the $x$-axis at $-1.5$.` },
      ],
      verify: () => {
        const f = (x: number) => 2 * x + 3;
        const g = (x: number) => -x + 9;
        // intersection by bisection on f - g
        let lo = -100, hi = 100;
        for (let i = 0; i < 200; i++) {
          const m = (lo + hi) / 2;
          if (f(m) - g(m) < 0) lo = m;
          else hi = m;
        }
        const P = [lo, f(lo)];
        const x1 = -3 / 2, x2 = 9; // roots of f and g
        const pts = [P, [x1, f(x1)], [x2, g(x2)]];
        const area = Math.abs(
          pts[0][0] * (pts[1][1] - pts[2][1]) + pts[1][0] * (pts[2][1] - pts[0][1]) + pts[2][0] * (pts[0][1] - pts[1][1]),
        ) / 2;
        return indexOfValue([21, 31.5, 36.75, 42, 73.5], area, 1e-7);
      },
    },
    // 12 ─ PS numeric (hard)
    {
      id: 't2-q1-12',
      type: 'numeric',
      difficulty: 5,
      topic: 'data.combinatorics',
      stem: 'A design team of 4 people will be chosen from a group of 5 engineers and 4 graphic designers. The team must include at least one graphic designer, and two of the engineers, Kai and Lena, refuse to serve on the same team. How many different teams are possible?',
      answer: { kind: 'decimal', value: 103 },
      explanation: r`Teams with at least one designer: $\binom{9}{4} - \binom{5}{4} = 126 - 5 = 121$. From these, remove teams containing both Kai and Lena: the other 2 members come from the remaining 3 engineers and 4 designers but cannot both be engineers, giving $\binom{7}{2} - \binom{3}{2} = 21 - 3 = 18$. Answer: $121 - 18 = 103$. The common error is to subtract all $\binom{7}{2} = 21$ Kai-and-Lena teams, getting 100; the 3 such teams with no designer were already removed.`,
      verify: () => {
        const people = ['Kai', 'Lena', 'E3', 'E4', 'E5', 'D1', 'D2', 'D3', 'D4'];
        return combos(people, 4).filter(
          (t) => t.some((p) => p.startsWith('D')) && !(t.includes('Kai') && t.includes('Lena')),
        ).length;
      },
    },
  ],
};
