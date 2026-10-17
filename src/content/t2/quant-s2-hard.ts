import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, mean, stdev } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// DI data (t2-q2h-dA): apple harvest at five orchard blocks of Valewood Farms, 2024
const BLOCKS = ['North', 'East', 'Ridge', 'Creek', 'South'];
const AREA = [40, 25, 60, 20, 55]; // acres
const YIELD = [300, 360, 250, 420, 320]; // bushels per acre
const CIDER_PCT = [25, 40, 30, 50, 20]; // percent of harvest sold to cider makers
const HARVEST = AREA.map((a, i) => a * YIELD[i]);
const CIDER = HARVEST.map((h, i) => (h * CIDER_PCT[i]) / 100);
const sumOf = (xs: number[]) => xs.reduce((s, v) => s + v, 0);

export const set: QuestionSet = {
  testId: 't2',
  measure: 'quant',
  key: 's2-hard',
  passages: [],
  dataSets: [
    {
      id: 't2-q2h-dA',
      charts: [
        {
          kind: 'table',
          title: 'Apple Harvest at the Five Orchard Blocks of Valewood Farms, 2024',
          columns: ['Orchard block', 'Area (acres)', 'Yield (bushels per acre)', 'Percent of harvest sold to cider makers'],
          rows: BLOCKS.map((b, i) => [b, AREA[i], YIELD[i], `${CIDER_PCT[i]}%`]),
          note: 'Yield is the average number of bushels of apples harvested per acre. The harvest of a block equals its area times its yield.',
        },
      ],
    },
  ],
  questions: [
    // 1 ─ QC
    {
      id: 't2-q2h-01',
      type: 'qc',
      difficulty: 5,
      topic: 'alg.inequalities-abs',
      info: r`$|x| + |y| = 5$<br>$x - y = 3$`,
      quantityA: r`$x + y$`,
      quantityB: r`$xy$`,
      answer: 3,
      explanation: r`Check sign cases. If $x \geq 0$ and $y \geq 0$: $x + y = 5$ and $x - y = 3$ give $(4, 1)$. If $x < 0$ and $y < 0$: $-x - y = 5$ and $x - y = 3$ give $(-1, -4)$. Mixed signs fail (for $x \geq 0 > y$, $|x| + |y| = x - y = 3 \neq 5$; for $x < 0 \leq y$, $x - y$ would be negative). For $(4, 1)$: A $= 5$, B $= 4$, so A is greater. For $(-1, -4)$: A $= -5$, B $= 4$, so B is greater. The relationship cannot be determined.`,
      traps: [
        { option: 0, trap: 'assumed-positive', why: r`Solving only the all-positive case gives $(4, 1)$; the pair $(-1, -4)$ also satisfies both equations.` },
      ],
      verify: () => {
        const cases: Array<[number, number]> = [];
        for (const x of range(-20, 20, 0.25)) {
          const y = x - 3;
          if (Math.abs(Math.abs(x) + Math.abs(y) - 5) < 1e-12) cases.push([x + y, x * y]);
        }
        return qcCompare(cases);
      },
    },
    // 2 ─ QC
    {
      id: 't2-q2h-02',
      type: 'qc',
      difficulty: 5,
      topic: 'data.statistics',
      info: 'List P consists of 5 numbers with an average (arithmetic mean) of 10 and a standard deviation of 2. List R consists of 5 numbers with an average of 20 and a standard deviation of 2. List T consists of the 10 numbers in P and R combined.',
      quantityA: 'The standard deviation of the numbers in T',
      quantityB: '5',
      answer: 0,
      explanation: r`The mean of T is 15. Each number in P equals $10 + e$, where the deviations $e$ average 0 and have root-mean-square size 2; its deviation from 15 is $-5 + e$. Because the $e$'s average 0, the mean of $(-5 + e)^{2}$ is $25 + 4 = 29$ (likewise for R). So the variance of T is 29 and its standard deviation is $\sqrt{29} \approx 5.39 > 5$. (With the sample formula it is about 5.6 — still greater.) The spread inside each list adds to the 5-unit gap between each list's mean and 15.`,
      traps: [
        { option: 2, trap: 'wrong-formula', why: 'Treating the SD of T as just the distance (5) from each group mean to the overall mean ignores the spread within each list, which adds to it.' },
        { option: 3, trap: 'd-trap', why: 'Different lists with these means and SDs all give the same SD for T, so the comparison is determined.' },
      ],
      verify: () => {
        const shapes = [
          [1, 2, 3, 4, 5],
          [0, 0, 0, 1, 7],
          [3, -1, 4, 1, -5],
          [2, 2, 9, 9, 5.5],
        ];
        const sampleSd = (xs: number[]) => {
          const m = mean(xs);
          return Math.sqrt(xs.reduce((s, v) => s + (v - m) ** 2, 0) / (xs.length - 1));
        };
        const cases: Array<[number, number]> = [];
        for (const sd of [stdev, sampleSd]) {
          const fit = (b: number[], m: number, s: number) => b.map((v) => m + (s * (v - mean(b))) / sd(b));
          for (const p of shapes) for (const q of shapes) cases.push([sd([...fit(p, 10, 2), ...fit(q, 20, 2)]), 5]);
        }
        return qcCompare(cases);
      },
    },
    // 3 ─ QC
    {
      id: 't2-q2h-03',
      type: 'qc',
      difficulty: 5,
      topic: 'geo.polygons',
      info: r`Each of the four sides of quadrilateral $Q$ has length 6.`,
      quantityA: r`The area of $Q$`,
      quantityB: '36',
      answer: 3,
      explanation: r`A quadrilateral with four equal sides is a rhombus. Its area is base times height, $6h$, where the height $h$ is at most 6. If $Q$ is a square, $h = 6$ and the area is exactly 36 (equal). If $Q$ is a non-square rhombus, say with a $30^{\circ}$ angle, then $h = 3$ and the area is 18 (B greater). The relationship cannot be determined.`,
      traps: [
        { option: 1, trap: 'd-trap', why: 'The area can never exceed 36, but it can equal 36 — a square is a rhombus. “Never greater” is not the same as “always less.”' },
      ],
      verify: () => {
        const cases: Array<[number, number]> = [];
        for (const deg of [...range(1, 179, 1), 90]) {
          const t = (deg * Math.PI) / 180;
          const pts = [[0, 0], [6, 0], [6 + 6 * Math.cos(t), 6 * Math.sin(t)], [6 * Math.cos(t), 6 * Math.sin(t)]];
          let a = 0;
          for (let i = 0; i < 4; i++) {
            const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 4];
            a += x1 * y2 - x2 * y1;
          }
          cases.push([Math.abs(a) / 2, 36]);
        }
        return qcCompare(cases);
      },
    },
    // 4 ─ QC
    {
      id: 't2-q2h-04',
      type: 'qc',
      difficulty: 4,
      topic: 'arith.integers',
      info: r`For any positive integer $n$, $n!$ denotes the product of all the integers from 1 to $n$.`,
      quantityA: r`The number of consecutive zero digits at the right end of the integer $75!$`,
      quantityB: '18',
      answer: 2,
      explanation: r`Each trailing zero needs a factor of $10 = 2 \times 5$, and factors of 2 are far more plentiful, so count factors of 5 in $75!$. Multiples of 5 up to 75 contribute $\lfloor 75/5 \rfloor = 15$, and the multiples of 25 (25, 50, 75) contribute one extra 5 each, for 3 more. Total: $15 + 3 = 18$. The quantities are equal.`,
      traps: [
        { option: 1, trap: 'calc-slip', why: 'Counting only the 15 multiples of 5 misses the extra factor of 5 in each of 25, 50, and 75.' },
      ],
      verify: () => {
        let f = 1n;
        for (let i = 1n; i <= 75n; i++) f *= i;
        let zeros = 0;
        while (f % 10n === 0n) {
          f /= 10n;
          zeros++;
        }
        return qcCompare([[zeros, 18]]);
      },
    },
    // 5 ─ QC
    {
      id: 't2-q2h-05',
      type: 'qc',
      difficulty: 4,
      topic: 'alg.functions',
      info: r`The function $g$ is defined by $g(x) = 4^{x} + 4^{-x}$ for all numbers $x$.`,
      quantityA: r`$g\left(\frac{1}{2}\right)$`,
      quantityB: r`$g\left(-\frac{3}{4}\right)$`,
      answer: 1,
      explanation: r`$g\left(\frac{1}{2}\right) = 4^{1/2} + 4^{-1/2} = 2 + \frac{1}{2} = 2.5$. $g\left(-\frac{3}{4}\right) = 4^{-3/4} + 4^{3/4} = \frac{1}{2\sqrt{2}} + 2\sqrt{2} \approx 0.35 + 2.83 = 3.18$. Quantity B is greater. (In fact $g(-x) = g(x)$, and $g$ grows as $|x|$ grows, so only $|x|$ matters.)`,
      traps: [
        { option: 0, trap: 'assumed-positive', why: r`Assuming a negative input must give a smaller output; $g$ is symmetric, $g(-x) = g(x)$, and $\frac{3}{4} > \frac{1}{2}$.` },
      ],
      verify: () => {
        const g = (x: number) => 4 ** x + 4 ** -x;
        return qcCompare([[g(0.5), g(-0.75)]]);
      },
    },
    // 6 ─ PS probability
    {
      id: 't2-q2h-06',
      type: 'mc-single',
      difficulty: 5,
      topic: 'data.probability',
      stem: 'A bag contains 4 red tokens and 2 green tokens. Ana draws a token at random and sets it aside without looking at it. Ben then draws a token at random from the 5 tokens remaining in the bag. If Ben’s token is red, what is the probability that Ana’s token is green?',
      options: [r`$\frac{4}{15}$`, r`$\frac{1}{3}$`, r`$\frac{2}{5}$`, r`$\frac{1}{2}$`, r`$\frac{2}{3}$`],
      answer: 2,
      explanation: r`$P(\text{Ana green and Ben red}) = \frac{2}{6} \cdot \frac{4}{5} = \frac{8}{30}$. $P(\text{Ana red and Ben red}) = \frac{4}{6} \cdot \frac{3}{5} = \frac{12}{30}$. So $P(\text{Ben red}) = \frac{20}{30}$, and $P(\text{Ana green} \mid \text{Ben red}) = \frac{8}{20} = \frac{2}{5}$. Ben’s red token makes it more likely that a red token was not used up by Ana.`,
      traps: [
        { option: 1, trap: 'wrong-formula', why: r`$\frac{1}{3}$ is Ana’s unconditional chance of green; it ignores the information that Ben drew red.` },
        { option: 0, trap: 'wrong-formula', why: r`$\frac{4}{15} = \frac{8}{30}$ is the joint probability that Ana is green AND Ben is red, not the conditional probability.` },
      ],
      verify: () => {
        const tokens = ['R', 'R', 'R', 'R', 'G', 'G'];
        let benRed = 0, both = 0;
        for (let a = 0; a < 6; a++)
          for (let b = 0; b < 6; b++) {
            if (a === b) continue;
            if (tokens[b] === 'R') {
              benRed++;
              if (tokens[a] === 'G') both++;
            }
          }
        return indexOfValue([4 / 15, 1 / 3, 2 / 5, 1 / 2, 2 / 3], both / benRed);
      },
    },
    // 7 ─ PS numeric (figure)
    {
      id: 't2-q2h-07',
      type: 'numeric',
      difficulty: 4,
      topic: 'geo.circles',
      stem: r`In the figure above, $ABCD$ is a square with sides of length 12. The circle passes through vertices $A$ and $B$ and is tangent to side $\overline{CD}$. What is the radius of the circle?`,
      figure: {
        kind: 'svg',
        svg: '<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg"><rect x="144" y="68" width="192" height="192" fill="none" stroke="black" stroke-width="2"/><circle cx="240" cy="188" r="120" fill="none" stroke="black" stroke-width="2"/><text x="122" y="282" font-size="14" font-style="italic">A</text><text x="344" y="282" font-size="14" font-style="italic">B</text><text x="344" y="64" font-size="14" font-style="italic">C</text><text x="122" y="64" font-size="14" font-style="italic">D</text></svg>',
      },
      answer: { kind: 'decimal', value: 7.5 },
      explanation: r`By symmetry the center lies on the perpendicular bisector of $\overline{AB}$, 6 units from $A$ horizontally. Put $A = (0, 0)$, $B = (12, 0)$, and $\overline{CD}$ on the line $y = 12$; the center is $(6, k)$ with radius $r = 12 - k$ (distance to the tangent line). Distance to $A$: $36 + k^{2} = (12 - k)^{2} = 144 - 24k + k^{2}$, so $24k = 108$, $k = 4.5$, and $r = 7.5$.`,
      verify: () => {
        // center (6, k); radius from A must equal distance to the line y = 12
        const f = (k: number) => Math.hypot(6, k) - (12 - k);
        let lo = 0, hi = 12;
        for (let i = 0; i < 200; i++) {
          const m = (lo + hi) / 2;
          if (f(m) < 0) lo = m;
          else hi = m;
        }
        return 12 - lo;
      },
    },
    // 8 ─ PS multi
    {
      id: 't2-q2h-08',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'arith.exponents-roots',
      stem: r`Which of the following integers are divisors of $9^{6} - 3^{10}$?<br><i>Indicate all such integers.</i>`,
      options: ['6', '16', '24', '36', '48', '81'],
      answer: [0, 2, 3, 5],
      explanation: r`$9^{6} = 3^{12}$, so $9^{6} - 3^{10} = 3^{10}(3^{2} - 1) = 8 \cdot 3^{10} = 2^{3} \cdot 3^{10}$. A divisor can use at most three factors of 2 and at most ten factors of 3. $6 = 2 \cdot 3$, $24 = 2^{3} \cdot 3$, $36 = 2^{2} \cdot 3^{2}$, and $81 = 3^{4}$ qualify; $16 = 2^{4}$ and $48 = 2^{4} \cdot 3$ need four factors of 2.`,
      traps: [
        { option: 1, trap: 'calc-slip', why: r`$16 = 2^{4}$, but the number contains only $2^{3}$.` },
        { option: 4, trap: 'calc-slip', why: r`$48 = 2^{4} \cdot 3$ needs four factors of 2; only three are available.` },
      ],
      verify: () => {
        const n = 9 ** 6 - 3 ** 10;
        return indicesWhere([6, 16, 24, 36, 48, 81], (d) => n % d === 0);
      },
    },
    // 9 ─ PS ratios
    {
      id: 't2-q2h-09',
      type: 'mc-single',
      difficulty: 3,
      topic: 'arith.ratios-rates',
      stem: 'A car-sharing company’s fleet consists only of gasoline cars and electric cars, in the ratio 5 to 2. After the company adds 9 electric cars to the fleet and removes none, the ratio of gasoline cars to electric cars is 5 to 3. How many cars are in the fleet after the electric cars are added?',
      options: ['27', '45', '54', '63', '72'],
      answer: 4,
      explanation: r`Let the fleet have $5k$ gasoline and $2k$ electric cars. Then $\frac{5k}{2k + 9} = \frac{5}{3}$, so $15k = 10k + 45$ and $k = 9$: 45 gasoline and 18 electric cars. After adding 9 electric cars there are $45 + 27 = 72$ cars.`,
      traps: [
        { option: 3, trap: 'misread', why: '63 is the size of the fleet before the 9 electric cars were added.' },
        { option: 1, trap: 'misread', why: '45 is the number of gasoline cars only.' },
      ],
      verify: () => {
        for (let gas = 1; gas <= 500; gas++)
          for (let el = 1; el <= 500; el++)
            if (gas * 2 === el * 5 && gas * 3 === (el + 9) * 5) return indexOfValue([27, 45, 54, 63, 72], gas + el + 9);
        return -1;
      },
    },
    // 10 ─ DI
    {
      id: 't2-q2h-10',
      type: 'mc-single',
      dataSetId: 't2-q2h-dA',
      difficulty: 3,
      topic: 'data.interpretation',
      stem: 'For the five orchard blocks combined, what was the average yield in 2024, in bushels per acre?',
      options: ['300', '310', '320', '330', '340'],
      answer: 1,
      explanation: r`Total harvest $= 40(300) + 25(360) + 60(250) + 20(420) + 55(320) = 12{,}000 + 9{,}000 + 15{,}000 + 8{,}400 + 17{,}600 = 62{,}000$ bushels. Total area $= 200$ acres. Average yield $= \frac{62{,}000}{200} = 310$ bushels per acre.`,
      traps: [
        { option: 3, trap: 'wrong-formula', why: r`330 is the simple average of the five yields; the blocks have different areas, so the yields must be weighted by area.` },
      ],
      verify: () => indexOfValue([300, 310, 320, 330, 340], sumOf(HARVEST) / sumOf(AREA)),
    },
    // 11 ─ DI numeric
    {
      id: 't2-q2h-11',
      type: 'numeric',
      dataSetId: 't2-q2h-dA',
      difficulty: 4,
      topic: 'data.interpretation',
      stem: 'Suppose that in 2025 the yield of the South block is 25 percent greater than its 2024 yield, and that the area of every block and the yield of every other block are the same as in 2024. What would the average yield for the five blocks combined be in 2025, in bushels per acre?',
      suffix: 'bushels per acre',
      answer: { kind: 'decimal', value: 332 },
      explanation: r`South’s yield rises from 320 to $1.25 \times 320 = 400$, so its harvest rises from 17,600 to $55 \times 400 = 22{,}000$ bushels, an increase of 4,400. The total harvest becomes $62{,}000 + 4{,}400 = 66{,}400$ bushels over the same 200 acres: $\frac{66{,}400}{200} = 332$. (Raising the overall average by 25% or adding 80 to it ignores that South is only 55 of the 200 acres.)`,
      verify: () => {
        const s = BLOCKS.indexOf('South');
        const y2025 = YIELD.map((y, i) => (i === s ? y * 1.25 : y));
        return sumOf(AREA.map((a, i) => a * y2025[i])) / sumOf(AREA);
      },
    },
    // 12 ─ DI multi
    {
      id: 't2-q2h-12',
      type: 'mc-multi',
      dataSetId: 't2-q2h-dA',
      difficulty: 5,
      topic: 'data.interpretation',
      stem: 'Based on the table, which of the following statements must be true?<br><i>Indicate all such statements.</i>',
      options: [
        'The Creek block sold more bushels to cider makers than the East block did.',
        'The Ridge and South blocks together produced more than half of the total harvest of the five blocks.',
        'The block with the greatest area also had the greatest harvest.',
        'Less than 32 percent of the total harvest of the five blocks was sold to cider makers.',
        'Every acre of the Creek block yielded more than 400 bushels of apples.',
      ],
      answer: [0, 1, 3],
      explanation: r`Harvests: North 12,000; East 9,000; Ridge 15,000; Creek 8,400; South 17,600 (total 62,000). (1) Creek sold $0.5 \times 8{,}400 = 4{,}200$ to cider makers; East sold $0.4 \times 9{,}000 = 3{,}600$ — true. (2) Ridge + South $= 32{,}600 > 31{,}000$ — true. (3) Ridge has the greatest area, but South has the greatest harvest — false. (4) Cider sales total $3{,}000 + 3{,}600 + 4{,}500 + 4{,}200 + 3{,}520 = 18{,}820$, about 30.4% of 62,000 — true (the simple average of the five percents, 33%, would wrongly suggest false). (5) 420 is an average yield; some acres could yield less than 400 — not necessarily true.`,
      traps: [
        { option: 2, trap: 'misread', why: r`Ridge has the largest area (60 acres) but a low yield; its harvest of 15,000 is less than South’s 17,600.` },
        { option: 4, trap: 'misread', why: 'An average yield of 420 bushels per acre does not mean every acre yielded more than 400.' },
      ],
      verify: () => {
        const H = (b: string) => HARVEST[BLOCKS.indexOf(b)];
        const C = (b: string) => CIDER[BLOCKS.indexOf(b)];
        const total = sumOf(HARVEST);
        const biggest = AREA.indexOf(Math.max(...AREA));
        const creek = BLOCKS.indexOf('Creek');
        // statement 5 is false if some valid distribution of per-acre yields has an acre at or below 400:
        // one acre at 300, the other acres sharing the rest equally
        const othersAvg = (HARVEST[creek] - 300) / (AREA[creek] - 1);
        const counterexampleExists = othersAvg >= 0;
        const truth = [
          C('Creek') > C('East'),
          H('Ridge') + H('South') > total / 2,
          HARVEST[biggest] === Math.max(...HARVEST),
          (sumOf(CIDER) / total) * 100 < 32,
          !counterexampleExists,
        ];
        return indicesWhere(truth, (t) => t);
      },
    },
    // 13 ─ PS numeric combinatorics
    {
      id: 't2-q2h-13',
      type: 'numeric',
      difficulty: 5,
      topic: 'data.combinatorics',
      stem: 'How many 4-digit positive integers are odd and have digits that strictly increase from left to right? (For example, 2579 is one such integer.)',
      answer: { kind: 'decimal', value: 80 },
      explanation: r`A strictly increasing digit string is determined by its set of digits, and 0 cannot appear (it would have to be the leading digit). So choose 4 digits from 1–9; the number is odd exactly when the largest chosen digit is odd. Largest digit 5: choose the other 3 from $\{1, \ldots, 4\}$, $\binom{4}{3} = 4$. Largest 7: $\binom{6}{3} = 20$. Largest 9: $\binom{8}{3} = 56$. Total $4 + 20 + 56 = 80$. (Of all $\binom{9}{4} = 126$ increasing 4-digit numbers, 46 are even.)`,
      verify: () => {
        let count = 0;
        for (let n = 1000; n <= 9999; n++) {
          const d = String(n).split('').map(Number);
          if (n % 2 === 1 && d[0] < d[1] && d[1] < d[2] && d[2] < d[3]) count++;
        }
        return count;
      },
    },
    // 14 ─ PS solids
    {
      id: 't2-q2h-14',
      type: 'mc-single',
      difficulty: 4,
      topic: 'geo.solids',
      stem: 'A rectangular block of wood measuring 10 centimeters by 6 centimeters by 4 centimeters is painted on all six faces and then cut into 240 cubes, each with edges of length 1 centimeter. How many of the cubes have paint on exactly two of their faces?',
      options: ['8', '32', '48', '56', '72'],
      answer: 3,
      explanation: r`Cubes with exactly two painted faces lie along the 12 edges of the block, excluding the 8 corner cubes (which have three painted faces). Each edge of length $L$ contributes $L - 2$ such cubes. There are 4 edges of each length: $4(10 - 2) + 4(6 - 2) + 4(4 - 2) = 32 + 16 + 8 = 56$.`,
      traps: [
        { option: 4, trap: 'calc-slip', why: r`$72 = 4(10 + 6 + 4) - 8$ removes each corner cube only once, but each corner lies on three edges and was counted three times.` },
        { option: 2, trap: 'ignored-constraint', why: '48 leaves out the four 4-centimeter edges.' },
      ],
      verify: () => {
        let count = 0;
        for (let x = 0; x < 10; x++)
          for (let y = 0; y < 6; y++)
            for (let z = 0; z < 4; z++) {
              const faces = +(x === 0) + +(x === 9) + +(y === 0) + +(y === 5) + +(z === 0) + +(z === 3);
              if (faces === 2) count++;
            }
        return indexOfValue([8, 32, 48, 56, 72], count);
      },
    },
    // 15 ─ PS percents
    {
      id: 't2-q2h-15',
      type: 'mc-single',
      difficulty: 3,
      topic: 'arith.percents',
      stem: 'Last year, 60 percent of Company T’s revenue came from product X. This year, the revenue from product X increased by 20 percent, and the combined revenue from all of the company’s other products decreased by 10 percent. What percent of the company’s revenue this year came from product X?',
      options: [r`$66\frac{2}{3}\%$`, r`$68\%$`, r`$70\%$`, r`$72\%$`, r`$75\%$`],
      answer: 0,
      explanation: r`Take last year’s revenue as 100. Product X: $60 \to 72$. Other products: $40 \to 36$. This year’s total is $72 + 36 = 108$, so X’s share is $\frac{72}{108} = \frac{2}{3} = 66\frac{2}{3}\%$.`,
      traps: [
        { option: 3, trap: 'ignored-constraint', why: r`72% treats X’s new revenue, 72, as a percent of last year’s total of 100; this year’s total is 108.` },
        { option: 2, trap: 'wrong-formula', why: r`70% adds and subtracts percents ($60 + 20 - 10$) instead of computing new amounts.` },
      ],
      verify: () => {
        const shares = [100, 250, 1000].map((rev) => {
          const x = 0.6 * rev * 1.2, other = 0.4 * rev * 0.9;
          return (x / (x + other)) * 100;
        });
        return indexOfValue([200 / 3, 68, 70, 72, 75], shares[1]) === indexOfValue([200 / 3, 68, 70, 72, 75], shares[0])
          ? indexOfValue([200 / 3, 68, 70, 72, 75], shares[2])
          : -1;
      },
    },
  ],
};
