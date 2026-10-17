import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// DI data (t3-q2e-dA): 2025 expenses of a community theater, percent by category; total 80,000 dollars
const TOTAL = 80000;
const SHARE: Record<string, number> = {
  Salaries: 35,
  'Venue rental': 20,
  'Sets and costumes': 15,
  Marketing: 10,
  Insurance: 8,
  Other: 12,
};

export const set: QuestionSet = {
  testId: 't3',
  measure: 'quant',
  key: 's2-easy',
  passages: [],
  dataSets: [
    {
      id: 't3-q2e-dA',
      charts: [
        {
          kind: 'pie',
          title: 'Expenses of the Harbor Street Community Theater, 2025',
          slices: Object.entries(SHARE).map(([label, value]) => ({ label, value })),
          labelMode: 'percent',
          note: 'Total 2025 expenses: 80,000 dollars',
        },
      ],
    },
  ],
  questions: [
    // 1 ─ QC
    {
      id: 't3-q2e-01',
      type: 'qc',
      difficulty: 1,
      topic: 'arith.fractions-decimals',
      quantityA: r`$\frac{7}{9}$`,
      quantityB: r`$0.77$`,
      answer: 0,
      explanation: r`$\frac{7}{9} = 0.777\ldots$, which is greater than $0.770$. Quantity A is greater.`,
      verify: () => qcCompare([[7 / 9, 0.77]]),
    },
    // 2 ─ QC
    {
      id: 't3-q2e-02',
      type: 'qc',
      difficulty: 1,
      topic: 'alg.linear',
      info: r`$4(x - 2) = 2x + 6$`,
      quantityA: r`$2x$`,
      quantityB: r`$14$`,
      answer: 2,
      explanation: r`Expand: $4x - 8 = 2x + 6$, so $2x = 14$. The quantities are equal.`,
      verify: () =>
        qcCompare(
          range(-50, 50, 0.25)
            .filter((x) => 4 * (x - 2) === 2 * x + 6)
            .map((x) => [2 * x, 14] as [number, number]),
        ),
    },
    // 3 ─ QC
    {
      id: 't3-q2e-03',
      type: 'qc',
      difficulty: 2,
      topic: 'geo.lines-angles',
      figure: {
        kind: 'svg',
        svg: '<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg"><line x1="20" y1="60" x2="325" y2="60" stroke="black" stroke-width="2"/><line x1="20" y1="160" x2="325" y2="160" stroke="black" stroke-width="2"/><line x1="142" y1="205" x2="218" y2="15" stroke="black" stroke-width="2"/><text x="334" y="65" font-size="14" font-style="italic">k</text><text x="334" y="165" font-size="14" font-style="italic">m</text><text x="160" y="51" font-size="14">112°</text><text x="176" y="152" font-size="14" font-style="italic">y°</text></svg>',
      },
      info: r`In the figure, line $k$ is parallel to line $m$.`,
      quantityA: r`$y$`,
      quantityB: r`$70$`,
      answer: 1,
      explanation: r`At the intersection with line $k$, the angle to the right of the transversal (above $k$) is $180 - 112 = 68$ degrees, because it forms a straight line with the $112^{\circ}$ angle. Because $k \parallel m$, the angle marked $y^{\circ}$ is the corresponding angle at line $m$, so $y = 68$. Quantity B is greater.`,
      verify: () => {
        const upperRight = 180 - 112; // linear pair with the 112 degree angle
        const y = upperRight; // corresponding angles along the transversal
        return qcCompare([[y, 70]]);
      },
    },
    // 4 ─ QC
    {
      id: 't3-q2e-04',
      type: 'qc',
      difficulty: 3,
      topic: 'alg.quadratics',
      info: r`$x^{2} - 2x - 15 = 0$`,
      quantityA: r`$x^{2}$`,
      quantityB: r`$2x + 14$`,
      answer: 0,
      explanation: r`The equation says $x^{2} = 2x + 15$, so Quantity A is exactly 1 more than Quantity B for either root. (Check: $x = 5$ gives $25$ vs. $24$; $x = -3$ gives $9$ vs. $8$.) Quantity A is greater.`,
      traps: [
        { option: 3, trap: 'd-trap', why: 'The equation has two different roots, but both give the same relationship, so two roots do not automatically mean the answer cannot be determined.' },
      ],
      verify: () =>
        qcCompare(
          range(-20, 20, 0.5)
            .filter((x) => x * x - 2 * x - 15 === 0)
            .map((x) => [x * x, 2 * x + 14] as [number, number]),
        ),
    },
    // 5 ─ QC
    {
      id: 't3-q2e-05',
      type: 'qc',
      difficulty: 3,
      topic: 'arith.integers',
      info: r`When the positive integer $n$ is divided by 6, the remainder is 4.`,
      quantityA: r`The remainder when $n$ is divided by 4`,
      quantityB: r`$2$`,
      answer: 3,
      explanation: r`The possible values of $n$ are $4, 10, 16, 22, \ldots$. Divided by 4, these leave remainders $0, 2, 0, 2, \ldots$. If $n = 4$, B is greater; if $n = 10$, the quantities are equal. The relationship cannot be determined.`,
      traps: [
        { option: 2, trap: 'ignored-constraint', why: r`Testing only $n = 10$ or $n = 22$ (remainder 2) misses $n = 4$ and $n = 16$ (remainder 0).` },
        { option: 1, trap: 'ignored-constraint', why: r`Testing only $n = 4$ or $n = 16$ misses values such as $n = 10$.` },
      ],
      verify: () => qcCompare(range(0, 60).map((k) => [(6 * k + 4) % 4, 2] as [number, number])),
    },
    // 6 ─ PS
    {
      id: 't3-q2e-06',
      type: 'mc-single',
      difficulty: 1,
      topic: 'arith.ratios-rates',
      stem: 'A label printer produces 42 labels every 3 minutes. At this rate, how many labels will it produce in 25 minutes?',
      options: ['350', '360', '375', '400', '420'],
      answer: 0,
      explanation: r`The rate is $\frac{42}{3} = 14$ labels per minute, so in 25 minutes the printer produces $14 \times 25 = 350$ labels.`,
      verify: () => indexOfValue([350, 360, 375, 400, 420], (42 / 3) * 25),
    },
    // 7 ─ PS
    {
      id: 't3-q2e-07',
      type: 'numeric',
      difficulty: 2,
      topic: 'arith.percents',
      stem: 'In a survey of 250 commuters, 40 percent said they bike to work at least once a week. Of those who bike, 30 percent also take a train at least once a week. Of those who do not bike, 20 percent take a train at least once a week. What percent of the 250 commuters take a train at least once a week?',
      suffix: '%',
      answer: { kind: 'decimal', value: 24 },
      explanation: r`Bikers: $0.40 \times 250 = 100$, of whom $0.30 \times 100 = 30$ take a train. Non-bikers: 150, of whom $0.20 \times 150 = 30$ take a train. In all, 60 of 250 commuters take a train: $\frac{60}{250} = 24\%$.`,
      verify: () => {
        const bikers = 0.4 * 250;
        const train = 0.3 * bikers + 0.2 * (250 - bikers);
        return (train / 250) * 100;
      },
    },
    // 8 ─ PS
    {
      id: 't3-q2e-08',
      type: 'mc-single',
      difficulty: 2,
      topic: 'geo.polygons',
      stem: r`Each interior angle of a regular polygon measures $156^{\circ}$. How many sides does the polygon have?`,
      options: ['12', '13', '14', '15', '16'],
      answer: 3,
      explanation: r`Each exterior angle is $180^{\circ} - 156^{\circ} = 24^{\circ}$. The exterior angles of any polygon sum to $360^{\circ}$, so the polygon has $\frac{360}{24} = 15$ sides.`,
      verify: () => indexOfValue([12, 13, 14, 15, 16], range(3, 60).find((n) => Math.abs(((n - 2) * 180) / n - 156) < 1e-9) ?? NaN),
    },
    // 9 ─ PS
    {
      id: 't3-q2e-09',
      type: 'mc-multi',
      difficulty: 2,
      topic: 'alg.inequalities-abs',
      stem: r`Which of the following values of $x$ satisfy the inequality $|2x - 3| \leq 7$?<br><i>Indicate all such values.</i>`,
      options: ['−5', '−2', '1.5', '5', '7'],
      answer: [1, 2, 3],
      explanation: r`$|2x - 3| \leq 7$ means $-7 \leq 2x - 3 \leq 7$. Adding 3 gives $-4 \leq 2x \leq 10$, so $-2 \leq x \leq 5$. Of the choices, $-2$, $1.5$, and $5$ satisfy this (the endpoints are included).`,
      verify: () => indicesWhere([-5, -2, 1.5, 5, 7], (x) => Math.abs(2 * x - 3) <= 7),
    },
    // 10 ─ DI
    {
      id: 't3-q2e-10',
      type: 'mc-single',
      dataSetId: 't3-q2e-dA',
      difficulty: 1,
      topic: 'data.interpretation',
      stem: r`How much did the theater spend on venue rental in 2025?`,
      options: [r`\$8,000`, r`\$12,000`, r`\$16,000`, r`\$20,000`, r`\$28,000`],
      answer: 2,
      explanation: r`Venue rental was 20% of the \$80,000 total: $0.20 \times 80{,}000 = 16{,}000$ dollars.`,
      verify: () => indexOfValue([8000, 12000, 16000, 20000, 28000], (SHARE['Venue rental'] / 100) * TOTAL),
    },
    // 11 ─ DI
    {
      id: 't3-q2e-11',
      type: 'numeric',
      dataSetId: 't3-q2e-dA',
      difficulty: 2,
      topic: 'data.interpretation',
      stem: 'In 2025, how many more dollars did the theater spend on salaries than on venue rental?',
      prefix: r`\$`,
      answer: { kind: 'decimal', value: 12000 },
      explanation: r`Salaries were 35% and venue rental 20% of the total, a difference of 15 percentage points: $0.15 \times 80{,}000 = 12{,}000$ dollars.`,
      verify: () => ((SHARE.Salaries - SHARE['Venue rental']) / 100) * TOTAL,
    },
    // 12 ─ DI
    {
      id: 't3-q2e-12',
      type: 'mc-single',
      dataSetId: 't3-q2e-dA',
      difficulty: 3,
      topic: 'data.interpretation',
      stem: r`Suppose the theater had spent an additional \$4,000 on marketing in 2025, with the amounts for all other categories unchanged. Marketing would then have accounted for approximately what percent of the theater’s total 2025 expenses?`,
      options: ['12%', '14%', '15%', '18%', '20%'],
      answer: 1,
      explanation: r`Marketing was $0.10 \times 80{,}000 = 8{,}000$ dollars; it would become 12,000 dollars, and the total would become 84,000 dollars. $\frac{12{,}000}{84{,}000} \approx 0.143$, or about 14%.`,
      traps: [
        { option: 2, trap: 'ignored-constraint', why: r`Dividing 12,000 by the original 80,000 gives 15%, but the extra \$4,000 also raises the total to \$84,000.` },
      ],
      verify: () => {
        const mk = (SHARE.Marketing / 100) * TOTAL + 4000;
        const pct = (mk / (TOTAL + 4000)) * 100;
        const opts = [12, 14, 15, 18, 20];
        const best = opts.reduce((b, o) => (Math.abs(o - pct) < Math.abs(b - pct) ? o : b));
        return opts.indexOf(best);
      },
    },
    // 13 ─ PS
    {
      id: 't3-q2e-13',
      type: 'mc-single',
      difficulty: 3,
      topic: 'data.combinatorics',
      stem: 'A café makes sandwiches using 4 kinds of bread, 5 fillings, and 3 sauces. Each sandwich has exactly 1 kind of bread and exactly 1 filling, and it has either exactly 1 sauce or no sauce. How many different sandwiches are possible?',
      options: ['12', '23', '60', '64', '80'],
      answer: 4,
      explanation: r`There are 4 choices of bread, 5 of filling, and 4 sauce choices (3 sauces or none). By the multiplication principle, $4 \times 5 \times 4 = 80$.`,
      traps: [
        { option: 2, trap: 'ignored-constraint', why: r`$4 \times 5 \times 3 = 60$ forgets that "no sauce" is a fourth sauce option.` },
        { option: 0, trap: 'wrong-formula', why: 'Adding the choices (4 + 5 + 3) instead of multiplying them.' },
      ],
      verify: () => {
        const sandwiches = new Set<string>();
        for (const b of ['b1', 'b2', 'b3', 'b4'])
          for (const f of ['f1', 'f2', 'f3', 'f4', 'f5'])
            for (const s of ['none', 's1', 's2', 's3']) sandwiches.add(`${b}-${f}-${s}`);
        return indexOfValue([12, 23, 60, 64, 80], sandwiches.size);
      },
    },
    // 14 ─ PS
    {
      id: 't3-q2e-14',
      type: 'numeric',
      difficulty: 3,
      topic: 'geo.solids',
      stem: 'A rectangular glass tank has a base that measures 8 inches by 5 inches and a height of 12 inches. The tank contains water to a depth of 6 inches. A solid metal cube with edges 4 inches long is placed in the tank and rests on the bottom. What is the new depth of the water, in inches?',
      suffix: 'inches',
      answer: { kind: 'decimal', value: 7.6 },
      explanation: r`The water’s volume is $8 \times 5 \times 6 = 240$ cubic inches, and the cube is fully submerged (its height, 4, is less than the water depth), so it displaces $4^{3} = 64$ cubic inches. The new depth is $\frac{240 + 64}{8 \times 5} = \frac{304}{40} = 7.6$ inches. (A common slip is to subtract the cube’s base area from the tank’s base area, which is only valid for a solid that is not fully submerged.)`,
      verify: () => {
        // raise the level in tiny steps until the water volume (tank volume below level minus cube part below level) reaches 240
        const water = 8 * 5 * 6;
        let h = 0;
        while (8 * 5 * h - 16 * Math.min(h, 4) < water - 1e-12) h += 0.0001;
        return Math.round(h * 1000) / 1000;
      },
    },
    // 15 ─ PS
    {
      id: 't3-q2e-15',
      type: 'mc-single',
      difficulty: 2,
      topic: 'alg.sequences',
      stem: r`In a sequence, $a_{1} = 3$, and $a_{n} = 2a_{n-1} - 1$ for each integer $n \geq 2$. What is the value of $a_{8}$?`,
      options: ['129', '255', '257', '513', '1,025'],
      answer: 2,
      explanation: r`Compute term by term: $3, 5, 9, 17, 33, 65, 129, 257$. So $a_{8} = 257$. (Each term is $2^{n} + 1$.)`,
      verify: () => {
        let a = 3;
        for (let n = 2; n <= 8; n++) a = 2 * a - 1;
        return indexOfValue([129, 255, 257, 513, 1025], a);
      },
    },
  ],
};
