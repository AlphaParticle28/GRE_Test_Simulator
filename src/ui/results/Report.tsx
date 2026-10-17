import { useMemo, useState } from 'react';
import type { Attempt } from '../../types.ts';
import { store, useStore } from '../../engine/store.ts';
import { getTest } from '../../content/registry.ts';
import { buildReport, resultsCsv, typeKey, TOPIC_LABEL, TRAP_LABEL, type AttemptReport, type QResult, type Stat } from '../../engine/analytics.ts';
import { formatAnswerKey, formatResponse } from '../../engine/grading.ts';
import { tierLabel } from '../../content/index.ts';
import { QuestionView } from '../questions/QuestionView.tsx';
import { RichText } from '../RichText.tsx';

const TAGS = ['concept gap', 'careless / silly', 'misread', 'vocabulary', 'time pressure', 'guessed', 'fell for trap'];
const MEASURE = { verbal: 'Verbal', quant: 'Quant' } as const;

const mmss = (ms: number) => {
  const t = Math.round(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
const pct = (s: Stat) => (s.n ? Math.round((100 * s.correct) / s.n) : 0);

function download(name: string, text: string, type = 'text/csv') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sectionName(r: { measure: 'verbal' | 'quant'; part: 1 | 2; tier?: string }) {
  return `${MEASURE[r.measure]} S${r.part}${r.part === 2 && r.tier ? ` (${tierLabel(r.tier as 'easy')})` : ''}`;
}

function StatTable({ title, rows, label }: { title: string; rows: Stat[]; label: (k: string) => string }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <table className="stat-table">
        <thead>
          <tr><th></th><th>Right</th><th>Accuracy</th><th>Avg time</th></tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.key}>
              <td>{label(s.key)}</td>
              <td>{s.correct}/{s.n}</td>
              <td>
                <div className="bar"><div className={`bar-fill ${pct(s) < 50 ? 'low' : pct(s) < 75 ? 'mid' : 'high'}`} style={{ width: `${pct(s)}%` }} /></div>
                <span className="bar-label">{pct(s)}%</span>
              </td>
              <td>{mmss(s.timeMs / s.n)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PacingChart({ rep, sectionIdx }: { rep: AttemptReport; sectionIdx: number }) {
  const rs = rep.results.filter((r) => r.sectionIdx === sectionIdx);
  if (!rs.length) return null;
  const target = rs[0].targetMs;
  const max = Math.max(target * 2.2, ...rs.map((r) => r.timeMs));
  const W = 560, H = 170, L = 40, B = 24, T = 10;
  const bw = (W - L - 10) / rs.length;
  const y = (ms: number) => T + (H - T - B) * (1 - ms / max);
  const s = rep.sections.find((x) => x.idx === sectionIdx)!;
  return (
    <div className="card">
      <h4>Pacing — Section {sectionIdx + 1}: {sectionName(s)}</h4>
      <svg viewBox={`0 0 ${W} ${H}`} className="pacing">
        {[0, 60_000, 120_000, 180_000, 240_000, 300_000].filter((v) => v <= max).map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 10} y1={y(v)} y2={y(v)} stroke="#e3e3e3" />
            <text x={L - 4} y={y(v) + 4} fontSize="10" textAnchor="end">{v / 60000}m</text>
          </g>
        ))}
        {rs.map((r, i) => (
          <g key={r.id}>
            <rect x={L + i * bw + 2} y={y(r.timeMs)} width={bw - 4} height={Math.max(0, y(0) - y(r.timeMs))} className={`pace-${r.credited ? 'ok' : r.outcome}`} />
            <text x={L + i * bw + bw / 2} y={H - 8} fontSize="10" textAnchor="middle">{r.pos}</text>
          </g>
        ))}
        <line x1={L} x2={W - 10} y1={y(target)} y2={y(target)} stroke="#1d4f91" strokeDasharray="5 4" />
        <text x={W - 12} y={y(target) - 4} fontSize="10" textAnchor="end" fill="#1d4f91">target {mmss(target)}</text>
      </svg>
      <div className="muted small">Bars: time spent per question (green = right, red = wrong, gray = blank). Dashed line: section average pace.</div>
    </div>
  );
}

