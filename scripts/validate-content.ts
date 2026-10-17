// Content gate. Usage:
//   node scripts/validate-content.ts                 -> validate every set file present
//   node scripts/validate-content.ts t1              -> only test t1 (cross-bank checks still use everything)
//   node scripts/validate-content.ts t1 verbal       -> only t1 verbal
// Exit code 1 if any error.
import ts from 'typescript';
import katex from 'katex';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import {
  QUANT_TOPICS, VERBAL_TOPICS, QUANT_TRAPS, VERBAL_TRAPS, SET_KEYS,
  type Measure, type Question, type QuestionSet, type SetKey, type Passage, type ChartSpec,
} from '../src/types.ts';
import {
  blueprintFor, DIFFICULTY_MIX, QUANT_TYPE_MINIMUMS, PASSAGE_WORDS, expectedId,
} from '../src/content/blueprint.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src', 'content');
const MEASURES: Measure[] = ['verbal', 'quant'];

const [argTest, argMeasure] = process.argv.slice(2);

type Issue = { where: string; msg: string };
const errors: Issue[] = [];
const err = (where: string, msg: string) => errors.push({ where, msg });

// ---------------------------------------------------------------------------
// Discover set files
// ---------------------------------------------------------------------------
interface SetFile { testId: string; measure: Measure; key: SetKey; file: string }
const allFiles: SetFile[] = [];
for (const dir of readdirSync(CONTENT, { withFileTypes: true })) {
  if (!dir.isDirectory() || !/^t\d+$/.test(dir.name)) continue;
  for (const measure of MEASURES) for (const key of SET_KEYS) {
    const file = path.join(CONTENT, dir.name, `${measure}-${key}.ts`);
    if (existsSync(file)) allFiles.push({ testId: dir.name, measure, key, file });
  }
}
const targeted = allFiles.filter((f) => (!argTest || f.testId === argTest) && (!argMeasure || f.measure === argMeasure));
if (targeted.length === 0) {
  console.log(`No set files found for ${argTest ?? '*'} ${argMeasure ?? '*'} (expected src/content/tN/<measure>-<s1|s2-easy|s2-medium|s2-hard>.ts)`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Type-check (TypeScript compiler API, only the targeted files + their imports)
// ---------------------------------------------------------------------------
{
  const program = ts.createProgram(targeted.map((f) => f.file), {
    strict: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true,
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], types: [],
  });
  for (const d of ts.getPreEmitDiagnostics(program)) {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (d.file && d.start !== undefined) {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      err(`${path.relative(ROOT, d.file.fileName)}:${line + 1}:${character + 1}`, `TS: ${msg}`);
    } else err('typescript', msg);
  }
}

// ---------------------------------------------------------------------------
// 2. Load sets
// ---------------------------------------------------------------------------
interface Loaded extends SetFile { set: QuestionSet }
const loaded: Loaded[] = [];
for (const f of allFiles) {
  try {
    const mod = await import(pathToFileURL(f.file).href);
    if (!mod.set) { err(rel(f.file), 'file must `export const set: QuestionSet = {...}`'); continue; }
    loaded.push({ ...f, set: mod.set as QuestionSet });
  } catch (e) {
    err(rel(f.file), `failed to import: ${(e as Error).message}`);
  }
}
function rel(p: string) { return path.relative(ROOT, p); }
const isTargeted = (l: SetFile) => targeted.some((t) => t.file === l.file);

// ---------------------------------------------------------------------------
// String checks
// ---------------------------------------------------------------------------
const CTRL = /[\u0000-\u0009\u000B-\u001F]/;
const BARE_CMD = /(?<![\\a-zA-Z])(frac|dfrac|tfrac|sqrt|times|cdot|div|leq|geq|le|ge|neq|ne|pi|angle|triangle|circ|text|textrm|mathrm|left|right|overline|pm|infty|approx|degree|alpha|beta|theta|sum|cdots|ldots|dots)(?![a-zA-Z])/;
const LATEX_OUTSIDE = /\\(frac|dfrac|sqrt|times|cdot|leq?|geq?|neq|pi|angle|triangle|overline|alpha|beta|theta)(?![a-zA-Z])/;
const ALLOWED_TAGS = new Set(['b', 'i', 'u', 'sup', 'sub', 'br', 'em', 'strong']);

function splitMath(s: string): { text: string; math: boolean }[] {
  const parts: { text: string; math: boolean }[] = [];
  let buf = '';
  let inMath = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '$') { buf += '\\$'; i++; continue; }
    if (c === '$') { parts.push({ text: buf, math: inMath }); buf = ''; inMath = !inMath; continue; }
    buf += c;
  }
  parts.push({ text: buf, math: inMath });
  if (inMath) parts.push({ text: '', math: false, unbalanced: true } as never);
  return parts;
}

