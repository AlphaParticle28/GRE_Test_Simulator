// End-to-end smoke test against the BUILT site, isolated port + data dir, headless system Chrome.
// Usage: node e2e/smoke.mjs   (run `node scripts/release.mjs` first)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5190;
const DATA = path.join(ROOT, 'data-e2e');
const OUT = path.join(ROOT, 'e2e', 'out');
fs.rmSync(DATA, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const server = spawn(process.execPath, [path.join(ROOT, 'server', 'server.mjs')], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR: 'data-e2e' },
  stdio: 'ignore',
});
const BASE = `http://127.0.0.1:${PORT}/?demo`;
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '  PASS' : '  FAIL'} ${msg}`);
  if (!cond) failures++;
};

async function waitServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/api/attempts`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server did not start');
}

await waitServer();
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 820 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

const tid = (id) => page.locator(`[data-testid="${id}"]`);
const activeId = () => page.evaluate(() => [...window.__gre.store.attempts.values()].find((a) => a.status === 'in-progress')?.id);
const counter = () => page.locator('.ets-sub > div').first().textContent();
const goHome = async () => {
  await page.getByRole('button', { name: 'Home', exact: true }).click();
};

try {
  // ---------------------------------------------------------------- 1. full test, all correct
  console.log('1. Full test, all correct -> 170/170');
  await page.goto(BASE);
  await tid('start-full-demo').click();
  for (let s = 0; s < 4; s++) {
    await tid('section-continue').click();
    const id = await activeId();
    await page.evaluate((id) => window.__gre.answerSection(id, true), id);
    await tid('tb-next').click();
    ok((await counter())?.includes('Question 2 of'), `section ${s + 1}: Next moves to question 2`);
    await tid('tb-exit').click();
    await tid('exit-confirm').click();
  }
  await tid('score-verbal').waitFor();
  ok((await tid('score-verbal').textContent()) === '170', 'verbal score 170');
  ok((await tid('score-quant').textContent()) === '170', 'quant score 170');
  await page.screenshot({ path: path.join(OUT, '1-report.png'), fullPage: true });

  // ---------------------------------------------------------------- 2. verbal only, all wrong
  console.log('2. Verbal only, all wrong -> 130');
  await goHome();
  await tid('start-verbal-demo').click();
  for (let s = 0; s < 2; s++) {
    await tid('section-continue').click();
    const id = await activeId();
    await page.evaluate((id) => window.__gre.answerSection(id, false), id);
    await tid('tb-exit').click();
    await tid('exit-confirm').click();
  }
  await tid('score-verbal').waitFor();
  ok((await tid('score-verbal').textContent()) === '130', 'verbal score 130 (easy route)');
  ok((await page.locator('.score-route').first().textContent())?.includes('Easier'), 'routed to the Easier S2');

  // ---------------------------------------------------------------- 3. verbal UI interactions
  console.log('3. Verbal question widgets');
  await goHome();
  await tid('start-verbal-demo').click();
  await tid('section-continue').click();
  let id = await activeId();
  const resp = (qn) =>
    page.evaluate(([id, qn]) => {
      const a = window.__gre.store.get(id);
      const sec = a.sections[a.order[a.sectionIdx]];
      return sec.responses[sec.questionIds[qn]];
    }, [id, qn]);
  await page.locator('.tc-cell').nth(1).click(); // TC1 choice index 1 (correct)
  ok(JSON.stringify(await resp(0)) === JSON.stringify({ kind: 'blanks', values: [1] }), 'TC 1-blank click stored');
  await tid('tb-next').click();
  await page.locator('.tc-col').nth(0).locator('.tc-cell').nth(1).click();
  await page.locator('.tc-col').nth(1).locator('.tc-cell').nth(0).click();
  ok(JSON.stringify(await resp(1)) === JSON.stringify({ kind: 'blanks', values: [1, 0] }), 'TC 2-blank clicks stored');
  await tid('tb-next').click();
  await page.locator('.choice').nth(0).click();
  await page.locator('.choice').nth(2).click();
  ok(JSON.stringify(await resp(2)) === JSON.stringify({ kind: 'multi', values: [0, 2] }), 'SE two picks stored');
  await tid('tb-next').click();
  ok(await page.locator('.passage').isVisible(), 'RC passage shown in split view');
  ok((await page.locator('.group-note').textContent())?.startsWith('Questions 4 to'), 'group note "Questions 4 to ..."');
  await page.locator('.split-right .choice').nth(1).click();
  ok(JSON.stringify(await resp(3)) === JSON.stringify({ kind: 'choice', value: 1 }), 'RC single pick stored');
  await tid('tb-next').click();
  await page.locator('.split-right .choice').nth(0).click();
  await page.locator('.split-right .choice').nth(1).click();
  ok(JSON.stringify(await resp(4)) === JSON.stringify({ kind: 'multi', values: [0, 1] }), 'RC multi picks stored');
  await tid('tb-next').click();
  await page.locator('.passage p').nth(1).locator('.sentence').nth(1).click();
  ok(JSON.stringify(await resp(5)) === JSON.stringify({ kind: 'sentence', value: { p: 1, s: 1 } }), 'select-in-passage click stored');
  await page.screenshot({ path: path.join(OUT, '3-select-in-passage.png') });
  await tid('tb-mark').click();
  ok((await tid('tb-mark').textContent()) === 'Marked', 'Mark toggles');
  await tid('tb-review').click();
  ok((await page.locator('.review-table tbody tr').count()) === 12, 'review lists 12 questions');
  ok((await page.locator('.review-table tbody tr').nth(11).textContent())?.includes('Not Seen'), 'unseen question shows Not Seen');
  ok((await page.locator('.review-table tbody tr').nth(5).textContent())?.includes('✔'), 'marked question shows check');
  await page.locator('.review-table tbody tr').nth(1).click();
  await tid('review-go').click();
  ok((await counter())?.includes('Question 2 of 12'), 'Go to Question works');

  // Save & Exit then resume
  console.log('4. Save & Exit, reload, resume');
  await tid('tb-exit').click();
  await tid('exit-save').click();
  await page.reload();
  await tid('resume').click();
  await tid('resume-continue').click();
  ok((await counter())?.includes('Question 2 of 12'), 'resumed on the same question');
  const susp = await page.evaluate((id) => window.__gre.store.get(id).suspensions, id);
  ok(susp.length === 1 && susp[0].reason === 'save-exit' && susp[0].resumedAt, 'suspension recorded');

  // reload mid-section (tab closed)
  const remaining = () => page.evaluate((id) => {
    const a = window.__gre.store.get(id);
    return a.sections[a.order[a.sectionIdx]].remainingMs;
  }, id);
  const before = await remaining();
  await page.reload();
  await tid('resume').click();
  await tid('resume-continue').click();
  const after = await remaining();
  ok(Math.abs(before - after) < 3000, `time preserved across reload (${Math.round(before / 1000)}s -> ${Math.round(after / 1000)}s)`);

  // time expiry
  console.log('5. Time expiry');
  await page.evaluate((id) => window.__gre.setRemaining(id, 1200), id);
  await tid('timeup-continue').waitFor({ timeout: 6000 });
  ok(true, 'time-expired screen shown');
  await tid('timeup-continue').click();
  await tid('section-continue').waitFor();
  ok(true, 'moved to next section intro');
  await tid('section-continue').click();
  await tid('tb-exit').click();
  await tid('exit-confirm').click();
  await tid('score-verbal').waitFor();
  ok(true, 'report reached');
  // open a review panel
  await page.locator('[data-testid="log-table"] tbody tr').first().click();
  ok(await page.locator('.explanation').isVisible(), 'question review shows explanation');
  await page.screenshot({ path: path.join(OUT, '5-review-panel.png'), fullPage: true });
  await page.getByRole('button', { name: '← Back to list' }).click();
  await page.getByRole('button', { name: 'Insights' }).click();
  await page.screenshot({ path: path.join(OUT, '5-insights.png'), fullPage: true });

  // ---------------------------------------------------------------- 6. quant UI + calculator
  console.log('6. Quant widgets + calculator');
  await goHome();
  await tid('start-quant-demo').click();
  await tid('section-continue').click();
  id = await activeId();
  ok((await page.locator('.qc-table').count()) === 1, 'QC layout shown');
  await page.locator('.choice').nth(3).click();
  ok(JSON.stringify(await resp(0)) === JSON.stringify({ kind: 'choice', value: 3 }), 'QC pick stored');
  await tid('tb-next').click();
  await tid('tb-next').click();
  await page.locator('.choice').nth(0).click();
  await page.locator('.choice').nth(2).click();
  ok(JSON.stringify(await resp(2)) === JSON.stringify({ kind: 'multi', values: [0, 2] }), 'MC multi picks stored');
  await tid('tb-next').click();
  await page.locator('.numeric-box').fill('35');
  ok(JSON.stringify(await resp(3)) === JSON.stringify({ kind: 'numeric', text: '35' }), 'numeric entry stored');
  await page.locator('.numeric-box').fill('3a');
  ok(JSON.stringify(await resp(3)) === JSON.stringify({ kind: 'numeric', text: '35' }), 'letters rejected in numeric box');
  await tid('tb-next').click();
  await page.locator('.numeric-box').nth(0).fill('5');
  await page.locator('.numeric-box').nth(1).fill('36');
  ok(JSON.stringify(await resp(4)) === JSON.stringify({ kind: 'fraction', num: '5', den: '36' }), 'fraction entry stored');
  await tid('tb-next').click();
  ok(await page.locator('.svg-figure svg').isVisible(), 'geometry figure renders');
  ok((await page.locator('.figure-note').textContent())?.includes('not drawn to scale'), 'not-to-scale note');
  await tid('tb-next').click();
  ok(await page.locator('.chart-svg').isVisible(), 'DI chart renders');
  await page.screenshot({ path: path.join(OUT, '6-di.png') });
  // calculator on the DI numeric question (single box)
  await tid('tb-calc').click();
  for (const k of ['1', '+', '2', '*', '4', '=']) await page.locator(`.calc-key[data-key="${k}"]`).click();
  ok((await tid('calc-display').textContent()) === '9.', 'calculator 1+2x4= shows 9.');
  for (const k of ['C', '2', '/', '3', '=']) await page.locator(`.calc-key[data-key="${k}"]`).click();
  ok((await tid('calc-display').textContent()) === '0.6666667', 'calculator 2/3 shows 0.6666667');
  await page.locator('.calc-transfer').click();
  ok((await page.locator('.numeric-box').inputValue()) === '0.6666667', 'Transfer Display fills the answer box');
  await page.locator('.calc').focus();
  await page.keyboard.type('6*7');
  await page.keyboard.press('Enter');
  ok((await tid('calc-display').textContent()) === '42.', 'calculator keyboard input works');
  await tid('tb-back').click();
  ok(await page.locator('.calc-transfer').isDisabled(), 'Transfer Display disabled on non-numeric question');
  await page.screenshot({ path: path.join(OUT, '6-calculator.png') });
  await tid('tb-exit').click();
  await tid('exit-confirm').click();
  await tid('section-continue').click();
  await tid('tb-exit').click();
  await tid('exit-confirm').click();
  await tid('score-quant').waitFor();
  ok(true, 'quant-only report reached');

  // ---------------------------------------------------------------- 7. home, bonus, dashboard
  console.log('7. Home / bonus / dashboard');
  await goHome();
  ok((await page.locator('.bonus button').count()) > 0, 'bonus sets offered for unseen tiers');
  await page.screenshot({ path: path.join(OUT, '7-home.png'), fullPage: true });
  await page.getByRole('button', { name: 'Progress dashboard' }).click();
  await page.screenshot({ path: path.join(OUT, '7-dashboard.png'), fullPage: true });
  await goHome();

  // disk persistence
  const files = fs.readdirSync(path.join(DATA, 'attempts')).filter((f) => f.endsWith('.json'));
  ok(files.length >= 4, `attempts saved to disk (${files.length} files)`);
} catch (e) {
  failures++;
  console.log('  FAIL EXCEPTION', e.message);
  await page.screenshot({ path: path.join(OUT, 'failure.png'), fullPage: true }).catch(() => {});
} finally {
  ok(errors.length === 0, `no console/page errors${errors.length ? ': ' + errors.slice(0, 5).join(' | ') : ''}`);
  await browser.close();
  server.kill();
  fs.rmSync(DATA, { recursive: true, force: true });
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nE2E PASSED');
  process.exit(failures ? 1 : 0);
}
