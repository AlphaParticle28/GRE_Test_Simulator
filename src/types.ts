// ============================================================================
// Shared schemas: content (questions/passages/data sets) + attempt state.
// Content files in src/content/tN/*.ts must conform to these types.
// ============================================================================

export type Measure = 'verbal' | 'quant';
export type Tier = 'easy' | 'medium' | 'hard';
export const TIERS: Tier[] = ['easy', 'medium', 'hard'];
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type SetKey = 's1' | 's2-easy' | 's2-medium' | 's2-hard';
export const SET_KEYS: SetKey[] = ['s1', 's2-easy', 's2-medium', 's2-hard'];

// ---------------------------------------------------------------------------
// Controlled vocabularies (the error log groups by these)
// ---------------------------------------------------------------------------
export const QUANT_TOPICS = [
  'arith.integers', 'arith.exponents-roots', 'arith.fractions-decimals', 'arith.percents', 'arith.ratios-rates',
  'alg.linear', 'alg.quadratics', 'alg.inequalities-abs', 'alg.functions', 'alg.coordinate', 'alg.sequences', 'alg.word-problems',
  'geo.lines-angles', 'geo.triangles', 'geo.polygons', 'geo.circles', 'geo.solids',
  'data.statistics', 'data.probability', 'data.combinatorics', 'data.distributions', 'data.interpretation',
] as const;

export const VERBAL_TOPICS = [
  'tc.1blank', 'tc.2blank', 'tc.3blank', 'se',
  'rc.main-idea', 'rc.detail', 'rc.inference', 'rc.function', 'rc.vocab-in-context', 'rc.attitude', 'rc.structure', 'rc.select-in-passage',
  'cr.strengthen', 'cr.weaken', 'cr.assumption', 'cr.paradox', 'cr.evaluate', 'cr.boldface', 'cr.inference',
] as const;

export type QuantTopic = (typeof QUANT_TOPICS)[number];
export type VerbalTopic = (typeof VERBAL_TOPICS)[number];
export type TopicId = QuantTopic | VerbalTopic;

export const VERBAL_TRAPS = ['reversal', 'too-extreme', 'out-of-scope', 'partial', 'wrong-shade', 'synonym-pair-trap'] as const;
export const QUANT_TRAPS = [
  'calc-slip', 'assumed-integer', 'assumed-positive', 'ignored-constraint', 'misread', 'd-trap', 'unit-error', 'wrong-formula',
] as const;
export type TrapType = (typeof VERBAL_TRAPS)[number] | (typeof QUANT_TRAPS)[number];

/** Why a tempting wrong option is wrong. `option` is the 0-based option index; for TC, `blank` is the 0-based blank index. */
export interface Trap {
  option: number;
  blank?: number;
  trap: TrapType;
  why: string;
}

export interface VocabEntry {
  word: string;
  meaning: string;
}

// ---------------------------------------------------------------------------
// Rich text conventions (rendered by RichText.tsx)
//   $...$          inline KaTeX math (write money as \$ ; thousands in math as 1{,}000 ; percent in math as \%)
//   <b> <i> <u> <sup> <sub> <br>   whitelisted HTML
//   {{1}} {{2}} {{3}}               TC/SE blank placeholders (stems only)
// ---------------------------------------------------------------------------

interface QBase {
  /** e.g. t1-v1-03, t1-v2h-11, t2-q1-07, t3-q2e-15 */
  id: string;
  difficulty: Difficulty;
  topic: TopicId;
  /** Step-by-step explanation shown in the error log. */
  explanation: string;
  /** Tempting wrong options and why they are wrong. */
  traps?: Trap[];
}

// ----------------------------- Verbal --------------------------------------

/** Text completion. stem contains {{1}} (and {{2}}, {{3}}). 1 blank: 5 choices; 2-3 blanks: 3 choices each. */
export interface TCQuestion extends QBase {
  type: 'tc';
  stem: string;
  blanks: string[][];
  /** 0-based index of the correct choice for each blank. */
  answer: number[];
  vocab?: VocabEntry[];
}