function checkString(where: string, s: string) {
  if (CTRL.test(s)) err(where, 'contains a control character (tab/form-feed/backspace) — a LaTeX backslash was lost. Use the r`...` tag.');
  const parts = splitMath(s);
  if (parts.some((p) => (p as { unbalanced?: boolean }).unbalanced)) {
    err(where, 'odd number of unescaped $ — write money as \\$ and wrap math in $...$');
    return;
  }
  for (const p of parts) {
    if (p.math) {
      if (p.text.includes('\n')) err(where, `newline inside math "$${p.text.slice(0, 30)}$" (lost \\n... command?)`);
      const bare = p.text.match(BARE_CMD);
      if (bare) err(where, `bare LaTeX word "${bare[1]}" inside math "$${p.text.slice(0, 40)}$" — missing backslash`);
      if (/(?<!\\)%/.test(p.text)) err(where, `unescaped % inside math "$${p.text.slice(0, 40)}$" — write \\%`);
      try {
        katex.renderToString(p.text, { throwOnError: true, strict: false });
      } catch (e) {
        err(where, `KaTeX error in "$${p.text.slice(0, 60)}$": ${(e as Error).message.slice(0, 160)}`);
      }
    } else {
      const lo = p.text.match(LATEX_OUTSIDE);
      if (lo) err(where, `LaTeX command \\${lo[1]} outside $...$`);
      const tagRe = /<\/?\s*([a-zA-Z0-9]*)/g;
      let m: RegExpExecArray | null;
      while ((m = tagRe.exec(p.text))) {
        if (!ALLOWED_TAGS.has(m[1].toLowerCase())) {
          err(where, `"<" outside math or disallowed tag "${m[0]}" — put comparisons inside $...$; allowed tags: ${[...ALLOWED_TAGS].join(',')}`);
          break;
        }
      }
    }
  }
}

function walkStrings(obj: unknown, where: string) {
  if (typeof obj === 'string') return checkString(where, obj);
  if (Array.isArray(obj)) return obj.forEach((v, i) => walkStrings(v, `${where}[${i}]`));
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'function') continue;
      if (k === 'svg') { checkSvg(`${where}.svg`, v as string); continue; }
      walkStrings(v, `${where}.${k}`);
    }
  }
}

