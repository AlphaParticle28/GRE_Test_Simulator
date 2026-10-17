import { r } from '../r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, combos, perms, mean, stdev, round, sum } from '../verify-helpers.ts';
import type { QuestionSet } from '../../types.ts';

// Data for the DI set (questions 10-12)
const COLLEGES = ['Arts and Sciences', 'Business', 'Engineering', 'Nursing'];
const ENROLL_2020 = [4800, 2400, 1800, 1000];
const ENROLL_2024 = [5040, 3000, 2340, 1120];
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const SQUARE_SVG =
  '<svg viewBox="0 0 330 310" xmlns="http://www.w3.org/2000/svg">' +
  '<polygon points="270,60 60,60 200,200 270,165" fill="#ddd" stroke="none"/>' +
  '<polygon points="60,270 270,270 270,60 60,60" fill="none" stroke="black" stroke-width="2"/>' +
  '<line x1="60" y1="270" x2="270" y2="165" stroke="black" stroke-width="2"/>' +
  '<line x1="270" y1="270" x2="60" y2="60" stroke="black" stroke-width="2"/>' +
  '<text x="42" y="290" font-size="14" font-style="italic">A</text>' +
  '<text x="276" y="290" font-size="14" font-style="italic">B</text>' +
  '<text x="276" y="56" font-size="14" font-style="italic">C</text>' +
  '<text x="42" y="56" font-size="14" font-style="italic">D</text>' +
  '<text x="278" y="170" font-size="14" font-style="italic">E</text>' +
  '<text x="195" y="226" font-size="14" font-style="italic">F</text>' +
  '</svg>';

