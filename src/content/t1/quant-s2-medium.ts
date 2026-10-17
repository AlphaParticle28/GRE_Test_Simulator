import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, isPrime, sum } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// Data for the DI set (questions 10-12)
const QUARTERS = ['First', 'Second', 'Third', 'Fourth'];
const SALES_2023 = [120, 180, 240, 160];
const SALES_2024 = [150, 210, 256, 184];
const TYPES_2024 = [
  { label: 'Road', value: 35 },
  { label: 'Mountain', value: 25 },
  { label: 'Hybrid', value: 30 },
  { label: 'Electric', value: 10 },
];

/** Index of the option closest to a value (for "approximately" questions). */
const nearest = (opts: number[], v: number) =>
  opts.reduce((best, o, i) => (Math.abs(o - v) < Math.abs(opts[best] - v) ? i : best), 0);

const CIRCLE_SVG =
  '<svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">' +
  '<circle cx="150" cy="120" r="90" fill="none" stroke="black" stroke-width="2"/>' +
  '<line x1="60" y1="120" x2="240" y2="120" stroke="black" stroke-width="2"/>' +
  '<line x1="60" y1="120" x2="200" y2="45" stroke="black" stroke-width="2"/>' +
  '<line x1="150" y1="120" x2="200" y2="45" stroke="black" stroke-width="2"/>' +
  '<circle cx="150" cy="120" r="2.5" fill="black"/>' +
  '<text x="42" y="126" font-size="14" font-style="italic">A</text>' +
  '<text x="247" y="126" font-size="14" font-style="italic">B</text>' +
  '<text x="144" y="139" font-size="14" font-style="italic">O</text>' +
  '<text x="203" y="38" font-size="14" font-style="italic">C</text>' +
  '</svg>';

