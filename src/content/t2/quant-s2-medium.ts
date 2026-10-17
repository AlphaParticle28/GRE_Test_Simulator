import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, round } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// DI data (t2-q2m-dA): freight shipped by Corvane Rail, by commodity (percent of total)
const COMMODITIES = ['Grain', 'Coal', 'Lumber', 'Chemicals', 'Other'];
const TOTAL_2020 = 800; // thousand tons
const TOTAL_2024 = 1200; // thousand tons
const PCT_2020 = [30, 35, 15, 10, 10];
const PCT_2024 = [28, 20, 17, 20, 15];
const tons = (pct: number[], total: number) => pct.map((p) => (p * total) / 100);

export const set: QuestionSet = {
  testId: 't2',
  measure: 'quant',
  key: 's2-medium',
  passages: [],
  dataSets: [
    {
      id: 't2-q2m-dA',
      charts: [
        {
          kind: 'pie',
          title: 'Freight Shipped by Corvane Rail in 2020, by Commodity (Total: 800 thousand tons)',
          slices: COMMODITIES.map((label, i) => ({ label, value: PCT_2020[i] })),
          labelMode: 'percent',
        },
        {
          kind: 'pie',
          title: 'Freight Shipped by Corvane Rail in 2024, by Commodity (Total: 1,200 thousand tons)',
          slices: COMMODITIES.map((label, i) => ({ label, value: PCT_2024[i] })),
          labelMode: 'percent',
        },
      ],
    },
  ],
  questions: [
    // 1 ─ QC
    {
      id: 't2-q2m-01',
      type: 'qc',
      difficulty: 3,
      topic: 'arith.exponents-roots',
      quantityA: r`$3^{20} - 3^{18}$`,
      quantityB: r`$8 \cdot 3^{18}$`,
      answer: 2,
      explanation: r`Factor out the smaller power: $3^{20} - 3^{18} = 3^{18}(3^{2} - 1) = 3^{18} \cdot 8$. The quantities are equal.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`Subtracting exponents ($3^{20} - 3^{18} = 3^{2} = 9$) — exponents subtract only when powers are divided, not subtracted.` },
      ],
      verify: () => {
        const big = (b: bigint, e: bigint) => b ** e;
        const A = big(3n, 20n) - big(3n, 18n);
        const B = 8n * big(3n, 18n);
        return A === B ? 2 : A > B ? 0 : 1;
      },
    },
    // 2 ─ QC
    {
      id: 't2-q2m-02',
      type: 'qc',
      difficulty: 3,
      topic: 'geo.circles',
      info: r`In a circle with radius 5, $\overline{AB}$ is a diameter, and $C$ is a point on the circle such that $AC = 7$.`,
      quantityA: r`$BC$`,
      quantityB: '7',
      answer: 0,
      explanation: r`An angle inscribed in a semicircle is a right angle, so $\angle ACB = 90^{\circ}$ and $AB = 10$ is the hypotenuse. Then $BC = \sqrt{10^{2} - 7^{2}} = \sqrt{51}$, and $\sqrt{51} > \sqrt{49} = 7$.`,
      traps: [
        { option: 3, trap: 'd-trap', why: r`It may seem that $C$ could be anywhere, but $AC = 7$ and the right angle at $C$ fix $BC$ at $\sqrt{51}$.` },
        { option: 2, trap: 'calc-slip', why: r`Assuming a 7-7-10 isosceles triangle; with a right angle at $C$, the legs are $7$ and $\sqrt{51}$, not equal.` },
      ],
      verify: () => {
        const cases: Array<[number, number]> = [];
        for (const sign of [1, -1]) {
          // C = (5cos t, 5 sin t), A = (-5, 0), B = (5, 0); find t in (0, pi) with AC = 7
          const AC = (t: number) => Math.hypot(5 * Math.cos(t) + 5, sign * 5 * Math.sin(t));
          let lo = 0, hi = Math.PI;
          for (let i = 0; i < 200; i++) {
            const m = (lo + hi) / 2;
            if (AC(m) > 7) lo = m;
            else hi = m;
          }
          const C = [5 * Math.cos(lo), sign * 5 * Math.sin(lo)];
          cases.push([Math.hypot(C[0] - 5, C[1]), 7]);
        }
        return qcCompare(cases);
      },
    },
    // 3 ─ QC
    {
      id: 't2-q2m-03',
      type: 'qc',
      difficulty: 4,
      topic: 'alg.quadratics',
      info: r`$k$ is a constant, and the equation $x^{2} + kx + 16 = 0$ has exactly one real solution.`,
      quantityA: r`$k$`,
      quantityB: '6',
      answer: 3,
      explanation: r`A quadratic has exactly one real solution when it is a perfect square (its discriminant $k^{2} - 64$ is 0). Both $(x + 4)^{2} = x^{2} + 8x + 16$ and $(x - 4)^{2} = x^{2} - 8x + 16$ work, so $k = 8$ or $k = -8$. Since $8 > 6$ but $-8 < 6$, the relationship cannot be determined.`,
      traps: [
        { option: 0, trap: 'assumed-positive', why: r`Finding only $k = 8$ from $(x + 4)^{2}$ and missing $k = -8$ from $(x - 4)^{2}$.` },
      ],
      verify: () => {
        const ks: number[] = [];
        for (const k of range(-30, 30, 0.25)) {
          // count distinct real roots of x^2 + kx + 16 by scanning sign changes / touching
          const disc = k * k - 64;
          const roots = disc > 0 ? 2 : disc === 0 ? 1 : 0;
          if (roots === 1) ks.push(k);
        }
        return qcCompare(ks.map((k) => [k, 6] as [number, number]));
      },
    },
    // 4 ─ QC
    {
      id: 't2-q2m-04',
      type: 'qc',
      difficulty: 3,
      topic: 'data.probability',
      quantityA: 'The probability of getting exactly 3 heads when a fair coin is tossed 6 times',
      quantityB: 'The probability of getting exactly 2 heads when a fair coin is tossed 4 times',
      answer: 1,
      explanation: r`Quantity A: $\binom{6}{3}\left(\frac{1}{2}\right)^{6} = \frac{20}{64} = \frac{5}{16}$. Quantity B: $\binom{4}{2}\left(\frac{1}{2}\right)^{4} = \frac{6}{16}$. Since $\frac{6}{16} > \frac{5}{16}$, Quantity B is greater. With more tosses, the outcomes are spread over more possibilities, so an exact even split becomes less likely.`,
      traps: [
        { option: 2, trap: 'wrong-formula', why: 'Assuming that “half heads” has the same probability regardless of the number of tosses.' },
      ],
      verify: () => {
        const p = (n: number, k: number) => {
          let c = 0;
          for (let m = 0; m < 2 ** n; m++) if (m.toString(2).split('').filter((d) => d === '1').length === k) c++;
          return c / 2 ** n;
        };
        return qcCompare([[p(6, 3), p(4, 2)]]);
      },
    },
    // 5 ─ QC
    {
      id: 't2-q2m-05',
      type: 'qc',
      difficulty: 4,
      topic: 'arith.integers',
      info: r`$x$ is a positive integer, and the units digit of $7^{x}$ is 3.`,
      quantityA: r`The remainder when $x$ is divided by 8`,
      quantityB: '5',
      answer: 3,
      explanation: r`The units digits of $7^{1}, 7^{2}, 7^{3}, 7^{4}, \ldots$ repeat in the cycle $7, 9, 3, 1$. The units digit is 3 exactly when $x$ is 3 more than a multiple of 4: $x = 3, 7, 11, 15, \ldots$. Divided by 8, these leave remainders $3, 7, 3, 7, \ldots$. If $x = 3$, B is greater; if $x = 7$, A is greater. The relationship cannot be determined.`,
      traps: [
        { option: 1, trap: 'd-trap', why: r`Testing only the smallest value, $x = 3$ (remainder 3), misses $x = 7$ (remainder 7). The cycle has length 4, not 8.` },
      ],
      verify: () => {
        const cases: Array<[number, number]> = [];
        for (let x = 1; x <= 400; x++) {
          let u = 1;
          for (let i = 0; i < x; i++) u = (u * 7) % 10;
          if (u === 3) cases.push([x % 8, 5]);
        }
        return qcCompare(cases);
      },
    },
    // 6 ─ PS numeric (fraction)
    {
      id: 't2-q2m-06',
      type: 'numeric',
      difficulty: 2,
      topic: 'arith.fractions-decimals',
      stem: r`A carpenter cuts a board into three pieces. The first piece is $\frac{2}{5}$ of the length of the board, and the second piece is $\frac{3}{4}$ of the length that remains after the first piece is cut off. The third piece is the rest of the board. What fraction of the length of the original board is the third piece?<br><i>Give your answer as a fraction.</i>`,
      answer: { kind: 'fraction', num: 3, den: 20 },
      explanation: r`After the first piece, $1 - \frac{2}{5} = \frac{3}{5}$ of the board remains. The second piece is $\frac{3}{4} \times \frac{3}{5} = \frac{9}{20}$ of the board. The third piece is $\frac{3}{5} - \frac{9}{20} = \frac{12}{20} - \frac{9}{20} = \frac{3}{20}$. (Equivalently, the third piece is $\frac{1}{4}$ of the remaining $\frac{3}{5}$.)`,
      verify: () => {
        const board = 200; // any length works; use 200 cm
        const first = (2 / 5) * board;
        const remaining = board - first;
        const second = (3 / 4) * remaining;
        return (board - first - second) / board;
      },
    },
    // 7 ─ PS sequences
    {
      id: 't2-q2m-07',
      type: 'mc-single',
      difficulty: 3,
      topic: 'alg.sequences',
      stem: 'In an arithmetic sequence, the 4th term is 17 and the 11th term is 52. What is the sum of the first 15 terms of the sequence?',
      options: ['480', '555', '600', '630', '1,110'],
      answer: 1,
      explanation: r`From the 4th term to the 11th term there are 7 steps, so the common difference is $\frac{52 - 17}{7} = 5$. The first term is $17 - 3(5) = 2$, and the 15th term is $2 + 14(5) = 72$. The sum is $\frac{15(2 + 72)}{2} = 15 \times 37 = 555$.`,
      traps: [
        { option: 0, trap: 'calc-slip', why: r`Taking the first term as $17 - 4(5) = -3$ (an off-by-one error) gives a 15th term of 67 and a sum of $\frac{15(-3 + 67)}{2} = 480$.` },
        { option: 4, trap: 'wrong-formula', why: r`$1{,}110 = 15(2 + 72)$ forgets to divide by 2.` },
      ],
      verify: () => {
        // brute force over first term and common difference
        for (let a = -100; a <= 100; a++)
          for (let d = -20; d <= 20; d++) {
            const term = (n: number) => a + (n - 1) * d;
            if (term(4) === 17 && term(11) === 52) {
              let s = 0;
              for (let n = 1; n <= 15; n++) s += term(n);
              return indexOfValue([480, 555, 600, 630, 1110], s);
            }
          }
        return -1;
      },
    },
    // 8 ─ PS multi
    {
      id: 't2-q2m-08',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'geo.triangles',
      stem: r`In triangle $XYZ$, $XY = 9$, $YZ = 4$, and $\angle XYZ$ is obtuse. Which of the following could be the perimeter of triangle $XYZ$?<br><i>Indicate all such values.</i>`,
      options: ['18', '21', '22.5', '23.5', '25', '26'],
      answer: [3, 4],
      explanation: r`Because $\angle Y$ is obtuse, the side opposite it satisfies $XZ^{2} > 9^{2} + 4^{2} = 97$, so $XZ > \sqrt{97} \approx 9.85$. The triangle inequality gives $XZ < 9 + 4 = 13$. So the perimeter $13 + XZ$ is strictly between about 22.85 and 26. Only 23.5 ($XZ = 10.5$) and 25 ($XZ = 12$) qualify.`,
      traps: [
        { option: 2, trap: 'ignored-constraint', why: r`A perimeter of 22.5 means $XZ = 9.5$, which satisfies the triangle inequality, but $9.5^{2} = 90.25 < 97$, so $\angle Y$ would be acute.` },
        { option: 5, trap: 'ignored-constraint', why: r`A perimeter of 26 means $XZ = 13 = 9 + 4$, a degenerate “triangle.”` },
      ],
      verify: () => {
        // Y at origin, X = (9, 0), Z = 4(cos t, sin t); angle Y obtuse means 90 deg < t < 180 deg
        const xz = (tDeg: number) => {
          const t = (tDeg * Math.PI) / 180;
          return Math.hypot(4 * Math.cos(t) - 9, 4 * Math.sin(t));
        };
        const lo = xz(90), hi = xz(180); // XZ increases with t; endpoints excluded
        return indicesWhere([18, 21, 22.5, 23.5, 25, 26], (p) => p - 13 > lo + 1e-12 && p - 13 < hi - 1e-12);
      },
    },
    // 9 ─ PS word problem (work)
    {
      id: 't2-q2m-09',
      type: 'mc-single',
      difficulty: 3,
      topic: 'alg.word-problems',
      stem: 'Working together at their respective constant rates, Ines and Theo can grade a stack of exams in 3 hours. Working alone, Ines can grade the stack in 5 hours. Theo begins grading the stack alone, and after 2 hours Ines joins him, and they finish the stack together. How many hours after Theo began is the grading finished?',
      options: ['2.2', '3.8', '4.2', '4.5', '5.2'],
      answer: 2,
      explanation: r`Theo’s rate is $\frac{1}{3} - \frac{1}{5} = \frac{2}{15}$ of the stack per hour. In his first 2 hours he grades $\frac{4}{15}$, leaving $\frac{11}{15}$. Together they grade $\frac{1}{3}$ per hour, so the rest takes $\frac{11}{15} \div \frac{1}{3} = \frac{11}{5} = 2.2$ hours. Total: $2 + 2.2 = 4.2$ hours.`,
      traps: [
        { option: 0, trap: 'misread', why: '2.2 hours is only the time after Ines joins; the question asks for the time from when Theo began.' },
        { option: 1, trap: 'wrong-formula', why: r`Giving Theo Ines’s rate of $\frac{1}{5}$ per hour leads to $2 + 1.8 = 3.8$.` },
      ],
      verify: () => {
        const together = 1 / 3, theo = 1 / 3 - 1 / 5;
        let t = 0, done = 0;
        const dt = 1e-5;
        while (done < 1 - 1e-12) {
          done += (t < 2 - 1e-12 ? theo : together) * dt;
          t += dt;
        }
        return indexOfValue([2.2, 3.8, 4.2, 4.5, 5.2], round(t, 2));
      },
    },
    // 10 ─ DI
    {
      id: 't2-q2m-10',
      type: 'mc-single',
      dataSetId: 't2-q2m-dA',
      difficulty: 2,
      topic: 'data.interpretation',
      stem: 'How many more thousand tons of grain did Corvane Rail ship in 2024 than in 2020?',
      options: ['96', '112', '120', '128', '144'],
      answer: 0,
      explanation: r`Grain in 2020: $0.30 \times 800 = 240$ thousand tons. Grain in 2024: $0.28 \times 1{,}200 = 336$ thousand tons. Difference: $336 - 240 = 96$ thousand tons.`,
      traps: [
        { option: 2, trap: 'wrong-formula', why: r`$120 = 0.30 \times 400$ applies a percent to the change in the total instead of computing each year’s grain tonnage.` },
      ],
      verify: () => {
        const g = COMMODITIES.indexOf('Grain');
        return indexOfValue([96, 112, 120, 128, 144], tons(PCT_2024, TOTAL_2024)[g] - tons(PCT_2020, TOTAL_2020)[g]);
      },
    },
    // 11 ─ DI multi
    {
      id: 't2-q2m-11',
      type: 'mc-multi',
      dataSetId: 't2-q2m-dA',
      difficulty: 3,
      topic: 'data.interpretation',
      stem: 'For which of the following commodities was the tonnage that Corvane Rail shipped in 2024 greater than the tonnage it shipped in 2020?<br><i>Indicate all such commodities.</i>',
      options: ['Grain', 'Coal', 'Lumber', 'Chemicals', 'Other'],
      answer: [0, 2, 3, 4],
      explanation: r`Convert percents to tonnage (thousand tons). 2020: Grain 240, Coal 280, Lumber 120, Chemicals 80, Other 80. 2024: Grain 336, Coal 240, Lumber 204, Chemicals 240, Other 180. Every commodity except coal increased. Grain is the tempting one to leave out: its share fell from 30% to 28%, but because the total grew by 50%, its tonnage still rose.`,
      traps: [
        { option: 1, trap: 'misread', why: r`The total grew, but coal’s share fell from 35% to 20%: $0.20 \times 1{,}200 = 240$ is less than $0.35 \times 800 = 280$.` },
      ],
      verify: () => {
        const t20 = tons(PCT_2020, TOTAL_2020), t24 = tons(PCT_2024, TOTAL_2024);
        return indicesWhere(['Grain', 'Coal', 'Lumber', 'Chemicals', 'Other'], (c) => {
          const i = COMMODITIES.indexOf(c);
          return t24[i] > t20[i];
        });
      },
    },
    // 12 ─ DI numeric
    {
      id: 't2-q2m-12',
      type: 'numeric',
      dataSetId: 't2-q2m-dA',
      difficulty: 4,
      topic: 'data.interpretation',
      stem: 'Suppose that in 2025 Corvane Rail ships the same tonnage of each commodity other than coal as it did in 2024, and that coal makes up exactly 25 percent of the company’s total 2025 tonnage. How many thousand tons of coal does the company ship in 2025?',
      suffix: 'thousand tons',
      answer: { kind: 'decimal', value: 320 },
      explanation: r`In 2024, the non-coal commodities totaled $80\%$ of $1{,}200 = 960$ thousand tons, and they stay at 960 in 2025. If coal is $c$, then $\frac{c}{c + 960} = \frac{1}{4}$, so $4c = c + 960$ and $c = 320$ thousand tons. (Taking 25% of 1,200 gives 300, but the 2025 total is not 1,200 once coal changes.)`,
      verify: () => {
        const ci = COMMODITIES.indexOf('Coal');
        const others = tons(PCT_2024, TOTAL_2024).reduce((s, v, i) => (i === ci ? s : s + v), 0);
        for (let c = 0; c <= 5000; c++) if (Math.abs(c / (c + others) - 0.25) < 1e-12) return c;
        return NaN;
      },
    },
    // 13 ─ PS numeric distributions
    {
      id: 't2-q2m-13',
      type: 'numeric',
      difficulty: 3,
      topic: 'data.distributions',
      stem: 'The volumes of juice that a machine puts into bottles are approximately normally distributed with a mean of 500 milliliters. About 16 percent of the bottles contain more than 512 milliliters. Assuming that about 68 percent of the volumes lie within 1 standard deviation of the mean and about 95 percent lie within 2 standard deviations of the mean, approximately what percent of the bottles contain less than 476 milliliters?',
      suffix: '%',
      answer: { kind: 'decimal', value: 2.5 },
      explanation: r`Outside 1 standard deviation lies $100\% - 68\% = 32\%$, half of it in each tail, so 16% of the volumes are more than 1 SD above the mean. Thus $512 = 500 + 1\text{ SD}$ and the SD is 12. Then $476 = 500 - 2(12)$ is 2 SDs below the mean, and the lower tail beyond 2 SDs holds $\frac{100\% - 95\%}{2} = 2.5\%$. (Answering 16 or 5 confuses one tail with the other or with both tails.)`,
      verify: () => {
        const mu = 500;
        // upper/lower tail beyond k SDs, from the stated 68/95 rule
        const tail = (k: number) => (k === 1 ? (100 - 68) / 2 : k === 2 ? (100 - 95) / 2 : NaN);
        // find the SD that puts 512 at the point with a 16% upper tail
        let sd = NaN;
        for (const s of range(0.5, 50, 0.5)) if (tail((512 - mu) / s) === 16) sd = s;
        return tail((mu - 476) / sd);
      },
    },
    // 14 ─ PS functions
    {
      id: 't2-q2m-14',
      type: 'mc-single',
      difficulty: 2,
      topic: 'alg.functions',
      stem: r`If $f(x) = 3x^{2} + 2x$ and $g(x) = 1 - x$ for all numbers $x$, what is the value of $f(g(4))$?`,
      options: [r`$-55$`, r`$-33$`, r`$-21$`, r`$-3$`, r`$21$`],
      answer: 4,
      explanation: r`Work from the inside out: $g(4) = 1 - 4 = -3$. Then $f(-3) = 3(-3)^{2} + 2(-3) = 27 - 6 = 21$.`,
      traps: [
        { option: 0, trap: 'misread', why: r`$-55 = g(f(4)) = 1 - 56$ applies the functions in the wrong order.` },
        { option: 1, trap: 'calc-slip', why: r`$-33$ comes from treating $(-3)^{2}$ as $-9$; the square of a negative number is positive.` },
      ],
      verify: () => {
        const f = (x: number) => 3 * x * x + 2 * x;
        const g = (x: number) => 1 - x;
        return indexOfValue([-55, -33, -21, -3, 21], f(g(4)));
      },
    },
    // 15 ─ PS combinatorics
    {
      id: 't2-q2m-15',
      type: 'mc-single',
      difficulty: 4,
      topic: 'data.combinatorics',
      stem: 'Seven runners, including Mia and Noor, compete in a race in which gold, silver, and bronze medals are awarded to the first three finishers, with no ties. In how many of the possible ways of awarding the three medals does exactly one of Mia and Noor receive a medal?',
      options: ['30', '60', '90', '120', '150'],
      answer: 3,
      explanation: r`Suppose Mia medals and Noor does not: choose Mia’s medal (3 ways), then fill the other two medals in order from the 5 runners other than Mia and Noor ($5 \times 4 = 20$ ways), for 60. The same count holds with Noor in place of Mia, so the total is $60 + 60 = 120$. (Check: of the $7 \cdot 6 \cdot 5 = 210$ outcomes, $5 \cdot 4 \cdot 3 = 60$ have neither and $3 \cdot 2 \cdot 5 = 30$ have both; $210 - 60 - 30 = 120$.)`,
      traps: [
        { option: 4, trap: 'misread', why: r`$150 = 210 - 60$ counts outcomes in which at least one of them medals, including the 30 in which both do.` },
        { option: 1, trap: 'calc-slip', why: '60 counts only the outcomes in which Mia (but not Noor) medals.' },
      ],
      verify: () => {
        let count = 0;
        for (let g = 0; g < 7; g++)
          for (let s = 0; s < 7; s++)
            for (let b = 0; b < 7; b++) {
              if (g === s || s === b || g === b) continue;
              const medal = [g, s, b];
              const mia = medal.includes(0), noor = medal.includes(1);
              if (mia !== noor) count++;
            }
        return indexOfValue([30, 60, 90, 120, 150], count);
      },
    },
  ],
};