export const set: QuestionSet = {
  testId: 't1',
  measure: 'quant',
  key: 's2-hard',
  passages: [],
  dataSets: [
    {
      id: 't1-q2h-dA',
      charts: [
        {
          kind: 'table',
          title: 'Enrollment at Westbrook University, by College',
          columns: ['College', '2020', '2024'],
          rows: [
            ...COLLEGES.map((c, i) => [c, fmt(ENROLL_2020[i]), fmt(ENROLL_2024[i])]),
            ['Total', fmt(sum(ENROLL_2020)), fmt(sum(ENROLL_2024))],
          ],
          note: 'Each student is enrolled in exactly one college.',
        },
      ],
    },
  ],
  questions: [
    // 1. QC
    {
      id: 't1-q2h-01',
      type: 'qc',
      difficulty: 5,
      topic: 'data.statistics',
      info: r`List $S$ consists of 8 numbers that have an average (arithmetic mean) of 40 and a standard deviation of 6. List $T$ consists of the 8 numbers in list $S$ together with two additional numbers, 34 and 46.`,
      quantityA: r`The standard deviation of the 10 numbers in list $T$`,
      quantityB: r`$6$`,
      answer: 2,
      explanation: r`The two added numbers have mean 40, so list $T$ still has mean 40. The standard deviation is the square root of the average squared deviation from the mean, and for $S$ that average is $6^2 = 36$. Each new number is exactly 6 from the mean, so each also has squared deviation 36. Adding values whose squared deviations equal the existing average leaves the average unchanged: $\frac{8(36) + 36 + 36}{10} = 36$. So the standard deviation of $T$ is still 6, and the quantities are equal.`,
      traps: [
        {
          option: 1,
          trap: 'wrong-formula',
          why: r`Adding values that lie inside the range of the data does not automatically reduce the standard deviation; only values less than one standard deviation from the mean would.`,
        },
        {
          option: 0,
          trap: 'wrong-formula',
          why: r`Adding values away from the mean increases the standard deviation only if they are more than one standard deviation from the mean; 34 and 46 are exactly one standard deviation away.`,
        },
      ],
      verify: () => {
        // build several different lists S with mean 40 and SD 6, then measure T
        const make = (base: number[]) => {
          const m = mean(base);
          const s = stdev(base);
          return base.map((x) => 40 + (6 * (x - m)) / s);
        };
        const bases = [
          [1, 2, 3, 4, 5, 6, 7, 20],
          [0, 0, 0, 0, 1, 1, 1, 1],
          [3, 9, 2, 7, 7, 1, 8, 15],
        ];
        return qcCompare(bases.map((b) => [stdev([...make(b), 34, 46]), 6] as [number, number]));
      },
    },
    // 2. QC
    {
      id: 't1-q2h-02',
      type: 'qc',
      difficulty: 5,
      topic: 'alg.inequalities-abs',
      info: r`$\frac{x}{|x|} + \frac{y}{|y|} = 0$`,
      quantityA: r`$xy$`,
      quantityB: r`$x + y$`,
      answer: 3,
      explanation: r`Each of $\frac{x}{|x|}$ and $\frac{y}{|y|}$ is 1 or $-1$, so the condition means $x$ and $y$ have opposite signs. Then $xy < 0$, but $x + y$ can be positive, negative, or zero. If $x = 2$ and $y = -1$, then $xy = -2$ and $x + y = 1$, so B is greater. If $x = -10$ and $y = 0.5$, then $xy = -5$ and $x + y = -9.5$, so A is greater. (If $x = -1$ and $y = 0.5$, the quantities are equal.) The relationship cannot be determined.`,
      traps: [
        {
          option: 1,
          trap: 'assumed-integer',
          why: r`For integers of opposite signs, $xy$ is always less than $x + y$, so testing only integers suggests B. A positive value between 0 and 1 paired with a large negative value reverses the comparison.`,
        },
      ],
      verify: () => {
        const vals = [-10, -3, -1, -0.5, -0.1, 0.1, 0.5, 1, 3, 10];
        const cases: Array<[number, number]> = [];
        for (const x of vals)
          for (const y of vals) if (x / Math.abs(x) + y / Math.abs(y) === 0) cases.push([x * y, x + y]);
        return qcCompare(cases);
      },
    },
    // 3. QC
    {
      id: 't1-q2h-03',
      type: 'qc',
      difficulty: 3,
      topic: 'geo.triangles',
      info: r`In triangle $XYZ$, $XY = YZ$ and $\angle XYZ = 70^{\circ}$.`,
      quantityA: r`$XZ$`,
      quantityB: r`$XY$`,
      answer: 0,
      explanation: r`Since $XY = YZ$, the base angles at $X$ and $Z$ are equal: each is $\frac{180^{\circ} - 70^{\circ}}{2} = 55^{\circ}$. In a triangle, the longer side is opposite the larger angle. $XZ$ is opposite the $70^{\circ}$ angle at $Y$, and $XY$ is opposite the $55^{\circ}$ angle at $Z$, so $XZ > XY$. Quantity A is greater.`,
      traps: [
        {
          option: 2,
          trap: 'misread',
          why: r`The equal sides are $XY$ and $YZ$; the base $XZ$ is a different side, and its length depends on the angle at $Y$.`,
        },
      ],
      verify: () => {
        const t = (70 * Math.PI) / 180;
        return qcCompare(
          [0.5, 1, 3, 10].map((L) => {
            // Y at the origin, X = (L, 0), Z at angle 70 degrees from YX
            const xz = Math.hypot(L - L * Math.cos(t), -L * Math.sin(t));
            return [xz, L] as [number, number];
          }),
        );
      },
    },
    // 4. QC
    {
      id: 't1-q2h-04',
      type: 'qc',
      difficulty: 4,
      topic: 'alg.sequences',
      info: r`In the sequence $a_1, a_2, a_3, \ldots$, $a_1 = 1$, $a_2 = 2$, and $a_n = a_{n-1} - a_{n-2}$ for each integer $n \geq 3$.`,
      quantityA: r`The sum of the first 101 terms of the sequence`,
      quantityB: r`The sum of the first 100 terms of the sequence`,
      answer: 1,
      explanation: r`List the terms: $1, 2, 1, -1, -2, -1, 1, 2, \ldots$ The sequence repeats every 6 terms, and each block of 6 sums to 0. Since $100 = 6(16) + 4$, the sum of the first 100 terms is $a_1 + a_2 + a_3 + a_4 = 1 + 2 + 1 - 1 = 3$. The 101st term is $a_5 = -2$, so the sum of the first 101 terms is $3 - 2 = 1$. Quantity B is greater.`,
      traps: [
        {
          option: 0,
          trap: 'assumed-positive',
          why: r`Assuming that including one more term must increase the sum; the 101st term is negative ($-2$).`,
        },
      ],
      verify: () => {
        const a = [0, 1, 2];
        for (let n = 3; n <= 101; n++) a.push(a[n - 1] - a[n - 2]);
        const S = (k: number) => sum(a.slice(1, k + 1));
        return qcCompare([[S(101), S(100)]]);
      },
    },
    // 5. QC
    {
      id: 't1-q2h-05',
      type: 'qc',
      difficulty: 4,
      topic: 'data.probability',
      info: r`Events $E$ and $F$ satisfy $P(E) = 0.6$ and $P(F) = 0.5$.`,
      quantityA: r`The probability that both $E$ and $F$ occur`,
      quantityB: r`$0.3$`,
      answer: 3,
      explanation: r`$P(E \text{ and } F) = P(E)P(F) = 0.3$ only if $E$ and $F$ are independent, which is not given. In general, $P(E \text{ and } F) = P(E) + P(F) - P(E \text{ or } F) = 1.1 - P(E \text{ or } F)$. Since $P(E \text{ or } F)$ can be anywhere from 0.6 to 1, $P(E \text{ and } F)$ can be anywhere from 0.1 (when at least one of the events always occurs) to 0.5 (when $F$ can occur only if $E$ occurs). It can be less than, equal to, or greater than 0.3.`,
      traps: [
        {
          option: 2,
          trap: 'wrong-formula',
          why: r`Multiplying $0.6 \times 0.5 = 0.3$ assumes the events are independent, which the problem does not state.`,
        },
      ],
      verify: () => {
        // 10 equally likely outcomes; E = outcomes 0-5; try every 5-outcome event F
        const cases = combos(range(0, 9), 5).map((F) => [F.filter((o) => o < 6).length / 10, 0.3] as [number, number]);
        return qcCompare(cases);
      },
    },
    // 6. PS
    {
      id: 't1-q2h-06',
      type: 'numeric',
      difficulty: 5,
      topic: 'data.combinatorics',
      stem: r`How many different arrangements of the seven letters A, A, A, B, B, C, D are there in which no two of the A's are next to each other?`,
      answer: { kind: 'decimal', value: 120 },
      explanation: r`First arrange the four letters other than A (B, B, C, D): $\frac{4!}{2!} = 12$ distinct orders. Each order leaves 5 slots for the A's: before the first letter, between consecutive letters, and after the last. Putting the three identical A's into 3 different slots guarantees that no two are adjacent: $\binom{5}{3} = 10$ ways. Total: $12 \times 10 = 120$. Forgetting that the two B's are identical gives 240.`,
      verify: () => {
        const distinct = new Set(perms(['A', 'A', 'A', 'B', 'B', 'C', 'D']).map((p) => p.join('')));
        return [...distinct].filter((s) => !s.includes('AA')).length;
      },
    },
    // 7. PS
    {
      id: 't1-q2h-07',
      type: 'mc-single',
      difficulty: 3,
      topic: 'geo.solids',
      stem: r`Three faces of a rectangular box meet at one corner, and the areas of those faces are 24, 32, and 48 square inches. What is the volume of the box, in cubic inches?`,
      options: ['104', '192', '208', '384', '36,864'],
      answer: 1,
      explanation: r`Let the edges be $a$, $b$, and $c$, with $ab = 24$, $ac = 32$, and $bc = 48$. Multiplying the three equations gives $(abc)^2 = 24 \cdot 32 \cdot 48 = 36{,}864$, so the volume is $abc = \sqrt{36{,}864} = 192$. (The edges are 4, 6, and 8 inches.)`,
      traps: [
        {
          option: 4,
          trap: 'calc-slip',
          why: r`$36{,}864$ is the square of the volume; its square root must still be taken.`,
        },
        {
          option: 2,
          trap: 'misread',
          why: r`208 is the surface area of the box, $2(24 + 32 + 48)$, not its volume.`,
        },
      ],
      verify: () => {
        // search edge lengths in steps of 0.5 inch
        let vol = -1;
        for (let a = 0.5; a <= 48; a += 0.5)
          for (let b = 0.5; b <= 48; b += 0.5) {
            if (a * b !== 24) continue;
            const c = 32 / a;
            if (Math.abs(b * c - 48) < 1e-9) vol = a * b * c;
          }
        return indexOfValue([104, 192, 208, 384, 36864], vol);
      },
    },
    // 8. PS (multi)
    {
      id: 't1-q2h-08',
      type: 'mc-multi',
      difficulty: 5,
      topic: 'alg.functions',
      stem: r`The function $h$ is defined for all numbers $x$ by $h(x) = \big|\,|x - 3| - 2\,\big|$. For which of the following values of $k$ does the equation $h(x) = k$ have exactly four solutions?<br><i>Indicate all such values.</i>`,
      options: [r`$-1$`, r`$0$`, r`$\frac{1}{2}$`, r`$1$`, r`$\frac{3}{2}$`, r`$2$`, r`$3$`],
      answer: [2, 3, 4],
      explanation: r`$h(x) = k$ means $|x - 3| - 2 = k$ or $|x - 3| - 2 = -k$, that is, $|x - 3| = 2 + k$ or $|x - 3| = 2 - k$. An equation $|x - 3| = c$ has two solutions if $c > 0$, one if $c = 0$, and none if $c < 0$. For $0 < k < 2$, the values $2 + k$ and $2 - k$ are different and both positive, giving four solutions. For $k = 2$, $|x - 3| = 4$ or $0$ gives only three solutions ($-1$, $3$, $7$). For $k = 0$ the two equations coincide (two solutions), for $k > 2$ there are two, and for $k < 0$ there are none. So the values are $\frac{1}{2}$, $1$, and $\frac{3}{2}$.`,
      traps: [
        {
          option: 5,
          trap: 'ignored-constraint',
          why: r`At $k = 2$ the equation $|x - 3| = 2 - k = 0$ has only the single solution $x = 3$, so there are three solutions in all, not four.`,
        },
        {
          option: 1,
          trap: 'calc-slip',
          why: r`At $k = 0$ the equations $|x - 3| = 2 + k$ and $|x - 3| = 2 - k$ are the same equation, so there are only two solutions (1 and 5).`,
        },
      ],
      verify: () => {
        const h = (x: number) => Math.abs(Math.abs(x - 3) - 2);
        const xs = range(-20, 26, 0.25);
        return indicesWhere([-1, 0, 0.5, 1, 1.5, 2, 3], (k) => xs.filter((x) => Math.abs(h(x) - k) < 1e-9).length === 4);
      },
    },
    // 9. PS
    {
      id: 't1-q2h-09',
      type: 'mc-single',
      difficulty: 4,
      topic: 'geo.polygons',
      figure: { kind: 'svg', svg: SQUARE_SVG },
      stem: r`In the figure above, $ABCD$ is a square with sides of length 6, $E$ is the midpoint of side $\overline{BC}$, and $\overline{AE}$ intersects diagonal $\overline{BD}$ at point $F$. What is the area of the shaded region $CDFE$?`,
      options: ['9', '12', '13.5', '15', '18'],
      answer: 3,
      explanation: r`Since $\overline{AD} \parallel \overline{BE}$, triangles $FAD$ and $FEB$ are similar with ratio $AD : EB = 6 : 3 = 2 : 1$. So $F$ is twice as far from $\overline{AD}$ as from $\overline{BC}$, and its distance from $\overline{BC}$ is $\frac{1}{3}(6) = 2$. Triangle $BEF$ has base $BE = 3$ and height 2, so its area is 3. The shaded region is triangle $BCD$ (area $\frac{1}{2} \cdot 6 \cdot 6 = 18$) minus triangle $BEF$: $18 - 3 = 15$.`,
      traps: [
        {
          option: 2,
          trap: 'misread',
          why: r`Assuming $F$ is the center of the square makes triangle $BEF$ have area 4.5 and gives 13.5, but $F$ is only one third of the way from $B$ to $D$.`,
        },
        {
          option: 4,
          trap: 'calc-slip',
          why: r`18 is the area of triangle $BCD$; triangle $BEF$ must still be removed.`,
        },
      ],
      verify: () => {
        const A = [0, 0];
        const B = [6, 0];
        const C = [6, 6];
        const D = [0, 6];
        const E = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
        const [x1, y1] = A;
        const [x2, y2] = E;
        const [x3, y3] = B;
        const [x4, y4] = D;
        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den;
        const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den;
        const poly = [C, D, [px, py], E];
        let area2 = 0;
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i];
          const q = poly[(i + 1) % poly.length];
          area2 += p[0] * q[1] - q[0] * p[1];
        }
        return indexOfValue([9, 12, 13.5, 15, 18], Math.abs(area2) / 2);
      },
    },
    // 10. DI
    {
      id: 't1-q2h-10',
      type: 'mc-single',
      difficulty: 3,
      topic: 'data.interpretation',
      dataSetId: 't1-q2h-dA',
      stem: r`Enrollment in which college increased by the smallest percent from 2020 to 2024?`,
      options: ['Arts and Sciences', 'Business', 'Engineering', 'Nursing', 'All four increased by the same percent.'],
      answer: 0,
      explanation: r`Percent increases: Arts and Sciences $\frac{240}{4{,}800} = 5\%$; Business $\frac{600}{2{,}400} = 25\%$; Engineering $\frac{540}{1{,}800} = 30\%$; Nursing $\frac{120}{1{,}000} = 12\%$. The smallest percent increase was in Arts and Sciences, even though Nursing had the smallest increase in number of students.`,
      traps: [
        {
          option: 3,
          trap: 'misread',
          why: 'Nursing had the smallest <i>numerical</i> increase (120 students), but relative to its size its 12% increase exceeds the 5% increase in Arts and Sciences.',
        },
      ],
      verify: () => {
        const pcts = ENROLL_2020.map((v, i) => (ENROLL_2024[i] - v) / v);
        const min = Math.min(...pcts);
        return pcts.filter((p) => p === min).length === 4 ? 4 : pcts.indexOf(min);
      },
    },
    // 11. DI (multi)
    {
      id: 't1-q2h-11',
      type: 'mc-multi',
      difficulty: 4,
      topic: 'data.interpretation',
      dataSetId: 't1-q2h-dA',
      stem: r`For which colleges did the college's enrollment make up a greater percent of the university's total enrollment in 2024 than in 2020?<br><i>Indicate all such colleges.</i>`,
      options: ['Arts and Sciences', 'Business', 'Engineering', 'Nursing'],
      answer: [1, 2],
      explanation: r`Total enrollment grew by 15% (from 10,000 to 11,500). A college's share of the total rises exactly when its own enrollment grew by more than 15%. Business (25%) and Engineering (30%) qualify: their shares rose from 24% to about 26.1% and from 18% to about 20.3%. Arts and Sciences (5%) and Nursing (12%) grew more slowly than the total, so their shares fell, from 48% to about 43.8% and from 10% to about 9.7%.`,
      traps: [
        {
          option: 3,
          trap: 'misread',
          why: 'Nursing enrollment increased, but by only 12%, less than the 15% growth of the total, so its share of the total actually fell.',
        },
      ],
      verify: () => {
        const t20 = sum(ENROLL_2020);
        const t24 = sum(ENROLL_2024);
        return indicesWhere([0, 1, 2, 3], (i) => ENROLL_2024[i] / t24 > ENROLL_2020[i] / t20);
      },
    },
    // 12. DI
    {
      id: 't1-q2h-12',
      type: 'numeric',
      difficulty: 5,
      topic: 'data.interpretation',
      dataSetId: 't1-q2h-dA',
      stem: r`Suppose that from 2024 to 2028 the enrollment of each college increases by the same percent as it did from 2020 to 2024. By what percent will the university's total enrollment increase from 2024 to 2028?<br><i>Round your answer to the nearest whole percent.</i>`,
      suffix: '%',
      answer: { kind: 'decimal', value: 16 },
      explanation: r`Apply each college's 2020-to-2024 growth factor to its 2024 enrollment: Arts and Sciences $5{,}040 \times 1.05 = 5{,}292$; Business $3{,}000 \times 1.25 = 3{,}750$; Engineering $2{,}340 \times 1.30 = 3{,}042$; Nursing $1{,}120 \times 1.12 = 1{,}254.4$. The projected total is $13{,}338.4$, and $\frac{13{,}338.4}{11{,}500} \approx 1.160$, an increase of about 16%. It is not 15%: the fast-growing colleges now make up a larger share of the total, so the overall growth rate rises.`,
      verify: () => {
        const t24 = sum(ENROLL_2024);
        const t28 = sum(ENROLL_2024.map((v, i) => v * (ENROLL_2024[i] / ENROLL_2020[i])));
        return round(((t28 - t24) / t24) * 100);
      },
    },
    // 13. PS (fraction numeric)
    {
      id: 't1-q2h-13',
      type: 'numeric',
      difficulty: 5,
      topic: 'data.probability',
      stem: r`Bag X contains 3 red marbles and 2 white marbles, and bag Y contains 2 red marbles and 6 white marbles. A fair coin is tossed. If it lands heads, one marble is drawn at random from bag X; if it lands tails, one marble is drawn at random from bag Y. Given that the marble drawn is red, what is the probability that it was drawn from bag X?<br><i>Give your answer as a fraction.</i>`,
      answer: { kind: 'fraction', num: 12, den: 17 },
      explanation: r`$P(\text{X and red}) = \frac{1}{2} \cdot \frac{3}{5} = \frac{3}{10}$ and $P(\text{Y and red}) = \frac{1}{2} \cdot \frac{2}{8} = \frac{1}{8}$. So $P(\text{red}) = \frac{3}{10} + \frac{1}{8} = \frac{17}{40}$, and $P(\text{X} \mid \text{red}) = \frac{3/10}{17/40} = \frac{12}{17}$. Simply counting red marbles (3 of the 5 red marbles are in bag X, giving $\frac{3}{5}$) is wrong because the bags have different sizes.`,
      verify: () => {
        // weight each (coin, marble) outcome by 80 * (1/2) * (1/bag size)
        const bags: Record<string, string[]> = {
          X: ['R', 'R', 'R', 'W', 'W'],
          Y: ['R', 'R', 'W', 'W', 'W', 'W', 'W', 'W'],
        };
        let redX = 0;
        let redAll = 0;
        for (const [name, bag] of Object.entries(bags))
          for (const m of bag) {
            const w = 80 / (2 * bag.length);
            if (m === 'R') {
              redAll += w;
              if (name === 'X') redX += w;
            }
          }
        return redX / redAll;
      },
    },
    // 14. PS
    {
      id: 't1-q2h-14',
      type: 'mc-single',
      difficulty: 4,
      topic: 'arith.exponents-roots',
      stem: r`Which of the following is greatest?`,
      options: [r`$\sqrt{2}$`, r`$\sqrt[3]{3}$`, r`$\sqrt[4]{5}$`, r`$\sqrt[6]{10}$`, r`$\sqrt[12]{120}$`],
      answer: 2,
      explanation: r`Raise every option to the 12th power, which preserves order for positive numbers: $(\sqrt{2})^{12} = 2^6 = 64$, $(\sqrt[3]{3})^{12} = 3^4 = 81$, $(\sqrt[4]{5})^{12} = 5^3 = 125$, $(\sqrt[6]{10})^{12} = 10^2 = 100$, and $(\sqrt[12]{120})^{12} = 120$. The largest is 125, so $\sqrt[4]{5}$ is greatest.`,
      traps: [
        {
          option: 4,
          trap: 'calc-slip',
          why: r`120 is the largest radicand, and $\sqrt[12]{120}$ is very close to $\sqrt[4]{5} = \sqrt[12]{125}$, but it is slightly smaller.`,
        },
      ],
      verify: () => {
        const vals = [2 ** (1 / 2), 3 ** (1 / 3), 5 ** (1 / 4), 10 ** (1 / 6), 120 ** (1 / 12)];
        return vals.indexOf(Math.max(...vals));
      },
    },
    // 15. PS
    {
      id: 't1-q2h-15',
      type: 'numeric',
      difficulty: 4,
      topic: 'arith.integers',
      stem: r`For how many positive integers $n$ is $n^2$ a divisor of $7{,}200$?`,
      answer: { kind: 'decimal', value: 12 },
      explanation: r`$7{,}200 = 2^5 \cdot 3^2 \cdot 5^2$. If $n = 2^a 3^b 5^c$, then $n^2 = 2^{2a} 3^{2b} 5^{2c}$ divides $7{,}200$ exactly when $2a \leq 5$, $2b \leq 2$, and $2c \leq 2$; that is, $a \in \{0, 1, 2\}$, $b \in \{0, 1\}$, and $c \in \{0, 1\}$. That gives $3 \times 2 \times 2 = 12$ values of $n$ (the largest is $n = 60$). A common error is to count all 54 divisors of $7{,}200$, or to allow $a = 3$.`,
      verify: () => range(1, 100).filter((n) => 7200 % (n * n) === 0).length,
    },
  ],
};
