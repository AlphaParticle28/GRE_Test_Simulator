import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, round, sum } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// Data for the DI set (questions 10-12)
const BUDGET = [
  { label: 'Housing', value: 32 },
  { label: 'Food', value: 18 },
  { label: 'Transportation', value: 12 },
  { label: 'Savings', value: 15 },
  { label: 'Utilities', value: 8 },
  { label: 'Other', value: 15 },
];
const TOTAL_BUDGET = 64000;
/** Percent of the total budget for a category. */
const pct = (label: string) => (BUDGET.find((s) => s.label === label)!.value / sum(BUDGET.map((s) => s.value))) * 100;

const PARALLEL_SVG =
  '<svg viewBox="0 0 400 270" xmlns="http://www.w3.org/2000/svg">' +
  '<line x1="40" y1="80" x2="360" y2="80" stroke="black" stroke-width="2"/>' +
  '<line x1="40" y1="200" x2="360" y2="200" stroke="black" stroke-width="2"/>' +
  '<line x1="224" y1="20" x2="132" y2="250" stroke="black" stroke-width="2"/>' +
  '<text x="368" y="85" font-size="14" font-style="italic">ℓ</text>' +
  '<text x="368" y="205" font-size="14" font-style="italic">m</text>' +
  '<text x="168" y="72" font-size="14" font-style="italic">x°</text>' +
  '<text x="116" y="222" font-size="14" font-style="italic">y°</text>' +
  '</svg>';

