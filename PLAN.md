# GRE Simulator — Build Plan

Personal, offline GRE (Verbal + Quant) simulator that runs only on this computer.
Status: **PLANNED. Do not start building until the user says "start".**

---

## 0. User profile (drives difficulty & analytics)

| Source | Quant | Verbal |
|---|---|---|
| PowerPrep (scored) | 166 | 151 |
| GregMat #1 / #2 / #3 | 165 / 163 / 165 | 150 / 150 / 146 |
| PowerPrep (unscored, raw) | S1 10/12 → S2 15/15 | S1 4/12 → S2 11/15 |

Implications:
- **Quant is strong (~165–168).** The Hard Section-2 sets must be genuinely 165–170 level: multi-step problems, traps around edge cases (negatives, fractions, zero, non-integers), and harder combinatorics, probability and statistics. At this level most lost points are **careless or trap errors**, so the error log should focus on traps, time and changed answers.
- **Verbal is the main lever (~146–151).** Section 1 decides the route (4/12 on the PowerPrep V1 almost certainly meant the Easy V2, which caps the score). So Verbal S1 must feel like real ETS medium difficulty. The error log should break out TC per-blank accuracy, SE partial picks, RC question subtypes and missed vocabulary.
- Scoring calibration checks: Quant 10+15 on the Hard route should give about 167–168. Verbal 4+11 on the Easy route should give about 145–147.

---

## 1. Scope

**In scope**
- 3 full practice tests (Verbal + Quant). Each measure has a neutral Section 1 and an adaptive Section 2 (Easy / Medium / Hard).
- No question repeats across tests or tiers, and nothing is copied from ETS, GregMat or other prep companies.
- An ETS-like interface: toolbar, Mark/Review, Hide/Show Time, section intro screens, time-expired handling, Exit Section confirmation.
- An ETS-accurate on-screen calculator (spec in §5).
- Estimated 130–170 scores plus approximate percentiles.
- A detailed error log and a dashboard across tests.
- Resume after interruption (auto-save; "Save & Exit" option).
- Bonus practice: after a test, the two unseen Section-2 tiers unlock as timed practice sets.
- Measure-only mode (Verbal only / Quant only).

**Out of scope**
- AWA/essay.
- Any deployment or public hosting.
- Mobile layout. Built for laptop/desktop, at least 1280×720.
- A pause button. Explicitly not wanted; the resume feature covers interruptions.

---

## 2. Exam format being simulated (current shorter GRE)

| Section | Questions | Time | Difficulty |
|---|---|---|---|
| Verbal S1 | 12 | 18 min | Mixed / medium (same for everyone) |
| Verbal S2 | 15 | 23 min | Easy / Medium / Hard, chosen by Verbal S1 |
| Quant S1 | 12 | 21 min | Mixed / medium (same for everyone) |
| Quant S2 | 15 | 26 min | Easy / Medium / Hard, chosen by Quant S1 |

- 54 questions, about 88 minutes, no scheduled break.
- **Section order (ETS-like):** ETS puts AWA first, then Verbal and Quant in any order. Section 2 of a measure always comes after Section 1 of the same measure, which leaves 6 valid orders: VVQQ, VQVQ, VQQV, QQVV, QVQV, QVVQ. One is picked at random per attempt. Headers read "Section k of 4" (no AWA).
- In measure-only mode the order is just V1→V2 or Q1→Q2.
- Inside a section you can move freely (Back/Next/Review/Mark). Once a section ends you can't return to it.
- **Routing (tunable constants):** S1 correct ≥ 8/12 → Hard; 5–7 → Medium; ≤ 4 → Easy.

---

## 3. Pre-flight results (verified on this machine, 2026-10-17)

| Item | Result |
|---|---|
| Node / npm | v24.15.0 / 11.12.1 ✅ |
| npm registry reachable | ✅ (internet needed **once** for `npm install`; fully offline after that) |
| Browsers | Chrome ✅ and Edge ✅ installed. Chrome is the recommended browser. |
| git | 2.50.1 ✅. Local repo only, never pushed. |
| Ports 5173 / 4173 | free ✅ |
| Disk | ~17.7 GB free ✅ (project needs well under 300 MB) |
| Full toolchain smoke test | install → type-check → build → unit test → headless Chrome renders KaTeX + localStorage ✅ |
| Node runs `.ts` scripts natively | ✅ with explicit `.ts` import extensions, so no `tsx` dependency is needed |

