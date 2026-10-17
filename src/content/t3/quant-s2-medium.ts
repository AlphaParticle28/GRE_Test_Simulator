import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, median } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// DI data (t3-q2m-dA): visitors (in thousands) to five state parks
const PARKS = ['Alder Ridge', 'Birch Hollow', 'Cedar Falls', 'Dune Point', 'Elk Meadow'];
const V2022 = [48, 75, 120, 32, 125];
const V2024 = [60, 69, 150, 44, 140];
const total = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const set: QuestionSet = {
  testId: 't3',
  measure: 'quant',
  key: 's2-medium',
  passages: [],
  dataSets: [
    {
      id: 't3-q2m-dA',
      charts: [
        {
          kind: 'table',
          title: 'Number of Visitors to Five State Parks, 2022 and 2024 (in thousands)',
          columns: ['State Park', '2022', '2024'],
          rows: PARKS.map((p, i) => [p, V2022[i], V2024[i]]),
        },
      ],
    },
  ],
  questions: [
    // 1 ─ QC
    {
      id: 't3-q2m-01',
      type: 'qc',
      difficulty: 2,
      topic: 'arith.ratios-rates',
      info: 'In a choir, the ratio of altos to sopranos is 3 to 5, and there are 6 more sopranos than altos.',
      quantityA: 'The total number of altos and sopranos in the choir',
      quantityB: r`$24$`,
      answer: 2,
      explanation: r`Write the numbers as $3k$ altos and $5k$ sopranos. The difference is $2k = 6$, so $k = 3$, giving 9 altos and 15 sopranos, a total of $8k = 24$. The quantities are equal.`,
      verify: () => {
        const cases = range(1, 200)
          .filter((a) => (a + 6) * 3 === a * 5)
          .map((a) => [a + (a + 6), 24] as [number, number]);
        return qcCompare(cases);
      },
    },
    // 2 ─ QC
    {
      id: 't3-q2m-02',
      type: 'qc',
      difficulty: 3,
      topic: 'alg.functions',
      info: r`$f(x) = x^{2} - 6x$ for all numbers $x$, and $f(t) = -5$.`,
      quantityA: r`$t$`,
      quantityB: r`$3$`,
      answer: 3,
      explanation: r`$t^{2} - 6t = -5$ gives $t^{2} - 6t + 5 = 0$, or $(t - 1)(t - 5) = 0$. So $t = 1$ (B greater) or $t = 5$ (A greater). The relationship cannot be determined.`,
      traps: [
        { option: 0, trap: 'ignored-constraint', why: r`Finding only the root $t = 5$; the root $t = 1$ also satisfies $f(t) = -5$.` },
        { option: 2, trap: 'misread', why: r`3 is the $x$-coordinate of the vertex of the parabola, which is the average of the two roots, not a root.` },
      ],
      verify: () =>
        qcCompare(
          range(-20, 20, 0.5)
            .filter((t) => t * t - 6 * t === -5)
            .map((t) => [t, 3] as [number, number]),
        ),
    },
    // 3 ─ QC
    {
      id: 't3-q2m-03',
      type: 'qc',
      difficulty: 3,
      topic: 'data.distributions',
      info: 'The weights of the packages a courier handled last month were approximately normally distributed, with a mean of 480 grams and a standard deviation of 60 grams.',
      quantityA: 'The percent of the packages that weighed between 420 grams and 600 grams',
      quantityB: r`$84\%$`,
      answer: 1,
      explanation: r`420 grams is 1 standard deviation below the mean and 600 grams is 2 standard deviations above it. About 34% of a normal distribution lies within 1 standard deviation below the mean and about 47.5% within 2 standard deviations above it, so Quantity A is about $34\% + 47.5\% = 81.5\%$ (a more precise value is about 81.9%). Quantity B is greater.`,
      traps: [
        { option: 2, trap: 'ignored-constraint', why: 'About 84% of the packages weigh more than 420 grams, but the roughly 2.5% heavier than 600 grams must be excluded.' },
      ],
      verify: () => {
        const z1 = (420 - 480) / 60;
        const z2 = (600 - 480) / 60;
        const phi = (z: number) => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
        const N = 2000;
        const h = (z2 - z1) / N;
        let s = 0;
        for (let i = 0; i <= N; i++) s += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * phi(z1 + i * h);
        const exact = ((s * h) / 3) * 100;
        const rule = 34 + 47.5; // 68-95-99.7 approximation
        return qcCompare([[exact, 84], [rule, 84]]);
      },
    },
    // 4 ─ QC
    {
      id: 't3-q2m-04',
      type: 'qc',
      difficulty: 4,
      topic: 'geo.circles',
      info: 'A circle is inscribed in an equilateral triangle with sides of length 6.',
      quantityA: 'The area of the circle',
      quantityB: 'One-half the area of the triangle',
      answer: 0,
      explanation: r`The triangle’s area is $\frac{\sqrt{3}}{4}(6^{2}) = 9\sqrt{3}$. The inradius of an equilateral triangle is one-third of its height: $\frac{1}{3}(3\sqrt{3}) = \sqrt{3}$, so the circle’s area is $3\pi \approx 9.42$. Half the triangle’s area is $4.5\sqrt{3} \approx 7.79$. Quantity A is greater.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`Guessing that a circle inside the triangle covers less than half of it, or using a radius smaller than the inradius $\sqrt{3}$; the inscribed circle covers $\frac{\pi}{3\sqrt{3}} \approx 60\%$ of the triangle.` },
      ],
      verify: () => {
        const side = 6;
        const triArea = (Math.sqrt(3) / 4) * side * side;
        const inr = triArea / ((3 * side) / 2); // area = inradius x semiperimeter
        return qcCompare([[Math.PI * inr * inr, triArea / 2]]);
      },
    },
    // 5 ─ QC
    {
      id: 't3-q2m-05',
      type: 'qc',
      difficulty: 4,
      topic: 'arith.exponents-roots',
      info: r`$\sqrt{x^{2}} = -x$`,
      quantityA: r`$x$`,
      quantityB: r`$0$`,
      answer: 3,
      explanation: r`For every real number, $\sqrt{x^{2}} = |x|$. The equation $|x| = -x$ holds exactly when $x \leq 0$. If $x = 0$, the quantities are equal; if $x = -2$, Quantity B is greater. The relationship cannot be determined.`,
      traps: [
        { option: 1, trap: 'ignored-constraint', why: r`Concluding that $x$ must be negative; $x = 0$ also satisfies $\sqrt{0^{2}} = -0$.` },
        { option: 2, trap: 'wrong-formula', why: r`Treating $\sqrt{x^{2}}$ as $x$ turns the equation into $x = -x$, so $x = 0$; but $\sqrt{x^{2}} = |x|$, which allows every negative $x$ too.` },
      ],
      verify: () =>
        qcCompare(
          range(-10, 10, 0.25)
            .filter((x) => Math.sqrt(x * x) === -x)
            .map((x) => [x, 0] as [number, number]),
        ),
    },
    // 6 ─ PS
    {
      id: 't3-q2m-06',
      type: 'mc-single',
      difficulty: 3,
      topic: 'alg.word-problems',
      stem: 'A theater had 3 times as many orchestra seats as balcony seats. A renovation removed 60 orchestra seats and added 120 balcony seats, after which the theater had twice as many orchestra seats as balcony seats. How many seats did the theater have before the renovation?',
      options: ['900', '1,080', '1,200', '1,260', '1,500'],
      answer: 2,
      explanation: r`Let $b$ be the original number of balcony seats, so there were $3b$ orchestra seats. After the renovation, $3b - 60 = 2(b + 120)$, so $b = 300$. The original total was $300 + 900 = 1{,}200$. (Check: $840 = 2 \times 420$.)`,
      traps: [
        { option: 3, trap: 'misread', why: r`1,260 is the total after the renovation ($840 + 420$), not before.` },
        { option: 0, trap: 'misread', why: '900 is the original number of orchestra seats only.' },
      ],
      verify: () => {
        const b = range(1, 3000).find((x) => 3 * x - 60 === 2 * (x + 120)) ?? NaN;
        return indexOfValue([900, 1080, 1200, 1260, 1500], 4 * b);
      },
    },
    // 7 ─ PS
    {
      id: 't3-q2m-07',
      type: 'numeric',
      difficulty: 3,
      topic: 'geo.triangles',
      figure: {
        kind: 'svg',
        svg: '<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg"><polygon points="50,75 50,210 230,210" fill="none" stroke="black" stroke-width="2"/><line x1="50" y1="210" x2="114.8" y2="123.6" stroke="black" stroke-width="2"/><polyline points="50,198 62,198 62,210" fill="none" stroke="black" stroke-width="1"/><polyline points="122.8,129.6 116.8,137.6 108.8,131.6" fill="none" stroke="black" stroke-width="1"/><text x="36" y="72" font-size="14" font-style="italic">A</text><text x="34" y="226" font-size="14" font-style="italic">B</text><text x="236" y="226" font-size="14" font-style="italic">C</text><text x="120" y="116" font-size="14" font-style="italic">D</text><text x="34" y="148" font-size="14">9</text><text x="134" y="228" font-size="14">12</text></svg>',
      },
      stem: r`In right triangle $ABC$ shown, $\angle ABC = 90^{\circ}$, $AB = 9$, and $BC = 12$. Point $D$ lies on $\overline{AC}$, and $\overline{BD}$ is perpendicular to $\overline{AC}$. What is the length of $\overline{AD}$?`,
      answer: { kind: 'decimal', value: 5.4 },
      explanation: r`By the Pythagorean theorem, $AC = \sqrt{9^{2} + 12^{2}} = 15$. Triangles $ADB$ and $ABC$ are similar (each has a right angle and they share $\angle A$), so $\frac{AD}{AB} = \frac{AB}{AC}$. Then $AD = \frac{9^{2}}{15} = \frac{81}{15} = 5.4$.`,
      verify: () => {
        // B at origin, A = (0, 9), C = (12, 0); D = foot of perpendicular from B to line AC
        const A = [0, 9], C = [12, 0];
        const dx = C[0] - A[0], dy = C[1] - A[1];
        const t = ((0 - A[0]) * dx + (0 - A[1]) * dy) / (dx * dx + dy * dy);
        const D = [A[0] + t * dx, A[1] + t * dy];
        return Math.hypot(D[0] - A[0], D[1] - A[1]);
      },
    },
    // 8 ─ PS
    {
      id: 't3-q2m-08',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'data.statistics',
      stem: r`A number $x$ is added to the list $3, 7, 8, 12, 15$ to form a list of six numbers. Which of the following could be the median of the new list?<br><i>Indicate all such values.</i>`,
      options: ['7', '7.5', '8', '9.25', '10', '10.5', '12'],
      answer: [1, 2, 3, 4],
      explanation: r`The median of six numbers is the average of the 3rd and 4th values. If $x \leq 7$, these are 7 and 8 (median 7.5). If $7 \leq x \leq 12$, they are $x$ and 8 in some order, so the median $\frac{x + 8}{2}$ runs from 7.5 to 10. If $x \geq 12$, they are 8 and 12 (median 10). So the median can be any number from 7.5 to 10: 7.5, 8, 9.25 (when $x = 10.5$), and 10.`,
      traps: [
        { option: 5, trap: 'misread', why: r`10.5 is the value of $x$ that makes the median 9.25, not a possible median.` },
        { option: 0, trap: 'ignored-constraint', why: 'A small x can only push the 3rd and 4th values down to 7 and 8; the median never drops below 7.5.' },
      ],
      verify: () => {
        const meds = range(-20, 40, 0.05).map((x) => median([3, 7, 8, 12, 15, x]));
        return indicesWhere([7, 7.5, 8, 9.25, 10, 10.5, 12], (v) => meds.some((m) => Math.abs(m - v) < 1e-9));
      },
    },
    // 9 ─ PS
    {
      id: 't3-q2m-09',
      type: 'mc-single',
      difficulty: 3,
      topic: 'alg.coordinate',
      stem: r`In the $xy$-plane, point $P$ lies on the line segment with endpoints $(-3, 2)$ and $(5, 8)$, and the distance from $P$ to $(-3, 2)$ is 2.5. What are the coordinates of $P$?`,
      options: [r`$(1, 5)$`, r`$(3, 6.5)$`, r`$(-2, 3.5)$`, r`$(-1, 4)$`, r`$(-1, 3.5)$`],
      answer: 4,
      explanation: r`The segment has length $\sqrt{8^{2} + 6^{2}} = 10$, so $P$ is $\frac{2.5}{10} = \frac{1}{4}$ of the way from $(-3, 2)$ to $(5, 8)$: $P = \left(-3 + \frac{8}{4},\ 2 + \frac{6}{4}\right) = (-1, 3.5)$.`,
      traps: [
        { option: 0, trap: 'misread', why: r`$(1, 5)$ is the midpoint of the segment, which is 5 units from $(-3, 2)$.` },
        { option: 1, trap: 'misread', why: r`$(3, 6.5)$ is 2.5 units from the other endpoint, $(5, 8)$.` },
      ],
      verify: () => {
        let P: [number, number] = [NaN, NaN];
        for (let i = 0; i <= 10000; i++) {
          const t = i / 10000;
          const x = -3 + 8 * t, y = 2 + 6 * t;
          if (Math.abs(Math.hypot(x + 3, y - 2) - 2.5) < 1e-9) P = [x, y];
        }
        const opts: [number, number][] = [[1, 5], [3, 6.5], [-2, 3.5], [-1, 4], [-1, 3.5]];
        return opts.findIndex((o) => Math.hypot(o[0] - P[0], o[1] - P[1]) < 1e-9);
      },
    },
    // 10 ─ DI
    {
      id: 't3-q2m-10',
      type: 'mc-single',
      dataSetId: 't3-q2m-dA',
      difficulty: 2,
      topic: 'data.interpretation',
      stem: 'Which of the five parks had the greatest percent increase in the number of visitors from 2022 to 2024?',
      options: PARKS,
      answer: 3,
      explanation: r`Percent changes: Alder Ridge $\frac{12}{48} = 25\%$, Birch Hollow $-8\%$, Cedar Falls $\frac{30}{120} = 25\%$, Dune Point $\frac{12}{32} = 37.5\%$, Elk Meadow $\frac{15}{125} = 12\%$. Dune Point had the greatest percent increase.`,
      traps: [
        { option: 2, trap: 'misread', why: 'Cedar Falls had the greatest increase in number of visitors (30 thousand), but its percent increase is only 25%.' },
      ],
      verify: () => {
        const pct = V2022.map((v, i) => (V2024[i] - v) / v);
        return pct.indexOf(Math.max(...pct));
      },
    },
    // 11 ─ DI
    {
      id: 't3-q2m-11',
      type: 'numeric',
      dataSetId: 't3-q2m-dA',
      difficulty: 3,
      topic: 'data.interpretation',
      stem: 'By what percent did the total number of visitors to the five parks increase from 2022 to 2024?',
      suffix: '%',
      answer: { kind: 'decimal', value: 15.75 },
      explanation: r`Total for 2022: $48 + 75 + 120 + 32 + 125 = 400$ thousand. Total for 2024: $60 + 69 + 150 + 44 + 140 = 463$ thousand. The increase is $\frac{63}{400} = 0.1575$, or 15.75%. (Averaging the five parks’ percent changes gives 18.3%, which is wrong because the parks have different sizes.)`,
      verify: () => ((total(V2024) - total(V2022)) / total(V2022)) * 100,
    },
    // 12 ─ DI
    {
      id: 't3-q2m-12',
      type: 'mc-multi',
      dataSetId: 't3-q2m-dA',
      difficulty: 4,
      topic: 'data.interpretation',
      stem: 'For which of the parks was the park’s share of the five-park total number of visitors greater in 2024 than in 2022?<br><i>Indicate all such parks.</i>',
      options: PARKS,
      answer: [0, 2, 3],
      explanation: r`A park’s share rises exactly when its percent increase exceeds the total’s percent increase, 15.75%. Alder Ridge (25%), Cedar Falls (25%), and Dune Point (37.5%) exceed it; Birch Hollow ($-8\%$) and Elk Meadow (12%) do not. For example, Elk Meadow’s share falls from $\frac{125}{400} = 31.25\%$ to $\frac{140}{463} \approx 30.2\%$ even though its visitor count rose.`,
      traps: [
        { option: 4, trap: 'misread', why: 'Elk Meadow’s number of visitors increased, but by less than the total did, so its share decreased.' },
      ],
      verify: () => indicesWhere(PARKS.map((_, i) => i), (i) => V2024[i] / total(V2024) > V2022[i] / total(V2022)),
    },
    // 13 ─ PS
    {
      id: 't3-q2m-13',
      type: 'numeric',
      difficulty: 3,
      topic: 'data.probability',
      stem: 'At a regional airport, each of three scheduled flights has a probability of 0.2 of departing late, independently of the other flights. What is the probability that exactly one of the three flights departs late?',
      answer: { kind: 'decimal', value: 0.384 },
      explanation: r`A particular flight late and the other two on time has probability $0.2 \times 0.8 \times 0.8 = 0.128$. Any one of the 3 flights can be the late one, so the probability is $3 \times 0.128 = 0.384$. (Stopping at 0.128 forgets the 3 possible choices of the late flight.)`,
      verify: () => {
        let p = 0;
        for (let m = 0; m < 8; m++) {
          const late = [0, 1, 2].map((k) => (m >> k) & 1);
          if (late.reduce((a, b) => a + b, 0) === 1) p += late.reduce((acc, l) => acc * (l ? 0.2 : 0.8), 1);
        }
        return p;
      },
    },
    // 14 ─ PS
    {
      id: 't3-q2m-14',
      type: 'mc-single',
      difficulty: 2,
      topic: 'arith.fractions-decimals',
      stem: r`A hiker has walked 27 kilometers, which is $\frac{3}{8}$ of the length of a trail. When the hiker has walked $\frac{5}{6}$ of the length of the trail, how many kilometers of the trail will remain?`,
      options: ['12', '15', '20', '45', '60'],
      answer: 0,
      explanation: r`The trail is $27 \div \frac{3}{8} = 72$ kilometers long. After $\frac{5}{6}$ of it is walked, $\frac{1}{6} \times 72 = 12$ kilometers remain.`,
      verify: () => {
        const L = 27 / (3 / 8);
        return indexOfValue([12, 15, 20, 45, 60], L - (5 / 6) * L);
      },
    },
    // 15 ─ PS
    {
      id: 't3-q2m-15',
      type: 'mc-single',
      difficulty: 4,
      topic: 'geo.polygons',
      stem: r`The vertices of a regular hexagon with sides of length 4 are labeled, in order, $P_{1}$ through $P_{6}$. What is the area of triangle $P_{1}P_{3}P_{5}$?`,
      options: [r`$6\sqrt{3}$`, r`$12\sqrt{3}$`, r`$16\sqrt{3}$`, r`$18\sqrt{3}$`, r`$24\sqrt{3}$`],
      answer: 1,
      explanation: r`Triangle $P_{1}P_{3}P_{5}$ is equilateral. Each side, such as $P_{1}P_{3}$, spans two sides of the hexagon meeting at a $120^{\circ}$ angle, so its length is $4\sqrt{3}$ (twice the height of an equilateral triangle with side 4). The area is $\frac{\sqrt{3}}{4}(4\sqrt{3})^{2} = \frac{\sqrt{3}}{4}(48) = 12\sqrt{3}$, exactly half the hexagon’s area of $24\sqrt{3}$.`,
      traps: [
        { option: 4, trap: 'misread', why: r`$24\sqrt{3}$ is the area of the whole hexagon.` },
        { option: 2, trap: 'wrong-formula', why: r`Using the long diagonal (8) as the triangle’s side gives $\frac{\sqrt{3}}{4}(64) = 16\sqrt{3}$; $P_{1}P_{3}$ is a short diagonal.` },
      ],
      verify: () => {
        const V = range(0, 5).map((k) => [4 * Math.cos((k * Math.PI) / 3), 4 * Math.sin((k * Math.PI) / 3)]);
        const [a, b, c] = [V[0], V[2], V[4]];
        const area = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
        const s3 = Math.sqrt(3);
        return indexOfValue([6 * s3, 12 * s3, 16 * s3, 18 * s3, 24 * s3], area);
      },
    },
  ],
};
