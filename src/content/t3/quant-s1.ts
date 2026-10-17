import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, combos, mean, median } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// DI data (t3-q1-dA): e-bikes sold by Shop K, by quarter
const SOLD_2024 = [120, 180, 240, 160];
const SOLD_2025 = [150, 171, 300, 219];

export const set: QuestionSet = {
  testId: 't3',
  measure: 'quant',
  key: 's1',
  passages: [],
  dataSets: [
    {
      id: 't3-q1-dA',
      charts: [
        {
          kind: 'bar',
          title: 'Number of E-Bikes Sold by Shop K, by Quarter, 2024 and 2025',
          categories: ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'],
          series: [
            { name: '2024', values: SOLD_2024 },
            { name: '2025', values: SOLD_2025 },
          ],
          xLabel: 'Quarter',
          yLabel: 'Number of e-bikes',
          yMin: 0,
          yMax: 350,
          yStep: 50,
          showValues: true,
        },
      ],
    },
  ],
  questions: [
    // 1 ─ QC
    {
      id: 't3-q1-01',
      type: 'qc',
      difficulty: 2,
      topic: 'arith.exponents-roots',
      quantityA: r`$3^{8} + 3^{8} + 3^{8}$`,
      quantityB: r`$9^{4.5}$`,
      answer: 2,
      explanation: r`Quantity A is $3 \cdot 3^{8} = 3^{9}$. Quantity B is $(3^{2})^{4.5} = 3^{9}$. The two quantities are equal.`,
      traps: [
        { option: 0, trap: 'wrong-formula', why: r`Adding exponents ($3^{8} + 3^{8} + 3^{8} = 3^{24}$) instead of recognizing $3 \cdot 3^{8} = 3^{9}$.` },
      ],
      verify: () => qcCompare([[3 ** 8 + 3 ** 8 + 3 ** 8, 9 ** 4.5]]),
    },
    // 2 ─ QC
    {
      id: 't3-q1-02',
      type: 'qc',
      difficulty: 3,
      topic: 'alg.inequalities-abs',
      info: r`$x^{2} < 4x$`,
      quantityA: r`$x$`,
      quantityB: r`$\frac{x^{2}}{4}$`,
      answer: 0,
      explanation: r`Divide both sides of $x^{2} < 4x$ by the positive number 4: $\frac{x^{2}}{4} < x$. So Quantity A is greater for every $x$ that satisfies the condition. (Equivalently, the condition forces $0 < x < 4$, and on that interval $\frac{x^{2}}{4} = x \cdot \frac{x}{4} < x$.)`,
      traps: [
        { option: 3, trap: 'ignored-constraint', why: r`Testing values such as $x = 8$ or $x = -2$, where B would be greater or the comparison changes; those values do not satisfy $x^{2} < 4x$.` },
      ],
      verify: () =>
        qcCompare(
          range(-10, 10, 0.01)
            .filter((x) => x * x < 4 * x)
            .map((x) => [x, (x * x) / 4] as [number, number]),
        ),
    },
    // 3 ─ QC
    {
      id: 't3-q1-03',
      type: 'qc',
      difficulty: 3,
      topic: 'data.statistics',
      info: r`The list $4, 9, 12, 15, x$ consists of five numbers, where $x > 15$.`,
      quantityA: 'The average (arithmetic mean) of the five numbers',
      quantityB: 'The median of the five numbers',
      answer: 3,
      explanation: r`Because $x > 15$, the ordered list is $4, 9, 12, 15, x$, so the median is 12. The mean is $\frac{40 + x}{5}$, which equals 12 exactly when $x = 20$. If $x = 16$, the mean is 11.2 (B greater); if $x = 30$, the mean is 14 (A greater). The relationship cannot be determined.`,
      traps: [
        { option: 0, trap: 'misread', why: r`Assuming a large $x$ always pulls the mean above the median; values of $x$ between 15 and 20 keep the mean below 12.` },
        { option: 1, trap: 'ignored-constraint', why: r`Testing only $x = 16$ (mean 11.2) and stopping; larger values of $x$ make the mean exceed 12.` },
      ],
      verify: () =>
        qcCompare(
          range(15.1, 80, 0.1).map((x) => {
            const L = [4, 9, 12, 15, x];
            return [mean(L), median(L)] as [number, number];
          }),
        ),
    },
    // 4 ─ QC
    {
      id: 't3-q1-04',
      type: 'qc',
      difficulty: 4,
      topic: 'geo.triangles',
      info: r`In triangle $PQR$, $PQ = 8$, $QR = 5$, and $\angle PQR > 90^{\circ}$.`,
      quantityA: r`The area of triangle $PQR$`,
      quantityB: r`$20$`,
      answer: 1,
      explanation: r`Use $\overline{PQ}$ as the base. The height is the perpendicular distance from $R$ to line $PQ$, which is at most $QR = 5$, and equals 5 only if $\angle PQR = 90^{\circ}$. Since the angle is obtuse, the height is less than 5, so the area is less than $\frac{1}{2}(8)(5) = 20$. Quantity B is greater.`,
      traps: [
        { option: 3, trap: 'd-trap', why: 'The area does vary with the angle, but every obtuse angle gives an area strictly below 20, so the comparison is still determined.' },
        { option: 2, trap: 'wrong-formula', why: r`Computing $\frac{1}{2}(8)(5)$ treats 8 and 5 as base and height, which is true only for a right angle at $Q$.` },
      ],
      verify: () =>
        qcCompare(range(90.1, 179.9, 0.1).map((deg) => [0.5 * 8 * 5 * Math.sin((deg * Math.PI) / 180), 20] as [number, number])),
    },
    // 5 ─ PS
    {
      id: 't3-q1-05',
      type: 'mc-single',
      difficulty: 3,
      topic: 'arith.percents',
      stem: 'A reseller marked up the price of a used camera by 25 percent. Weeks later, the reseller set a clearance price that was 10 percent less than the camera’s original price. The clearance price was what percent less than the marked-up price?',
      options: ['15%', '25%', '28%', '30%', '35%'],
      answer: 2,
      explanation: r`Let the original price be 100. The marked-up price is 125 and the clearance price is 90. The decrease is $125 - 90 = 35$, measured against 125: $\frac{35}{125} = 0.28$, or 28%.`,
      traps: [
        { option: 4, trap: 'wrong-formula', why: 'Adding 25% and 10% ignores that the decrease is measured from the larger, marked-up price.' },
        { option: 0, trap: 'wrong-formula', why: 'Subtracting the percents (25% − 10%) has no meaning here; percent changes do not combine by addition or subtraction.' },
      ],
      verify: () => {
        const P = 100;
        const up = P * 1.25;
        const clr = P * 0.9;
        return indexOfValue([15, 25, 28, 30, 35], ((up - clr) / up) * 100);
      },
    },
    // 6 ─ PS
    {
      id: 't3-q1-06',
      type: 'numeric',
      difficulty: 2,
      topic: 'alg.linear',
      stem: r`A ferry charges \$18 for each adult ticket and \$11 for each child ticket. On one crossing, the ferry sold 140 tickets for a total of \$2,107. How many child tickets were sold?`,
      answer: { kind: 'decimal', value: 59 },
      explanation: r`Let $c$ be the number of child tickets, so $140 - c$ adult tickets were sold. Then $18(140 - c) + 11c = 2{,}107$, so $2{,}520 - 7c = 2{,}107$ and $c = 59$. Check: $81 \times 18 + 59 \times 11 = 1{,}458 + 649 = 2{,}107$.`,
      verify: () => range(0, 140).find((c) => 18 * (140 - c) + 11 * c === 2107) ?? NaN,
    },
    // 7 ─ PS
    {
      id: 't3-q1-07',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'arith.integers',
      stem: r`If $m$ and $n$ are positive integers and $m^{2} - n^{2} = 45$, which of the following could be the value of $m$?<br><i>Indicate all such values.</i>`,
      options: ['5', '7', '9', '11', '15', '23', '45'],
      answer: [1, 2, 5],
      explanation: r`Factor: $(m - n)(m + n) = 45$ with $0 < m - n < m + n$. The factor pairs are $1 \times 45$, $3 \times 15$, and $5 \times 9$, giving $m = \frac{1 + 45}{2} = 23$, $m = \frac{3 + 15}{2} = 9$, and $m = \frac{5 + 9}{2} = 7$. So $m$ can be 7, 9, or 23 (with $n = 2, 6, 22$).`,
      traps: [
        { option: 6, trap: 'misread', why: r`45 is the value of $m + n$ in the pair $1 \times 45$, not $m$; if $m = 45$, $n^{2} = 1{,}980$, which is not a perfect square.` },
        { option: 4, trap: 'misread', why: r`15 is $m + n$ in the pair $3 \times 15$; the corresponding $m$ is 9.` },
      ],
      verify: () => indicesWhere([5, 7, 9, 11, 15, 23, 45], (m) => range(1, 200).some((n) => m * m - n * n === 45)),
    },
    // 8 ─ PS
    {
      id: 't3-q1-08',
      type: 'mc-single',
      difficulty: 3,
      topic: 'geo.circles',
      stem: r`A sector of a circle has area $24\pi$ and arc length $4\pi$. What is the perimeter of the sector (the sum of its two radii and its arc length)?`,
      options: [r`$6 + 4\pi$`, r`$12 + 4\pi$`, r`$12 + 8\pi$`, r`$16 + 4\pi$`, r`$24 + 4\pi$`],
      answer: 4,
      explanation: r`For a central angle $\theta$, the area is $\frac{\theta}{360}\pi r^{2}$ and the arc is $\frac{\theta}{360}(2\pi r)$, so area $= \frac{r}{2} \times$ arc. Then $24\pi = \frac{r}{2}(4\pi)$ gives $r = 12$ (and $\theta = 60^{\circ}$). The perimeter is $2(12) + 4\pi = 24 + 4\pi$.`,
      traps: [
        { option: 1, trap: 'misread', why: 'Using the radius 12 only once; the boundary of a sector includes two radii.' },
      ],
      verify: () => {
        let per = NaN;
        for (const rad of range(1, 60))
          for (const th of range(1, 359)) {
            const area = (th / 360) * Math.PI * rad * rad;
            const arc = (th / 360) * 2 * Math.PI * rad;
            if (Math.abs(area - 24 * Math.PI) < 1e-9 && Math.abs(arc - 4 * Math.PI) < 1e-9) per = 2 * rad + arc;
          }
        const pi = Math.PI;
        return indexOfValue([6 + 4 * pi, 12 + 4 * pi, 12 + 8 * pi, 16 + 4 * pi, 24 + 4 * pi], per);
      },
    },
    // 9 ─ DI
    {
      id: 't3-q1-09',
      type: 'mc-single',
      dataSetId: 't3-q1-dA',
      difficulty: 1,
      topic: 'data.interpretation',
      stem: 'What was the total number of e-bikes Shop K sold from January through June of 2025?',
      options: ['300', '321', '330', '351', '390'],
      answer: 1,
      explanation: 'January through June is the first two quarters. In 2025 the shop sold 150 (Jan-Mar) + 171 (Apr-Jun) = 321 e-bikes.',
      verify: () => indexOfValue([300, 321, 330, 351, 390], SOLD_2025[0] + SOLD_2025[1]),
    },
    // 10 ─ DI
    {
      id: 't3-q1-10',
      type: 'numeric',
      dataSetId: 't3-q1-dA',
      difficulty: 3,
      topic: 'data.interpretation',
      stem: r`Shop K’s average selling price per e-bike was \$1,250 in 2024 and \$1,200 in 2025. By what percent did the shop’s total revenue from e-bike sales increase from 2024 to 2025?`,
      suffix: '%',
      answer: { kind: 'decimal', value: 15.2 },
      explanation: r`Total sales: 2024 $= 120 + 180 + 240 + 160 = 700$; 2025 $= 150 + 171 + 300 + 219 = 840$. Revenue: $700 \times 1{,}250 = 875{,}000$ and $840 \times 1{,}200 = 1{,}008{,}000$. The increase is $\frac{133{,}000}{875{,}000} = 0.152$, or 15.2%. (Trap: units rose 20% and price fell 4%, but $20 - 4 = 16$ is wrong; the changes multiply, $1.2 \times 0.96 = 1.152$.)`,
      verify: () => {
        const rev24 = SOLD_2024.reduce((a, b) => a + b, 0) * 1250;
        const rev25 = SOLD_2025.reduce((a, b) => a + b, 0) * 1200;
        return ((rev25 - rev24) / rev24) * 100;
      },
    },
    // 11 ─ PS
    {
      id: 't3-q1-11',
      type: 'mc-single',
      difficulty: 3,
      topic: 'alg.coordinate',
      stem: r`In the $xy$-plane, line $\ell$ passes through the points $(-2, 5)$ and $(4, -7)$. Line $k$ is perpendicular to line $\ell$ and passes through the point $(6, 1)$. What is the $x$-intercept of line $k$?`,
      options: ['−8', '−4', '2', '4', '8'],
      answer: 3,
      explanation: r`The slope of $\ell$ is $\frac{-7 - 5}{4 - (-2)} = -2$, so the slope of $k$ is the negative reciprocal, $\frac{1}{2}$. Line $k$: $y - 1 = \frac{1}{2}(x - 6)$. Setting $y = 0$ gives $x - 6 = -2$, so $x = 4$.`,
      traps: [
        { option: 4, trap: 'wrong-formula', why: r`Using slope $-\frac{1}{2}$ (reciprocal without the sign change) gives $x = 8$.` },
      ],
      verify: () => {
        const sl = (-7 - 5) / (4 - -2);
        const sk = -1 / sl;
        // y - 1 = sk (x - 6), y = 0
        const xInt = 6 - 1 / sk;
        return indexOfValue([-8, -4, 2, 4, 8], xInt);
      },
    },
    // 12 ─ PS
    {
      id: 't3-q1-12',
      type: 'numeric',
      difficulty: 5,
      topic: 'data.probability',
      stem: 'A seed packet contains 9 seeds: 4 sunflower, 3 marigold, and 2 zinnia. A gardener selects 3 of the seeds at random, without replacement. Given that at least one of the selected seeds is a sunflower seed, what is the probability that all 3 selected seeds are sunflower seeds?<br><i>Give your answer as a fraction.</i>',
      answer: { kind: 'fraction', num: 2, den: 37 },
      explanation: r`There are $\binom{9}{3} = 84$ equally likely selections. Selections with no sunflower seed: $\binom{5}{3} = 10$, so 74 selections contain at least one. Selections with all sunflower seeds: $\binom{4}{3} = 4$. The conditional probability is $\frac{4}{74} = \frac{2}{37}$. (Trap: $\frac{4}{84} = \frac{1}{21}$ ignores the condition, which shrinks the sample space to the 74 selections with at least one sunflower seed.)`,
      verify: () => {
        const seeds: string[] = [];
        for (let i = 0; i < 9; i++) seeds.push((i < 4 ? 'S' : i < 7 ? 'M' : 'Z') + i);
        const all = combos(seeds, 3);
        const atLeast = all.filter((c) => c.some((s) => s[0] === 'S'));
        const allS = atLeast.filter((c) => c.every((s) => s[0] === 'S'));
        return allS.length / atLeast.length;
      },
    },
  ],
};
