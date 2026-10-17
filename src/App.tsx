import { useCallback, useEffect, useState } from 'react';
import { store, useStore } from './engine/store.ts';
import { Home } from './ui/Home.tsx';
import { TestRunner } from './ui/TestRunner.tsx';
import { Report } from './ui/results/Report.tsx';
import { Dashboard } from './ui/results/Dashboard.tsx';
import { Calculator } from './calculator/Calculator.tsx';
import type { CalcState } from './calculator/calcEngine.ts';
import { getTest, showDemo } from './content/registry.ts';
import { RenderAll } from './ui/RenderAll.tsx';

type Screen = { name: 'home' } | { name: 'test'; id: string } | { name: 'report'; id: string } | { name: 'dashboard' } | { name: 'calc' };

function CalcPractice({ onHome }: { onHome: () => void }) {
  const [s, setS] = useState<CalcState | undefined>();
  const [box, setBox] = useState('');
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Calculator practice</h1>
          <div className="muted">Same behaviour as in the test. Try: 1 + 2 × 4 =  ·  21 × 21 + 54 × 54 = √  ·  memory with M+ / MR.</div>
        </div>
        <div className="head-actions"><button className="btn-primary" onClick={onHome}>Home</button></div>
      </div>
      <div className="card">
        <p>Numeric entry box (Transfer Display target): <input className="numeric-box" value={box} onChange={(e) => setBox(e.target.value)} /></p>
      </div>
      <Calculator state={s} onState={setS} onClose={onHome} onTransfer={setBox} />
    </div>
  );
}

export function App() {
  useStore();
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  useEffect(() => {
    store.init().then(() => setReady(true));
  }, []);

  const home = useCallback(() => setScreen({ name: 'home' }), []);

  const renderAll = showDemo() ? new URLSearchParams(location.search).get('renderall') : null;
  if (renderAll) return <RenderAll testId={renderAll} />;
  if (!ready) return <div className="page muted">Loading…</div>;

  if (screen.name === 'test') {
    const a = store.get(screen.id);
    if (!a || !getTest(a.testId)) return <div className="page">Attempt not found. <button className="btn" onClick={home}>Home</button></div>;
    return <TestRunner key={screen.id} attemptId={screen.id} onExit={home} onFinished={() => setScreen({ name: 'report', id: screen.id })} />;
  }
  if (screen.name === 'report') {
    const a = store.get(screen.id);
    if (!a || !getTest(a.testId)) return <div className="page">Report not found. <button className="btn" onClick={home}>Home</button></div>;
    return <Report attemptId={screen.id} onHome={home} />;
  }
  if (screen.name === 'dashboard') return <Dashboard onHome={home} onReport={(id) => setScreen({ name: 'report', id })} />;
  if (screen.name === 'calc') return <CalcPractice onHome={home} />;
  return (
    <Home
      onOpenTest={(id) => setScreen({ name: 'test', id })}
      onReport={(id) => setScreen({ name: 'report', id })}
      onDashboard={() => setScreen({ name: 'dashboard' })}
      onCalc={() => setScreen({ name: 'calc' })}
    />
  );
}
