# Content Authoring Guide (for question-writing agents)

You are writing original GRE practice content for a personal, offline simulator. The test taker scores about **165 Quant / 150 Verbal** on official practice tests. The content must feel like the real ETS GRE in difficulty, style and trap design.

Read first: `src/types.ts` (schemas), `src/content/blueprint.ts` (exact section layouts), `src/content/samples.ts` (one correct example of every type), `src/content/verify-helpers.ts`.

## 1. Your files

You own exactly 4 files: `src/content/<testId>/<measure>-<setKey>.ts` for setKey in `s1`, `s2-easy`, `s2-medium`, `s2-hard`.

- **Do not create or edit any other file.**
- Write each file with the **Write tool** (never shell heredocs or echo; they corrupt backslashes on this machine).
- Write and validate one file at a time.

Skeleton:

```ts
import { r } from '../r.ts';
import { qcCompare, qcOne, range, indexOfValue, indicesWhere, choose, perm, gcd, isPrime, round, mean, median, stdev } from '../verify-helpers.ts'; // import only what you use
import type { QuestionSet } from '../../types.ts';

export const set: QuestionSet = {
  testId: 't1',
  measure: 'quant',        // or 'verbal'
  key: 's1',               // 's1' | 's2-easy' | 's2-medium' | 's2-hard'
  passages: [],            // verbal: the 3 passages (A, B, C)
  dataSets: [],            // quant: the 1 DI data set
  questions: [ /* exactly per blueprint, in order */ ],
};
```

**Validate:** `node scripts/validate-content.ts <testId> <measure>` (for example `node scripts/validate-content.ts t1 quant`). Repeat until your files show ✔. Errors that mention another test's IDs (duplicate vocabulary, near-duplicate text) are yours to fix: change *your* question.

## 2. IDs

- Questions: `<testId>-<v|q><1|2e|2m|2h>-<NN>`, for example `t1-v1-01`, `t1-v2h-15`, `t2-q2e-07`, numbered in blueprint order.
- Passages: `<testId>-v<1|2e|2m|2h>-p<A|B|C>`, for example `t1-v2m-pA`.
- Data sets: `<testId>-q<1|2e|2m|2h>-dA`, for example `t3-q1-dA`.

## 3. Blueprints (enforced exactly)

**Verbal S1 (12):**
1. TC 1-blank
2. TC 2-blank
3. TC 2-blank
4. TC 3-blank
5–7. RC passage **A** (long, 250–480 words). At least one `rc-multi`; S1 must also contain at least one `rc-select` (put it in A or B).
8–9. SE
10–11. RC passage **B** (short, 100–250 words)
12. Critical-reasoning argument: `rc-single` on passage **C** (40–160 words), topic `cr.*`

**Verbal S2 (15):**
1–2. TC 1-blank
3–4. TC 2-blank
5. TC 3-blank
6–9. RC passage A (at least one `rc-multi`)
10–12. SE
13–14. RC passage B
15. CR on passage C

**Quant S1 (12):**
1–4. QC
5–8. Problem solving (`mc-single` / `mc-multi` / `numeric`)
9–10. Data interpretation: both use the same `dataSetId`, topic `data.interpretation`
11–12. Problem solving

Totals across the set: numeric ≥ 2, mc-multi ≥ 1, mc-single ≥ 3.

**Quant S2 (15):**
1–5. QC
6–9. Problem solving
10–12. DI (same `dataSetId`)
13–15. Problem solving

Totals: numeric ≥ 2, mc-multi ≥ 1, mc-single ≥ 4.

**Quant topic coverage:**
- Each set needs at least 2 questions from each family: `arith.*`, `alg.*`, `geo.*`, `data.*` (the DI questions count as data).
- Across your 4 quant sets, include **at least one fraction-style numeric entry** (`answer: {kind:'fraction', num, den}`).

**Exact difficulty mix per set (counts of d1, d2, d3, d4, d5):**