**Pinned dependency versions** (chosen to be at least 3 weeks old, not the brand-new releases from the past few days). All tested together in the smoke test:

```
dependencies:    react 19.3.0, react-dom 19.3.0, katex 0.18.9
devDependencies: vite 8.3.1, @vitejs/plugin-react 6.1.1, typescript 6.0.3,
                 vitest 5.0.2, playwright-core 1.63.0,
                 @types/react 19.3.0, @types/react-dom 19.3.0
```
Use exact versions (no `^`) and commit `package-lock.json`.

**Gotchas found in pre-flight. These are mandatory rules for the build:**
1. **TypeScript 6 rejects `import 'x.css'`** unless `"types": ["vite/client"]` is in tsconfig (error TS2882). → Add it.
2. **Bash heredocs on this machine strip backslashes** (`\\frac` became a form-feed character plus "rac"). → **All source and content files are written with the Write/Edit tools, never with shell heredocs or `echo`.**
3. **Killing an `npx` process on Windows leaves an orphan `node` holding the port.** → Start servers with PowerShell `Start-Process node <script>`, stop them with `Stop-Process -Id`, then confirm the port is free.
4. tsconfig must set `allowImportingTsExtensions: true`, `erasableSyntaxOnly: true` and `noEmit: true`, and every import uses an explicit `.ts`/`.tsx` extension. This is so Node can run the validator scripts directly.

---

## 4. Architecture

**Stack:** React 19 + TypeScript + Vite 8, with KaTeX bundled locally (no CDN). Server is a tiny Node script with no dependencies.

```
GRE_Self_Website/
  PLAN.md                     this file
  start.bat                   one-click launcher (see §9)
  package.json / package-lock.json / tsconfig.json / vite.config.ts / index.html
  server/server.mjs           zero-dependency Node http server:
                              - serves dist/ on http://127.0.0.1:5173 (127.0.0.1 only, strictPort)
                              - /api/attempts  GET list, PUT save (atomic tmp+rename) → data/attempts/<id>.json
                              - /api/notes     user's self-tags on wrong questions
                              - DATA_DIR and PORT overridable by env (used for dev/e2e isolation)
  data/                       user's saved attempts (gitignored). Backup of localStorage.
  src/
    main.tsx, App.tsx         screen routing (state-based)
    types.ts                  ALL schemas (content + attempt + response)
    content/
      r.ts                    export const r = String.raw  (for LaTeX-safe strings)
      verify-helpers.ts       qcCompare(), brute-force helpers for verify()
      registry.ts             list of tests
      t1/ verbal-s1.ts verbal-s2-easy.ts verbal-s2-medium.ts verbal-s2-hard.ts
          quant-s1.ts  quant-s2-easy.ts  quant-s2-medium.ts  quant-s2-hard.ts  index.ts
      t2/ …same…   t3/ …same…
    engine/
      attempt.ts              create attempt, section order, routing, transitions (pure functions)
      timer.ts                timestamp-based countdown, sleep-gap detection
      grading.ts              correctness per question type, numeric equivalence
      scoring.ts              raw → scaled tables, percentiles
      analytics.ts            error-log insights, cross-test aggregation
      persistence.ts          localStorage (every 1 s) + server sync (every 10 s & on transitions)
    calculator/
      calcEngine.ts           pure state machine (unit-tested against ETS examples)
      Calculator.tsx          draggable window UI
    ui/
      Home.tsx                tests list (Start / Resume / Report), bonus sets, dashboard, backup
      TestShell.tsx           ETS toolbar, timer, section intro, dialogs
      ReviewScreen.tsx
      RichText.tsx            $math$, whitelisted HTML, {{blanks}}, highlights
      questions/              TextCompletion, SentenceEquivalence, ReadingComp (single/multi/select),
                              QuantComparison, MultipleChoice (single/multi), NumericEntry (single/fraction),
                              DataSetView + Chart (bar/line/pie/table/svg), Figure
      results/                ScoreReport, ErrorLog, QuestionReview, Dashboard, VocabList
  scripts/
    validate-content.ts       content gate (see §8.2)
    export-blind.ts           question sets WITHOUT answers → verify/blind/*.md
    compare-blind.ts          blind-solver answers vs. key → mismatch report
    release.mjs               build to dist-next/, then swap into dist/ (live site never breaks mid-build)
  tests/                      vitest unit tests
  e2e/smoke.mjs               playwright-core driving system Chrome (headless)
```

