import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, sum } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// Data for the DI set (questions 9-10)
const COURSES = ['Pottery', 'Spanish', 'Coding', 'Yoga'];
const ENR_2022 = [40, 60, 35, 65];
const ENR_2024 = [50, 54, 70, 76];

const CIRCLE_SVG =
  '<svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M 150 30 A 95 95 0 0 1 245 125 Z" fill="#ddd" stroke="black" stroke-width="1.5"/>' +
  '<circle cx="150" cy="125" r="95" fill="none" stroke="black" stroke-width="2"/>' +
  '<line x1="150" y1="125" x2="150" y2="30" stroke="black" stroke-width="2"/>' +
  '<line x1="150" y1="125" x2="245" y2="125" stroke="black" stroke-width="2"/>' +
  '<path d="M 150 113 L 162 113 L 162 125" fill="none" stroke="black" stroke-width="1.5"/>' +
  '<circle cx="150" cy="125" r="2.5" fill="black"/>' +
  '<text x="134" y="144" font-size="14" font-style="italic">O</text>' +
  '<text x="144" y="22" font-size="14" font-style="italic">A</text>' +
  '<text x="252" y="130" font-size="14" font-style="italic">B</text>' +
  '</svg>';

export const set: QuestionSet = {
  testId: 't1',
  measure: 'quant',
  key: 's1',
  passages: [],
  dataSets: [
    {
      id: 't1-q1-dA',
      charts: [
        {
          kind: 'bar',
          title: 'Enrollment in Four Evening Courses at Kellam Community Center',
          categories: COURSES,
          series: [
            { name: '2022', values: ENR_2022 },
            { name: '2024', values: ENR_2024 },
          ],
          xLabel: 'Course',
          yLabel: 'Number of students enrolled',
          yMin: 0,
          yMax: 80,
          yStep: 10,
          showValues: true,
        },
      ],
    },
  ],
  questions: [
    // 1. QC
    {
      id: 't1-q1-01',
      type: 'qc',
      difficulty: 2,
      topic: 'arith.fractions-decimals',
      quantityA: r`$\frac{4}{11}$`,
      quantityB: r`$0.36$`,
      answer: 0,
      explanation: r`Divide: $4 \div 11 = 0.363636\ldots$, a repeating decimal. Compare it digit by digit with $0.36 = 0.360000\ldots$: the first two decimal digits match, but in the third decimal place $3 > 0$. So $\frac{4}{11} > 0.36$, and Quantity A is greater.`,
      traps: [
        {
          option: 2,
          trap: 'misread',
          why: r`Seeing the digits 36 in both quantities and treating $0.36$ as if it were the repeating decimal $0.\overline{36}$. The terminating decimal $0.36$ is slightly smaller.`,
        },
      ],
      verify: () => {
        // long division of 4 by 11, first 8 decimal digits
        let rem = 4;
        let digits = 0;
        for (let k = 0; k < 8; k++) {
          rem *= 10;
          digits = digits * 10 + Math.floor(rem / 11);
          rem %= 11;
        }
        return qcCompare([[digits / 1e8, 0.36]]);
      },
    },
    // 2. QC
    {
      id: 't1-q1-02',
      type: 'qc',
      difficulty: 3,
      topic: 'alg.inequalities-abs',
      info: r`$-2 < x < 1$`,
      quantityA: r`$x^2$`,
      quantityB: r`$|x|$`,
      answer: 3,
      explanation: r`Since $x^2 = |x| \cdot |x|$, $x^2$ is greater than $|x|$ when $|x| > 1$ and less than $|x|$ when $0 < |x| < 1$. The given range allows both. If $x = -1.5$, then $x^2 = 2.25$ and $|x| = 1.5$, so A is greater. If $x = 0.5$, then $x^2 = 0.25$ and $|x| = 0.5$, so B is greater. The relationship cannot be determined.`,
      traps: [
        {
          option: 1,
          trap: 'assumed-positive',
          why: r`Testing only values between 0 and 1 (where squaring makes a number smaller) and overlooking negative values less than $-1$, such as $x = -1.5$.`,
        },
      ],
      verify: () => qcCompare(range(-1.99, 0.99, 0.01).map((x) => [x * x, Math.abs(x)] as [number, number])),
    },
    // 3. QC
    {
      id: 't1-q1-03',
      type: 'qc',
      difficulty: 3,
      topic: 'arith.integers',
      info: r`When the positive integer $n$ is divided by 12, the remainder is 7.`,
      quantityA: r`The remainder when $2n$ is divided by 6`,
      quantityB: r`The remainder when $n$ is divided by 4`,
      answer: 1,
      explanation: r`Write $n = 12k + 7$. Then $2n = 24k + 14 = 6(4k + 2) + 2$, so the remainder in Quantity A is 2. Also $n = 4(3k + 1) + 3$, so the remainder in Quantity B is 3. For example, with $n = 19$: $38 = 6 \cdot 6 + 2$ and $19 = 4 \cdot 4 + 3$. Quantity B is greater.`,
      traps: [
        {
          option: 0,
          trap: 'calc-slip',
          why: r`Doubling the remainder 7 to get 14 and not reducing it: a remainder on division by 6 must be less than 6, and $14 = 2 \cdot 6 + 2$ leaves remainder 2.`,
        },
      ],
      verify: () =>
        qcCompare(
          range(1, 1200)
            .filter((n) => n % 12 === 7)
            .map((n) => [(2 * n) % 6, n % 4] as [number, number]),
        ),
    },
    // 4. QC
    {
      id: 't1-q1-04',
      type: 'qc',
      difficulty: 4,
      topic: 'data.statistics',
      info: r`List $L$ consists of 5 positive integers. The average (arithmetic mean) of the integers in $L$ is 12, and the median is 14.`,
      quantityA: r`The greatest possible value of the largest integer in list $L$`,
      quantityB: r`$30$`,
      answer: 2,
      explanation: r`The five integers sum to $5 \times 12 = 60$. In increasing order they are $a \leq b \leq 14 \leq d \leq e$, so $e = 60 - 14 - a - b - d = 46 - a - b - d$. To make $e$ as large as possible, make $a$, $b$, and $d$ as small as allowed: $a = b = 1$ and $d = 14$ (the fourth integer cannot be less than the median). Then $e = 30$, from the list 1, 1, 14, 14, 30. The two quantities are equal.`,
      traps: [
        {
          option: 0,
          trap: 'ignored-constraint',
          why: r`Making the fourth integer 1 as well gives a largest value of 43, but in increasing order the fourth integer must be at least the median, 14.`,
        },
        {
          option: 1,
          trap: 'misread',
          why: r`Assuming the integers must be different (for example 1, 2, 14, 15, 28) gives a smaller maximum; nothing says the integers are distinct.`,
        },
      ],
      verify: () => {
        let best = 0;
        for (let a = 1; a <= 14; a++)
          for (let b = a; b <= 14; b++)
            for (let d = 14; d <= 60; d++) {
              const e = 60 - a - b - 14 - d;
              if (e >= d) best = Math.max(best, e);
            }
        return qcCompare([[best, 30]]);
      },
    },
    // 5. PS
    {
      id: 't1-q1-05',
      type: 'mc-single',
      difficulty: 1,
      topic: 'alg.linear',
      stem: r`If $\frac{3x}{4} + 5 = 17$, what is the value of $x$?`,
      options: ['8', '9', '12', '15', '16'],
      answer: 4,
      explanation: r`Subtract 5 from both sides: $\frac{3x}{4} = 12$. Multiply both sides by $\frac{4}{3}$: $x = 16$. Check: $\frac{3(16)}{4} + 5 = 12 + 5 = 17$.`,
      traps: [
        {
          option: 1,
          trap: 'calc-slip',
          why: r`Multiplying 12 by $\frac{3}{4}$ instead of by $\frac{4}{3}$ gives 9.`,
        },
      ],
      verify: () => indexOfValue([8, 9, 12, 15, 16], range(-100, 100).find((x) => (3 * x) / 4 + 5 === 17)!),
    },
    // 6. PS
    {
      id: 't1-q1-06',
      type: 'mc-single',
      difficulty: 3,
      topic: 'geo.polygons',
      stem: r`A regular hexagon and an equilateral triangle have the same perimeter. What is the ratio of the area of the hexagon to the area of the triangle?`,
      options: [r`$1:2$`, r`$2:3$`, r`$1:1$`, r`$3:2$`, r`$2:1$`],
      answer: 3,
      explanation: r`Let the common perimeter be 6, so the hexagon has side 1 and the triangle has side 2. A regular hexagon with side 1 is made of 6 equilateral triangles with side 1. An equilateral triangle with side 2 can be cut (by joining the midpoints of its sides) into 4 equilateral triangles with side 1. So the ratio of the areas is $6 : 4 = 3 : 2$.`,
      traps: [
        {
          option: 2,
          trap: 'wrong-formula',
          why: 'Assuming that figures with equal perimeters have equal areas. With the same perimeter, the regular hexagon encloses more area than the triangle.',
        },
        {
          option: 4,
          trap: 'calc-slip',
          why: 'Counting 6 small triangles in the hexagon but only 3 (instead of 4) in the larger triangle, whose side is twice as long.',
        },
      ],
      verify: () => {
        const P = 36;
        const hexSide = P / 6;
        const triSide = P / 3;
        const hexArea = 6 * (Math.sqrt(3) / 4) * hexSide ** 2;
        const triArea = (Math.sqrt(3) / 4) * triSide ** 2;
        return indexOfValue([1 / 2, 2 / 3, 1, 3 / 2, 2], hexArea / triArea);
      },
    },
    // 7. PS (fraction numeric)
    {
      id: 't1-q1-07',
      type: 'numeric',
      difficulty: 3,
      topic: 'data.probability',
      stem: r`A drawer contains 4 red pens and 6 blue pens. Two pens are selected at random from the drawer, one after the other, without replacement. What is the probability that the two pens selected are the same color?<br><i>Give your answer as a fraction.</i>`,
      answer: { kind: 'fraction', num: 7, den: 15 },
      explanation: r`There are $\binom{10}{2} = 45$ equally likely pairs of pens. The same-color pairs are $\binom{4}{2} = 6$ red pairs and $\binom{6}{2} = 15$ blue pairs, 21 in all. The probability is $\frac{21}{45} = \frac{7}{15}$. Equivalently, $\frac{4}{10} \cdot \frac{3}{9} + \frac{6}{10} \cdot \frac{5}{9} = \frac{42}{90} = \frac{7}{15}$. A common slip is to compute as if with replacement: $(0.4)^2 + (0.6)^2 = 0.52$.`,
      verify: () => {
        const pens = ['R', 'R', 'R', 'R', 'B', 'B', 'B', 'B', 'B', 'B'];
        let same = 0;
        let total = 0;
        for (let i = 0; i < pens.length; i++)
          for (let j = 0; j < pens.length; j++) {
            if (i === j) continue;
            total++;
            if (pens[i] === pens[j]) same++;
          }
        return same / total;
      },
    },
    // 8. PS (multi)
    {
      id: 't1-q1-08',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'arith.exponents-roots',
      stem: r`If $-1 < x < 0$, which of the following must be greater than $x$?<br><i>Indicate all such expressions.</i>`,
      options: [r`$x^2$`, r`$x^3$`, r`$\frac{1}{x}$`, r`$-x$`, r`$\frac{x}{2}$`, r`$\sqrt[3]{x}$`],
      answer: [0, 1, 3, 4],
      explanation: r`Test $x = -0.5$: $x^2 = 0.25$, $x^3 = -0.125$, $\frac{1}{x} = -2$, $-x = 0.5$, $\frac{x}{2} = -0.25$, and $\sqrt[3]{x} \approx -0.79$. In general, $x^2$ and $-x$ are positive, and $x^3$ and $\frac{x}{2}$ are negative numbers closer to 0 than $x$ is, so all four exceed $x$. But $\frac{1}{x} < -1 < x$, and because $|x| < 1$, $\sqrt[3]{x}$ is farther from 0 than $x$, so $\sqrt[3]{x} < x$.`,
      traps: [
        {
          option: 5,
          trap: 'assumed-positive',
          why: r`For a positive fraction, taking a root makes it larger; for a negative fraction, the cube root is farther from 0 and therefore smaller (for example, $\sqrt[3]{-0.125} = -0.5$).`,
        },
        {
          option: 2,
          trap: 'assumed-positive',
          why: r`The reciprocal of a number between 0 and 1 is larger than the number, but the reciprocal of a number between $-1$ and 0 is less than $-1$.`,
        },
      ],
      verify: () => {
        const xs = range(-0.999, -0.001, 0.001);
        const fns: Array<(x: number) => number> = [
          (x) => x * x,
          (x) => x ** 3,
          (x) => 1 / x,
          (x) => -x,
          (x) => x / 2,
          (x) => Math.cbrt(x),
        ];
        return indicesWhere(fns, (f) => xs.every((x) => f(x) > x));
      },
    },
    // 9. DI
    {
      id: 't1-q1-09',
      type: 'mc-single',
      difficulty: 2,
      topic: 'data.interpretation',
      dataSetId: 't1-q1-dA',
      stem: 'By what percent did enrollment in Coding increase from 2022 to 2024?',
      options: ['50%', '100%', '120%', '150%', '200%'],
      answer: 1,
      explanation: r`Coding enrollment rose from 35 to 70, an increase of 35 students. As a percent of the original enrollment, the increase is $\frac{35}{35} = 1 = 100\%$.`,
      traps: [
        {
          option: 4,
          trap: 'wrong-formula',
          why: 'The 2024 enrollment is 200% <i>of</i> the 2022 enrollment, but the increase is only 100% of the original.',
        },
        {
          option: 0,
          trap: 'calc-slip',
          why: r`Dividing the increase of 35 by the 2024 enrollment of 70 instead of by the original enrollment of 35.`,
        },
      ],
      verify: () => {
        const i = COURSES.indexOf('Coding');
        return indexOfValue([50, 100, 120, 150, 200], ((ENR_2024[i] - ENR_2022[i]) / ENR_2022[i]) * 100);
      },
    },
    // 10. DI
    {
      id: 't1-q1-10',
      type: 'mc-single',
      difficulty: 3,
      topic: 'data.interpretation',
      dataSetId: 't1-q1-dA',
      stem: 'By what percent did the total enrollment in the four courses increase from 2022 to 2024?',
      options: ['15%', '20%', '25%', '33%', '125%'],
      answer: 2,
      explanation: r`Total 2022 enrollment: $40 + 60 + 35 + 65 = 200$. Total 2024 enrollment: $50 + 54 + 70 + 76 = 250$. The increase is $\frac{250 - 200}{200} = 0.25$, or 25%. Averaging the four courses' individual percent changes does not work, because the courses have different sizes.`,
      traps: [
        {
          option: 3,
          trap: 'wrong-formula',
          why: r`Averaging the four individual percent changes ($25\%$, $-10\%$, $100\%$, and about $17\%$) gives about 33%, but percent changes of groups of different sizes cannot simply be averaged.`,
        },
        {
          option: 1,
          trap: 'calc-slip',
          why: 'Dividing the increase of 50 by the 2024 total of 250 instead of by the original total of 200.',
        },
      ],
      verify: () => {
        const t22 = sum(ENR_2022);
        const t24 = sum(ENR_2024);
        return indexOfValue([15, 20, 25, 33, 125], ((t24 - t22) / t22) * 100);
      },
    },
    // 11. PS
    {
      id: 't1-q1-11',
      type: 'mc-single',
      difficulty: 3,
      topic: 'geo.circles',
      figure: { kind: 'svg', svg: CIRCLE_SVG },
      stem: r`In the figure above, $O$ is the center of the circle, points $A$ and $B$ lie on the circle, and $\angle AOB = 90^{\circ}$. If the area of triangle $AOB$ is 18, what is the area of the shaded region?`,
      options: [r`$9\pi - 18$`, r`$9\pi - 9$`, r`$18\pi - 18$`, r`$36\pi - 18$`, r`$36\pi - 36$`],
      answer: 0,
      explanation: r`Triangle $AOB$ is a right triangle whose legs are both radii, so $\frac{1}{2}r^2 = 18$ and $r = 6$. Because $\angle AOB = 90^{\circ}$, sector $AOB$ is $\frac{1}{4}$ of the circle, with area $\frac{1}{4}\pi(6)^2 = 9\pi$. The shaded region is the sector minus the triangle: $9\pi - 18$.`,
      traps: [
        {
          option: 3,
          trap: 'misread',
          why: r`Subtracting the triangle from the area of the entire circle, $36\pi$, rather than from the quarter-circle sector.`,
        },
        {
          option: 2,
          trap: 'wrong-formula',
          why: r`Treating the sector as half of the circle; a $90^{\circ}$ central angle cuts off one quarter of the circle.`,
        },
      ],
      verify: () => {
        const rad = Math.sqrt(2 * 18);
        const shaded = (Math.PI * rad * rad * 90) / 360 - 0.5 * rad * rad;
        return indexOfValue(
          [9 * Math.PI - 18, 9 * Math.PI - 9, 18 * Math.PI - 18, 36 * Math.PI - 18, 36 * Math.PI - 36],
          shaded,
        );
      },
    },
    // 12. PS
    {
      id: 't1-q1-12',
      type: 'numeric',
      difficulty: 5,
      topic: 'alg.word-problems',
      stem: r`Of the 80 members of a club, 10 play none of the three games chess, go, and bridge. If 60 of the members play chess, 55 play go, and 50 play bridge, what is the least possible number of members who play all three games?`,
      answer: { kind: 'decimal', value: 25 },
      explanation: r`Only 70 members play at least one game, yet the counts add to $60 + 55 + 50 = 165$ game memberships. If $t$ members play all three games and each of the other $70 - t$ players plays at most two, then $165 \leq 3t + 2(70 - t) = 140 + t$, so $t \geq 25$. The value 25 is attainable: 25 play all three, 20 play only chess and go, 15 play only chess and bridge, and 10 play only go and bridge (chess: $25 + 20 + 15 = 60$; go: $25 + 20 + 10 = 55$; bridge: $25 + 15 + 10 = 50$; total 70). Forgetting the 10 nonplayers leads to the wrong answer 5.`,
      verify: () => {
        // t = all three; a = chess&go only; b = chess&bridge only; c = go&bridge only
        let best = Infinity;
        for (let t = 0; t <= 50; t++)
          for (let a = 0; a + t <= 55; a++)
            for (let b = 0; a + b + t <= 60 && b + t <= 50; b++)
              for (let c = 0; b + c + t <= 50 && a + c + t <= 55; c++) {
                const sC = 60 - a - b - t;
                const sG = 55 - a - c - t;
                const sB = 50 - b - c - t;
                if (sC < 0 || sG < 0 || sB < 0) continue;
                if (t + a + b + c + sC + sG + sB === 70) best = Math.min(best, t);
              }
        return best;
      },
    },
  ],
};
