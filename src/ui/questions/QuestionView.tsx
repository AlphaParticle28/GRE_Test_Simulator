import type { ReactNode } from 'react';
import type { Passage, Question, Response, SentenceRef, DataSet } from '../../types.ts';
import { RichText } from '../RichText.tsx';
import { Chart, Figure } from './Chart.tsx';
import { emptyResponse } from '../../engine/grading.ts';

const ROMAN = ['i', 'ii', 'iii'];
const QC_CHOICES = [
  'Quantity A is greater.',
  'Quantity B is greater.',
  'The two quantities are equal.',
  'The relationship cannot be determined from the information given.',
];

export interface ReviewMarks {
  /** show correct answers in green and wrong picks in red */
  show: boolean;
}

interface Props {
  q: Question;
  passage?: Passage;
  dataSet?: DataSet;
  response: Response | undefined;
  onChange?: (r: Response) => void;
  review?: ReviewMarks;
  /** e.g. "Questions 5 to 7 are based on the following passage." */
  groupNote?: string;
}

function optClass(base: string, selected: boolean, isAnswer: boolean, review?: ReviewMarks) {
  let c = base + (selected ? ' selected' : '');
  if (review?.show) {
    if (isAnswer) c += ' key-correct';
    else if (selected) c += ' key-wrong';
  }
  return c;
}

function Choices({ options, multi, selected, answer, onPick, review }: {
  options: string[];
  multi: boolean;
  selected: number[];
  answer: number[];
  onPick?: (i: number) => void;
  review?: ReviewMarks;
}) {
  return (
    <div className="choices">
      {options.map((o, i) => (
        <button
          key={i}
          type="button"
          className={optClass('choice', selected.includes(i), answer.includes(i), review)}
          onClick={onPick ? () => onPick(i) : undefined}
          disabled={!onPick}
          aria-pressed={selected.includes(i)}
        >
          <span className={multi ? 'box' : 'oval'} />
          {review?.show && <span className="choice-letter">{'ABCDEFGHIJ'[i]}</span>}
          <RichText text={o} className="choice-text" />
        </button>
      ))}
    </div>
  );
}