**Isolation rule:** the user's site is `127.0.0.1:5173` with `data/`. All development and e2e runs use **different ports (5180/5181) and `data-dev/`**. A different port is a different browser origin, so testing can never touch the user's saved progress.

---

## 5. Calculator spec (from the official ETS guidelines PDF)

The tonypottera24 replica is a Flutter app that can't be inspected, so the official ETS spec is the source of truth.

- **Layout (exactly the ETS picture):** title bar with ✕
  - Display row, with an **M** indicator on the left when memory is in use
  - `MR MC M+ ( )`
  - `7 8 9 ÷ C`
  - `4 5 6 × CE`
  - `1 2 3 − √`
  - `± 0 . + =`
  - Full-width `Transfer Display` row at the bottom
- **Order of operations:** parentheses → √ → × ÷ (left to right) → + − (left to right). Example: `1+2×4=` gives **9**.
- **√ and ±** act immediately on the number currently displayed. `21×21+54×54=√` gives 57.939624. `21×21+54×54√=` gives 21²+54√54.
- **Display:** at most 8 digits are typed or shown. Results are rounded to fit 8 digits (`-0.2528571`, `57.939624`). Integers show a trailing point (`0.`, `8.8`, `3375.`).
- **Errors:**
  - A result above 99,999,999 → **ERROR**.
  - Division by zero → **ERROR**.
  - √ of a negative number → **ERROR**.
  - While ERROR is showing, **only C** does anything.
  - Positive results below 10⁻⁷ display as **0**.
- **C** clears everything except memory. **CE** clears only the current entry.
- **Memory:**
  - The first **M+** stores the display value and shows "M". Each later M+ adds the display value to memory.
  - **MR** recalls memory into the entry. **MC** clears memory and hides "M".
- **Showing partial results:** pressing an operator shows the part of the expression that can already be worked out (for example `2×3+` shows 6).
- Pressing `=` again does nothing. After `=`, a digit starts a new entry and an operator continues from the result.
- **Transfer Display** is enabled only on numeric-entry questions with a single box. It writes the display (without the trailing point) into that box.
- **Window:**
  - Draggable by the title bar, closable, opened from the toolbar "Calculator" button.
  - Its state is kept when closed and reopened within a section, and reset between sections.
  - Quant sections only.
- **Keyboard:** works only while the calculator has focus: digits, `.`, `+ - * /`, `( )`, Enter or `=`. No Backspace, matching the ETS key set.
- **Unit tests (must pass):** `1+2×4=`→9; `4+6.73÷2=`→7.365; `(8.4+9.3)÷70=±`→-0.2528571; `8.4+9.3=÷70=±`→-0.2528571; `21×21+54×54=√`→57.939624; `15±×15±×15±=`→-3375; `6×5280÷3600=`→8.8; ETS memory example →73.25 (MR shows 5860); `10000000×10=`→ERROR; `6÷0=`→ERROR; `1±√`→ERROR; then C clears.

---

## 6. Test interface (ETS-like)

- **Toolbar, row 1:** test name on the left. On the right: `[Calculator]` (Quant only), `Exit Section`, `Review`, `Mark`, `Help`, `Back`, `Next`.
- **Toolbar, row 2:** "Section k of 4 | Question n of N" on the left; the timer `0:17:59` with `Hide Time` / `Show Time` on the right.
- **Timer:**
  - Counts down. At **5:00 remaining** it blinks for a few seconds and stays visible even if hidden (per ETS).
  - At 0:00 the section ends automatically with a "Time has expired" screen and a Continue button.
- **Section intro screen:** measure, question count, time, directions, and a Continue button. The timer starts on the first question.
- **Review screen:**
  - Table of Question # | Status | Marked. Statuses are `Answered`, `Not Answered`, `Incomplete` (for example an SE with 1 of 2 picked, a partly filled TC, or one fraction box filled) and `Not Seen`.
  - The current question is highlighted. Buttons: `Go to Question`, `Return`.
