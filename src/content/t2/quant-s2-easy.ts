import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, combos } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// DI data (t2-q2e-dA): books checked out at five branches of the Alder County Library (hundreds)
const BRANCHES = ['Oakdale', 'Pinecrest', 'Riverside', 'Hilltop', 'Central'];
const MAR_2023 = [120, 64, 95, 51, 150];
const MAR_2024 = [138, 80, 76, 66, 216];

export const set: QuestionSet = {
  testId: 't2',
  measure: 'quant',
  key: 's2-easy',
  passages: [],
  dataSets: [
    {
      id: 't2-q2e-dA',
      charts: [
        {
          kind: 'bar',
          title: 'Books Checked Out at Five Branches of the Alder County Library, March 2023 and March 2024 (in hundreds)',
          categories: BRANCHES,
          series: [
            { name: 'March 2023', values: MAR_2023 },
            { name: 'March 2024', values: MAR_2024 },
          ],
          xLabel: 'Branch',
          yLabel: 'Hundreds of books',
          yMin: 0,
          yMax: 240,
          yStep: 40,
          showValues: true,
        },
      ],
    },
  ],
  questions: [
    // 1 ─ QC
    {
      id: 't2-q2e-01',
      type: 'qc',
      difficulty: 1,
      topic: 'arith.fractions-decimals',
      quantityA: r`$\frac{7}{12}$`,
      quantityB: r`$\frac{4}{7}$`,
      answer: 0,
      explanation: r`Cross-multiply: compare $7 \times 7 = 49$ with $4 \times 12 = 48$. Since $49 > 48$, $\frac{7}{12} > \frac{4}{7}$. (In decimals, $0.583\ldots > 0.571\ldots$.)`,
      verify: () => qcCompare([[7 / 12, 4 / 7]]),
    },
    // 2 ─ QC
    {
      id: 't2-q2e-02',
      type: 'qc',
      difficulty: 2,
      topic: 'alg.linear',
      info: r`$2a + 5b = 31$<br>$a + b = 8$`,
      quantityA: r`$a$`,
      quantityB: r`$b$`,
      answer: 1,
      explanation: r`From the second equation, $a = 8 - b$. Substituting: $2(8 - b) + 5b = 31$, so $16 + 3b = 31$ and $b = 5$. Then $a = 3$. Quantity B is greater.`,
      verify: () => {
        const cases: Array<[number, number]> = [];
        for (const b of range(-50, 50, 0.25)) {
          const a = 8 - b;
          if (Math.abs(2 * a + 5 * b - 31) < 1e-9) cases.push([a, b]);
        }
        return qcCompare(cases);
      },
    },
    // 3 ─ QC (figure)
    {
      id: 't2-q2e-03',
      type: 'qc',
      difficulty: 2,
      topic: 'geo.lines-angles',
      info: r`In the figure, lines $\ell$ and $m$ are parallel.`,
      figure: {
        kind: 'svg',
        svg: '<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg"><line x1="60" y1="80" x2="420" y2="80" stroke="black" stroke-width="2"/><line x1="60" y1="220" x2="420" y2="220" stroke="black" stroke-width="2"/><line x1="178.56" y1="300" x2="253.59" y2="20" stroke="black" stroke-width="2"/><text x="430" y="85" font-size="14" font-style="italic">ℓ</text><text x="430" y="225" font-size="14" font-style="italic">m</text><text x="250" y="110" font-size="14">3<tspan font-style="italic">x</tspan>°</text><text x="216" y="207" font-size="14">(<tspan font-style="italic">x</tspan> + 40)°</text></svg>',
      },
      quantityA: r`$x$`,
      quantityB: r`$35$`,
      answer: 2,
      explanation: r`The angles labeled $3x^{\circ}$ and $(x + 40)^{\circ}$ are both between the parallel lines and on the same side of the transversal, so they are supplementary: $3x + (x + 40) = 180$. Then $4x = 140$ and $x = 35$. The quantities are equal.`,
      verify: () => {
        const cases: Array<[number, number]> = [];
        for (const x of range(0, 90, 0.5)) if (Math.abs(3 * x + (x + 40) - 180) < 1e-9) cases.push([x, 35]);
        return qcCompare(cases);
      },
    },
    // 4 ─ QC
    {
      id: 't2-q2e-04',
      type: 'qc',
      difficulty: 3,
      topic: 'data.statistics',
      info: 'The average (arithmetic mean) of a list of 6 numbers is 15. When one number is removed from the list, the average of the remaining 5 numbers is 13.',
      quantityA: 'The number that was removed',
      quantityB: '24',
      answer: 0,
      explanation: r`The sum of the 6 numbers is $6 \times 15 = 90$, and the sum of the remaining 5 is $5 \times 13 = 65$. The removed number is $90 - 65 = 25$, which is greater than 24.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`Reasoning from the averages alone (for example, $15 - 13 = 2$ or $15 + 2 = 17$) ignores that averages must be converted to sums.` },
      ],
      verify: () => {
        const cases: Array<[number, number]> = [];
        // brute force: try every candidate removed value on a fine grid
        for (const x of range(-100, 100, 0.5)) if (Math.abs((6 * 15 - x) / 5 - 13) < 1e-9) cases.push([x, 24]);
        return qcCompare(cases);
      },
    },
    // 5 ─ QC
    {
      id: 't2-q2e-05',
      type: 'qc',
      difficulty: 3,
      topic: 'arith.integers',
      info: r`$n$ is a positive integer that is divisible by both 4 and 6.`,
      quantityA: r`The remainder when $n$ is divided by 24`,
      quantityB: '10',
      answer: 3,
      explanation: r`Being divisible by both 4 and 6 means $n$ is a multiple of their least common multiple, 12 — not necessarily of 24. If $n = 24$, the remainder is 0 (B is greater). If $n = 12$, the remainder is 12 (A is greater). The relationship cannot be determined.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`Assuming $n$ must be a multiple of $4 \times 6 = 24$ (so the remainder is always 0). The least common multiple of 4 and 6 is 12.` },
      ],
      verify: () =>
        qcCompare(range(1, 2400).filter((n) => n % 4 === 0 && n % 6 === 0).map((n) => [n % 24, 10] as [number, number])),
    },
    // 6 ─ PS
    {
      id: 't2-q2e-06',
      type: 'mc-single',
      difficulty: 1,
      topic: 'arith.ratios-rates',
      stem: 'In a bread dough, flour and water are combined in the ratio 5 to 2 by weight. How many grams of water are in 1,400 grams of the dough?',
      options: ['280', '400', '560', '700', '1,000'],
      answer: 1,
      explanation: r`Water is 2 of every $5 + 2 = 7$ parts, so it is $\frac{2}{7}$ of the dough: $\frac{2}{7} \times 1{,}400 = 400$ grams.`,
      traps: [
        { option: 2, trap: 'wrong-formula', why: r`$560 = \frac{2}{5} \times 1{,}400$ treats the part-to-part ratio as a part-to-whole fraction.` },
      ],
      verify: () => {
        for (let k = 1; k <= 1400; k++) if (5 * k + 2 * k === 1400) return indexOfValue([280, 400, 560, 700, 1000], 2 * k);
        return -1;
      },
    },
    // 7 ─ PS numeric
    {
      id: 't2-q2e-07',
      type: 'numeric',
      difficulty: 2,
      topic: 'geo.polygons',
      stem: 'A rectangular vegetable garden has a perimeter of 54 meters. The length of the garden is 3 meters more than twice its width. What is the area of the garden?',
      suffix: 'square meters',
      answer: { kind: 'decimal', value: 152 },
      explanation: r`Let the width be $w$; then the length is $2w + 3$. The perimeter gives $2(w + 2w + 3) = 54$, so $3w + 3 = 27$ and $w = 8$. The length is 19, and the area is $8 \times 19 = 152$ square meters.`,
      verify: () => {
        for (const w of range(0.5, 27, 0.5)) {
          const len = 2 * w + 3;
          if (Math.abs(2 * (len + w) - 54) < 1e-9) return len * w;
        }
        return NaN;
      },
    },
    // 8 ─ PS
    {
      id: 't2-q2e-08',
      type: 'mc-single',
      difficulty: 2,
      topic: 'alg.quadratics',
      stem: r`If $x^{2} - 3x - 28 = 0$ and $x < 0$, what is the value of $x^{2} + x$?`,
      options: ['12', '20', '28', '42', '56'],
      answer: 0,
      explanation: r`Factor: $(x - 7)(x + 4) = 0$, so $x = 7$ or $x = -4$. Since $x < 0$, $x = -4$, and $x^{2} + x = 16 - 4 = 12$.`,
      traps: [
        { option: 4, trap: 'ignored-constraint', why: r`$56 = 7^{2} + 7$ uses the positive root, which the condition $x < 0$ rules out.` },
        { option: 1, trap: 'calc-slip', why: r`$20 = 16 + 4$ comes from mishandling the sign of $x = -4$.` },
      ],
      verify: () => {
        const roots = range(-100, 100).filter((x) => x * x - 3 * x - 28 === 0 && x < 0);
        return indexOfValue([12, 20, 28, 42, 56], roots[0] * roots[0] + roots[0]);
      },
    },
    // 9 ─ PS multi
    {
      id: 't2-q2e-09',
      type: 'mc-multi',
      difficulty: 3,
      topic: 'alg.inequalities-abs',
      stem: r`Which of the following values of $x$ satisfy both $|x - 1| < 4$ and $x^{2} > 4$?<br><i>Indicate all such values.</i>`,
      options: [r`$-3$`, r`$-2.5$`, r`$-1$`, r`$0$`, r`$2.5$`, r`$4$`, r`$5$`],
      answer: [1, 4, 5],
      explanation: r`$|x - 1| < 4$ means $-3 < x < 5$. $x^{2} > 4$ means $x < -2$ or $x > 2$. Both hold when $-3 < x < -2$ or $2 < x < 5$. Of the choices, $-2.5$, $2.5$, and $4$ work. The endpoints $-3$ and $5$ fail because the inequality is strict ($|x - 1| = 4$ there), and $-1$ and $0$ fail $x^{2} > 4$.`,
      traps: [
        { option: 0, trap: 'ignored-constraint', why: r`At $x = -3$, $|x - 1| = 4$, which is not less than 4.` },
        { option: 6, trap: 'ignored-constraint', why: r`At $x = 5$, $|x - 1| = 4$, which is not less than 4.` },
      ],
      verify: () => indicesWhere([-3, -2.5, -1, 0, 2.5, 4, 5], (x) => Math.abs(x - 1) < 4 && x * x > 4),
    },
    // 10 ─ DI
    {
      id: 't2-q2e-10',
      type: 'mc-single',
      dataSetId: 't2-q2e-dA',
      difficulty: 1,
      topic: 'data.interpretation',
      stem: 'Which branch had the greatest increase in the number of books checked out from March 2023 to March 2024?',
      options: ['Oakdale', 'Pinecrest', 'Riverside', 'Hilltop', 'Central'],
      answer: 4,
      explanation: r`The changes (in hundreds) are: Oakdale $138 - 120 = 18$, Pinecrest $80 - 64 = 16$, Riverside $76 - 95 = -19$ (a decrease), Hilltop $66 - 51 = 15$, and Central $216 - 150 = 66$. Central had the greatest increase.`,
      verify: () => {
        const inc = MAR_2024.map((v, i) => v - MAR_2023[i]);
        const best = inc.indexOf(Math.max(...inc));
        return ['Oakdale', 'Pinecrest', 'Riverside', 'Hilltop', 'Central'].indexOf(BRANCHES[best]);
      },
    },
    // 11 ─ DI
    {
      id: 't2-q2e-11',
      type: 'mc-single',
      dataSetId: 't2-q2e-dA',
      difficulty: 2,
      topic: 'data.interpretation',
      stem: 'By what percent did the number of books checked out at the Pinecrest branch increase from March 2023 to March 2024?',
      options: ['16%', '20%', '25%', '30%', '36%'],
      answer: 2,
      explanation: r`Pinecrest went from 64 hundred to 80 hundred books, an increase of 16 hundred. Percent increase $= \frac{16}{64} = 0.25$, or 25%.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`$\frac{16}{80} = 20\%$ divides by the new value instead of the original value.` },
        { option: 0, trap: 'misread', why: 'The increase of 16 (hundred books) is an amount, not a percent.' },
      ],
      verify: () => {
        const i = BRANCHES.indexOf('Pinecrest');
        return indexOfValue([16, 20, 25, 30, 36], ((MAR_2024[i] - MAR_2023[i]) / MAR_2023[i]) * 100);
      },
    },
    // 12 ─ DI numeric
    {
      id: 't2-q2e-12',
      type: 'numeric',
      dataSetId: 't2-q2e-dA',
      difficulty: 3,
      topic: 'data.interpretation',
      stem: 'The books checked out at the Central branch in March 2024 made up what percent of all the books checked out at the five branches in March 2024?',
      suffix: '%',
      answer: { kind: 'decimal', value: 37.5 },
      explanation: r`The March 2024 total (in hundreds) is $138 + 80 + 76 + 66 + 216 = 576$. Central’s share is $\frac{216}{576} = \frac{3}{8} = 37.5\%$. (Dividing by the March 2023 total, 480, gives 45%, which mixes the two months.)`,
      verify: () => {
        const t24 = MAR_2024.reduce((s, v) => s + v, 0);
        return (MAR_2024[BRANCHES.indexOf('Central')] / t24) * 100;
      },
    },
    // 13 ─ PS probability
    {
      id: 't2-q2e-13',
      type: 'mc-single',
      difficulty: 2,
      topic: 'data.probability',
      stem: 'A jar contains 15 tea bags: 6 chamomile, 4 mint, and 5 black tea. If 2 tea bags are selected from the jar at random, without replacement, what is the probability that both are mint?',
      options: [r`$\frac{2}{35}$`, r`$\frac{16}{225}$`, r`$\frac{4}{35}$`, r`$\frac{2}{15}$`, r`$\frac{4}{15}$`],
      answer: 0,
      explanation: r`The probability that the first bag is mint is $\frac{4}{15}$; given that, the probability that the second is mint is $\frac{3}{14}$. Multiply: $\frac{4}{15} \times \frac{3}{14} = \frac{12}{210} = \frac{2}{35}$.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`$\left(\frac{4}{15}\right)^{2} = \frac{16}{225}$ treats the draws as being made with replacement.` },
        { option: 4, trap: 'misread', why: r`$\frac{4}{15}$ is the probability for a single draw only.` },
      ],
      verify: () => {
        const bags = [...Array(6).fill('C'), ...Array(4).fill('M'), ...Array(5).fill('B')].map((t, i) => t + i);
        const pairs = combos(bags, 2);
        const both = pairs.filter((p) => p[0].startsWith('M') && p[1].startsWith('M')).length;
        return indexOfValue([2 / 35, 16 / 225, 4 / 35, 2 / 15, 4 / 15], both / pairs.length);
      },
    },
    // 14 ─ PS numeric
    {
      id: 't2-q2e-14',
      type: 'numeric',
      difficulty: 1,
      topic: 'arith.percents',
      stem: r`A monthly phone plan costs \$40. If the monthly price increases by 15 percent, what will the new monthly price be?`,
      prefix: r`\$`,
      answer: { kind: 'decimal', value: 46 },
      explanation: r`15 percent of \$40 is $0.15 \times 40 = 6$ dollars, so the new price is $40 + 6 = 46$ dollars, or \$46.`,
      verify: () => 40 + (40 * 15) / 100,
    },
    // 15 ─ PS solids
    {
      id: 't2-q2e-15',
      type: 'mc-single',
      difficulty: 3,
      topic: 'geo.solids',
      stem: 'A closed rectangular box has a square base, and the height of the box is twice the length of a side of the base. If the total surface area of the box is 160 square inches, what is the volume of the box, in cubic inches?',
      options: ['32', '64', '96', '128', '256'],
      answer: 3,
      explanation: r`Let the base have side $s$, so the height is $2s$. The surface area is two square faces plus four rectangular faces: $2s^{2} + 4(s)(2s) = 10s^{2} = 160$, so $s^{2} = 16$ and $s = 4$. The volume is $4 \times 4 \times 8 = 128$ cubic inches.`,
      traps: [
        { option: 1, trap: 'misread', why: r`$64 = 4^{3}$ treats the box as a cube, ignoring that the height is $2s = 8$.` },
        { option: 4, trap: 'calc-slip', why: r`$256 = 4 \times 8 \times 8$ doubles the wrong dimension; only the height is $2s$.` },
      ],
      verify: () => {
        // search side lengths s on a fine grid for surface area 160
        for (const s of range(0.01, 20, 0.01)) {
          const sa = 2 * s * s + 4 * s * (2 * s);
          if (Math.abs(sa - 160) < 1e-6) return indexOfValue([32, 64, 96, 128, 256], s * s * (2 * s), 1e-6);
        }
        return -1;
      },
    },
  ],
};