| Set | d1 | d2 | d3 | d4 | d5 |
|---|---|---|---|---|---|
| s1 | 1 | 2 | 6 | 2 | 1 |
| s2-easy | 4 | 6 | 5 | 0 | 0 |
| s2-medium | 0 | 3 | 7 | 5 | 0 |
| s2-hard | 0 | 0 | 3 | 6 | 6 |

## 4. Difficulty calibration (be honest; the scoring depends on it)

| Level | Score band | What it looks like |
|---|---|---|
| d1 | ~145 | One step, obvious clue, common vocabulary |
| d2 | ~150 | Two steps; mild distractors |
| d3 | ~155–158 | Typical GRE medium; one real trap |
| d4 | ~160–164 | Multi-step, or dense syntax / subtle RC inference; attractive wrong answers |
| d5 | ~165–170 | The hardest real GRE items; see below |

What d5 looks like:
- **Quant:** QC with hidden cases (negatives, fractions, zero, non-integers), number-property reasoning, conditional probability or combinatorics with restrictions, statistics concepts (how SD/median change), tricky geometry.
- **Verbal:** 3-blank TC with reversals and uncommon words, RC inference where two choices look right, CR with a subtle gap.

The **Hard S2** sets must genuinely challenge a 165+ quant scorer. The **S1** sets must feel like a real ETS first section: mostly medium, with a couple of hard items.

## 5. Formatting rules (the validator enforces most of these)