- **Next on the last question** opens the Review screen with an "end of section" message.
- **Exit Section** asks for confirmation: `Return` / `Exit Section` / **`Save & Exit Test (resume later)`**.
- **Answer widgets:**
  - Single answer: round ovals. Multiple answers: square checkboxes.
  - TC: one column of choices per blank; 1-blank questions have 5 choices, 2- and 3-blank questions have 3 per blank.
  - SE: 6 square boxes, exactly 2 to pick.
  - RC: split screen with a scrollable passage on the left and the question on the right. Select-in-passage questions make sentences clickable.
  - QC: Quantity A / Quantity B boxes with the 4 fixed ETS choices.
  - Numeric entry:
    - Single box accepts digits, one `.` and a leading `-`.
    - Fraction mode shows two boxes over a line; integers only.
    - Unit labels (`$`, `%`) can sit before or after the box.
  - DI: data set (charts or tables) on the left, question on the right.
- **Help:** directions for the current question type, plus the calculator guide.
- **Other:**
  - A full-screen button on the start screen.
  - Browser Back is intercepted during a test.
  - System fonts only (works offline).
  - Use physical scratch paper, as in the real test.

---

## 7. Data model (summary of `src/types.ts`)

```ts
type Measure = 'verbal' | 'quant';  type Tier = 'easy' | 'medium' | 'hard';
type Difficulty = 1 | 2 | 3 | 4 | 5;
type QType = 'tc' | 'se' | 'rc-single' | 'rc-multi' | 'rc-select' | 'cr'
           | 'qc' | 'mc-single' | 'mc-multi' | 'numeric';

interface QuestionBase {
  id: string;                 // t1-v1-03, t1-v2h-11, t2-q1-07, t3-q2e-15  (frozen once published)
  type: QType; difficulty: Difficulty;
  topic: TopicId;             // controlled list (§8.4)
  explanation: string;        // step-by-step, rich text
  distractors?: Record<number, { trap: TrapType; why: string }>;  // why tempting wrong options are wrong
  vocab?: { word: string; meaning: string }[];                     // verbal: words worth learning
  verify?: () => unknown;     // QUANT: required; independently recomputes the key
}
// Per-type fields: tc {stem with {{1}}..{{3}}, blanks: string[][], answer: number[]}
// se {stem with {{1}}, options[6], answer:[i,j]}  rc-* {passageId, stem, options?, answer}
// cr {stimulus, stem, options[5], answer}  qc {info?, quantityA, quantityB, answer: 0..3}
// mc-single {stem, options[5], answer}  mc-multi {stem, options, answer: number[], exactly?: number}
// numeric {stem, answer: {kind:'decimal', value} | {kind:'fraction', num, den}, prefix?, suffix?}
// Any quant question: figure?: Figure, dataSetId?: string
// Passage {id, paragraphs: string[][] (sentences)}   DataSet {id, title?, charts: ChartSpec[]}
// ChartSpec: bar | line | pie | table | svg(raw)
```

**Attempt state:** test id, mode, section order, current section/question/phase, and the tier chosen for each S2 (fixed at the moment S2 starts). For each section it also keeps:
- remaining milliseconds
- responses and marks
- time spent per question, visit counts and seen flags
- each question's **answer history**, so we can see when a right answer was changed to a wrong one

Also stored: suspensions (time and length of each), disputed question IDs and the user's notes.

**Grading rules (ETS):**
- No partial credit: TC needs every blank right; SE needs exactly the right 2; multi-select needs exactly the right set.
- Numeric answers are compared by value: 2.5 = 2.50, and fractions need not be reduced (3/6 = 1/2). If the question asks for rounding, the key holds the rounded value.

---

## 8. Content plan

### 8.1 Volume
Per test per measure: S1 (12) + S2 Easy (15) + S2 Medium (15) + S2 Hard (15) = **57**.
Per test **114**. All 3 tests: **342 questions**, every one with an explanation.

### 8.2 Section blueprints

**Verbal S1 (12):**
- Q1–4 TC (1-blank ×1, 2-blank ×2, 3-blank ×1)
- Q5–7 RC passage A (long, about 300–450 words; includes at least 1 multi-select)
- Q8–9 SE
- Q10–11 RC passage B (short, about 150–200 words)
- Q12 CR (argument paragraph)

**Verbal S2 (15):**
- Q1–5 TC (1-blank ×2, 2-blank ×2, 3-blank ×1)
- Q6–9 RC passage A (long; at least 1 multi-select)
- Q10–12 SE
- Q13–14 RC passage B (short)
- Q15 CR

