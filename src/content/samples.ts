// REFERENCE EXAMPLES — one of every question type, written in the exact conventions content files must use.
// (Not part of any test. Used by the content guide and by the dev-only demo test.)
import { r } from './r.ts';
import { qcCompare, range, indexOfValue, indicesWhere, choose } from './verify-helpers.ts';
import type { Passage, DataSet, VerbalQuestion, QuantQuestion } from '../types.ts';

export const samplePassages: Passage[] = [
  {
    id: 'sample-pA',
    paragraphs: [
      [
        'For much of the twentieth century, historians treated the medieval guild as an obstacle to economic growth, a cartel that restricted entry and suppressed innovation.',
        'More recent scholarship has complicated this picture.',
        'Guilds, it now appears, also certified quality, trained apprentices, and pooled the risks of members who fell ill.',
      ],
      [
        'Yet the revisionists may have overcorrected.',
        'That guilds performed useful functions does not establish that those functions required guilds; town governments and merchant networks often provided the same services at lower cost.',
      ],
    ],
  },
  {
    id: 'sample-pC',
    paragraphs: [
      [
        'Last year the city of Larmont installed brighter streetlights on Elm Avenue, and reported nighttime burglaries on that street fell by 30 percent.',
        'The city council concludes that installing brighter streetlights on other streets will reduce burglaries there as well.',
      ],
    ],
  },
];

export const sampleDataSets: DataSet[] = [
  {
    id: 'sample-dA',
    charts: [
      {
        kind: 'bar',
        title: 'Annual Revenue of Company X, by Division (in millions of dollars)',
        categories: ['2019', '2020', '2021', '2022'],
        series: [
          { name: 'Hardware', values: [40, 45, 38, 52] },
          { name: 'Software', values: [25, 30, 42, 48] },
        ],
        yLabel: 'Millions of dollars',
        yMax: 60,
        yStep: 10,
      },
    ],
  },
];

