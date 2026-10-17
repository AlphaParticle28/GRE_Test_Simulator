// Compare a blind solver's answers with the answer keys.
// Usage: node scripts/compare-blind.ts t3 quant   (reads verify/blind/t3-quant.answers.json)
// answers.json format: { "answers": { "<id>": <answer> }, "flags": { "<id>": "note" } }
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { SET_KEYS, type QuestionSet, type Question } from '../src/types.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [testId, measure] = process.argv.slice(2);
const L = 'ABCDEFGHIJ';
const file = path.join(ROOT, 'verify', 'blind', `${testId}-${measure}.answers.json`);
const data = JSON.parse(readFileSync(file, 'utf8')) as { answers: Record<string, unknown>; flags?: Record<string, string> };

function key(q: Question): string {
  switch (q.type) {
    case 'tc': return JSON.stringify(q.answer.map((a, i) => q.blanks[i][a].toLowerCase()));
    case 'se': case 'rc-multi': case 'mc-multi': return JSON.stringify(q.answer.map((a) => L[a]));
    case 'rc-select': return `P${q.answer.p + 1}S${q.answer.s + 1}`;
    case 'numeric': return q.answer.kind === 'decimal' ? String(q.answer.value) : `${q.answer.num}/${q.answer.den}`;
    default: return L[q.answer];
  }
}

function norm(q: Question, a: unknown): string {
  if (a === undefined || a === null) return '(none)';
  switch (q.type) {
    case 'tc': return JSON.stringify((a as string[]).map((w) => String(w).toLowerCase().trim()));
    case 'se': case 'rc-multi': case 'mc-multi': return JSON.stringify([...(a as string[])].map((x) => String(x).toUpperCase().trim()).sort());
    case 'rc-select': return String(a).toUpperCase().replace(/\s/g, '');
    case 'numeric': {
      const s = String(a).trim();
      if (q.answer.kind === 'fraction' && s.includes('/')) {
        const [n, d] = s.split('/').map(Number);
        return Math.abs(n / d - q.answer.num / q.answer.den) < 1e-9 ? key(q) : s;
      }
      const v = Number(s.replace(/,/g, ''));
      const exp = q.answer.kind === 'decimal' ? q.answer.value : q.answer.num / q.answer.den;
      return Math.abs(v - exp) < 1e-9 * Math.max(1, Math.abs(exp)) ? key(q) : s;
    }
    default: return String(a).toUpperCase().trim();
  }
}

let total = 0, mism = 0;
for (const k of SET_KEYS) {
  const f = path.join(ROOT, 'src', 'content', testId, `${measure}-${k}.ts`);
  if (!existsSync(f)) continue;
  const set = (await import(pathToFileURL(f).href)).set as QuestionSet;
  for (const q of set.questions) {
    total++;
    const exp = key(q);
    const got = norm(q, data.answers[q.id]);
    const flag = data.flags?.[q.id];
    if (exp !== got) {
      mism++;
      console.log(`MISMATCH ${q.id} (${q.type}, d${q.difficulty}): key=${exp} solver=${got}${flag ? `  | flag: ${flag}` : ''}`);
    } else if (flag) console.log(`FLAG     ${q.id}: ${flag}`);
  }
}
console.log(`\n${total - mism}/${total} agree, ${mism} mismatch(es).`);