function checkSvg(where: string, svg: string) {
  if (typeof svg !== 'string' || !svg.trim().startsWith('<svg') || !svg.trim().endsWith('</svg>')) err(where, 'svg must start with <svg and end with </svg>');
  else {
    if (!/viewBox=/.test(svg)) err(where, 'svg needs a viewBox');
    if (/https?:|xlink:href|<script|<image/i.test(svg.replace(/xmlns(:\w+)?="[^"]*"/g, ''))) err(where, 'svg must not reference external resources/scripts/images');
    const opens = (svg.match(/<(?!\/)(?!!)[a-zA-Z][^>]*[^/]>/g) ?? []).length;
    const closes = (svg.match(/<\/[a-zA-Z]+>/g) ?? []).length;
    if (opens !== closes) err(where, `svg looks malformed (${opens} open tags vs ${closes} close tags)`);
  }
}

// ---------------------------------------------------------------------------
// Per-set checks
// ---------------------------------------------------------------------------
const wordCount = (p: Passage) => p.paragraphs.flat().join(' ').replace(/\$[^$]*\$/g, 'x').split(/\s+/).filter(Boolean).length;
const inRange = (i: unknown, n: number) => Number.isInteger(i) && (i as number) >= 0 && (i as number) < n;
const uniq = <T,>(xs: T[]) => new Set(xs).size === xs.length;
const sortedUniqInRange = (xs: unknown, n: number) =>
  Array.isArray(xs) && xs.length > 0 && xs.every((x) => inRange(x, n)) && uniq(xs) && xs.every((x, i) => i === 0 || xs[i - 1] < x);

function correctOf(q: Question): unknown {
  return q.answer;
}

function checkSet(l: Loaded) {
  const { set, testId, measure, key } = l;
  const tag = `${testId}/${measure}-${key}`;
  if (set.testId !== testId) err(tag, `set.testId must be "${testId}"`);
  if (set.measure !== measure) err(tag, `set.measure must be "${measure}"`);
  if (set.key !== key) err(tag, `set.key must be "${key}"`);
  const bp = blueprintFor(measure, key);
  const qs = set.questions ?? [];
  if (qs.length !== bp.length) err(tag, `expected ${bp.length} questions, found ${qs.length}`);

  walkStrings(set.passages, `${tag}.passages`);
  walkStrings(set.dataSets, `${tag}.dataSets`);

  const passages = new Map((set.passages ?? []).map((p) => [p.id, p]));
  const dataSets = new Map((set.dataSets ?? []).map((d) => [d.id, d]));
  const groupIds: Record<string, Set<string>> = {};
  const usedPassages = new Set<string>();
  const usedDataSets = new Set<string>();
  const topics = measure === 'quant' ? (QUANT_TOPICS as readonly string[]) : (VERBAL_TOPICS as readonly string[]);
  const traps = measure === 'quant' ? (QUANT_TRAPS as readonly string[]) : (VERBAL_TRAPS as readonly string[]);
  const diffCount = [0, 0, 0, 0, 0];

  qs.forEach((q, i) => {
    const slot = bp[i];
    const w = `${tag} #${i + 1} (${q.id})`;
    if (!slot) return;
    const expId = expectedId(testId, measure, key, i);
    if (q.id !== expId) err(w, `id must be "${expId}"`);
    if (!slot.types.includes(q.type)) err(w, `type "${q.type}" not allowed here; expected one of ${slot.types.join('/')}`);
    if (![1, 2, 3, 4, 5].includes(q.difficulty)) err(w, 'difficulty must be 1-5');
    else diffCount[q.difficulty - 1]++;
    if (!topics.includes(q.topic)) err(w, `topic "${q.topic}" is not in the ${measure} topic list`);
    if (slot.topicPrefix && !q.topic?.startsWith(slot.topicPrefix)) err(w, `topic must start with "${slot.topicPrefix}"`);
    if (!slot.topicPrefix && measure === 'quant' && q.topic === 'data.interpretation') err(w, 'data.interpretation topic is only for DI-set questions');
    if (typeof q.explanation !== 'string' || q.explanation.trim().length < 40) err(w, 'explanation missing or too short');
    walkStrings({ ...q, verify: undefined }, w);

    // group membership
    if (slot.group) {
      const ref = slot.group === 'DI' ? (q as { dataSetId?: string }).dataSetId : (q as { passageId?: string }).passageId;
      if (!ref) err(w, `must reference ${slot.group === 'DI' ? 'a dataSetId' : 'a passageId'} (group ${slot.group})`);
      else (groupIds[slot.group] ??= new Set()).add(ref);
    } else if (measure === 'quant' && (q as { dataSetId?: string }).dataSetId) {
      err(w, 'only DI positions may have a dataSetId');
    }

    // type-specific
    switch (q.type) {
      case 'tc': {
        if (q.blanks.length !== slot.blanks) err(w, `expected ${slot.blanks} blanks, found ${q.blanks.length}`);
        const need = q.blanks.length === 1 ? 5 : 3;
        q.blanks.forEach((b, bi) => {
          if (b.length !== need) err(w, `blank ${bi + 1} must have ${need} choices`);
          if (!uniq(b.map((x) => x.toLowerCase()))) err(w, `blank ${bi + 1} has duplicate choices`);
        });
        for (let k = 1; k <= 3; k++) {
          const c = q.stem.split(`{{${k}}}`).length - 1;
          if (k <= q.blanks.length && c !== 1) err(w, `stem must contain {{${k}}} exactly once`);
          if (k > q.blanks.length && c !== 0) err(w, `stem has {{${k}}} but only ${q.blanks.length} blanks`);
        }
        if (!Array.isArray(q.answer) || q.answer.length !== q.blanks.length || q.answer.some((a, bi) => !inRange(a, q.blanks[bi]?.length ?? 0)))
          err(w, 'answer must give one valid choice index per blank');
        break;
      }
      case 'se': {
        if (q.options.length !== 6) err(w, 'SE needs exactly 6 options');
        if (!uniq(q.options.map((x) => x.toLowerCase()))) err(w, 'duplicate options');
        if (q.stem.split('{{1}}').length - 1 !== 1) err(w, 'stem must contain {{1}} exactly once');
        if (!sortedUniqInRange(q.answer, 6) || q.answer.length !== 2) err(w, 'answer must be two sorted distinct indices 0-5');
        break;
      }
      case 'rc-single':
      case 'rc-multi':
      case 'rc-select': {
        const p = passages.get(q.passageId);
        if (!p) { err(w, `passageId "${q.passageId}" not found in set.passages`); break; }
        usedPassages.add(q.passageId);
        if (q.type === 'rc-single') {
          if (q.options.length !== 5) err(w, 'rc-single needs 5 options');
          if (!inRange(q.answer, q.options.length)) err(w, 'answer index out of range');
          if (q.highlight && !p.paragraphs[q.highlight.p]?.[q.highlight.s]) err(w, 'highlight sentence ref does not exist');
        } else if (q.type === 'rc-multi') {
          if (q.options.length !== 3) err(w, 'rc-multi needs exactly 3 options');
          if (!sortedUniqInRange(q.answer, q.options.length)) err(w, 'answer must be sorted distinct valid indices (1-3 of them)');
        } else {
          if (!p.paragraphs[q.answer.p]?.[q.answer.s]) err(w, 'answer sentence ref does not exist');
          if (q.paragraph !== undefined && q.paragraph !== q.answer.p) err(w, 'answer must be inside the selectable paragraph');
        }
        if ('options' in q && !uniq(q.options)) err(w, 'duplicate options');
        break;
      }
      case 'qc':
        if (![0, 1, 2, 3].includes(q.answer)) err(w, 'qc answer must be 0-3');
        if (!q.quantityA?.trim() || !q.quantityB?.trim()) err(w, 'quantityA/quantityB required');
        break;
      case 'mc-single':
        if (q.options.length !== 5) err(w, 'mc-single needs 5 options');
        if (!uniq(q.options)) err(w, 'duplicate options');
        if (!inRange(q.answer, q.options.length)) err(w, 'answer index out of range');
        break;
      case 'mc-multi':
        if (q.options.length < 3 || q.options.length > 8) err(w, 'mc-multi needs 3-8 options');
        if (!uniq(q.options)) err(w, 'duplicate options');
        if (!sortedUniqInRange(q.answer, q.options.length)) err(w, 'answer must be sorted distinct valid indices');
        if (q.exactly !== undefined && q.exactly !== q.answer.length) err(w, '`exactly` must equal number of correct answers');
        break;
      case 'numeric': {
        const a = q.answer;
        if (a.kind === 'decimal' && !Number.isFinite(a.value)) err(w, 'decimal answer must be finite');
        if (a.kind === 'fraction' && (!Number.isInteger(a.num) || !Number.isInteger(a.den) || a.den === 0)) err(w, 'fraction num/den must be integers, den != 0');
        break;
      }
    }

    // traps
    for (const t of q.traps ?? []) {
      if (!traps.includes(t.trap)) err(w, `trap type "${t.trap}" not allowed for ${measure}`);
      if (typeof t.why !== 'string' || t.why.length < 10) err(w, 'trap.why too short');
      if (q.type === 'tc') {
        if (!inRange(t.blank, q.blanks.length)) err(w, 'tc trap needs valid `blank` index');
        else if (!inRange(t.option, q.blanks[t.blank!].length) || t.option === q.answer[t.blank!]) err(w, 'tc trap option invalid or is the correct choice');
      } else {
        const n = q.type === 'qc' ? 4 : 'options' in q ? q.options.length : 0;
        const ans = correctOf(q);
        const isCorrect = Array.isArray(ans) ? (ans as number[]).includes(t.option) : ans === t.option;
        if (!inRange(t.option, n) || isCorrect) err(w, `trap option ${t.option} invalid or is a correct answer`);
      }
    }

    // quant verify()
    if (measure === 'quant') {
      const qq = q as Question & { verify?: () => unknown };
      if (typeof qq.verify !== 'function') err(w, 'verify() is required for quant questions');
      else {
        try {
          const v = qq.verify();
          const ok = (() => {
            switch (q.type) {
              case 'qc': case 'mc-single': return v === q.answer;
              case 'mc-multi': return Array.isArray(v) && JSON.stringify([...v].sort((a, b) => a - b)) === JSON.stringify(q.answer);
              case 'numeric': {
                const exp = q.answer.kind === 'decimal' ? q.answer.value : q.answer.num / q.answer.den;
                return typeof v === 'number' && Math.abs(v - exp) <= 1e-6 * Math.max(1, Math.abs(exp));
              }
              default: return false;
            }
          })();
          if (!ok) err(w, `verify() returned ${JSON.stringify(v)} but answer key is ${JSON.stringify(q.answer)}`);
        } catch (e) {
          err(w, `verify() threw: ${(e as Error).message}`);
        }
      }
    }
  });

  // groups
  for (const [g, ids] of Object.entries(groupIds)) if (ids.size !== 1) err(tag, `group ${g} questions must all share one ${g === 'DI' ? 'dataSetId' : 'passageId'} (found ${[...ids].join(', ')})`);
  if (measure === 'verbal') {
    const a = [...(groupIds.A ?? [])][0], b = [...(groupIds.B ?? [])][0], c = [...(groupIds.C ?? [])][0];
    if (new Set([a, b, c]).size !== 3) err(tag, 'groups A, B, C must use three different passages');
    for (const [g, id] of [['A', a], ['B', b], ['C', c]] as const) {
      const p = id ? passages.get(id) : undefined;
      if (p) {
        const n = wordCount(p);
        const [lo, hi] = PASSAGE_WORDS[g];
        if (n < lo || n > hi) err(tag, `passage ${id} (group ${g}) has ${n} words; expected ${lo}-${hi}`);
      }
    }
    const aQs = qs.filter((_, i) => bp[i]?.group === 'A');
    if (!aQs.some((q) => q.type === 'rc-multi')) err(tag, 'passage A questions must include at least one rc-multi');
    if (key === 's1' && !qs.some((q) => q.type === 'rc-select')) err(tag, 'S1 must include at least one rc-select');
    for (const p of set.passages ?? []) if (!usedPassages.has(p.id)) err(tag, `passage ${p.id} is not used`);
  } else {
    for (const q of qs) if ((q as { dataSetId?: string }).dataSetId) usedDataSets.add((q as { dataSetId?: string }).dataSetId!);
    for (const id of usedDataSets) if (!dataSets.has(id)) err(tag, `dataSetId "${id}" not found in set.dataSets`);
    for (const d of set.dataSets ?? []) {
      if (!usedDataSets.has(d.id)) err(tag, `data set ${d.id} is not used`);
      d.charts.forEach((c, ci) => checkChart(`${tag} dataSet ${d.id} chart ${ci}`, c));
    }
    for (const q of qs) if ((q as { figure?: ChartSpec }).figure && (q as { figure: { kind: string } }).figure.kind !== 'svg') checkChart(`${tag} ${q.id} figure`, (q as { figure: ChartSpec }).figure);
    const mins = QUANT_TYPE_MINIMUMS[key === 's1' ? 's1' : 's2'];
    for (const [t, n] of Object.entries(mins)) {
      const c = qs.filter((q) => q.type === t).length;
      if (c < (n ?? 0)) err(tag, `needs at least ${n} "${t}" questions, found ${c}`);
    }
    const fam = (f: string) => qs.filter((q) => q.topic.startsWith(f)).length;
    for (const f of ['arith.', 'alg.', 'geo.', 'data.']) if (fam(f) < 2) err(tag, `needs at least 2 questions from ${f}* topics (found ${fam(f)})`);
  }
  const mix = DIFFICULTY_MIX[key];
  if (diffCount.join() !== mix.join()) err(tag, `difficulty mix must be d1..d5 = [${mix.join(',')}], found [${diffCount.join(',')}]`);
}

function checkChart(where: string, c: ChartSpec) {
  if (c.kind === 'bar' || c.kind === 'line') {
    for (const s of c.series) if (s.values.length !== c.categories.length) err(where, `series "${s.name}" has ${s.values.length} values for ${c.categories.length} categories`);
  } else if (c.kind === 'pie') {
    if (c.slices.some((s) => !(s.value > 0))) err(where, 'pie slices must be positive');
  } else if (c.kind === 'table') {
    c.rows.forEach((r, i) => { if (r.length !== c.columns.length) err(where, `table row ${i} has ${r.length} cells for ${c.columns.length} columns`); });
  }
}

for (const l of loaded) if (isTargeted(l)) checkSet(l);

// ---------------------------------------------------------------------------
// Cross-bank checks (always over everything loaded)
// ---------------------------------------------------------------------------
type QRef = { q: Question; l: Loaded };
const all: QRef[] = loaded.flatMap((l) => (l.set.questions ?? []).map((q) => ({ q, l })));

// unique ids
{
  const seen = new Map<string, string>();
  for (const { q, l } of all) {
    const where = `${l.testId}/${l.measure}-${l.key}`;
    if (seen.has(q.id)) err(q.id, `duplicate id (also in ${seen.get(q.id)})`);
    seen.set(q.id, where);
  }
}

// near-duplicate questions
function textOf(q: Question): string {
  const parts: string[] = [];
  for (const k of ['stem', 'info', 'quantityA', 'quantityB'] as const) if ((q as Record<string, unknown>)[k]) parts.push(String((q as Record<string, unknown>)[k]));
  if ('options' in q) parts.push(...q.options);
  if (q.type === 'tc') parts.push(...q.blanks.flat());
  return parts.join(' ');
}
function shingles(s: string, n = 5): Set<string> {
  const toks = s.toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= toks.length; i++) out.add(toks.slice(i, i + n).join(' '));
  return out;
}
function jaccard(a: Set<string>, b: Set<string>) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter || 1);
}
{
  const sh = all.map((x) => ({ ...x, s: shingles(textOf(x.q)) }));
  for (let i = 0; i < sh.length; i++) for (let j = i + 1; j < sh.length; j++) {
    const a = sh[i], b = sh[j];
    if (!isTargeted(a.l) && !isTargeted(b.l)) continue;
    if (a.s.size < 8 || b.s.size < 8) continue;
    const jac = jaccard(a.s, b.s);
    if (jac > 0.5) err(`${a.q.id} ~ ${b.q.id}`, `near-duplicate questions (similarity ${jac.toFixed(2)})`);
  }
  // passages
  const ps = loaded.flatMap((l) => (l.set.passages ?? []).map((p) => ({ p, l, s: shingles(p.paragraphs.flat().join(' ')) })));
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    if (!isTargeted(ps[i].l) && !isTargeted(ps[j].l)) continue;
    if (ps[i].p.id === ps[j].p.id) err(ps[i].p.id, 'duplicate passage id');
    const jac = jaccard(ps[i].s, ps[j].s);
    if (jac > 0.2) err(`${ps[i].p.id} ~ ${ps[j].p.id}`, `passages too similar (${jac.toFixed(2)})`);
  }
}

