import type { ChartSpec, Figure as FigureSpec } from '../../types.ts';
import { RichText } from '../RichText.tsx';

const PATTERNS = ['#333', '#999', '#fff', '#666', '#ccc'];

function niceStep(max: number): number {
  const raw = max / 5;
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

function BarLine({ c }: { c: Extract<ChartSpec, { kind: 'bar' | 'line' }> }) {
  const W = 520, H = 300, L = 60, R = 16, T = 16, B = 56;
  const stackedMax = c.stacked ? Math.max(...c.categories.map((_, i) => c.series.reduce((s, se) => s + se.values[i], 0))) : 0;
  const dataMax = c.stacked ? stackedMax : Math.max(...c.series.flatMap((s) => s.values));
  const dataMin = Math.min(0, ...c.series.flatMap((s) => s.values));
  const step = c.yStep ?? niceStep(dataMax - dataMin);
  const yMax = c.yMax ?? Math.ceil(dataMax / step) * step;
  const yMin = c.yMin ?? (dataMin < 0 ? Math.floor(dataMin / step) * step : 0);
  const pw = W - L - R, ph = H - T - B;
  const y = (v: number) => T + ph - ((v - yMin) / (yMax - yMin)) * ph;
  const n = c.categories.length;
  const band = pw / n;
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  const sCount = c.series.length;
  const barW = c.stacked ? band * 0.55 : (band * 0.7) / sCount;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#bbb" strokeWidth={t === 0 ? 1.5 : 0.75} />
          <text x={L - 6} y={y(t) + 4} fontSize="12" textAnchor="end">{fmt(t)}</text>
        </g>
      ))}
      <line x1={L} x2={L} y1={T} y2={T + ph} stroke="#000" />
      <line x1={L} x2={W - R} y1={y(Math.max(yMin, 0))} y2={y(Math.max(yMin, 0))} stroke="#000" />
      {c.categories.map((cat, i) => (
        <text key={cat + i} x={L + band * i + band / 2} y={T + ph + 18} fontSize="12" textAnchor="middle">{cat}</text>
      ))}
      {c.kind === 'bar' &&
        c.categories.map((_, i) => {
          let acc = 0;
          return c.series.map((s, si) => {
            const v = s.values[i];
            const x = c.stacked ? L + band * i + (band - barW) / 2 : L + band * i + band * 0.15 + barW * si;
            const y0 = c.stacked ? y(acc) : y(Math.max(0, yMin));
            const y1 = c.stacked ? y(acc + v) : y(v);
            acc += v;
            return (
              <g key={`${i}-${si}`}>
                <rect x={x} y={Math.min(y0, y1)} width={barW} height={Math.abs(y0 - y1)} fill={PATTERNS[si % PATTERNS.length]} stroke="#000" strokeWidth="1" />
                {c.showValues && (
                  <text x={x + barW / 2} y={Math.min(y0, y1) - 4} fontSize="11" textAnchor="middle">{fmt(v)}</text>
                )}
              </g>
            );
          });
        })}
      {c.kind === 'line' &&
        c.series.map((s, si) => (
          <g key={s.name}>
            <polyline
              fill="none"
              stroke="#000"
              strokeWidth="2"
              strokeDasharray={si === 1 ? '6 4' : si === 2 ? '2 3' : undefined}
              points={s.values.map((v, i) => `${L + band * i + band / 2},${y(v)}`).join(' ')}
            />
            {s.values.map((v, i) => (
              <g key={i}>
                {si % 2 === 0 ? (
                  <circle cx={L + band * i + band / 2} cy={y(v)} r="4" fill="#000" />
                ) : (
                  <rect x={L + band * i + band / 2 - 4} y={y(v) - 4} width="8" height="8" fill="#fff" stroke="#000" />
                )}
                {c.showValues && (
                  <text x={L + band * i + band / 2} y={y(v) - 8} fontSize="11" textAnchor="middle">{fmt(v)}</text>
                )}
              </g>
            ))}
          </g>
        ))}
      {c.yLabel && (
        <text x={14} y={T + ph / 2} fontSize="12" textAnchor="middle" transform={`rotate(-90 14 ${T + ph / 2})`}>{c.yLabel}</text>
      )}
      {c.xLabel && <text x={L + pw / 2} y={H - 6} fontSize="12" textAnchor="middle">{c.xLabel}</text>}
    </svg>
  );
}

