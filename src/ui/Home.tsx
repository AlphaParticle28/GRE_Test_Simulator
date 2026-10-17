import { useRef, useState } from 'react';
import type { Attempt, AttemptMode, Measure, TestDef, Tier } from '../types.ts';
import { TIERS } from '../types.ts';
import { store, useStore } from '../engine/store.ts';
import { allTests, getTest } from '../content/registry.ts';
import { createAttempt, currentSection } from '../engine/attempt.ts';
import { buildReport } from '../engine/analytics.ts';
import { tierLabel } from '../content/index.ts';

const mmss = (ms: number) => {
  const t = Math.round(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
const MODE_LABEL: Record<AttemptMode, string> = { full: 'Full test', verbal: 'Verbal only', quant: 'Quant only', bonus: 'Bonus set' };

function seenTiers(attempts: Attempt[], measure: Measure): Set<Tier> {
  const s = new Set<Tier>();
  for (const a of attempts) for (const sec of Object.values(a.sections)) if (sec && sec.measure === measure && sec.tier && sec.status !== 'not-started') s.add(sec.tier);
  return s;
}

function TestCard({ test, onStart, onResume, onReport }: { test: TestDef; onStart: (mode: AttemptMode, bonus?: { measure: Measure; tier: Tier }) => void; onResume: (id: string) => void; onReport: (id: string) => void }) {
  const attempts = store.list().filter((a) => a.testId === test.id);
  const active = attempts.filter((a) => a.status === 'in-progress');
  const done = attempts.filter((a) => a.status === 'completed');
  const mainActive = active.filter((a) => a.mode !== 'bonus');
  const tookMeasure = (m: Measure) => done.some((a) => a.mode === 'full' || a.mode === m);
  const bonusOptions: { measure: Measure; tier: Tier }[] = [];
  for (const m of ['verbal', 'quant'] as const) {
    if (!tookMeasure(m)) continue;
    const seen = seenTiers(attempts, m);
    for (const t of TIERS) if (!seen.has(t)) bonusOptions.push({ measure: m, tier: t });
  }

  return (
    <div className="test-card" data-testid={`card-${test.id}`}>
      <div className="test-card-head">
        <h3>{test.name}</h3>
        <span className="muted small">27 Verbal + 27 Quant · 88 min</span>
      </div>
      {active.map((a) => {
        const sec = currentSection(a);
        return (
          <div className="resume-row" key={a.id}>
            <div>
              <b>In progress</b> — {MODE_LABEL[a.mode]}{a.bonus ? ` (${a.bonus.measure} ${tierLabel(a.bonus.tier)})` : ''} · section {a.sectionIdx + 1} of {a.order.length}
              {sec && sec.status === 'in-progress' && <> · {mmss(sec.remainingMs)} left</>}
            </div>
            <div className="row-actions">
              <button className="btn-primary" onClick={() => onResume(a.id)} data-testid="resume">Resume</button>
              <button
                className="btn"
                onClick={() => {
                  if (confirm('Discard this in-progress attempt? Its answers will be deleted.')) store.remove(a.id);
                }}
              >
                Discard
              </button>
            </div>
          </div>
        );
      })}
      {mainActive.length === 0 && (
        <div className="start-row">
          <button className="btn-primary" onClick={() => onStart('full')} data-testid={`start-full-${test.id}`}>
            {done.some((a) => a.mode === 'full') ? 'Retake full test' : 'Start full test'}
          </button>
          <button className="btn" onClick={() => onStart('verbal')} data-testid={`start-verbal-${test.id}`}>Verbal only</button>
          <button className="btn" onClick={() => onStart('quant')} data-testid={`start-quant-${test.id}`}>Quant only</button>
        </div>
      )}
      {done.length > 0 && (
        <div className="done-list">
          {done.map((a) => {
            const rep = buildReport(a, test);
            const sc = [rep.scores.verbal && `V ${rep.scores.verbal.scaled}`, rep.scores.quant && `Q ${rep.scores.quant.scaled}`].filter(Boolean).join(' · ');
            const raw = a.mode === 'bonus' && rep.sections[0] ? `${rep.sections[0].correct}/${rep.sections[0].total}` : '';
            return (
              <button key={a.id} className="done-row" onClick={() => onReport(a.id)} data-testid="open-report">
                <span>{new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>{MODE_LABEL[a.mode]}{a.bonus ? ` · ${a.bonus.measure === 'verbal' ? 'Verbal' : 'Quant'} S2 ${tierLabel(a.bonus.tier)}` : ''}{a.isRetake ? ' · retake' : ''}</span>
                <b>{sc || raw}</b>
                <span className="link">Report →</span>
              </button>
            );
          })}
        </div>
      )}
      {bonusOptions.length > 0 && active.every((a) => a.mode !== 'bonus') && (
        <div className="bonus">
          <div className="muted small">Bonus practice — Section 2 sets you haven't seen (single timed section, raw score):</div>
          <div className="start-row">
            {bonusOptions.map((b) => (
              <button key={`${b.measure}-${b.tier}`} className="btn small" onClick={() => onStart('bonus', b)}>
                {b.measure === 'verbal' ? 'Verbal' : 'Quant'} S2 · {tierLabel(b.tier)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Home({ onOpenTest, onReport, onDashboard, onCalc }: { onOpenTest: (id: string) => void; onReport: (id: string) => void; onDashboard: () => void; onCalc: () => void }) {
  useStore();
  const tests = allTests();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const start = (test: TestDef, mode: AttemptMode, bonus?: { measure: Measure; tier: Tier }) => {
    const prior = store.list().some((a) => a.testId === test.id && a.status === 'completed' && (a.mode === mode || a.mode === 'full' || mode === 'full') && mode !== 'bonus');
    const a = createAttempt(test, mode, { bonus, isRetake: prior });
    store.add(a);
    onOpenTest(a.id);
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(store.list(), null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `gre-sim-backup-${new Date().toISOString().slice(0, 10)}.json`;
    el.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="page home">
      <div className="page-head">
        <div>
          <h1>GRE Practice Simulator</h1>
          <div className="muted">Verbal + Quant · section-adaptive · ETS-style interface and calculator</div>
        </div>
        <div className="head-actions">
          <span className={`pill ${store.serverOk ? 'pill-ok' : 'pill-warn'}`} title={store.serverOk ? 'Progress is also saved to the data/ folder' : 'Disk backup unavailable — progress is saved in this browser only'}>
            {store.serverOk ? 'Saving to disk ✓' : 'Browser-only saving'}
          </span>
          <button className="btn" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}>Full screen</button>
        </div>
      </div>

      {tests.length === 0 && <div className="card">No practice tests are installed yet.</div>}
      <div className="test-grid">
        {tests.map((t) => (
          <TestCard key={t.id} test={t} onStart={(m, b) => start(t, m, b)} onResume={onOpenTest} onReport={onReport} />
        ))}
      </div>

      <div className="tools">
        <button className="btn" onClick={onDashboard}>Progress dashboard</button>
        <button className="btn" onClick={onCalc}>Calculator practice</button>
        <button className="btn" onClick={exportAll}>Export backup</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>Import backup</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const n = store.importAll(JSON.parse(await f.text()));
              setMsg(`Imported ${n} attempt(s).`);
            } catch {
              setMsg('That file is not a valid backup.');
            }
            e.target.value = '';
          }}
        />
        {msg && <span className="muted">{msg}</span>}
      </div>

      <div className="card tips">
        <b>Test-day realism:</b> use scratch paper and a pen, sit at a desk, and keep your phone away. Sections cannot be paused —
        if something comes up, close the tab or use <i>Exit Section → Save &amp; Exit Test</i>; the clock stops and you can resume here.
      </div>
      {getTest('demo') && tests.some((t) => t.id === 'demo') && <div className="muted small">Demo test is visible because this is a development build or ?demo is in the URL.</div>}
    </div>
  );
}