/** Sentence equivalence. stem contains {{1}}; exactly 6 options; exactly 2 correct. */
export interface SEQuestion extends QBase {
  type: 'se';
  stem: string;
  options: string[];
  answer: [number, number];
  vocab?: VocabEntry[];
}

/** Location of a sentence in a passage: paragraph index p, sentence index s (both 0-based). */
export interface SentenceRef {
  p: number;
  s: number;
}

/** Reading comprehension single answer (5 options). Also used for critical reasoning (topic cr.*). */
export interface RCSingleQuestion extends QBase {
  type: 'rc-single';
  passageId: string;
  stem: string;
  options: string[];
  answer: number;
  /** Optional sentence to highlight in the passage while this question is shown. */
  highlight?: SentenceRef;
}

/** Reading comprehension "select all that apply" (exactly 3 options, 1-3 correct). */
export interface RCMultiQuestion extends QBase {
  type: 'rc-multi';
  passageId: string;
  stem: string;
  options: string[];
  answer: number[];
}

/** Select-in-passage: click the sentence that ... */
export interface RCSelectQuestion extends QBase {
  type: 'rc-select';
  passageId: string;
  stem: string;
  answer: SentenceRef;
  /** If set, only sentences in this paragraph are selectable. */
  paragraph?: number;
}

// ----------------------------- Quant ---------------------------------------

export interface SvgFigure {
  kind: 'svg';
  svg: string;
  notToScale?: boolean;
}

export type Figure = SvgFigure | ChartSpec;

interface QuantBase extends QBase {
  figure?: Figure;
  /** Data interpretation questions reference a DataSet in the same set file. */
  dataSetId?: string;
  /**
   * REQUIRED for every quant question: independently recomputes the answer.
   * Must return: qc -> 0|1|2|3 ; mc-single -> option index ; mc-multi -> sorted index array ; numeric -> numeric value.
   */
  verify: () => unknown;
}

/** Quantitative comparison. answer: 0 = A greater, 1 = B greater, 2 = equal, 3 = cannot be determined. */
export interface QCQuestion extends QuantBase {
  type: 'qc';
  /** Centered information above the quantities (optional). */
  info?: string;
  quantityA: string;
  quantityB: string;
  answer: 0 | 1 | 2 | 3;
}

/** Multiple choice, select one (5 options). */
export interface MCSingleQuestion extends QuantBase {
  type: 'mc-single';
  stem: string;
  options: string[];
  answer: number;
}

/** Multiple choice, select one or more (3-8 options). */
export interface MCMultiQuestion extends QuantBase {
  type: 'mc-multi';
  stem: string;
  options: string[];
  answer: number[];
  /** If the stem says "Indicate exactly N" */
  exactly?: number;
}

export type NumericAnswer = { kind: 'decimal'; value: number } | { kind: 'fraction'; num: number; den: number };

/** Numeric entry. decimal -> single box; fraction -> numerator/denominator boxes. */
export interface NumericQuestion extends QuantBase {
  type: 'numeric';
  stem: string;
  answer: NumericAnswer;
  /** Label before the box, e.g. "\$" */
  prefix?: string;
  /** Label after the box, e.g. "%" or "cm" */
  suffix?: string;
}

export type VerbalQuestion = TCQuestion | SEQuestion | RCSingleQuestion | RCMultiQuestion | RCSelectQuestion;
export type QuantQuestion = QCQuestion | MCSingleQuestion | MCMultiQuestion | NumericQuestion;
export type Question = VerbalQuestion | QuantQuestion;
export type QType = Question['type'];

// ----------------------------- Shared structures ---------------------------

/** paragraphs[p][s] = sentence s of paragraph p. Sentences are joined with a space when rendered. */
export interface Passage {
  id: string;
  paragraphs: string[][];
}