function Legend({ names, kind }: { names: string[]; kind: 'bar' | 'line' }) {
  if (names.length < 2) return null;
  return (
    <div className="chart-legend">
      {names.map((n, i) => (
        <span key={n} className="legend-item">
          {kind === 'bar' ? (
            <span className="legend-swatch" style={{ background: PATTERNS[i % PATTERNS.length] }} />
          ) : (
            <svg width="30" height="10"><line x1="0" x2="30" y1="5" y2="5" stroke="#000" strokeWidth="2" strokeDasharray={i === 1 ? '6 4' : i === 2 ? '2 3' : undefined} /></svg>
          )}
          {n}
        </span>
      ))}
    </div>
  );
}

function Pie({ c }: { c: Extract<ChartSpec, { kind: 'pie' }> }) {
  const total = c.slices.reduce((s, x) => s + x.value, 0);
  const cx = 260, cy = 150, r = 110;
  let a0 = -Math.PI / 2;
  return (
    <svg viewBox="0 0 520 300" className="chart-svg" role="img">
      {c.slices.map((s, i) => {
        const frac = s.value / total;
        const a1 = a0 + frac * 2 * Math.PI;
        const large = frac > 0.5 ? 1 : 0;
        const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
        const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
        const mid = (a0 + a1) / 2;
        const path = frac >= 0.9999 ? `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0` : `M ${cx} ${cy} L ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]} Z`;
        const el = (
          <g key={s.label}>
            <path d={path} fill={['#fff', '#ddd', '#aaa', '#eee', '#ccc', '#bbb', '#f4f4f4'][i % 7]} stroke="#000" />
            <line x1={cx + r * 0.85 * Math.cos(mid)} y1={cy + r * 0.85 * Math.sin(mid)} x2={cx + (r + 14) * Math.cos(mid)} y2={cy + (r + 14) * Math.sin(mid)} stroke="#000" />
          </g>
        );
        a0 = a1;
        return el;
      })}
      {(() => {
        let b0 = -Math.PI / 2;
        return c.slices.map((s) => {
          const frac = s.value / total;
          const mid = b0 + frac * Math.PI;
          b0 += frac * 2 * Math.PI;
          const x = cx + (r + 18) * Math.cos(mid);
          const yy = cy + (r + 18) * Math.sin(mid);
          const label = c.labelMode === 'raw' ? `${s.label}: ${fmt(s.value)}` : `${s.label}: ${fmt(Math.round(frac * 1000) / 10)}%`;
          return (
            <text key={s.label} x={x} y={yy + 4} fontSize="12" textAnchor={Math.cos(mid) >= 0 ? 'start' : 'end'}>
              {label}
            </text>
          );
        });
      })()}
    </svg>
  );
}

export function Chart({ c }: { c: ChartSpec }) {
  return (
    <div className="chart">
      {'title' in c && c.title && <div className="chart-title"><RichText text={c.title} /></div>}
      {(c.kind === 'bar' || c.kind === 'line') && (
        <>
          <BarLine c={c} />
          <Legend names={c.series.map((s) => s.name)} kind={c.kind} />
        </>
      )}
      {c.kind === 'pie' && <Pie c={c} />}
      {c.kind === 'table' && (
        <table className="data-table">
          <thead>
            <tr>{c.columns.map((h, i) => <th key={i}><RichText text={h} /></th>)}</tr>
          </thead>
          <tbody>
            {c.rows.map((r, i) => (
              <tr key={i}>{r.map((cell, j) => <td key={j}><RichText text={String(cell)} /></td>)}</tr>
            ))}
          </tbody>
        </table>
      )}
      {c.kind === 'svg' && <div className="svg-figure" dangerouslySetInnerHTML={{ __html: c.svg }} />}
      {c.kind === 'pie' && c.note && <div className="chart-note"><RichText text={c.note} /></div>}
      {c.kind === 'table' && c.note && <div className="chart-note"><RichText text={c.note} /></div>}
    </div>
  );
}

export function Figure({ f }: { f: FigureSpec }) {
  if (f.kind === 'svg') {
    return (
      <div className="figure">
        <div className="svg-figure" dangerouslySetInnerHTML={{ __html: f.svg }} />
        {'notToScale' in f && f.notToScale && <div className="figure-note">Note: Figure not drawn to scale.</div>}
      </div>
    );
  }
  return <Chart c={f} />;
}
