import { useMemo } from 'react';
import { store, useStore } from '../../engine/store.ts';
import { getTest } from '../../content/registry.ts';
import { buildReport, typeKey, TOPIC_LABEL, type Stat } from '../../engine/analytics.ts';

const pct = (s: Stat) => (s.n ? Math.round((100 * s.correct) / s.n) : 0);

export function Dashboard({ onHome, onReport }: { onHome: () => void; onReport: (id: string) => void }) {
  const v = useStore();
  const data = useMemo(() => {
    const reps = store
      .list()
      .filter((a) => a.status === 'completed' && a.testId !== 'demo')
      .map((a) => ({ a, test: getTest(a.testId) }))
      .filter((x) => x.test)
      .map((x) => buildReport(x.a, x.test!));
    const topic = new Map<string, Stat>(), type = new Map<string, Stat>();
    const tags = new Map<string, number>();
    const causes = new Map<string, number>();
    for (const rep of reps) {
      for (const r of rep.results) {
        for (const [m, k] of [[topic, r.q.topic], [type, typeKey(r)]] as const) {
          const s = m.get(k) ?? { key: k, n: 0, correct: 0, timeMs: 0 };
          s.n++;
          if (r.outcome === 'correct') s.correct++;
          s.timeMs += r.timeMs;
          m.set(k, s);
        }
        if (r.outcome !== 'correct' && !r.disputed) for (const d of r.diagnoses) if (d.severity !== 'good') causes.set(d.label.startsWith('Trap') ? 'Fell for a trap' : d.label, (causes.get(d.label.startsWith('Trap') ? 'Fell for a trap' : d.label) ?? 0) + 1);
        const tag = rep.attempt.notes[r.id]?.tag;
        if (tag) tags.set(tag, (tags.get(tag) ?? 0) + 1);
      }
    }
    const topics = [...topic.values()].filter((s) => s.n >= 2).sort((x, y) => pct(x) - pct(y) || y.n - x.n);
    return { reps, topics, types: [...type.values()].sort((x, y) => pct(x) - pct(y)), tags: [...tags.entries()].sort((x, y) => y[1] - x[1]), causes: [...causes.entries()].sort((x, y) => y[1] - x[1]) };
  }, [v]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Progress dashboard</h1>
          <div className="muted">Across {data.reps.length} completed attempt(s)</div>
        </div>
        <div className="head-actions"><button className="btn-primary" onClick={onHome}>Home</button></div>
      </div>
      {data.reps.length === 0 ? (
        <div className="card">Finish a test to see your trends here.</div>
      ) : (
        <>
          <div className="card">
            <h4>Scores</h4>
            <table className="stat-table">
              <thead><tr><th>Date</th><th>Test</th><th>Mode</th><th>Verbal</th><th>Quant</th><th></th></tr></thead>
              <tbody>
                {[...data.reps].reverse().map((r) => (
                  <tr key={r.attempt.id}>
                    <td>{new Date(r.attempt.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{r.test.name}</td>
                    <td>{r.attempt.mode}{r.attempt.isRetake ? ' (retake)' : ''}</td>
                    <td>{r.scores.verbal ? `${r.scores.verbal.scaled} (${r.scores.verbal.s1}+${r.scores.verbal.s2})` : r.attempt.mode === 'bonus' && r.attempt.bonus?.measure === 'verbal' ? `${r.sections[0]?.correct}/${r.sections[0]?.total}` : '—'}</td>
                    <td>{r.scores.quant ? `${r.scores.quant.scaled} (${r.scores.quant.s1}+${r.scores.quant.s2})` : r.attempt.mode === 'bonus' && r.attempt.bonus?.measure === 'quant' ? `${r.sections[0]?.correct}/${r.sections[0]?.total}` : '—'}</td>
                    <td><button className="link-btn" onClick={() => onReport(r.attempt.id)}>Report</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="insights">
            <div className="card">
              <h4>Top topics to revise</h4>
              <ol>
                {data.topics.slice(0, 5).map((s) => (
                  <li key={s.key}><b>{TOPIC_LABEL[s.key] ?? s.key}</b> — {s.correct}/{s.n} ({pct(s)}%)</li>
                ))}
              </ol>
              <h4>Most common reasons for misses</h4>
              <ul>
                {data.causes.slice(0, 6).map(([l, n]) => <li key={l}>{l}: <b>{n}</b></li>)}
              </ul>
              {data.tags.length > 0 && (
                <>
                  <h4>Your own tags</h4>
                  <ul>{data.tags.map(([t, n]) => <li key={t}>{t}: <b>{n}</b></li>)}</ul>
                </>
              )}
            </div>
            <div className="card">
              <h4>All topics (weakest first, 2+ questions)</h4>
              <table className="stat-table">
                <tbody>
                  {data.topics.map((s) => (
                    <tr key={s.key}><td>{TOPIC_LABEL[s.key] ?? s.key}</td><td>{s.correct}/{s.n}</td><td>{pct(s)}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h4>By question type</h4>
              <table className="stat-table">
                <tbody>
                  {data.types.map((s) => (
                    <tr key={s.key}><td>{s.key}</td><td>{s.correct}/{s.n}</td><td>{pct(s)}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