export const sampleVerbal: VerbalQuestion[] = [
  {
    id: 'sample-tc1',
    type: 'tc',
    difficulty: 3,
    topic: 'tc.1blank',
    stem: 'Although the senator was known for her {{1}} speeches, her final address to the chamber was surprisingly brief.',
    blanks: [['laconic', 'prolix', 'trenchant', 'stirring', 'candid']],
    answer: [1],
    explanation: '"Although" sets up a contrast with "surprisingly brief," so the blank must mean long-winded. "Prolix" (tediously lengthy) fits. "Laconic" is the opposite; "trenchant," "stirring," and "candid" do not contrast with brevity.',
    traps: [{ option: 0, blank: 0, trap: 'reversal', why: '"Laconic" means brief — it agrees with the second clause instead of contrasting with it.' }],
    vocab: [{ word: 'prolix', meaning: 'using too many words; tediously lengthy' }, { word: 'laconic', meaning: 'using very few words' }],
  },
  {
    id: 'sample-tc2',
    type: 'tc',
    difficulty: 4,
    topic: 'tc.2blank',
    stem: 'The committee’s report was anything but {{1}}: far from glossing over the agency’s failures, it {{2}} them in exhaustive detail.',
    blanks: [
      ['exhaustive', 'evasive', 'scathing'],
      ['catalogued', 'minimized', 'excused'],
    ],
    answer: [1, 0],
    explanation: '"Anything but" + "far from glossing over" means the report did not evade; blank (i) = "evasive." The report described failures in exhaustive detail, so blank (ii) = "catalogued."',
    vocab: [{ word: 'evasive', meaning: 'tending to avoid commitment or direct answers' }],
  },
  {
    id: 'sample-se',
    type: 'se',
    difficulty: 3,
    topic: 'se',
    stem: 'Critics found the novelist’s latest book {{1}}, a sprawling work whose many subplots never cohere into a satisfying whole.',
    options: ['diffuse', 'incisive', 'rambling', 'terse', 'derivative', 'polished'],
    answer: [0, 2],
    explanation: '"Sprawling" and "never cohere" call for a word meaning unfocused. "Diffuse" and "rambling" both fit and produce sentences alike in meaning. "Derivative" (unoriginal) is a plausible criticism but does not match the clue.',
    traps: [{ option: 4, trap: 'wrong-shade', why: '"Derivative" is negative but means unoriginal, not unfocused.' }],
    vocab: [{ word: 'diffuse', meaning: 'spread out; lacking concision or focus' }],
  },
  {
    id: 'sample-rc-single',
    type: 'rc-single',
    passageId: 'sample-pA',
    difficulty: 3,
    topic: 'rc.main-idea',
    stem: 'The primary purpose of the passage is to',
    options: [
      'defend the twentieth-century view of guilds against recent criticism',
      'describe a scholarly reassessment and raise a reservation about it',
      'argue that town governments were more efficient than guilds in every respect',
      'explain why guilds disappeared at the end of the medieval period',
      'catalogue the services that guilds provided to their members',
    ],
    answer: 1,
    explanation: 'Paragraph 1 presents the revisionist reassessment; paragraph 2 says the revisionists "may have overcorrected." That is a reassessment plus a reservation.',
    traps: [{ option: 2, trap: 'too-extreme', why: 'The passage says other institutions "often" provided services at lower cost — not "in every respect."' }],
  },
  {
    id: 'sample-rc-multi',
    type: 'rc-multi',
    passageId: 'sample-pA',
    difficulty: 4,
    topic: 'rc.detail',
    stem: 'According to the passage, recent scholarship holds that guilds did which of the following?<br><i>Consider each of the choices separately and select all that apply.</i>',
    options: ['Certified the quality of goods', 'Trained apprentices', 'Provided services more cheaply than town governments'],
    answer: [0, 1],
    explanation: 'Sentence 3 lists certifying quality and training apprentices. The cost comparison in paragraph 2 favors town governments, not guilds.',
  },
  {
    id: 'sample-rc-select',
    type: 'rc-select',
    passageId: 'sample-pA',
    difficulty: 3,
    topic: 'rc.select-in-passage',
    stem: 'Select the sentence in the passage that distinguishes between a function being useful and a function requiring a particular institution.',
    answer: { p: 1, s: 1 },
    explanation: 'The final sentence states that guilds performing useful functions does not show those functions required guilds.',
  },
  {
    id: 'sample-cr',
    type: 'rc-single',
    passageId: 'sample-pC',
    difficulty: 3,
    topic: 'cr.weaken',
    stem: 'Which of the following, if true, most seriously weakens the council’s conclusion?',
    options: [
      'Residents of Elm Avenue strongly supported the new streetlights.',
      'During the same year, the city added a police patrol that covered Elm Avenue but no other street.',
      'Brighter streetlights cost more to operate than the older lights.',
      'Burglaries in Larmont are more common at night than during the day.',
      'Some streets in Larmont already have bright streetlights.',
    ],
    answer: 1,
    explanation: 'A new patrol limited to Elm Avenue offers an alternative cause for the drop, so the result may not transfer to other streets.',
    traps: [{ option: 3, trap: 'out-of-scope', why: 'This is consistent with the argument and does not undercut the causal claim.' }],
  },
];