export const set: QuestionSet = {
  testId: 't1',
  measure: 'quant',
  key: 's2-medium',
  passages: [],
  dataSets: [
    {
      id: 't1-q2m-dA',
      charts: [
        {
          kind: 'bar',
          title: 'Number of Bicycles Sold by Store T, by Quarter',
          categories: QUARTERS,
          series: [
            { name: '2023', values: SALES_2023 },
            { name: '2024', values: SALES_2024 },
          ],
          xLabel: 'Quarter',
          yLabel: 'Bicycles sold',
          yMin: 0,
          yMax: 300,
          yStep: 50,
          showValues: true,
        },
        {
          kind: 'pie',
          title: 'Bicycles Sold by Store T in 2024, by Type',
          slices: TYPES_2024,
          labelMode: 'percent',
        },
      ],
    },
  ],
  questions: [
    // 1. QC
    {
      id: 't1-q2m-01',
      type: 'qc',
      difficulty: 4,
      topic: 'arith.percents',
      info: r`$x$ is 30 percent of $y$, and $y$ is 150 percent of $z$.`,
      quantityA: r`$x$`,
      quantityB: r`$\frac{z}{2}$`,
      answer: 3,
      explanation: r`$x = 0.3y = 0.3(1.5z) = 0.45z$, so the comparison is $0.45z$ versus $0.5z$. If $z = 100$, A is 45 and B is 50, so B is greater. If $z = -100$, A is $-45$ and B is $-50$, so A is greater. (If $z = 0$, they are equal.) Nothing says $z$ is positive, so the relationship cannot be determined.`,
      traps: [
        {
          option: 1,
          trap: 'assumed-positive',
          why: r`$0.45z < 0.5z$ only when $z$ is positive; a negative $z$ reverses the comparison.`,
        },
      ],
      verify: () =>
        qcCompare(
          [-100, -3.5, -1, 0, 0.2, 1, 40].map((z) => {
            const y = 1.5 * z;
            const x = 0.3 * y;
            return [x, z / 2] as [number, number];
          }),
        ),
    },
    // 2. QC
    {
      id: 't1-q2m-02',
      type: 'qc',
      difficulty: 3,
      topic: 'alg.inequalities-abs',
      info: r`$|2x - 5| < 3$`,
      quantityA: r`$x^2 - 5x$`,
      quantityB: r`$-4$`,
      answer: 1,
      explanation: r`$|2x - 5| < 3$ means $-3 < 2x - 5 < 3$, so $1 < x < 4$. Compare $x^2 - 5x$ with $-4$ by comparing $x^2 - 5x + 4 = (x - 1)(x - 4)$ with 0. For $1 < x < 4$, the factor $x - 1$ is positive and $x - 4$ is negative, so the product is negative. Thus $x^2 - 5x < -4$, and Quantity B is greater.`,
      traps: [
        {
          option: 3,
          trap: 'd-trap',
          why: r`At $x = 1$ or $x = 4$ the quantities would be equal, but the strict inequality excludes those endpoints, so B is always greater.`,
        },
      ],
      verify: () =>
        qcCompare(
          range(-5, 10, 0.01)
            .filter((x) => Math.abs(2 * x - 5) < 3)
            .map((x) => [x * x - 5 * x, -4] as [number, number]),
        ),
    },
    // 3. QC
    {
      id: 't1-q2m-03',
      type: 'qc',
      difficulty: 4,
      topic: 'geo.triangles',
      info: r`In right triangle $PQR$, the hypotenuse $\overline{PR}$ has length 10.`,
      quantityA: r`$PQ + QR$`,
      quantityB: r`$14$`,
      answer: 3,
      explanation: r`The legs satisfy $PQ^2 + QR^2 = 100$, but their individual lengths are not fixed. With legs 6 and 8, $PQ + QR = 14$ (equal). With legs $\sqrt{50}$ and $\sqrt{50}$, the sum is $2\sqrt{50} \approx 14.14$ (A greater). With legs 1 and $\sqrt{99}$, the sum is about 10.95 (B greater). The relationship cannot be determined.`,
      traps: [
        {
          option: 2,
          trap: 'assumed-integer',
          why: r`Assuming the legs must be the familiar 6 and 8. Any legs with $PQ^2 + QR^2 = 100$ are possible.`,
        },
      ],
      verify: () => qcCompare(range(0.5, 9.5, 0.5).map((a) => [a + Math.sqrt(100 - a * a), 14] as [number, number])),
    },
    // 4. QC
    {
      id: 't1-q2m-04',
      type: 'qc',
      difficulty: 3,
      topic: 'arith.integers',
      info: r`$p$ and $q$ are different prime numbers, each greater than 2.`,
      quantityA: r`The remainder when $p^2 + q^2$ is divided by 8`,
      quantityB: r`$2$`,
      answer: 2,
      explanation: r`Every prime greater than 2 is odd, and the square of an odd number leaves remainder 1 when divided by 8: if $p = 2k + 1$, then $p^2 = 4k(k + 1) + 1$, and since $k(k + 1)$ is even, $4k(k + 1)$ is a multiple of 8. So $p^2 + q^2$ leaves remainder $1 + 1 = 2$. For example, $3^2 + 5^2 = 34 = 4 \cdot 8 + 2$. The quantities are equal.`,
      traps: [
        {
          option: 3,
          trap: 'd-trap',
          why: r`Expecting different primes to give different remainders; testing a few pairs (such as 3 and 5, or 5 and 7) shows the remainder is always 2.`,
        },
      ],
      verify: () => {
        const ps = range(3, 200).filter(isPrime);
        const cases: Array<[number, number]> = [];
        for (const p of ps) for (const q of ps) if (p !== q) cases.push([(p * p + q * q) % 8, 2]);
        return qcCompare(cases);
      },
    },
    // 5. QC
    {
      id: 't1-q2m-05',
      type: 'qc',
      difficulty: 2,
      topic: 'arith.fractions-decimals',
      quantityA: r`$\frac{0.13}{0.004}$`,
      quantityB: r`$\frac{2.7}{0.09}$`,
      answer: 0,
      explanation: r`Clear the decimals by multiplying the numerator and denominator by the same power of 10: $\frac{0.13}{0.004} = \frac{130}{4} = 32.5$, and $\frac{2.7}{0.09} = \frac{270}{9} = 30$. Quantity A is greater.`,
      traps: [
        {
          option: 1,
          trap: 'calc-slip',
          why: r`Shifting the decimal points by different amounts in the numerator and denominator, for example treating $\frac{0.13}{0.004}$ as $\frac{13}{4} = 3.25$.`,
        },
      ],
      verify: () => qcCompare([[0.13 / 0.004, 2.7 / 0.09]]),
    },
    // 6. PS
    {
      id: 't1-q2m-06',
      type: 'mc-single',
      difficulty: 2,
      topic: 'alg.quadratics',
      stem: r`The product of two consecutive positive odd integers is 195. What is the sum of the two integers?`,
      options: ['28', '30', '32', '34', '36'],
      answer: 0,
      explanation: r`Let the integers be $n$ and $n + 2$. Then $n(n + 2) = 195$, so $n^2 + 2n - 195 = 0$, which factors as $(n + 15)(n - 13) = 0$. Since $n$ is positive, $n = 13$, the integers are 13 and 15, and their sum is 28. (A quick check: $\sqrt{195} \approx 14$, so try 13 and 15.)`,
      traps: [
        {
          option: 1,
          trap: 'calc-slip',
          why: r`Taking the two integers to be 15 and 15 (or 14 and 16, which are even) instead of the consecutive odd integers 13 and 15.`,
        },
      ],
      verify: () => {
        const n = range(1, 199, 2).find((k) => k * (k + 2) === 195)!;
        return indexOfValue([28, 30, 32, 34, 36], n + (n + 2));
      },
    },
    // 7. PS
    {
      id: 't1-q2m-07',
      type: 'numeric',
      difficulty: 3,
      topic: 'arith.ratios-rates',
      stem: r`Working alone at its constant rate, pump A can fill an empty tank in 6 hours; working alone at its constant rate, pump B can fill the same tank in 9 hours. The two pumps begin filling the empty tank together, and after 2 hours pump A stops working. How many more hours will it take pump B, working alone, to finish filling the tank?`,
      suffix: 'hours',
      answer: { kind: 'decimal', value: 4 },
      explanation: r`Together the pumps fill $\frac{1}{6} + \frac{1}{9} = \frac{5}{18}$ of the tank per hour, so in 2 hours they fill $\frac{10}{18} = \frac{5}{9}$ of it. The remaining $\frac{4}{9}$ is filled by pump B alone at $\frac{1}{9}$ of the tank per hour, which takes 4 more hours. (Answering 6, the total time, instead of the additional time is a common slip.)`,
      verify: () => {
        // simulate minute by minute with a 1,080-unit tank (A: 3 units/min, B: 2 units/min)
        const cap = 1080;
        const a = cap / (6 * 60);
        const b = cap / (9 * 60);
        let filled = 0;
        for (let t = 0; t < 120; t++) filled += a + b;
        let extra = 0;
        while (filled < cap) {
          filled += b;
          extra++;
        }
        return extra / 60;
      },
    },
    // 8. PS
    {
      id: 't1-q2m-08',
      type: 'mc-single',
      difficulty: 3,
      topic: 'data.probability',
      stem: r`Two different integers are selected at random from the integers 1 through 9, inclusive. What is the probability that the product of the two integers is even?`,
      options: [r`$\frac{5}{18}$`, r`$\frac{4}{9}$`, r`$\frac{56}{81}$`, r`$\frac{13}{18}$`, r`$\frac{5}{6}$`],
      answer: 3,
      explanation: r`The product is odd only when both integers are odd. There are $\binom{9}{2} = 36$ equally likely pairs, and $\binom{5}{2} = 10$ of them consist of two odd integers (from 1, 3, 5, 7, 9). So the probability of an even product is $1 - \frac{10}{36} = \frac{26}{36} = \frac{13}{18}$.`,
      traps: [
        {
          option: 2,
          trap: 'wrong-formula',
          why: r`$1 - \left(\frac{5}{9}\right)^2 = \frac{56}{81}$ treats the selections as independent (with replacement), but the two integers must be different.`,
        },
        {
          option: 0,
          trap: 'misread',
          why: r`$\frac{10}{36} = \frac{5}{18}$ is the probability that the product is <i>odd</i>.`,
        },
      ],
      verify: () => {
        let even = 0;
        let total = 0;
        for (let a = 1; a <= 9; a++)
          for (let b = a + 1; b <= 9; b++) {
            total++;
            if ((a * b) % 2 === 0) even++;
          }
        return indexOfValue([5 / 18, 4 / 9, 56 / 81, 13 / 18, 5 / 6], even / total);
      },
    },
    // 9. PS
    {
      id: 't1-q2m-09',
      type: 'mc-single',
      difficulty: 3,
      topic: 'geo.circles',
      figure: { kind: 'svg', svg: CIRCLE_SVG },
      stem: r`In the figure above, $\overline{AB}$ is a diameter of the circle with center $O$, and $C$ is a point on the circle. If $\angle BAC = 28^{\circ}$, what is the measure of $\angle BOC$?`,
      options: [r`$28^{\circ}$`, r`$56^{\circ}$`, r`$62^{\circ}$`, r`$112^{\circ}$`, r`$124^{\circ}$`],
      answer: 1,
      explanation: r`$OA$ and $OC$ are radii, so triangle $AOC$ is isosceles and $\angle OCA = \angle OAC = 28^{\circ}$. Then $\angle AOC = 180^{\circ} - 56^{\circ} = 124^{\circ}$. Since $A$, $O$, and $B$ lie on a line, $\angle BOC = 180^{\circ} - 124^{\circ} = 56^{\circ}$. (This is the central angle intercepting the same arc as the inscribed angle $BAC$, so it is twice as large.)`,
      traps: [
        {
          option: 4,
          trap: 'misread',
          why: r`$124^{\circ}$ is $\angle AOC$, the angle on the other side of $\overline{OC}$.`,
        },
        {
          option: 2,
          trap: 'wrong-formula',
          why: r`$62^{\circ} = 90^{\circ} - 28^{\circ}$ is $\angle ABC$ (an inscribed angle), not the central angle $\angle BOC$.`,
        },
      ],
      verify: () => {
        // unit circle, A = (-1, 0), B = (1, 0), O = origin; C is where the ray from A at 28 degrees meets the circle
        const t = (28 * Math.PI) / 180;
        const s = 2 * Math.cos(t);
        const C = [-1 + s * Math.cos(t), s * Math.sin(t)];
        const boc = (Math.acos((1 * C[0] + 0 * C[1]) / Math.hypot(C[0], C[1])) * 180) / Math.PI;
        return indexOfValue([28, 56, 62, 112, 124], boc, 1e-6);
      },
    },
    // 10. DI
    {
      id: 't1-q2m-10',
      type: 'mc-single',
      difficulty: 2,
      topic: 'data.interpretation',
      dataSetId: 't1-q2m-dA',
      stem: r`Store T's total number of bicycles sold in 2024 was approximately what percent greater than its total number sold in 2023?`,
      options: ['7%', '10%', '12.5%', '14%', '25%'],
      answer: 3,
      explanation: r`Total for 2023: $120 + 180 + 240 + 160 = 700$. Total for 2024: $150 + 210 + 256 + 184 = 800$. The increase is $\frac{100}{700} \approx 0.143$, or about 14%.`,
      traps: [
        {
          option: 2,
          trap: 'calc-slip',
          why: r`$\frac{100}{800} = 12.5\%$ uses the 2024 total as the base; a percent increase is measured from the original (2023) value.`,
        },
      ],
      verify: () =>
        nearest([7, 10, 12.5, 14, 25], ((sum(SALES_2024) - sum(SALES_2023)) / sum(SALES_2023)) * 100),
    },
    // 11. DI (multi)
    {
      id: 't1-q2m-11',
      type: 'mc-multi',
      difficulty: 3,
      topic: 'data.interpretation',
      dataSetId: 't1-q2m-dA',
      stem: r`For which quarters was the number of bicycles Store T sold in 2024 at least 15 percent greater than the number it sold in the same quarter of 2023?<br><i>Indicate all such quarters.</i>`,
      options: ['First quarter', 'Second quarter', 'Third quarter', 'Fourth quarter'],
      answer: [0, 1, 3],
      explanation: r`Percent increases: first quarter $\frac{30}{120} = 25\%$; second quarter $\frac{30}{180} \approx 16.7\%$; third quarter $\frac{16}{240} \approx 6.7\%$; fourth quarter $\frac{24}{160} = 15\%$ exactly. "At least 15 percent" includes the fourth quarter, so the answer is the first, second, and fourth quarters.`,
      traps: [
        {
          option: 2,
          trap: 'misread',
          why: r`Third-quarter sales rose by 16 bicycles, not by 16 percent; $\frac{16}{240}$ is only about 6.7%.`,
        },
      ],
      verify: () => indicesWhere([0, 1, 2, 3], (i) => 100 * SALES_2024[i] >= 115 * SALES_2023[i]),
    },
    // 12. DI
    {
      id: 't1-q2m-12',
      type: 'mc-single',
      difficulty: 4,
      topic: 'data.interpretation',
      dataSetId: 't1-q2m-dA',
      stem: r`In 2023, road bicycles accounted for 40 percent of the bicycles Store T sold. Which of the following best describes the change in the number of road bicycles Store T sold from 2023 to 2024?`,
      options: ['A decrease of 12.5%', 'A decrease of 5%', 'No change', 'An increase of 5%', 'An increase of about 14%'],
      answer: 2,
      explanation: r`Road bicycles sold in 2023: $0.40 \times 700 = 280$. Road bicycles sold in 2024: $0.35 \times 800 = 280$. The number did not change, even though road bicycles' share of sales fell from 40% to 35%, because total sales grew.`,
      traps: [
        {
          option: 1,
          trap: 'wrong-formula',
          why: 'The share fell by 5 percentage points, but a change in share is not the same as a change in the number sold.',
        },
        {
          option: 0,
          trap: 'ignored-constraint',
          why: r`$\frac{40 - 35}{40} = 12.5\%$ compares the shares as if the total number of bicycles sold were the same in both years.`,
        },
      ],
      verify: () => {
        const road23 = 0.4 * sum(SALES_2023);
        const road24 = (TYPES_2024.find((t) => t.label === 'Road')!.value / sum(TYPES_2024.map((t) => t.value))) * sum(SALES_2024);
        const change = ((road24 - road23) / road23) * 100;
        return nearest([-12.5, -5, 0, 5, 14], change);
      },
    },
    // 13. PS
    {
      id: 't1-q2m-13',
      type: 'numeric',
      difficulty: 4,
      topic: 'alg.word-problems',
      stem: r`A tank holds 30 liters of a solution that is 10 percent acid by volume. Some of the solution is drained from the tank and replaced with an equal volume of pure acid, and the resulting 30 liters of solution is 28 percent acid by volume. How many liters of the original solution were drained?`,
      suffix: 'liters',
      answer: { kind: 'decimal', value: 6 },
      explanation: r`Let $x$ liters be drained. The $30 - x$ liters left contain $0.1(30 - x)$ liters of acid, and $x$ liters of pure acid are added, so $0.1(30 - x) + x = 0.28(30) = 8.4$. Then $3 + 0.9x = 8.4$, so $x = 6$. A common error is to ignore the acid removed with the drained solution, writing $3 + x = 8.4$ and getting 5.4.`,
      verify: () => {
        for (let k = 0; k <= 3000; k++) {
          const x = k / 100;
          const acid = 0.1 * (30 - x) + x;
          if (Math.abs(acid / 30 - 0.28) < 1e-9) return x;
        }
        return NaN;
      },
    },
    // 14. PS
    {
      id: 't1-q2m-14',
      type: 'mc-single',
      difficulty: 3,
      topic: 'data.distributions',
      stem: r`The heights of the plants in a large greenhouse are approximately normally distributed with a mean of 40 centimeters and a standard deviation of 5 centimeters. Approximately what percent of the plants have heights between 35 centimeters and 50 centimeters?`,
      options: ['34%', '48%', '68%', '75%', '82%'],
      answer: 4,
      explanation: r`35 cm is 1 standard deviation below the mean, and 50 cm is 2 standard deviations above it. In a normal distribution, about 34% of the data lie between the mean and 1 standard deviation below it, and about 47.5% lie between the mean and 2 standard deviations above it. The total is about $34\% + 47.5\% \approx 82\%$.`,
      traps: [
        {
          option: 2,
          trap: 'misread',
          why: '68% is the proportion within 1 standard deviation on <i>both</i> sides of the mean (35 to 45 cm); this interval extends to 2 standard deviations above the mean.',
        },
      ],
      verify: () => {
        // Simpson's rule on the normal density from 35 to 50
        const pdf = (x: number) => Math.exp(-((x - 40) ** 2) / (2 * 25)) / (5 * Math.sqrt(2 * Math.PI));
        const n = 2000;
        const lo = 35;
        const hi = 50;
        const h = (hi - lo) / n;
        let s = pdf(lo) + pdf(hi);
        for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * pdf(lo + i * h);
        return nearest([34, 48, 68, 75, 82], ((s * h) / 3) * 100);
      },
    },
    // 15. PS (multi)
    {
      id: 't1-q2m-15',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'alg.functions',
      stem: r`The function $g$ is defined by $g(x) = (x - 1)(x + 3)$ for all numbers $x$. Which of the following could be the value of $g(n)$ for some integer $n$?<br><i>Indicate all such values.</i>`,
      options: [r`$-5$`, r`$-4$`, r`$-3$`, r`$0$`, r`$4$`, r`$5$`, r`$12$`, r`$20$`],
      answer: [1, 2, 3, 5, 6],
      explanation: r`Expand and complete the square: $g(x) = x^2 + 2x - 3 = (x + 1)^2 - 4$. For an integer $n$, $(n + 1)^2$ is a perfect square, so $g(n)$ is 4 less than a perfect square: $-4, -3, 0, 5, 12, 21, \ldots$ (from $n = -1, 0, 1, 2, 3, 4, \ldots$). Thus $-4$, $-3$, $0$, $5$, and $12$ are possible. $-5$ is below the minimum value $-4$, and 4 and 20 would require $(n + 1)^2$ to equal 8 or 24, which are not perfect squares.`,
      traps: [
        {
          option: 0,
          trap: 'ignored-constraint',
          why: r`The least value of $g(x)$ is $-4$ (at $x = -1$), so $g(n) = -5$ is impossible.`,
        },
        {
          option: 4,
          trap: 'assumed-integer',
          why: r`$g(x) = 4$ has real solutions, but they are $-1 \pm 2\sqrt{2}$, not integers.`,
        },
      ],
      verify: () => {
        const vals = new Set(range(-200, 200).map((n) => (n - 1) * (n + 3)));
        return indicesWhere([-5, -4, -3, 0, 4, 5, 12, 20], (v) => vals.has(v));
      },
    },
  ],
};