// correct-answer vocabulary must be unique across the bank
{
  const words = new Map<string, string>();
  for (const { q, l } of all) {
    let correct: string[] = [];
    if (q.type === 'tc') correct = q.answer.map((a, bi) => q.blanks[bi]?.[a] ?? '');
    else if (q.type === 'se') correct = q.answer.map((a) => q.options[a] ?? '');
    for (const w of correct.map((x) => x.trim().toLowerCase()).filter(Boolean)) {
      const prev = words.get(w);
      if (prev && prev !== q.id && (isTargeted(l) || all.some((x) => x.q.id === prev && isTargeted(x.l))))
        err(`${q.id}`, `correct-answer word "${w}" already used as a correct answer in ${prev}`);
      if (!prev) words.set(w, q.id);
    }
  }
}

// test-level requirements (only when all 4 sets of a measure exist)
for (const testId of new Set(loaded.map((l) => l.testId))) {
  for (const measure of MEASURES) {
    const sets = loaded.filter((l) => l.testId === testId && l.measure === measure);
    if (sets.length !== 4 || !sets.some(isTargeted)) continue;
    const qs = sets.flatMap((s) => s.set.questions);
    if (measure === 'quant' && !qs.some((q) => q.type === 'numeric' && q.answer.kind === 'fraction'))
      err(`${testId}/quant`, 'needs at least one fraction-style numeric entry across its 4 sets');
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
for (const t of targeted) {
  const l = loaded.find((x) => x.file === t.file);
  const tag = `${t.testId}/${t.measure}-${t.key}`;
  const n = errors.filter((e) => e.where.startsWith(tag) || (l && l.set.questions?.some((q) => e.where.includes(q.id)))).length;
  console.log(`${n ? '✖' : '✔'} ${tag.padEnd(24)} ${l ? l.set.questions?.length ?? 0 : '?'} questions${n ? `  (${n} issues)` : ''}`);
}
if (errors.length) {
  console.log(`\n${errors.length} issue(s):`);
  for (const e of errors) console.log(`  - [${e.where}] ${e.msg}`);
  process.exit(1);
}
console.log('\nAll checks passed.');