Each test needs at least 1 select-in-passage question per measure across its sets (at least 1 in S1). Passage subjects are pre-assigned per test so passages don't overlap (§8.5).

**Quant S1 (12):**
- Q1–4 QC
- Q5–8 PS (mc-single ×2, mc-multi ×1, numeric ×1)
- Q9–10 DI (one data set)
- Q11–12 PS (mc-single ×1, numeric ×1)

**Quant S2 (15):**
- Q1–5 QC
- Q6–9 PS (mc-single ×2, mc-multi ×1, numeric ×1)
- Q10–12 DI (one data set)
- Q13–15 PS (mc-single ×2, numeric or mc-multi ×1)

Each test needs at least 1 fraction-style numeric entry per measure set. Topic mix is about 30% arithmetic, 30% algebra, 20% geometry and 20% data analysis.

**Difficulty mix (1–5 scale):**

| Set | d1 | d2 | d3 | d4 | d5 |
|---|---|---|---|---|---|
| S1 (12) | 1 | 2 | 6 | 2 | 1 |
| S2 Easy (15) | 4 | 6 | 5 | – | – |
| S2 Medium (15) | – | 3 | 7 | 5 | – |
| S2 Hard (15) | – | – | 3 | 6 | 6 |

Quant Hard d4–d5 items must be real 165–170 discriminators.

### 8.3 Validation gate: `node scripts/validate-content.ts` must pass before a test is released
1. `tsc` type-check of all content (structure is checked at compile time).
2. Counts, type order and difficulty mix match §8.2 exactly; IDs are unique and correctly formatted.
3. **Strings:**
   - No control characters, which catches lost backslashes (`\frac` → form-feed).
   - No bare LaTeX command words inside math (`frac{`, `sqrt{`, `times`, `cdot`, `le`, `neq`, `pi`…).
   - An even number of unescaped `$` (money must be written `\$`).
   - Every math segment renders with KaTeX `throwOnError: true`.
4. **Answer keys:**
   - Indices are within range; SE has exactly 2 answers; TC has the right blank and choice counts.
   - Numeric keys are well-formed, and every fraction denominator is nonzero.
5. **Quant `verify()`** runs for every question and must equal the key.
6. **Cross-references:**
   - Every passageId, dataSetId and select-in-passage sentence index exists.
   - Every SVG has a viewBox and no external references.
7. **Non-overlap:**
   - No exact or near-duplicate stems across the whole bank (normalized 5-gram Jaccard > 0.5 is flagged).
   - **No correct-answer vocabulary word reused across the bank.**
   - Passage subjects are unique.
8. **Non-empty:** every question has an explanation and difficulty, and the topic is in the controlled list.

**Then a blind solve:** `export-blind.ts` writes each set *without answers*. A separate solver agent answers everything and flags anything ambiguous; `compare-blind.ts` lists mismatches. I adjudicate each mismatch by fixing the key, rewriting the question, or confirming the key. Nothing ships with an unresolved mismatch.

**Finally, a render pass:** e2e renders every question in Chrome with zero console errors, and I visually inspect screenshots of every figure and chart.

### 8.4 Topic taxonomy (controlled list, used by the error log)
- **Quant:**
  - arith.integers, arith.exponents-roots, arith.fractions-decimals, arith.percents, arith.ratios-rates
  - alg.linear, alg.quadratics, alg.inequalities-abs, alg.functions, alg.coordinate, alg.sequences, alg.word-problems
  - geo.lines-angles, geo.triangles, geo.polygons, geo.circles, geo.solids
  - data.statistics, data.probability, data.combinatorics, data.distributions, data.interpretation
- **Verbal:**
  - tc.1blank, tc.2blank, tc.3blank, se
  - rc.main-idea, rc.detail, rc.inference, rc.function, rc.vocab-in-context, rc.attitude, rc.structure, rc.select-in-passage
  - cr.strengthen, cr.weaken, cr.assumption, cr.paradox, cr.evaluate, cr.boldface, cr.inference
- **Trap types:**
  - Verbal: reversal, too-extreme, out-of-scope, partial, wrong-shade, synonym-pair-trap
  - Quant: calc-slip, assumed-integer, assumed-positive, ignored-constraint, misread, d-trap, unit-error, wrong-formula

