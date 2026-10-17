# GRE Simulator

Ran out of free GRE mocks, so I built my own. Runs locally, looks and feels like the real ETS test. (Paid ETS tests do be crazy expensive ong)

## What it does

- 3 full practice tests (Verbal + Quant, 54 questions each, ~88 min) [Analytical Writing? What daat??]
- Section-adaptive like the real GRE: how you do in section 1 decides how hard section 2 is
- Real timing, Mark/Review, Hide Time, the works
- The clunky ETS calculator, recreated (order of operations, 8 digits, Transfer Display) (We all know how bad it actually is, F**k you ETS calculator, but gotta do what I gotta do)
- 130–170 score estimate after each test
- An error log that tells you *why* you missed stuff (fell for a trap, rushed, changed a right answer, ran out of time), plus a list of the vocab words you missed (These were my patterns, you can add yours)
- Pause by closing the tab and resume later with the same time left (My test, My way type shi)

## Run it

Needs [Node.js](https://nodejs.org) 20+.

```bash
npm install
npm run release   # build
npm run serve     # http://127.0.0.1:5173
```

On Windows, just double-click `start.bat`. (Poor guy here, never used a Mac enough, don't know how it works there)

## Heads up

- All questions are original (AI-written, then independently re-solved to check the answer keys). Not affiliated with ETS.
- Scores are estimates (±3). The hard Quant sets run harder than the real thing.
- Your attempts are saved in your browser and in `data/` (gitignored).

## Special thanks to Claude Code, the real homie.