- **Wrap every string containing LaTeX or a backslash in the `r` tag:** r\`If $\frac{x}{2} = 3$ ...\`. In plain '...' strings a backslash is silently eaten (`'\frac'` becomes form-feed + "rac").
- **Math:** inline `$...$` only (no `$$`). Use KaTeX syntax: `\frac`, `\sqrt`, `\times`, `\leq`, `\geq`, `\neq`, `\pi`, `\angle`, `\triangle`, `\overline{AB}`, `^{\circ}`, `\text{cm}`.
- **Money:** always `\$` (for example r\`\$45\`). An unescaped `$` starts math.
- **Percent inside math** is `\%`. Outside math, plain `%` is fine.
- **Thousands inside math:** `1{,}000`. Outside math, `1,000` is fine.
- **Never type `<` or `>` outside math** (they'd be read as HTML). Write comparisons as $x < 3$.
- Allowed HTML: `<b> <i> <u> <sup> <sub> <br> <em> <strong>`. Use `<b>` for boldface in CR boldface questions.
- **Do not write `${`** inside an r\`\` string (that's a JS interpolation).
- TC/SE blanks are `{{1}}`, `{{2}}`, `{{3}}` in the stem.
- **Standard stem endings:**
  - rc-multi: `...<br><i>Consider each of the choices separately and select all that apply.</i>`
  - mc-multi: `...<br><i>Indicate all such numbers.</i>` (or "values"/"statements"). With "Indicate <b>two</b> such ...", also set `exactly: 2`.
  - rc-select: begins `Select the sentence in the passage that ...` (or "in the second paragraph", with `paragraph: 1`).
- **Passages:** `paragraphs: string[][]`, one string per sentence (sentence splitting matters for select-in-passage). Use curly quotes or plain quotes, never backticks.
- **QC:** use `info` for centered given information; `quantityA` / `quantityB` hold the quantities. Answer encoding: 0 = A greater, 1 = B greater, 2 = equal, 3 = cannot be determined.
- **Figures** (`figure: {kind:'svg', svg, notToScale?}`):
  - Hand-written SVG with `viewBox` (width ≤ 480, height ≤ 320) and `xmlns="http://www.w3.org/2000/svg"`.
  - `stroke="black"`, `fill="none"` (light gray `#ddd` fill allowed for shaded regions).
  - `<text>` labels at `font-size="14"` with `font-style="italic"` for points and variables. Keep labels clear of lines.
  - Set `notToScale: true` when it applies.
  - Double-check that coordinates actually depict what the stem says.
- **DI data sets:** use `bar` / `line` / `pie` / `table` chart specs (see types). If an answer depends on exact values, use a `table`, set `showValues: true`, or put values on gridlines (`yStep`). Otherwise make options spread far enough apart that estimating from the graph is enough. DI questions must be answerable from the data shown.

## 6. Quality rules

- **100% original.** Do not reproduce or lightly edit questions from ETS (Official Guide, PowerPrep), GregMat, Manhattan, Magoosh, Kaplan, Princeton Review, and so on. Avoid textbook-famous setups.
- **Exactly one defensible answer** (or exactly the keyed set). Re-solve every question from scratch before finalizing.
- **TC:** strong contextual clues (contrast/continuation signals); distractors plausible in isolation but wrong in context; all choices in a blank share a part of speech. 3-blank items need each blank to depend on the logic.
- **SE:** exactly two choices give sentences **alike in meaning**. Include a tempting synonym pair that does **not** fit the context, and a choice that fits the context but has no partner.
- **RC:** ETS-style passages (academic, dense, with a point of view or tension) and ETS question styles: main idea, detail, inference, function ("primarily in order to"), vocabulary in context, author's attitude, structure, select-in-passage. Wrong options: too extreme, reversals, out of scope, half-right.
- **CR:** weaken/strengthen/assumption/paradox/evaluate/boldface/inference. One clear best answer.
- **Quant:** real GRE scope only (no calculus or trig functions; special right triangles are OK). Exact numbers. If rounding is needed, say so in the stem ("to the nearest tenth").
- **Answer positions:** vary the correct positions across each set (roughly uniform over A–E). In QC sets, use all four answers, with D appearing in roughly 25–35% of QC items.
- **`verify()` (quant, required):** recompute the answer *independently*, by brute force where possible (enumerate cases, simulate, iterate over values). Don't just return the key. For QC, use `qcCompare` over representative cases, **including edge cases**. For mc-single, `indexOfValue(optionValues, computed)`. For mc-multi, `indicesWhere(...)`. For numeric, return the number (for fractions, return num/den).
- **`explanation`:** 2–6 sentences, step by step, showing the fastest valid method. For verbal, cite the clue words or the lines of the passage.
- **`traps`:** for every question at d3+, add at least one trap (option index, trap type, why it's tempting and wrong). For TC traps include `blank`. Trap types:
  - Verbal: reversal, too-extreme, out-of-scope, partial, wrong-shade, synonym-pair-trap
  - Quant: calc-slip, assumed-integer, assumed-positive, ignored-constraint, misread, d-trap, unit-error, wrong-formula
- **`vocab`** (TC/SE): list the correct words and any hard distractors as `{word, meaning}` with a short dictionary meaning. **Correct-answer words must be unique across the whole bank** (the validator checks all tests). Prefer a wide range of real GRE vocabulary.

## 7. Non-overlap assignments

Passage A/B subjects (write a fresh, original passage in that domain):

| Test | s1 A / B | s2-easy A / B | s2-medium A / B | s2-hard A / B |
|---|---|---|---|---|
| t1 | cell biology / Renaissance art | volcanology / urban planning | labor economics / linguistics | Victorian literature criticism / astronomy |
| t2 | neuroscience / jazz history | paleontology / film studies | environmental policy / materials science | moral philosophy / colonial-era history |
| t3 | ecology / architecture | oceanography / anthropology | behavioral economics / ancient history | poetry criticism / quantum physics |

CR passage C scenarios:

| Test | s1 | s2-easy | s2-medium | s2-hard |
|---|---|---|---|---|
| t1 | retail business | municipal policy | nutrition/medicine | archaeological dating |
| t2 | agriculture | education | transportation | a pharmaceutical study |
| t3 | a tech company | wildlife conservation | workplace productivity | epidemiology |

Quant: use varied, fresh scenarios and numbers. Don't reuse the sample questions' setups. Spread topics broadly across your 57 questions (cover nearly every topic in `QUANT_TOPICS`).

## 8. When done

Run the validator for your test and measure until all 4 files pass. Then reply with:
- a short summary: files written, plus the answer-position distribution per set;
- any question you're less than fully sure about.