export const set: QuestionSet = {
  testId: 't1',
  measure: 'quant',
  key: 's2-easy',
  passages: [],
  dataSets: [
    {
      id: 't1-q2e-dA',
      charts: [
        {
          kind: 'pie',
          title: 'Moreno Family Budget for 2023, by Category',
          slices: BUDGET,
          labelMode: 'percent',
          note: r`Total budget for 2023: \$64,000`,
        },
      ],
    },
  ],
  questions: [
    // 1. QC
    {
      id: 't1-q2e-01',
      type: 'qc',
      difficulty: 1,
      topic: 'arith.exponents-roots',
      quantityA: r`$\sqrt{50}$`,
      quantityB: r`$7$`,
      answer: 0,
      explanation: r`Compare the squares of the two positive quantities: $(\sqrt{50})^2 = 50$ and $7^2 = 49$. Since $50 > 49$, $\sqrt{50} > 7$. Quantity A is greater.`,
      verify: () => qcCompare([[Math.sqrt(50), 7]]),
    },
    // 2. QC
    {
      id: 't1-q2e-02',
      type: 'qc',
      difficulty: 2,
      topic: 'geo.lines-angles',
      figure: { kind: 'svg', svg: PARALLEL_SVG, notToScale: true },
      info: r`$\ell \parallel m$ and $x = 112$`,
      quantityA: r`$y$`,
      quantityB: r`$70$`,
      answer: 1,
      explanation: r`Because $\ell \parallel m$, the angle above line $m$ on the left side of the transversal corresponds to the angle marked $x^{\circ}$, so it also measures $112^{\circ}$. That angle and the angle marked $y^{\circ}$ together form a straight angle along the transversal, so $y = 180 - 112 = 68$. Since $68 < 70$, Quantity B is greater.`,
      traps: [
        {
          option: 2,
          trap: 'calc-slip',
          why: r`Estimating $y$ from the figure, or computing $180 - 112$ carelessly as 70; the exact value is 68.`,
        },
      ],
      verify: () => {
        const correspondingAtM = 112; // angle above m, left of the transversal
        const y = 180 - correspondingAtM; // linear pair
        return qcCompare([[y, 70]]);
      },
    },
    // 3. QC
    {
      id: 't1-q2e-03',
      type: 'qc',
      difficulty: 2,
      topic: 'alg.linear',
      info: r`$3x + 2y = 18$<br>$x - y = 1$`,
      quantityA: r`$2x - y$`,
      quantityB: r`$5$`,
      answer: 2,
      explanation: r`From the second equation, $x = y + 1$. Substituting into the first: $3(y + 1) + 2y = 18$, so $5y = 15$, $y = 3$, and $x = 4$. Then $2x - y = 8 - 3 = 5$. The quantities are equal.`,
      verify: () => {
        const cases: Array<[number, number]> = [];
        for (let x = -20; x <= 20; x += 0.5)
          for (let y = -20; y <= 20; y += 0.5) if (3 * x + 2 * y === 18 && x - y === 1) cases.push([2 * x - y, 5]);
        return qcCompare(cases);
      },
    },
    // 4. QC
    {
      id: 't1-q2e-04',
      type: 'qc',
      difficulty: 3,
      topic: 'alg.quadratics',
      info: r`$a$ and $b$ are positive numbers, and $a + b = 10$.`,
      quantityA: r`$ab$`,
      quantityB: r`$25$`,
      answer: 3,
      explanation: r`Substitute $b = 10 - a$: $ab = 10a - a^2 = 25 - (a - 5)^2$. So $ab \leq 25$, with equality exactly when $a = b = 5$. If $a = b = 5$, the quantities are equal; if $a = 2$ and $b = 8$, then $ab = 16 < 25$. The relationship cannot be determined.`,
      traps: [
        {
          option: 1,
          trap: 'd-trap',
          why: r`Trying only unequal pairs such as 4 and 6 (product 24) suggests B is always greater, but $a = b = 5$ makes the quantities equal.`,
        },
      ],
      verify: () => {
        const as = [...range(0.1, 9.9, 0.1), 5];
        return qcCompare(as.map((a) => [a * (10 - a), 25] as [number, number]));
      },
    },
    // 5. QC
    {
      id: 't1-q2e-05',
      type: 'qc',
      difficulty: 2,
      topic: 'geo.triangles',
      info: r`The lengths of the three sides of a triangle are 7, 10, and $x$.`,
      quantityA: r`$x$`,
      quantityB: r`$17$`,
      answer: 1,
      explanation: r`By the triangle inequality, each side of a triangle is less than the sum of the other two, so $x < 7 + 10 = 17$ (and also $x > 10 - 7 = 3$). Therefore Quantity B is greater.`,
      traps: [
        {
          option: 2,
          trap: 'wrong-formula',
          why: r`If $x$ were 17, the three segments would lie flat along one line; a side of a triangle must be strictly less than the sum of the other two.`,
        },
      ],
      verify: () => {
        const xs = range(0.5, 30, 0.5).filter((x) => x < 7 + 10 && 7 < x + 10 && 10 < x + 7);
        return qcCompare(xs.map((x) => [x, 17] as [number, number]));
      },
    },
    // 6. PS
    {
      id: 't1-q2e-06',
      type: 'mc-single',
      difficulty: 2,
      topic: 'arith.percents',
      stem: r`A hardware store sells a ladder for \$60, which is 20 percent more than the price the store paid for the ladder. How much did the store pay for the ladder?`,
      options: [r`\$48`, r`\$50`, r`\$52`, r`\$54`, r`\$72`],
      answer: 1,
      explanation: r`If the store paid $c$ dollars, then $1.2c = 60$, so $c = \frac{60}{1.2} = 50$. The store paid \$50. (Check: 20 percent of \$50 is \$10, and $50 + 10 = 60$.)`,
      traps: [
        {
          option: 0,
          trap: 'wrong-formula',
          why: r`Subtracting 20 percent of \$60 gives \$48, but the 20 percent markup is based on the store's cost, not on the selling price.`,
        },
      ],
      verify: () => {
        let cost = -1;
        for (let cents = 1; cents <= 6000; cents++) if (Math.abs(cents * 1.2 - 6000) < 1e-6) cost = cents / 100;
        return indexOfValue([48, 50, 52, 54, 72], cost);
      },
    },
    // 7. PS
    {
      id: 't1-q2e-07',
      type: 'numeric',
      difficulty: 1,
      topic: 'arith.ratios-rates',
      stem: r`A cyclist rides 54 miles in 3 hours. At the same average speed, how many miles will the cyclist ride in 5 hours?`,
      suffix: 'miles',
      answer: { kind: 'decimal', value: 90 },
      explanation: r`The cyclist's speed is $\frac{54}{3} = 18$ miles per hour. In 5 hours the cyclist rides $18 \times 5 = 90$ miles.`,
      verify: () => (54 / 3) * 5,
    },
    // 8. PS
    {
      id: 't1-q2e-08',
      type: 'mc-single',
      difficulty: 1,
      topic: 'alg.functions',
      stem: r`If $f(x) = 2x^2 - 3x$ for all numbers $x$, what is the value of $f(-2)$?`,
      options: [r`$-14$`, r`$-2$`, r`$2$`, r`$8$`, r`$14$`],
      answer: 4,
      explanation: r`$f(-2) = 2(-2)^2 - 3(-2) = 2(4) + 6 = 14$.`,
      traps: [
        {
          option: 2,
          trap: 'calc-slip',
          why: r`Treating $-3(-2)$ as $-6$ gives $8 - 6 = 2$.`,
        },
      ],
      verify: () => {
        const f = (x: number) => 2 * x * x - 3 * x;
        return indexOfValue([-14, -2, 2, 8, 14], f(-2));
      },
    },
    // 9. PS
    {
      id: 't1-q2e-09',
      type: 'mc-single',
      difficulty: 2,
      topic: 'data.combinatorics',
      stem: r`A café's lunch special consists of one sandwich and one side, and the side must be either a soup or a salad. If there are 5 sandwiches, 4 soups, and 3 salads to choose from, how many different lunch specials are possible?`,
      options: ['12', '20', '35', '60', '70'],
      answer: 2,
      explanation: r`There are $4 + 3 = 7$ possible sides (a soup <i>or</i> a salad). Each of the 5 sandwiches can be paired with any of the 7 sides, giving $5 \times 7 = 35$ lunch specials.`,
      traps: [
        {
          option: 3,
          trap: 'misread',
          why: r`$5 \times 4 \times 3 = 60$ counts meals with a sandwich, a soup, <i>and</i> a salad, but each special includes only one side.`,
        },
      ],
      verify: () => {
        let n = 0;
        // soup 0 / salad 0 mean "none"; a special has exactly one side
        for (let s = 1; s <= 5; s++)
          for (let soup = 0; soup <= 4; soup++)
            for (let salad = 0; salad <= 3; salad++) if ((soup > 0 ? 1 : 0) + (salad > 0 ? 1 : 0) === 1) n++;
        return indexOfValue([12, 20, 35, 60, 70], n);
      },
    },
    // 10. DI
    {
      id: 't1-q2e-10',
      type: 'mc-single',
      difficulty: 1,
      topic: 'data.interpretation',
      dataSetId: 't1-q2e-dA',
      stem: r`How much money did the Moreno family budget for transportation in 2023?`,
      options: [r`\$7,680`, r`\$8,320`, r`\$9,600`, r`\$11,520`, r`\$12,000`],
      answer: 0,
      explanation: r`Transportation is 12% of the \$64,000 total: $0.12 \times 64{,}000 = 7{,}680$, so the amount is \$7,680.`,
      verify: () => indexOfValue([7680, 8320, 9600, 11520, 12000], (pct('Transportation') / 100) * TOTAL_BUDGET),
    },
    // 11. DI
    {
      id: 't1-q2e-11',
      type: 'mc-single',
      difficulty: 2,
      topic: 'data.interpretation',
      dataSetId: 't1-q2e-dA',
      stem: r`The amount the Moreno family budgeted for housing in 2023 was how many times the amount it budgeted for utilities?`,
      options: ['2', '2.5', '3', '4', '24'],
      answer: 3,
      explanation: r`Both amounts are percents of the same total, so their ratio equals the ratio of the percents: $\frac{32}{8} = 4$. (In dollars: $\frac{20{,}480}{5{,}120} = 4$.)`,
      traps: [
        {
          option: 4,
          trap: 'misread',
          why: r`24 is the difference between the two percents ($32 - 8$), not their ratio.`,
        },
      ],
      verify: () =>
        indexOfValue([2, 2.5, 3, 4, 24], (pct('Housing') * TOTAL_BUDGET) / (pct('Utilities') * TOTAL_BUDGET)),
    },
    // 12. DI
    {
      id: 't1-q2e-12',
      type: 'numeric',
      difficulty: 3,
      topic: 'data.interpretation',
      dataSetId: 't1-q2e-dA',
      stem: r`Suppose the Moreno family's total budget for 2024 is 10 percent greater than its total budget for 2023, and the amount budgeted for housing is the same in both years. What percent of the 2024 total budget is budgeted for housing?<br><i>Round your answer to the nearest whole percent.</i>`,
      suffix: '%',
      answer: { kind: 'decimal', value: 29 },
      explanation: r`Housing in 2023: $0.32 \times 64{,}000 = 20{,}480$ dollars. The 2024 total is $1.1 \times 64{,}000 = 70{,}400$ dollars. Housing's share is $\frac{20{,}480}{70{,}400} \approx 0.291$, or about 29%. (Equivalently, $\frac{32}{1.1} \approx 29.1$.) Subtracting 10 percentage points to get 22%, or keeping 32%, are common errors.`,
      verify: () => {
        const housing = (pct('Housing') / 100) * TOTAL_BUDGET;
        const total2024 = TOTAL_BUDGET * 1.1;
        return round((housing / total2024) * 100);
      },
    },
    // 13. PS
    {
      id: 't1-q2e-13',
      type: 'numeric',
      difficulty: 3,
      topic: 'geo.solids',
      stem: r`A rectangular box has length 6 inches, width 3 inches, and height 2 inches. What is the length, in inches, of the longest line segment that joins two vertices of the box?`,
      suffix: 'inches',
      answer: { kind: 'decimal', value: 7 },
      explanation: r`The longest such segment joins opposite corners through the interior of the box. The diagonal of the $6 \times 3$ base is $\sqrt{6^2 + 3^2} = \sqrt{45}$. That diagonal and the height 2 are the legs of a right triangle whose hypotenuse is the space diagonal: $\sqrt{45 + 2^2} = \sqrt{49} = 7$. A common slip is to stop at a face diagonal, such as $\sqrt{45} \approx 6.7$.`,
      verify: () => {
        const verts: number[][] = [];
        for (const x of [0, 6]) for (const y of [0, 3]) for (const z of [0, 2]) verts.push([x, y, z]);
        let best = 0;
        for (const p of verts)
          for (const q of verts) best = Math.max(best, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]));
        return best;
      },
    },
    // 14. PS (multi)
    {
      id: 't1-q2e-14',
      type: 'mc-multi',
      difficulty: 3,
      topic: 'alg.sequences',
      stem: r`In a certain sequence, the first term is 2, and each term after the first is 2 less than 3 times the term before it. Which of the following numbers are terms of the sequence?<br><i>Indicate all such numbers.</i>`,
      options: ['4', '8', '10', '26', '28', '80', '82'],
      answer: [0, 2, 4, 6],
      explanation: r`Generate the terms: $2$, $3(2) - 2 = 4$, $3(4) - 2 = 10$, $3(10) - 2 = 28$, $3(28) - 2 = 82$, $244$, and so on. Of the choices, 4, 10, 28, and 82 are terms; 8, 26, and 80 are not.`,
      traps: [
        {
          option: 1,
          trap: 'misread',
          why: r`Reading "2 less than 3 times" as "2 more than 3 times" produces 2, 8, 26, 80, ..., which selects the wrong numbers.`,
        },
      ],
      verify: () => {
        const terms: number[] = [2];
        while (terms[terms.length - 1] < 1000) terms.push(3 * terms[terms.length - 1] - 2);
        return indicesWhere([4, 8, 10, 26, 28, 80, 82], (v) => terms.includes(v));
      },
    },
    // 15. PS
    {
      id: 't1-q2e-15',
      type: 'mc-single',
      difficulty: 3,
      topic: 'alg.coordinate',
      stem: r`In the $xy$-plane, a line passes through the points $(-2, 7)$ and $(4, -2)$. What is the $y$-intercept of the line?`,
      options: [r`$-8$`, r`$4$`, r`$5.5$`, r`$8.5$`, r`$10$`],
      answer: 1,
      explanation: r`The slope is $\frac{-2 - 7}{4 - (-2)} = \frac{-9}{6} = -\frac{3}{2}$. Moving from $(-2, 7)$ two units right to $x = 0$ changes $y$ by $2 \times \left(-\frac{3}{2}\right) = -3$, so the $y$-intercept is $7 - 3 = 4$. (Check with $(4, -2)$: moving 4 units left raises $y$ by 6, giving $-2 + 6 = 4$.)`,
      traps: [
        {
          option: 4,
          trap: 'calc-slip',
          why: r`Moving from $x = -2$ to $x = 0$ is a move to the right, so with a negative slope $y$ decreases; adding 3 instead of subtracting gives 10.`,
        },
      ],
      verify: () => {
        const m = (-2 - 7) / (4 - -2);
        const b = 7 - m * -2;
        return indexOfValue([-8, 4, 5.5, 8.5, 10], b);
      },
    },
  ],
};
