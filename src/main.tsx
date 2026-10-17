import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import './styles.css';
import { App } from './App.tsx';
import { store } from './engine/store.ts';
import { getTest, showDemo } from './content/registry.ts';
import { indexOf } from './content/index.ts';
import { currentSection, setResponse } from './engine/attempt.ts';
import { correctResponse, wrongResponse } from './engine/grading.ts';

// e2e/dev hook (only with ?demo or in dev builds)
if (showDemo()) {
  (window as unknown as { __gre: unknown }).__gre = {
    store,
    /** Answer every question in the current section correctly (true) or wrongly (false). */
    answerSection(attemptId: string, correct: boolean) {
      const a = store.get(attemptId)!;
      const test = getTest(a.testId)!;
      const idx = indexOf(test);
      store.update(attemptId, (x) => {
        const sec = currentSection(x)!;
        for (const id of sec.questionIds) {
          const q = idx.get(id)!.q;
          setResponse(x, id, correct ? correctResponse(q) : wrongResponse(q));
        }
      });
    },
    setRemaining(attemptId: string, ms: number) {
      store.update(attemptId, (x) => {
        currentSection(x)!.remainingMs = ms;
      });
    },
  };
}

createRoot(document.getElementById('root')!).render(<App />);