### 8.5 Non-overlap assignments (given to the content agents)
- **Passage domains:**
  - T1: cell biology, Renaissance art, labor economics, volcanology, Victorian literature, astronomy, linguistics, urban planning
  - T2: neuroscience, jazz history, environmental policy, paleontology, colonial history, materials science, moral philosophy, film studies
  - T3: ecology, architecture, behavioral economics, oceanography, ancient history, quantum physics, anthropology, poetry criticism
- **Quant:** each agent gets its test number and must vary scenarios. The validator's similarity check catches recycled problems across agents.

### 8.6 Authoring rules (given verbatim to every content agent)
- Original GRE-style content; never reproduce known published questions.
- Exactly one defensible answer (or exactly the stated set). TC and SE distractors are plausible but clearly wrong in context. SE includes a tempting synonym pair that doesn't fit.
- Scope is real GRE only (no calculus, no trig beyond 30-60-90 and 45-45-90 triangles). Numeric answers must be exact, or the stem states the rounding.
- **Strings with LaTeX use the `r` tag:** r\`If $\frac{x}{2}=3$…\`. Money is written `\$`. Thousands separators inside math are written `1{,}000`.
- Figures: SVG with a viewBox ≤ 480 wide, black strokes, 14px labels, and `notToScale` when it applies.
- Every quant question has an independent `verify()` (brute force where possible, using `qcCompare` for QC).
- Every question has an explanation. The most tempting wrong option(s) get a `distractors` entry with a trap type.
- Write one file per set (S1, S2-easy, S2-medium, S2-hard), and run the validator on your own files before finishing.

---

## 9. Persistence, resume & local hosting

- **Launch:**
  - `start.bat` checks Node, runs `npm install` if `node_modules` is missing, and builds if `dist/` is missing.
  - It then starts `server/server.mjs` and opens **http://127.0.0.1:5173** in Chrome.
  - The server binds to **127.0.0.1 only**, so it isn't reachable from the network and Windows Firewall won't prompt.
- **Always use that exact URL.** Saved data is tied to the address (`localhost` ≠ `127.0.0.1`). `start.bat` handles this, and the disk backup means nothing is lost either way.
- **Saving:**
  - The in-progress attempt saves to localStorage every second and on every answer, navigation or mark, plus on page close.
  - It syncs to `data/attempts/<id>.json` every 10 s, on every section change and at completion.
  - On load, the newer of the browser copy and the disk copy wins.
- **Resume:** the home screen shows "Resume Test N — Section k, mm:ss left". You come back to the same question with the same time left.
- **Ways to suspend:**
  - Close the tab or browser at any time (at most about 1 s of time is lost).
  - Or use Exit Section → **Save & Exit Test**.
  - Each suspension is logged and shown in the report.
- **Sleep or freeze protection:** if the timer sees a gap over 90 seconds (laptop slept, tab frozen), that gap isn't charged to your clock and is logged as an interruption. Normal tab switching still counts, as in a real test.
- **Safe updates while you study:** `release.mjs` builds into `dist-next/` and then swaps it in, so a reload during an update never breaks. Published question IDs never change.

---

## 10. Scoring (estimate; ETS's formula isn't public)

Scaled score = table[route][S1 correct + S2 correct]. The tables are monotonic and capped by route:

| Total correct (of 27) | Hard route | Medium route | Easy route |
|---|---|---|---|
| 27 | 170 | — | — |
| 25 | 168 | — | — |
| 22 | 164 | 161 (cap) | — |
| 19 | 160 | 157 | 152 (cap) |
| 15 | 155 | 151 | 146 |
| 11 | 151 | 146 | 141 |
| 5 | — | 139 | 134 |
| ≤ 1 | — | — | 130 |

- The full per-point tables live in `scoring.ts`. Unit tests check that scores never drop when correct answers rise, check these anchors, and check the user's calibration points from §0.
- Percentiles come from an approximate ETS table and are labeled "approx."
- Disputed questions (flagged by you in review) count as correct and are listed separately. The route chosen during the test can't change after the fact.

---

## 11. Error log & analytics

- **Score report:**
  - V and Q scaled scores with approximate percentiles.
  - Route per measure (for example "Verbal S1 7/12 → Medium S2 11/15").
  - Time used per section and interruptions.
- **Question table** (filter by wrong / marked / type / topic / section):
  - type, topic and difficulty
  - your answer vs. the correct answer
  - time and visits
  - marked flag and answer-change history
- **Per-question review:**
  - The question shown exactly as in the test, with your choice and the correct one highlighted.
  - The explanation, plus **why your specific wrong pick is tempting**, using the trap type.
- **"What went wrong" diagnosis per miss** (rule-based):

  | Diagnosis | Rule |
  |---|---|
  | Omitted | No answer given |
  | Time-pressure guess | Answered in the section's last 60 s, or in under 20 s |
  | Over-invested & wrong | More than 2× the target time and still wrong |
  | Changed away from correct | Answer history shows a right answer replaced by a wrong one |
  | Fell for trap (type) | The chosen option has a labeled trap |
  | Partial understanding | TC with some blanks right, SE with 1 of 2 right, multi-select missing or extra options |

  You can add your own tag to any miss (concept gap / silly / vocab / misread / time) and a note. Tags and notes are saved.
- **Pattern insights:**
  - Accuracy by type, topic and difficulty.
  - Time sinks, and rushed errors.
  - A pacing chart per section (cumulative time against an ideal line).
  - TC accuracy for blank (i), (ii) and (iii).
  - SE partial picks.
  - RC by subtype and by passage length.
  - QC: whether you over-pick D or C, and how often you fall for the D-trap.
  - Right-to-wrong answer changes.
  - Questions unanswered when time ran out.
- **Vocabulary list:** every word from missed TC/SE questions (the correct words and the distractors you chose) with meanings. Printable.
- **Dashboard across tests:** score trend, topic accuracy over time, and "Top 5 topics to revise".
- **Export:** CSV error log, JSON backup and import, and a print-friendly report (browser → Save as PDF).

---

## 12. Build phases (start only on the user's go)

| Phase | Owner | Work | Done when |
|---|---|---|---|
| **P0 Foundations** | me | `git init` (local only); scaffold with pinned versions; `types.ts`, `r.ts`, verify helpers; validator; one sample question per type | `tsc` + validator pass on the samples |
| **P1 Content** (parallel) | 6 writer agents | T1-Verbal, T1-Quant, T2-Verbal, T2-Quant, T3-Verbal, T3-Quant (57 questions each) | each agent's files pass the validator |
| **P1 App** (parallel with content) | me | calculator engine + UI; test engine (order, routing, timer, grading, scoring); ETS interface; review; persistence/resume; server; results, error log, dashboard | unit tests green; e2e green on sample content |
| **P2 Verify T1** | 2 blind-solver agents + me | blind-solve T1 V & Q, settle mismatches, render pass + figure screenshots | zero unresolved mismatches; no console errors |
| **Release T1** | me | `release.mjs`, `start.bat` check, hand over | **you start Test 1** |
| **P3 Verify T2, T3** | 4 blind-solver agents + me | same as P2 | same |
| **Release T2, T3** | me | swap the build in safely (an open Test 1 isn't affected) | you take T2 / T3 |

**Target:** Test 1 playable **this evening (Sat)**; Tests 2–3 late tonight or early Sunday. I'll report real progress rather than promise exact times.

**E2E smoke** (headless Chrome, isolated port and data):
- All-correct run → 170 / 170. All-wrong run → 130 / 130.
- Mid-section reload resumes with the right time and question.
- Time expiry handled (fast-clock flag in dev builds only).
- Calculator worked by clicks; Transfer Display.
- Review navigation; results page renders.
- No console errors anywhere.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| A wrong answer key or ambiguous question (written by AI) | `verify()` for every quant question, then blind-solve by a separate agent, then the render pass. The **dispute button** removes a bad question from the score |
| Difficulty calibration differs from ETS | The S1 mix is modeled on ETS, and scores are labeled "estimate ±3". Use the error log as the main value |
| Losing in-progress data | localStorage every second plus a disk copy, a fixed URL, and JSON export |
| A build breaking the site while you're mid-test | Build into `dist-next` and swap; frozen IDs |
| Toolchain surprises | Versions pinned and smoke-tested; pre-flight gotchas turned into rules (§3) |
| Token cost of 12 agents | Accepted by the user for speed |

---

## 14. What you need to do

1. Say **"start"**.
2. Stay online until the first `npm install` finishes (about a minute). After that everything runs offline.
3. To take a test: double-click `start.bat`, keep the black server window open, and use Chrome at `http://127.0.0.1:5173`. Closing that window stops the site; your in-progress test is safe and resumable.
4. Have scratch paper and a pen ready, as in the real test.
