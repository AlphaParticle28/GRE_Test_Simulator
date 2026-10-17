import { useEffect, useMemo, useRef, useState } from 'react';
import type { Attempt, Question, SectionState, TestDef } from '../types.ts';
import { store, useStore } from '../engine/store.ts';
import { getTest } from '../content/registry.ts';
import { indexOf } from '../content/index.ts';
import {
  currentSection, endSection, ensureSection, goTo, measureOf, moveToNextSection, setResponse, startSection, tick, toggleMark,
} from '../engine/attempt.ts';
import { answerStatus } from '../engine/grading.ts';
import { QuestionView } from './questions/QuestionView.tsx';
import { Calculator } from '../calculator/Calculator.tsx';
import type { CalcState } from '../calculator/calcEngine.ts';

const SLEEP_GAP_MS = 90_000;

function fmtClock(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MEASURE_NAME = { verbal: 'Verbal Reasoning', quant: 'Quantitative Reasoning' } as const;

function groupNote(test: TestDef, sec: SectionState, i: number): string | undefined {
  const idx = indexOf(test);
  const q = idx.get(sec.questionIds[i])!.q as Question & { passageId?: string; dataSetId?: string };
  const key = q.passageId ?? q.dataSetId;
  if (!key) return undefined;
  const members = sec.questionIds.map((id, j) => {
    const qq = idx.get(id)!.q as Question & { passageId?: string; dataSetId?: string };
    return (qq.passageId ?? qq.dataSetId) === key ? j : -1;
  }).filter((j) => j >= 0);
  const first = members[0] + 1, last = members[members.length - 1] + 1;
  const what = q.passageId ? 'passage' : 'data';
  return first === last ? `Question ${first} is based on the following ${what}.` : `Questions ${first} to ${last} are based on the following ${what}.`;
}

function SectionIntro({ a, sec, onContinue }: { a: Attempt; sec: SectionState; onContinue: () => void }) {
  const mins = Math.round(sec.durationMs / 60000);
  return (
    <div className="intro">
      <h2>
        Section {a.sectionIdx + 1} of {a.order.length}: {MEASURE_NAME[sec.measure]}
      </h2>
      <p>
        <b>{sec.questionIds.length} questions</b> — <b>{mins} minutes</b>
      </p>
      {a.mode === 'bonus' && <p className="muted">Bonus practice set (unseen Section 2). Scored as a raw score only.</p>}
      <div className="intro-dirs">
        {sec.measure === 'verbal' ? (
          <>
            <p>For each question, indicate the best answer, using the directions given.</p>
            <p>You may move between questions in this section with <b>Back</b> and <b>Next</b>, mark questions to revisit with <b>Mark</b>, and see the status of all questions with <b>Review</b>.</p>
          </>
        ) : (
          <>
            <p>For each question, indicate the best answer, using the directions given.</p>
            <p>
              <b>Notes:</b> All numbers used are real numbers. All figures are assumed to lie in a plane unless otherwise indicated.
              Geometric figures, such as lines, circles, triangles, and quadrilaterals, are not necessarily drawn to scale. Coordinate
              systems and graphical data presentations are drawn to scale unless noted otherwise.
            </p>
            <p>An on-screen calculator is available from the <b>Calculator</b> button.</p>
          </>
        )}
        <p>Once you leave this section, you cannot return to it. The timer starts when you click Continue.</p>
      </div>
      <button className="btn-primary" onClick={onContinue} data-testid="section-continue">
        Continue
      </button>
    </div>
  );
}

function ReviewScreen({ test, sec, onGo, onReturn, endOfSection }: { test: TestDef; sec: SectionState; onGo: (i: number) => void; onReturn: () => void; endOfSection: boolean }) {
  const [sel, setSel] = useState(sec.currentQ);
  const idx = indexOf(test);
  return (
    <div className="review">
      <h2>Review</h2>
      {endOfSection && <p className="review-banner">You have reached the end of this section. You may review your answers while time remains, or click <b>Exit Section</b> to continue.</p>}
      <p className="muted">Click a question to select it, then click <b>Go to Question</b>. Click <b>Return</b> to go back to the question you were on.</p>
      <div className="review-table-wrap">
        <table className="review-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Status</th>
              <th>Marked</th>
            </tr>
          </thead>
          <tbody>
            {sec.questionIds.map((id, i) => {
              const q = idx.get(id)!.q;
              const st = answerStatus(q, sec.responses[id]);
              const label = !sec.seen[id] ? 'Not Seen' : st === 'answered' ? 'Answered' : st === 'incomplete' ? 'Incomplete' : 'Not Answered';
              return (
                <tr key={id} className={(i === sel ? 'sel ' : '') + (i === sec.currentQ ? 'current' : '')} onClick={() => setSel(i)} onDoubleClick={() => onGo(i)}>
                  <td>{i + 1}</td>
                  <td className={`st-${label.replace(' ', '-').toLowerCase()}`}>{label}</td>
                  <td>{sec.marked[id] ? '✔' : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="review-actions">
        <button className="btn" onClick={() => onGo(sel)} data-testid="review-go">Go to Question</button>
        <button className="btn" onClick={onReturn} data-testid="review-return">Return</button>
      </div>
    </div>
  );
}

function HelpDialog({ q, quant, onClose }: { q?: Question; quant: boolean; onClose: () => void }) {
  return (
    <div className="modal-back">
      <div className="modal wide">
        <h3>Help</h3>
        <h4>Testing tools</h4>
        <ul>
          <li><b>Next / Back</b> move one question forward or back within the section.</li>
          <li><b>Mark</b> flags the current question for later; click again to unmark.</li>
          <li><b>Review</b> lists every question in the section with its status (Answered, Not Answered, Incomplete, Not Seen) and marks. Select a question and click <b>Go to Question</b>.</li>
          <li><b>Hide Time / Show Time</b> hides or shows the timer. At 5 minutes remaining the timer flashes and stays visible.</li>
          <li><b>Exit Section</b> ends the section (you cannot return). It also offers <b>Save &amp; Exit Test</b> to resume later.</li>
        </ul>
        {q && (
          <>
            <h4>This question type</h4>
            <p>{helpFor(q)}</p>
          </>
        )}
        {quant && (
          <>
            <h4>Calculator</h4>
            <p>
              The calculator follows the order of operations (parentheses, square roots, × ÷, then + −). √ and ± act immediately on
              the number displayed. It displays up to 8 digits; results above 99,999,999 or division by zero show ERROR (press C).
              MR recalls memory, MC clears it, M+ adds the display to memory. <b>Transfer Display</b> copies the display into a
              single numeric-entry box — check rounding/percent form afterwards.
            </p>
          </>
        )}
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Return to Test</button>
        </div>
      </div>
    </div>
  );
}

function helpFor(q: Question): string {
  switch (q.type) {
    case 'tc': return 'Text Completion: choose one entry for each blank. All blanks must be correct for credit.';
    case 'se': return 'Sentence Equivalence: choose exactly two answers that complete the sentence with the same meaning. Both must be correct for credit.';
    case 'rc-single': return 'Choose one answer.';
    case 'rc-multi': return 'Choose all answers that apply (one, two, or all three). No partial credit.';
    case 'rc-select': return 'Click the sentence in the passage that answers the question.';
    case 'qc': return 'Quantitative Comparison: compare Quantity A and Quantity B.';
    case 'mc-single': return 'Choose one answer.';
    case 'mc-multi': return 'Choose all answers that apply. No partial credit.';
    case 'numeric': return 'Numeric Entry: type an integer or decimal (or a numerator and denominator if there are two boxes). Equivalent forms are accepted; fractions need not be reduced.';
  }
}

export function TestRunner({ attemptId, onExit, onFinished }: { attemptId: string; onExit: () => void; onFinished: () => void }) {
  useStore();
  const a = store.get(attemptId)!;
  const test = getTest(a.testId)!;
  const sec = currentSection(a);
  const [showTime, setShowTime] = useState(true);
  const [dialog, setDialog] = useState<null | 'exit' | 'help'>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [endBanner, setEndBanner] = useState(false);
  const [blink, setBlink] = useState(false);
  const [forcedShow, setForcedShow] = useState(false);
  // Restored mid-section (after closing the tab / Save & Exit): hold the clock until the user clicks Continue.
  const [held, setHeld] = useState(() => a.phase === 'question' || a.phase === 'review');
  const lastTick = useRef(performance.now());

  // block browser Back during the test
  useEffect(() => {
    history.pushState({ test: true }, '');
    const onPop = () => history.pushState({ test: true }, '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // finished
  useEffect(() => {
    if (a.status === 'completed') onFinished();
  }, [a.status, onFinished]);

  // clock
  useEffect(() => {
    lastTick.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      const cur = store.get(attemptId);
      if (!cur || held) return;
      const s = currentSection(cur);
      if (!s || s.status !== 'in-progress' || (cur.phase !== 'question' && cur.phase !== 'review')) return;
      if (dt > SLEEP_GAP_MS) {
        store.update(attemptId, (x) => {
          x.suspensions.push({ at: Date.now() - dt, section: s.key, remainingMs: s.remainingMs, reason: 'sleep-gap', gapMs: Math.round(dt), resumedAt: Date.now() });
        }, { remoteNow: true });
        return;
      }
      const before = Math.ceil(s.remainingMs / 1000);
      let expired = false;
      store.update(attemptId, (x) => {
        expired = tick(x, dt);
      }, { silent: true, remoteNow: false });
      const after = Math.ceil((currentSection(store.get(attemptId)!)?.remainingMs ?? 0) / 1000);
      if (expired) {
        store.flush(attemptId);
        store.emit();
      } else if (before !== after) {
        if (before > 300 && after <= 300) {
          setBlink(true);
          setForcedShow(true);
          setTimeout(() => setBlink(false), 5000);
        }
        store.emit();
      }
    }, 250);
    return () => clearInterval(id);
  }, [attemptId, held]);

  // close the calculator when the section changes
  useEffect(() => {
    setCalcOpen(false);
    setEndBanner(false);
  }, [a.sectionIdx]);

  const idx = indexOf(test);
  const qid = sec?.questionIds[sec.currentQ];
  const info = qid ? idx.get(qid) : undefined;
  const note = useMemo(() => (sec && info ? groupNote(test, sec, sec.currentQ) : undefined), [test, sec, info]);

  if (!sec) return null;
  const quant = measureOf(sec.key) === 'quant';
  const inQuestion = a.phase === 'question';
  const timerVisible = (showTime || forcedShow) && (a.phase === 'question' || a.phase === 'review');
  const n = sec.questionIds.length;

  const update = (fn: (x: Attempt) => void, remoteNow = false) => store.update(attemptId, fn, { remoteNow });

  const next = () => {
    if (sec.currentQ + 1 >= n) {
      setEndBanner(true);
      update((x) => (x.phase = 'review'));
    } else update((x) => goTo(x, sec.currentQ + 1));
  };
  const back = () => update((x) => goTo(x, sec.currentQ - 1));

  const continueToNext = () => {
    update((x) => {
      moveToNextSection(x);
      ensureSection(x, test);
    }, true);
  };

  const transferTarget =
    inQuestion && info?.q.type === 'numeric' && info.q.answer.kind === 'decimal'
      ? (v: string) => update((x) => setResponse(x, info.q.id, { kind: 'numeric', text: v }))
      : undefined;

  return (
    <div className="ets">
      <header className="ets-top">
        <div className="ets-brand">GRE® Practice — {test.name}</div>
        <div className="ets-buttons">
          {quant && (
            <button className="tb" disabled={!inQuestion && a.phase !== 'review'} onClick={() => setCalcOpen((v) => !v)} data-testid="tb-calc">
              Calculator
            </button>
          )}
          <button className="tb" disabled={!inQuestion && a.phase !== 'review'} onClick={() => setDialog('exit')} data-testid="tb-exit">
            Exit Section
          </button>
          <button className="tb" disabled={!inQuestion} onClick={() => { setEndBanner(false); update((x) => (x.phase = 'review')); }} data-testid="tb-review">
            Review
          </button>
          <button className={`tb ${qid && sec.marked[qid] ? 'tb-on' : ''}`} disabled={!inQuestion} onClick={() => update(toggleMark)} data-testid="tb-mark">
            {qid && sec.marked[qid] ? 'Marked' : 'Mark'}
          </button>
          <button className="tb" disabled={a.phase !== 'question' && a.phase !== 'review' && a.phase !== 'intro'} onClick={() => setDialog('help')}>
            Help
          </button>
          <button className="tb" disabled={!inQuestion || sec.currentQ === 0} onClick={back} data-testid="tb-back">
            Back
          </button>
          <button className="tb" disabled={!inQuestion} onClick={next} data-testid="tb-next">
            Next
          </button>
        </div>
      </header>
      <div className="ets-sub">
        <div>
          {(a.phase === 'question' || a.phase === 'review') && (
            <>
              Section {a.sectionIdx + 1} of {a.order.length} | {a.phase === 'review' ? 'Review' : `Question ${sec.currentQ + 1} of ${n}`}
            </>
          )}
        </div>
        <div className="timer-area">
          {timerVisible && (
            <span className={`timer ${blink ? 'blink' : ''}`} data-testid="timer">
              {fmtClock(sec.remainingMs)}
            </span>
          )}
          {(a.phase === 'question' || a.phase === 'review') && (
            <button className="link-btn" onClick={() => setShowTime((v) => !v)} disabled={forcedShow}>
              {showTime || forcedShow ? 'Hide Time' : 'Show Time'}
            </button>
          )}
        </div>
      </div>

      <main className="ets-body">
        {a.phase === 'intro' && <SectionIntro a={a} sec={sec} onContinue={() => update((x) => startSection(x, test), true)} />}
        {a.phase === 'timeup' && (
          <div className="intro">
            <h2>Time has expired for this section.</h2>
            <p>Your answers for this section have been saved. Click Continue to go on.</p>
            <button className="btn-primary" onClick={continueToNext} data-testid="timeup-continue">Continue</button>
          </div>
        )}
        {a.phase === 'review' && (
          <ReviewScreen
            key={`${a.sectionIdx}-${endBanner}`}
            test={test}
            sec={sec}
            endOfSection={endBanner}
            onGo={(i) => update((x) => goTo(x, i))}
            onReturn={() => update((x) => (x.phase = 'question'))}
          />
        )}
        {a.phase === 'question' && info && (
          <QuestionView
            key={info.q.id}
            q={info.q}
            passage={info.passage}
            dataSet={info.dataSet}
            groupNote={note}
            response={sec.responses[info.q.id]}
            onChange={(r) => update((x) => setResponse(x, info.q.id, r))}
          />
        )}
      </main>

      {quant && calcOpen && (a.phase === 'question' || a.phase === 'review') && (
        <Calculator
          state={sec.calc as CalcState | undefined}
          onState={(s) => update((x) => (currentSection(x)!.calc = s))}
          onClose={() => setCalcOpen(false)}
          onTransfer={transferTarget}
        />
      )}

      {dialog === 'exit' && (
        <div className="modal-back">
          <div className="modal">
            <h3>Exit Section?</h3>
            <p>If you exit this section, you will <b>not</b> be able to return to it.</p>
            <p className="muted">Need to step away? <b>Save &amp; Exit Test</b> saves everything (including time remaining) so you can resume later from the home screen.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setDialog(null)} data-testid="exit-return">Return</button>
              <button
                className="btn"
                data-testid="exit-save"
                onClick={() => {
                  update((x) => {
                    const s = currentSection(x)!;
                    x.suspensions.push({ at: Date.now(), section: s.key, remainingMs: s.remainingMs, reason: 'save-exit' });
                  }, true);
                  setDialog(null);
                  onExit();
                }}
              >
                Save &amp; Exit Test
              </button>
              <button
                className="btn-primary"
                data-testid="exit-confirm"
                onClick={() => {
                  setDialog(null);
                  update((x) => {
                    endSection(x, 'exit');
                    ensureSection(x, test);
                  }, true);
                }}
              >
                Exit Section
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog === 'help' && <HelpDialog q={inQuestion ? info?.q : undefined} quant={quant} onClose={() => setDialog(null)} />}

      {held && (
        <div className="modal-back">
          <div className="modal">
            <h3>Test restored</h3>
            <p>
              Section {a.sectionIdx + 1} of {a.order.length} ({MEASURE_NAME[sec.measure]}) — {a.phase === 'review' ? 'Review screen' : `Question ${sec.currentQ + 1}`} — <b>{fmtClock(sec.remainingMs)}</b> remaining.
            </p>
            <p className="muted">The clock was stopped while you were away. It starts again when you click Continue.</p>
            <div className="modal-actions">
              <button className="btn" onClick={onExit}>Back to Home</button>
              <button
                className="btn-primary"
                data-testid="resume-continue"
                onClick={() => {
                  update((x) => {
                    const last = x.suspensions[x.suspensions.length - 1];
                    const s = currentSection(x)!;
                    if (last && last.reason === 'save-exit' && !last.resumedAt) last.resumedAt = Date.now();
                    else x.suspensions.push({ at: x.updatedAt, section: s.key, remainingMs: s.remainingMs, reason: 'closed', resumedAt: Date.now() });
                  }, true);
                  lastTick.current = performance.now();
                  setHeld(false);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
