// Render every question of a test in headless Chrome: fail on console errors / KaTeX errors,
// and screenshot every question that has a figure or data set for visual inspection.
// Usage: node e2e/render-all.mjs t3      (run `node scripts/release.mjs` first)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testId = process.argv[2];
const PORT = 5191;
const OUT = path.join(ROOT, 'e2e', 'out', `render-${testId}`);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const server = spawn(process.execPath, [path.join(ROOT, 'server', 'server.mjs')], {
  env: { ...process.env, PORT: String(PORT), DATA_DIR: 'data-e2e' },
  stdio: 'ignore',
});
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${PORT}/api/attempts`)).ok) break;
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
let code = 0;
try {
  await page.goto(`http://127.0.0.1:${PORT}/?demo&renderall=${testId}`);
  await page.waitForSelector('.rq');
  const n = await page.locator('.rq').count();
  console.log(`rendered ${n} questions`);
  const katexErrors = await page.locator('.katex-error').evaluateAll((els) => els.map((e) => `${e.closest('.rq')?.getAttribute('data-qid')}: ${e.getAttribute('title') ?? e.textContent}`));
  if (katexErrors.length) {
    code = 1;
    console.log('KaTeX errors:\n  ' + katexErrors.join('\n  '));
  }
  // raw $ or {{ left visible in text (unrendered markup)
  const leftovers = await page.locator('.rq').evaluateAll((els) =>
    els.flatMap((e) => {
      const t = e.innerText;
      const bad = [];
      if (/\{\{\d\}\}/.test(t)) bad.push('{{n}} placeholder');
      if (/\\(frac|sqrt|times|cdot)/.test(t)) bad.push('raw LaTeX');
      return bad.length ? [`${e.getAttribute('data-qid')}: ${bad.join(', ')}`] : [];
    }),
  );
  if (leftovers.length) {
    code = 1;
    console.log('Unrendered markup:\n  ' + leftovers.join('\n  '));
  }
  const figs = page.locator('.rq.has-fig');
  const nf = await figs.count();
  for (let i = 0; i < nf; i++) {
    const el = figs.nth(i);
    const qid = await el.getAttribute('data-qid');
    await el.locator('.rp-question').screenshot({ path: path.join(OUT, `${qid}.png`) });
  }
  console.log(`screenshots: ${nf} -> ${path.relative(ROOT, OUT)}`);
} catch (e) {
  code = 1;
  console.log('EXCEPTION', e.message);
} finally {
  if (errors.length) {
    code = 1;
    console.log('Console errors:\n  ' + errors.slice(0, 20).join('\n  '));
  }
  await browser.close();
  server.kill();
  fs.rmSync(path.join(ROOT, 'data-e2e'), { recursive: true, force: true });
  console.log(code ? 'RENDER CHECK FAILED' : 'RENDER CHECK PASSED');
  process.exit(code);
}