function ReviewPanel({ rep, list, index, onClose, onMove }: { rep: AttemptReport; list: QResult[]; index: number; onClose: () => void; onMove: (i: number) => void }) {
  const r = list[index];
  const a = rep.attempt;
  const note = a.notes[r.id] ?? {};
  const setNote = (patch: { tag?: string; text?: string }) => store.update(a.id, (x) => (x.notes[r.id] = { ...x.notes[r.id], ...patch }));
  const toggleDispute = () =>
    store.update(a.id, (x) => {
      x.disputed = x.disputed.includes(r.id) ? x.disputed.filter((d) => d !== r.id) : [...x.disputed, r.id];
    }, { remoteNow: true });
  return (
    <div className="review-panel">
      <div className="rp-top">
        <button className="btn" onClick={onClose}>← Back to list</button>
        <div className="rp-nav">
          <button className="btn" disabled={index === 0} onClick={() => onMove(index - 1)}>‹ Prev</button>
          <span>{index + 1} / {list.length}</span>
          <button className="btn" disabled={index === list.length - 1} onClick={() => onMove(index + 1)}>Next ›</button>
        </div>
      </div>
      <div className="rp-meta">
        <span className={`pill ${r.credited ? 'pill-ok' : r.outcome === 'omitted' ? 'pill-blank' : 'pill-bad'}`}>
          {r.disputed ? 'Disputed (credited)' : r.outcome === 'correct' ? 'Correct' : r.outcome === 'omitted' ? 'Blank' : 'Wrong'}
        </span>
        <span>Section {r.sectionIdx + 1} · {sectionName(r)} · Q{r.pos}</span>
        <span>{typeKey(r)}</span>
        <span>{TOPIC_LABEL[r.q.topic] ?? r.q.topic}</span>
        <span>Difficulty {r.q.difficulty}/5</span>
        <span>Time {mmss(r.timeMs)} (target {mmss(r.targetMs)})</span>
        <span>Visits {r.visits}</span>
        {r.marked && <span>Marked</span>}
      </div>
      <div className="rp-question">
        <QuestionView q={r.q} passage={r.info.passage} dataSet={r.info.dataSet} response={r.response} review={{ show: true }} />
      </div>
      <div className="rp-answers">
        <div>Your answer: <b className={r.credited ? 'ok' : 'bad'}>{formatResponse(r.q, r.response)}</b></div>
        <div>Correct answer: <b className="ok">{formatAnswerKey(r.q)}</b></div>
      </div>
      {r.diagnoses.length > 0 && (
        <div className="card">
          <h4>What happened</h4>
          <ul className="diag-list">
            {r.diagnoses.map((d, i) => (
              <li key={i} className={`diag-${d.severity}`}>
                <b>{d.label}.</b> {d.detail && <RichText text={d.detail} />}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card">
        <h4>Explanation</h4>
        <RichText as="div" className="explanation" text={r.q.explanation} />
        {(r.q.traps ?? []).length > 0 && (
          <>
            <h5>Traps in this question</h5>
            <ul className="trap-list">
              {r.q.traps!.map((t, i) => {
                const hit = r.traps.includes(t);
                const label = r.q.type === 'tc' && r.q.blanks.length > 1 ? `Blank (${['i', 'ii', 'iii'][t.blank ?? 0]}) "${r.q.blanks[t.blank ?? 0][t.option]}"` : r.q.type === 'tc' ? `"${r.q.blanks[0][t.option]}"` : `Choice ${'ABCDEFGHIJ'[t.option]}`;
                return (
                  <li key={i} className={hit ? 'trap-hit' : ''}>
                    <b>{label}</b> — {TRAP_LABEL[t.trap] ?? t.trap}{hit ? ' (you picked this)' : ''}: <RichText text={t.why} />
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {'vocab' in r.q && r.q.vocab && r.q.vocab.length > 0 && (
          <>
            <h5>Vocabulary</h5>
            <ul className="vocab-inline">
              {r.q.vocab.map((v) => <li key={v.word}><b>{v.word}</b>: {v.meaning}</li>)}
            </ul>
          </>
        )}
      </div>
      {r.history.length > 1 && (
        <div className="card">
          <h4>Answer history</h4>
          <ol className="history">
            {r.history.map((h, i) => (
              <li key={i}>at {mmss(h.t)} into the section → {formatResponse(r.q, h.r)}</li>
            ))}
          </ol>
        </div>
      )}
      <div className="card notes">
        <h4>Your notes</h4>
        <div className="tag-row">
          {TAGS.map((t) => (
            <button key={t} className={`tag ${note.tag === t ? 'on' : ''}`} onClick={() => setNote({ tag: note.tag === t ? undefined : t })}>{t}</button>
          ))}
        </div>
        <textarea placeholder="What will you do differently next time?" value={note.text ?? ''} onChange={(e) => setNote({ text: e.target.value })} />
        <label className="dispute">
          <input type="checkbox" checked={a.disputed.includes(r.id)} onChange={toggleDispute} /> This question is flawed (ambiguous or wrong key) — count it as correct
        </label>
      </div>
    </div>
  );
}

export function Report({ attemptId, onHome }: { attemptId: string; onHome: () => void }) {
  const v = useStore();
  const a = store.get(attemptId) as Attempt;
  const test = getTest(a.testId)!;
  const rep = useMemo(() => buildReport(a, test), [a, test, v]); // eslint-disable-line react-hooks/exhaustive-deps
  const [tab, setTab] = useState<'log' | 'insights' | 'vocab'>('log');
  const [filter, setFilter] = useState<'missed' | 'all' | 'marked' | 'verbal' | 'quant' | 'slow'>('missed');
  const [open, setOpen] = useState<number | null>(null);

  const list = rep.results.filter((r) =>
    filter === 'all' ? true
      : filter === 'missed' ? !r.credited || r.outcome !== 'correct'
      : filter === 'marked' ? r.marked
      : filter === 'slow' ? r.timeMs > 2 * r.targetMs
      : r.measure === filter,
  );

  if (open !== null && list[open]) {
    return (
      <div className="page">
        <ReviewPanel rep={rep} list={list} index={open} onClose={() => setOpen(null)} onMove={setOpen} />
      </div>
    );
  }

  const misses = rep.results.filter((r) => r.outcome !== 'correct' && !r.disputed);
  const count = (code: string) => misses.filter((r) => r.diagnoses.some((d) => d.code === code)).length;
  const causes = [
    ['Fell for a trap answer', count('trap')],
    ['Over-invested time and still missed', count('over-invested')],
    ['Changed a right answer to a wrong one', count('changed-away')],
    ['Rushed (under 20 s)', count('rushed')],
    ['Answered in the final minute', count('time-pressure')],
    ['Partly right (multi-part question)', count('partial')],
    ['Left blank', count('omitted') + count('timeout-blank')],
    ['Never reached', count('not-reached')],
  ] as const;
  const totalTime = rep.sections.reduce((s, x) => s + x.timeUsedMs, 0);
  const isBonus = a.mode === 'bonus';

  return (
    <div className="page report">
      <div className="page-head">
        <div>
          <h1>{isBonus ? 'Practice Set Report' : 'Score Report'} — {test.name}</h1>
          <div className="muted">
            {new Date(a.createdAt).toLocaleString()} · {a.mode === 'full' ? 'Full test' : a.mode === 'bonus' ? `Bonus: ${MEASURE[a.bonus!.measure]} S2 (${tierLabel(a.bonus!.tier)})` : `${MEASURE[a.mode]} only`}
            {a.isRetake && ' · Retake (scores inflated by familiarity)'} · total time {mmss(totalTime)}
          </div>
        </div>
        <div className="head-actions">
          <button className="btn" onClick={() => download(`gre-${test.id}-${new Date(a.createdAt).toISOString().slice(0, 10)}-errorlog.csv`, resultsCsv(rep))}>Export CSV</button>
          <button className="btn" onClick={() => window.print()}>Print / PDF</button>
          <button className="btn-primary" onClick={onHome}>Home</button>
        </div>
      </div>

      <div className="score-row">
        {(['verbal', 'quant'] as const).map((m) => {
          const s = rep.scores[m];
          if (!s) return null;
          return (
            <div className="score-card" key={m}>
              <div className="score-measure">{m === 'verbal' ? 'Verbal Reasoning' : 'Quantitative Reasoning'}</div>
              <div className="score-big" data-testid={`score-${m}`}>{s.scaled}</div>
              <div className="muted">≈ {s.percentile}th percentile (approx.)</div>
              <div className="score-route">S1 {s.s1}/12 → {tierLabel(s.tier)} S2 {s.s2}/15</div>
              <div className="muted small" title="Count-based: raw correct answers on the route. Difficulty-adjusted: weights each question by how hard it was.">
                count-based {s.countBased} · difficulty-adjusted {s.adjusted}
              </div>
            </div>
          );
        })}
        {isBonus && rep.sections[0] && (
          <div className="score-card">
            <div className="score-measure">Raw score</div>
            <div className="score-big">{rep.sections[0].correct}/{rep.sections[0].total}</div>
            <div className="muted">No scaled score for a single practice section</div>
          </div>
        )}
        <div className="score-card note-card">
          <b>About these scores.</b> They are estimates (ETS does not publish its formula) — expect about ±3 points against the real
          test. The real value is the error log below: fix the patterns, not just the questions.
        </div>
      </div>

      <div className="card">
        <h4>Sections</h4>
        <table className="stat-table">
          <thead><tr><th>#</th><th>Section</th><th>Right</th><th>Answered</th><th>Time used</th><th>Ended by</th></tr></thead>
          <tbody>
            {rep.sections.map((s) => (
              <tr key={s.key}>
                <td>{s.idx + 1}</td>
                <td>{sectionName(s)}</td>
                <td>{s.correct}/{s.total}</td>
                <td>{s.answered}/{s.total}</td>
                <td>{mmss(s.timeUsedMs)} / {mmss(s.durationMs)}</td>
                <td>{s.endedReason === 'time' ? 'Time expired' : s.endedReason === 'exit' ? 'Exit Section' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {a.suspensions.length > 0 && (
          <div className="muted small">
            Interruptions: {a.suspensions.map((s, i) => (
              <span key={i}>{i ? '; ' : ''}{s.reason === 'sleep-gap' ? `computer asleep ${mmss(s.gapMs ?? 0)}` : s.reason === 'save-exit' ? 'Save & Exit' : 'tab closed'} in section {a.order.indexOf(s.section) + 1} at {mmss(s.remainingMs)} left</span>
            ))}
          </div>
        )}
      </div>

      <div className="tabs">
        <button className={tab === 'log' ? 'on' : ''} onClick={() => setTab('log')}>Error log</button>
        <button className={tab === 'insights' ? 'on' : ''} onClick={() => setTab('insights')}>Insights</button>
        <button className={tab === 'vocab' ? 'on' : ''} onClick={() => setTab('vocab')}>Vocabulary ({rep.vocab.length})</button>
      </div>

      {tab === 'log' && (
        <div className="card">
          <div className="filters">
            {([['missed', 'Wrong & blank'], ['all', 'All'], ['marked', 'Marked'], ['slow', 'Slow (>2× pace)'], ['verbal', 'Verbal'], ['quant', 'Quant']] as const).map(([k, l]) => (
              <button key={k} className={`tag ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
            ))}
            <span className="muted small">{list.length} question(s) — click a row for the full review</span>
          </div>
          <table className="log-table" data-testid="log-table">
            <thead>
              <tr><th>Sec</th><th>Q</th><th>Type</th><th>Topic</th><th>Diff</th><th>Yours</th><th>Correct</th><th>Time</th><th>What went wrong</th><th>Tag</th></tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={r.id} className={`row-${r.disputed ? 'disputed' : r.outcome}`} onClick={() => setOpen(i)}>
                  <td title={sectionName(r)}>{r.sectionIdx + 1}{r.part === 2 ? ` (${r.measure === 'verbal' ? 'V' : 'Q'}2)` : ` (${r.measure === 'verbal' ? 'V' : 'Q'}1)`}</td>
                  <td>{r.pos}{r.marked ? ' ⚑' : ''}</td>
                  <td>{typeKey(r)}</td>
                  <td>{TOPIC_LABEL[r.q.topic] ?? r.q.topic}</td>
                  <td>{r.q.difficulty}</td>
                  <td className={r.credited ? 'ok' : 'bad'}>{formatResponse(r.q, r.response)}</td>
                  <td>{formatAnswerKey(r.q)}</td>
                  <td className={r.timeMs > 2 * r.targetMs ? 'bad' : ''}>{mmss(r.timeMs)}</td>
                  <td className="diag-cell">{r.diagnoses.filter((d) => d.severity !== 'good').map((d) => d.label).join(' · ') || (r.outcome === 'correct' ? '' : 'Wrong')}</td>
                  <td>{a.notes[r.id]?.tag ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'insights' && (
        <div className="insights">
          <div className="card">
            <h4>What cost you points ({misses.length} missed)</h4>
            <table className="stat-table">
              <tbody>
                {causes.filter(([, n]) => n > 0).map(([l, n]) => (
                  <tr key={l}><td>{l}</td><td><b>{n}</b></td></tr>
                ))}
              </tbody>
            </table>
            {rep.qcBias.dQuestions + rep.qcBias.pickedDWrongly > 0 && (
              <p className="small">
                QC "(D) cannot be determined": you picked D wrongly <b>{rep.qcBias.pickedDWrongly}</b> time(s) and missed D on <b>{rep.qcBias.missedD}</b> of {rep.qcBias.dQuestions} D-questions.
                {rep.qcBias.missedD > 0 && ' Missing D usually means you tested only one case — try 0, negatives, fractions and extremes.'}
              </p>
            )}
            {rep.tcBlanks.length > 0 && (
              <p className="small">
                Multi-blank TC accuracy by blank: {rep.tcBlanks.map((b) => `(${['i', 'ii', 'iii'][b.blank]}) ${b.correct}/${b.n}`).join(' · ')}
              </p>
            )}
          </div>
          <StatTable title="Weakest topics first" rows={rep.byTopic} label={(k) => TOPIC_LABEL[k] ?? k} />
          <StatTable title="By question type" rows={rep.byType} label={(k) => k} />
          <StatTable title="By difficulty (1 = easy … 5 = hardest)" rows={rep.byDifficulty} label={(k) => `Difficulty ${k.slice(1)}`} />
          {rep.sections.map((s) => <PacingChart key={s.key} rep={rep} sectionIdx={s.idx} />)}
        </div>
      )}

      {tab === 'vocab' && (
        <div className="card">
          <h4>Words from the TC/SE questions you missed</h4>
          {rep.vocab.length === 0 ? (
            <p className="muted">No missed vocabulary questions — nice.</p>
          ) : (
            <table className="stat-table vocab-table">
              <tbody>
                {rep.vocab.map((v) => (
                  <tr key={v.word}><td><b>{v.word}</b></td><td>{v.meaning || <span className="muted">(see explanation)</span>}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
