// Export a test+measure as a Markdown "test booklet" WITHOUT answers/explanations/traps, for blind solving.
// Usage: node scripts/export-blind.ts t3 quant   -> verify/blind/t3-quant.md
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { SET_KEYS, type QuestionSet, type Question, type ChartSpec, type Passage, type DataSet } from '../src/types.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [testId, measure] = process.argv.slice(2);
if (!testId || !measure) {
  console.log('usage: node scripts/export-blind.ts <testId> <verbal|quant>');
  process.exit(1);
}
const L = 'ABCDEFGHIJ';
const QC = ['Quantity A is greater.', 'Quantity B is greater.', 'The two quantities are equal.', 'The relationship cannot be determined from the information given.'];

function chartText(c: ChartSpec): string {
  switch (c.kind) {
    case 'bar':
    case 'line': {
      const head = `| ${c.xLabel ?? 'Category'} | ${c.series.map((s) => s.name).join(' | ')} |`;
      const sep = `|${'---|'.repeat(c.series.length + 1)}`;
      const rows = c.categories.map((cat, i) => `| ${cat} | ${c.series.map((s) => s.values[i]).join(' | ')} |`);
      return `**${c.kind.toUpperCase()} CHART: ${c.title}**${c.yLabel ? ` (y-axis: ${c.yLabel})` : ''}${c.stacked ? ' [stacked]' : ''}${c.showValues ? ' [values printed on chart]' : ' [values read from gridlines' + (c.yStep ? `, gridlines every ${c.yStep}` : '') + ']'}\n\n${head}\n${sep}\n${rows.join('\n')}`;
    }
    case 'pie': {
      const total = c.slices.reduce((s, x) => s + x.value, 0);
      return `**PIE CHART: ${c.title}** (labels shown as ${c.labelMode === 'raw' ? 'raw values' : 'percents'})\n\n${c.slices.map((s) => `- ${s.label}: ${c.labelMode === 'raw' ? s.value : `${Math.round((1000 * s.value) / total) / 10}%`}`).join('\n')}${c.note ? `\n\nNote: ${c.note}` : ''}`;
    }
    case 'table':
      return `**TABLE: ${c.title}**\n\n| ${c.columns.join(' | ')} |\n|${'---|'.repeat(c.columns.length)}\n${c.rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}${c.note ? `\n\nNote: ${c.note}` : ''}`;
    case 'svg':
      return `**FIGURE${c.title ? `: ${c.title}` : ''}** (SVG source):\n\n\`\`\`svg\n${c.svg}\n\`\`\``;
  }
}

function passageText(p: Passage): string {
  return p.paragraphs.map((para, pi) => para.map((s, si) => `[P${pi + 1}S${si + 1}] ${s}`).join(' ')).join('\n\n');
}

function questionText(q: Question, set: QuestionSet): string {
  const out: string[] = [`### ${q.id}  (${q.type})`];
  if ('passageId' in q) out.push(`_Passage: ${q.passageId}_`);
  if ('dataSetId' in q && q.dataSetId) out.push(`_Data set: ${q.dataSetId}_`);
  if ('figure' in q && q.figure) out.push(q.figure.kind === 'svg' ? `**FIGURE** ${q.figure.notToScale ? '(Note: Figure not drawn to scale.)' : ''}\n\n\`\`\`svg\n${q.figure.svg}\n\`\`\`` : chartText(q.figure));
  switch (q.type) {
    case 'tc':
      out.push(q.stem.replace(/\{\{(\d)\}\}/g, (_, n) => `___(${['i', 'ii', 'iii'][Number(n) - 1]})___`));
      q.blanks.forEach((b, i) => out.push(`Blank (${['i', 'ii', 'iii'][i]}): ${b.map((w) => `"${w}"`).join(', ')}`));
      out.push('_Answer format: array of the chosen words, one per blank._');
      break;
    case 'se':
      out.push(q.stem.replace('{{1}}', '________'));
      out.push(q.options.map((o, i) => `(${L[i]}) ${o}`).join('\n'));
      out.push('_Select exactly TWO. Answer format: ["X","Y"]._');
      break;
    case 'rc-single':
    case 'mc-single':
      out.push(q.stem);
      if (q.type === 'rc-single' && q.highlight) out.push(`_(Highlighted sentence: P${q.highlight.p + 1}S${q.highlight.s + 1})_`);
      out.push(q.options.map((o, i) => `(${L[i]}) ${o}`).join('\n'));
      out.push('_Answer format: one letter._');
      break;
    case 'rc-multi':
    case 'mc-multi':
      out.push(q.stem);
      out.push(q.options.map((o, i) => `(${L[i]}) ${o}`).join('\n'));
      out.push('_Select ALL that apply. Answer format: array of letters._');
      break;
    case 'rc-select':
      out.push(q.stem + (q.paragraph !== undefined ? ` (selectable: paragraph ${q.paragraph + 1} only)` : ''));
      out.push('_Answer format: sentence label like "P2S3"._');
      break;
    case 'qc':
      if (q.info) out.push(`Given: ${q.info}`);
      out.push(`Quantity A: ${q.quantityA}\n\nQuantity B: ${q.quantityB}`);
      out.push(QC.map((o, i) => `(${L[i]}) ${o}`).join('\n'));
      out.push('_Answer format: one letter A-D._');
      break;
    case 'numeric':
      out.push(q.stem);
      out.push(`${q.prefix ? `[prefix ${q.prefix}] ` : ''}${q.answer.kind === 'fraction' ? 'Two boxes (numerator / denominator). Answer format: "n/d".' : 'One box. Answer format: the number as a string.'}${q.suffix ? ` [suffix ${q.suffix}]` : ''}`);
      break;
  }
  void set;
  return out.join('\n\n');
}

const parts: string[] = [`# Blind solve booklet: ${testId} ${measure}\n\nMath is LaTeX between $...$; "\\$" is a dollar sign. Answer every question.`];
for (const key of SET_KEYS) {
  const file = path.join(ROOT, 'src', 'content', testId, `${measure}-${key}.ts`);
  if (!existsSync(file)) continue;
  const set = (await import(pathToFileURL(file).href)).set as QuestionSet;
  parts.push(`\n---\n\n## Set ${key}\n`);
  for (const p of set.passages) parts.push(`#### Passage ${p.id}\n\n${passageText(p)}`);
  for (const d of set.dataSets as DataSet[]) parts.push(`#### Data set ${d.id}${d.title ? `: ${d.title}` : ''}\n\n${d.charts.map(chartText).join('\n\n')}`);
  for (const q of set.questions) parts.push(questionText(q, set));
}
const outDir = path.join(ROOT, 'verify', 'blind');
mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${testId}-${measure}.md`);
writeFileSync(out, parts.join('\n\n'));
console.log(`wrote ${path.relative(ROOT, out)}`);
