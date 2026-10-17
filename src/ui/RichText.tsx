import { memo, useMemo } from 'react';
import katex from 'katex';

const ROMAN = ['i', 'ii', 'iii'];

/** Convert content markup ($math$, \$, whitelisted HTML, {{n}} blanks) to HTML. */
export function richToHtml(src: string, opts: { blanks?: (n: number) => string } = {}): string {
  let out = '';
  let buf = '';
  let inMath = false;
  const flush = () => {
    if (inMath) {
      out += katex.renderToString(buf, { throwOnError: false, strict: false });
    } else {
      let t = buf.replace(/\\\$/g, '$');
      t = t.replace(/\{\{(\d)\}\}/g, (_, n) => (opts.blanks ? opts.blanks(Number(n)) : `<span class="blank-line">${'_'.repeat(10)}</span>`));
      t = t.replace(/\n/g, '<br>');
      out += t;
    }
    buf = '';
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\\' && src[i + 1] === '$') {
      buf += inMath ? '\\$' : '\\$';
      i++;
      continue;
    }
    if (c === '$') {
      flush();
      inMath = !inMath;
      continue;
    }
    buf += c;
  }
  flush();
  return out;
}

export function blankHtml(n: number, total: number): string {
  const label = total > 1 ? `<span class="blank-label">(${ROMAN[n - 1]})</span>` : '';
  return `<span class="blank-slot">${label}<span class="blank-line"></span></span>`;
}

export const RichText = memo(function RichText({ text, className, as = 'span', blanks }: { text: string; className?: string; as?: 'span' | 'div' | 'p'; blanks?: number }) {
  const html = useMemo(() => richToHtml(text, blanks ? { blanks: (n) => blankHtml(n, blanks) } : {}), [text, blanks]);
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});