export const sampleQuant: QuantQuestion[] = [
  {
    id: 'sample-qc',
    type: 'qc',
    difficulty: 3,
    topic: 'alg.inequalities-abs',
    info: r`$x^2 = 9$`,
    quantityA: r`$x$`,
    quantityB: r`$2$`,
    answer: 3,
    explanation: r`$x$ can be $3$ or $-3$. If $x = 3$, A is greater; if $x = -3$, B is greater. The relationship cannot be determined.`,
    traps: [{ option: 0, trap: 'assumed-positive', why: r`Forgetting the negative root $x=-3$.` }],
    verify: () => qcCompare([3, -3].map((x) => [x, 2] as [number, number])),
  },
  {
    id: 'sample-mc',
    type: 'mc-single',
    difficulty: 2,
    topic: 'arith.percents',
    stem: r`A jacket originally priced at \$80 is discounted by 25 percent, and the sale price is then increased by 10 percent. What is the final price?`,
    options: [r`\$62`, r`\$66`, r`\$68`, r`\$70`, r`\$72`],
    answer: 1,
    explanation: r`$80 \times 0.75 = 60$, then $60 \times 1.1 = 66$. The final price is \$66.`,
    traps: [{ option: 2, trap: 'wrong-formula', why: r`Netting the percents (−25% + 10% = −15%) gives \$68 — but successive percent changes multiply, they do not add.` }],
    verify: () => indexOfValue([62, 66, 68, 70, 72], 80 * 0.75 * 1.1),
  },
  {
    id: 'sample-mc-multi',
    type: 'mc-multi',
    difficulty: 4,
    topic: 'arith.integers',
    stem: r`If $n$ is a positive integer and $n^2$ is divisible by 18, which of the following must be divisors of $n$?<br><i>Indicate all such numbers.</i>`,
    options: ['2', '3', '6', '9', '18'],
    answer: [0, 1, 2],
    explanation: r`$18 = 2 \cdot 3^2$. For $n^2$ to contain $2$ and $3^2$, $n$ must contain $2$ and $3$, so $6 \mid n$. $n = 6$ works ($36$ is divisible by 18), so 9 and 18 need not divide $n$.`,
    verify: () => {
      const ns = range(1, 500).filter((n) => (n * n) % 18 === 0);
      return indicesWhere([2, 3, 6, 9, 18], (d) => ns.every((n) => n % d === 0));
    },
  },
  {
    id: 'sample-numeric',
    type: 'numeric',
    difficulty: 3,
    topic: 'data.combinatorics',
    stem: 'A committee of 3 is to be chosen from 7 people. How many different committees are possible?',
    answer: { kind: 'decimal', value: 35 },
    explanation: r`Order does not matter: $\binom{7}{3} = \frac{7 \cdot 6 \cdot 5}{3 \cdot 2 \cdot 1} = 35$.`,
    verify: () => choose(7, 3),
  },
  {
    id: 'sample-fraction',
    type: 'numeric',
    difficulty: 3,
    topic: 'data.probability',
    stem: 'Two fair six-sided dice are rolled. What is the probability that the sum is 8?<br><i>Give your answer as a fraction.</i>',
    answer: { kind: 'fraction', num: 5, den: 36 },
    explanation: 'Sums of 8: (2,6), (3,5), (4,4), (5,3), (6,2) — 5 of 36 equally likely outcomes.',
    verify: () => {
      let n = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === 8) n++;
      return n / 36;
    },
  },
  {
    id: 'sample-geo',
    type: 'mc-single',
    difficulty: 3,
    topic: 'geo.triangles',
    stem: r`In the figure above, triangle $ABC$ is a right triangle with legs of length 6 and 8. What is the length of the altitude from $C$ to the hypotenuse $AB$?`,
    figure: {
      kind: 'svg',
      notToScale: true,
      svg: '<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><polygon points="40,170 260,170 40,40" fill="none" stroke="black" stroke-width="2"/><text x="28" y="188" font-size="14">C</text><text x="264" y="188" font-size="14">B</text><text x="28" y="36" font-size="14">A</text><text x="20" y="110" font-size="14">6</text><text x="145" y="188" font-size="14">8</text></svg>',
    },
    options: ['4.2', '4.8', '5', '5.6', '6'],
    answer: 1,
    explanation: r`The hypotenuse is $\sqrt{6^2 + 8^2} = 10$. Area $= \frac{1}{2}(6)(8) = 24 = \frac{1}{2}(10)h$, so $h = 4.8$.`,
    verify: () => indexOfValue([4.2, 4.8, 5, 5.6, 6], (6 * 8) / Math.hypot(6, 8)),
  },
  {
    id: 'sample-di',
    type: 'numeric',
    dataSetId: 'sample-dA',
    difficulty: 3,
    topic: 'data.interpretation',
    stem: 'By what percent did Software revenue increase from 2019 to 2022?',
    suffix: '%',
    answer: { kind: 'decimal', value: 92 },
    explanation: r`$(48 - 25)/25 = 0.92$, an increase of 92%.`,
    verify: () => ((48 - 25) / 25) * 100,
  },
];