export interface ChartSeries {
  name: string;
  values: number[];
}

export type ChartSpec =
  | {
      kind: 'bar' | 'line';
      title: string;
      categories: string[];
      series: ChartSeries[];
      xLabel?: string;
      yLabel?: string;
      yMin?: number;
      yMax?: number;
      yStep?: number;
      stacked?: boolean;
      /** Show the numeric value above each bar/point. */
      showValues?: boolean;
    }
  | {
      kind: 'pie';
      title: string;
      slices: { label: string; value: number }[];
      /** 'percent' labels slices as "label: 25%" ; 'raw' as "label: 120" */
      labelMode?: 'percent' | 'raw';
      note?: string;
    }
  | {
      kind: 'table';
      title: string;
      columns: string[];
      rows: (string | number)[][];
      note?: string;
    }
  | {
      kind: 'svg';
      title?: string;
      svg: string;
    };

export interface DataSet {
  id: string;
  /** Optional intro line, e.g. "Questions 9-10 are based on the following data." is added automatically. */
  title?: string;
  charts: ChartSpec[];
}

/** One section's content (S1 or one S2 tier) for one measure of one test. */
export interface QuestionSet {
  testId: string;
  measure: Measure;
  key: SetKey;
  passages: Passage[];
  dataSets: DataSet[];
  questions: Question[];
}

export interface MeasureContent {
  s1: QuestionSet;
  s2: Record<Tier, QuestionSet>;
}

export interface TestDef {
  id: string;
  name: string;
  verbal: MeasureContent;
  quant: MeasureContent;
}

// ============================================================================
// Attempt state
// ============================================================================

export type SectionKey = 'V1' | 'V2' | 'Q1' | 'Q2';

export type Response =
  | { kind: 'choice'; value: number | null }
  | { kind: 'multi'; values: number[] }
  | { kind: 'blanks'; values: (number | null)[] }
  | { kind: 'sentence'; value: SentenceRef | null }
  | { kind: 'numeric'; text: string }
  | { kind: 'fraction'; num: string; den: string };

export interface HistoryEntry {
  /** ms since section start (time used) */
  t: number;
  r: Response;
}

export interface SectionState {
  key: SectionKey;
  measure: Measure;
  part: 1 | 2;
  /** For part 2: tier chosen when the section started. For part 1: undefined. */
  tier?: Tier;
  questionIds: string[];
  status: 'not-started' | 'in-progress' | 'done';
  durationMs: number;
  remainingMs: number;
  endedReason?: 'time' | 'exit';
  currentQ: number;
  responses: Record<string, Response>;
  marked: Record<string, boolean>;
  seen: Record<string, boolean>;
  timeMs: Record<string, number>;
  visits: Record<string, number>;
  history: Record<string, HistoryEntry[]>;
  /** Wall-clock time (ms since section start) at which each question was last answered. */
  answeredAtMs: Record<string, number>;
  /** Calculator state persisted per section (quant only). */
  calc?: unknown;
}

export type AttemptMode = 'full' | 'verbal' | 'quant' | 'bonus';

export interface Suspension {
  at: number;
  section: SectionKey;
  remainingMs: number;
  reason: 'closed' | 'save-exit' | 'sleep-gap';
  gapMs?: number;
  resumedAt?: number;
}

export type Phase = 'intro' | 'question' | 'review' | 'timeup' | 'between' | 'done';

export interface Attempt {
  id: string;
  testId: string;
  mode: AttemptMode;
  /** For bonus mode: which set is being practiced. */
  bonus?: { measure: Measure; tier: Tier };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  order: SectionKey[];
  sectionIdx: number;
  phase: Phase;
  sections: Partial<Record<SectionKey, SectionState>>;
  status: 'in-progress' | 'completed';
  suspensions: Suspension[];
  disputed: string[];
  notes: Record<string, { tag?: string; text?: string }>;
  /** True if the same test had been completed before this attempt. */
  isRetake?: boolean;
}