function PassageView({ passage, highlight, selectable, selected, answer, onSelect, review }: {
  passage: Passage;
  highlight?: SentenceRef;
  selectable?: number | 'all';
  selected?: SentenceRef | null;
  answer?: SentenceRef;
  onSelect?: (ref: SentenceRef) => void;
  review?: ReviewMarks;
}) {
  return (
    <div className="passage">
      {passage.paragraphs.map((para, p) => (
        <p key={p}>
          {para.map((s, si) => {
            const canSelect = selectable === 'all' || selectable === p;
            const isSel = selected?.p === p && selected?.s === si;
            const isHl = highlight?.p === p && highlight?.s === si;
            const isAns = review?.show && answer?.p === p && answer?.s === si;
            let cls = 'sentence';
            if (canSelect) cls += ' selectable';
            if (isSel) cls += ' sel';
            if (isHl) cls += ' hl';
            if (isAns) cls += ' key-correct';
            else if (review?.show && isSel) cls += ' key-wrong';
            return (
              <span key={si}>
                <span className={cls} onClick={canSelect && onSelect ? () => onSelect({ p, s: si }) : undefined}>
                  <RichText text={s} />
                </span>{' '}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

function NumericBox({ value, onChange, integerOnly, label }: { value: string; onChange?: (v: string) => void; integerOnly?: boolean; label?: string }) {
  return (
    <input
      className="numeric-box"
      aria-label={label ?? 'answer'}
      value={value}
      readOnly={!onChange}
      maxLength={12}
      onChange={(e) => {
        const v = e.target.value;
        const ok = integerOnly ? /^-?\d*$/.test(v) : /^-?\d*\.?\d*$/.test(v);
        if (ok && onChange) onChange(v);
      }}
      inputMode="decimal"
      autoComplete="off"
    />
  );
}

function Split({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="split">
      <div className="split-left">{left}</div>
      <div className="split-right">{right}</div>
    </div>
  );
}

export function QuestionView({ q, passage, dataSet, response, onChange, review, groupNote }: Props) {
  const r = response ?? emptyResponse(q);
  const ro = !onChange;

  switch (q.type) {
    case 'tc': {
      const vals = r.kind === 'blanks' ? r.values : q.blanks.map(() => null);
      const n = q.blanks.length;
      return (
        <div className="q-single">
          <div className="directions">
            {n === 1
              ? 'For the following question, select one entry for the blank. Fill the blank in the way that best completes the text.'
              : 'For the following question, select one entry for each blank from the corresponding column of choices. Fill all blanks in the way that best completes the text.'}
          </div>
          <RichText as="div" className="stem" text={q.stem} blanks={n} />
          <div className={`tc-columns tc-${n}`}>
            {q.blanks.map((col, b) => (
              <div className="tc-col" key={b}>
                {n > 1 && <div className="tc-head">Blank ({ROMAN[b]})</div>}
                {col.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={ro}
                    className={optClass('tc-cell', vals[b] === i, q.answer[b] === i, review)}
                    onClick={() => {
                      const next = [...vals];
                      next[b] = next[b] === i ? null : i;
                      onChange?.({ kind: 'blanks', values: next });
                    }}
                  >
                    <RichText text={w} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'se': {
      const sel = r.kind === 'multi' ? r.values : [];
      return (
        <div className="q-single">
          <div className="directions">
            For the following question, select the <b>two</b> answer choices that, when used to complete the sentence, fit the
            meaning of the sentence as a whole <b>and</b> produce completed sentences that are alike in meaning.
          </div>
          <RichText as="div" className="stem" text={q.stem} blanks={1} />
          <Choices
            options={q.options}
            multi
            selected={sel}
            answer={q.answer}
            review={review}
            onPick={ro ? undefined : (i) => onChange!({ kind: 'multi', values: sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i].sort((a, b) => a - b) })}
          />
        </div>
      );
    }

    case 'rc-single':
    case 'rc-multi':
    case 'rc-select': {
      const left = (
        <>
          {groupNote && <div className="group-note">{groupNote}</div>}
          {passage && (
            <PassageView
              passage={passage}
              highlight={q.type === 'rc-single' ? q.highlight : undefined}
              selectable={q.type === 'rc-select' ? (q.paragraph ?? 'all') : undefined}
              selected={q.type === 'rc-select' && r.kind === 'sentence' ? r.value : null}
              answer={q.type === 'rc-select' ? q.answer : undefined}
              onSelect={q.type === 'rc-select' && !ro ? (ref) => onChange!({ kind: 'sentence', value: ref }) : undefined}
              review={review}
            />
          )}
        </>
      );
      let right: ReactNode;
      if (q.type === 'rc-select') {
        right = (
          <>
            <RichText as="div" className="stem" text={q.stem} />
            <div className="hint">Click on a sentence in the passage to select it.</div>
          </>
        );
      } else {
        const sel = q.type === 'rc-multi' ? (r.kind === 'multi' ? r.values : []) : r.kind === 'choice' && r.value !== null ? [r.value] : [];
        right = (
          <>
            {q.type === 'rc-single' && <div className="directions small">Select one answer choice.</div>}
            <RichText as="div" className="stem" text={q.stem} />
            <Choices
              options={q.options}
              multi={q.type === 'rc-multi'}
              selected={sel}
              answer={q.type === 'rc-multi' ? q.answer : [q.answer]}
              review={review}
              onPick={
                ro
                  ? undefined
                  : (i) =>
                      q.type === 'rc-multi'
                        ? onChange!({ kind: 'multi', values: sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i].sort((a, b) => a - b) })
                        : onChange!({ kind: 'choice', value: i })
              }
            />
          </>
        );
      }
      return <Split left={left} right={right} />;
    }

    case 'qc': {
      const sel = r.kind === 'choice' && r.value !== null ? [r.value] : [];
      return (
        <div className="q-single">
          <div className="directions">
            Compare Quantity A and Quantity B, using additional information centered above the two quantities if such information
            is given, and select one of the four answer choices below.
          </div>
          {q.info && <RichText as="div" className="qc-info" text={q.info} />}
          {q.figure && <Figure f={q.figure} />}
          <div className="qc-table">
            <div className="qc-col">
              <div className="qc-head">Quantity A</div>
              <RichText as="div" className="qc-cell" text={q.quantityA} />
            </div>
            <div className="qc-col">
              <div className="qc-head">Quantity B</div>
              <RichText as="div" className="qc-cell" text={q.quantityB} />
            </div>
          </div>
          <Choices options={QC_CHOICES} multi={false} selected={sel} answer={[q.answer]} review={review} onPick={ro ? undefined : (i) => onChange!({ kind: 'choice', value: i })} />
        </div>
      );
    }

    case 'mc-single':
    case 'mc-multi':
    case 'numeric': {
      const body = (
        <>
          <RichText as="div" className="stem" text={q.stem} />
          {q.figure && <Figure f={q.figure} />}
          {q.type === 'mc-single' && (
            <Choices
              options={q.options}
              multi={false}
              selected={r.kind === 'choice' && r.value !== null ? [r.value] : []}
              answer={[q.answer]}
              review={review}
              onPick={ro ? undefined : (i) => onChange!({ kind: 'choice', value: i })}
            />
          )}
          {q.type === 'mc-multi' && (() => {
            const sel = r.kind === 'multi' ? r.values : [];
            return (
              <Choices
                options={q.options}
                multi
                selected={sel}
                answer={q.answer}
                review={review}
                onPick={ro ? undefined : (i) => onChange!({ kind: 'multi', values: sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i].sort((a, b) => a - b) })}
              />
            );
          })()}
          {q.type === 'numeric' && (
            <div className="numeric-wrap">
              {q.prefix && <RichText className="numeric-affix" text={q.prefix} />}
              {r.kind === 'fraction' ? (
                <div className="fraction">
                  <NumericBox integerOnly label="numerator" value={r.num} onChange={ro ? undefined : (v) => onChange!({ ...r, num: v })} />
                  <div className="fraction-bar" />
                  <NumericBox integerOnly label="denominator" value={r.den} onChange={ro ? undefined : (v) => onChange!({ ...r, den: v })} />
                </div>
              ) : (
                <NumericBox value={r.kind === 'numeric' ? r.text : ''} onChange={ro ? undefined : (v) => onChange!({ kind: 'numeric', text: v })} />
              )}
              {q.suffix && <RichText className="numeric-affix" text={q.suffix} />}
            </div>
          )}
          {q.type === 'numeric' && review?.show && (
            <div className="key-line">Correct answer: <b>{q.answer.kind === 'decimal' ? q.answer.value : `${q.answer.num}/${q.answer.den}`}</b></div>
          )}
        </>
      );
      if (dataSet) {
        return (
          <Split
            left={
              <>
                {groupNote && <div className="group-note">{groupNote}</div>}
                {dataSet.title && <RichText as="div" className="chart-title" text={dataSet.title} />}
                {dataSet.charts.map((c, i) => <Chart key={i} c={c} />)}
              </>
            }
            right={body}
          />
        );
      }
      return <div className="q-single">{body}</div>;
    }
  }
}
