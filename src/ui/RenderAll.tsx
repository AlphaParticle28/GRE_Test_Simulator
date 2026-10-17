// Dev-only verification page: renders every question of a test with answers shown (?demo&renderall=t3).
import { getTest } from '../content/registry.ts';
import { setsOf } from '../content/index.ts';
import { QuestionView } from './questions/QuestionView.tsx';
import { RichText } from './RichText.tsx';
import { correctResponse } from '../engine/grading.ts';

export function RenderAll({ testId }: { testId: string }) {
  const test = getTest(testId);
  if (!test) return <div className="page">Unknown test {testId}</div>;
  return (
    <div className="page renderall">
      <h1>Render check — {test.name}</h1>
      {setsOf(test).map((set) => (
        <div key={`${set.measure}-${set.key}`}>
          <h2>
            {set.measure} {set.key}
          </h2>
          {set.questions.map((q) => {
            const passage = 'passageId' in q ? set.passages.find((p) => p.id === q.passageId) : undefined;
            const dataSet = 'dataSetId' in q && q.dataSetId ? set.dataSets.find((d) => d.id === q.dataSetId) : undefined;
            const hasFig = ('figure' in q && !!q.figure) || !!dataSet;
            return (
              <div key={q.id} className={`card rq ${hasFig ? 'has-fig' : ''}`} data-qid={q.id}>
                <div className="muted small">
                  {q.id} · {q.type} · d{q.difficulty} · {q.topic}
                </div>
                <div className="rp-question">
                  <QuestionView q={q} passage={passage} dataSet={dataSet} response={correctResponse(q)} review={{ show: true }} />
                </div>
                <RichText as="div" className="explanation small" text={q.explanation} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
