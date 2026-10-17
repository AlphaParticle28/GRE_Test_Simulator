// ETS-style GRE on-screen calculator as a pure, serializable state machine.
// Spec: ETS "GRE Guidelines to Using the On-screen Calculator" (see PLAN.md §5).
//  - respects order of operations; parentheses; sqrt and ± act immediately on the displayed number
//  - 8-digit display; |result| > 99,999,999 -> ERROR; positive results < 1e-7 display as 0
//  - ERROR on divide by zero / sqrt of negative; only C clears ERROR
//  - one memory location: MR, MC, M+ ("M" indicator while memory is in use)

export type Op = '+' | '-' | '*' | '/';
export type CalcKey =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | Op | '(' | ')' | '=' | 'sqrt' | 'neg' | 'C' | 'CE' | 'MR' | 'MC' | 'M+';

export interface CalcState {
  vals: number[];
  ops: (Op | '(')[];
  /** Digits being typed (string), or null when not typing. */
  entry: string | null;
  /** A computed operand (result of =, ), sqrt, MR, ±) waiting to be used, or null. */
  operand: number | null;
  /** Numeric value currently shown. */
  shown: number;
  display: string;
  error: boolean;
  memory: number | null;
  /** True right after '=': typing a digit starts a brand-new calculation. */
  fresh: boolean;
}

const MAX = 99_999_999;
const MAX_DIGITS = 8;

export function initialCalc(): CalcState {
  return { vals: [], ops: [], entry: null, operand: null, shown: 0, display: '0.', error: false, memory: null, fresh: false };
}

const prec = (op: Op | '('): number => (op === '+' || op === '-' ? 1 : op === '*' || op === '/' ? 2 : 0);
const digitCount = (s: string) => s.replace(/[^0-9]/g, '').length;

/** Format a computed value for the 8-digit display (integers get a trailing point, like "0."). */
export function formatValue(v: number): string {
  if (v === 0) return '0.';
  const neg = v < 0;
  const a = Math.abs(v);
  const intDigits = Math.floor(a).toString().length;
  const dec = Math.max(0, MAX_DIGITS - intDigits);
  let s = (a + a * 1e-15).toFixed(dec);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s === '0') return '0.';
  return (neg ? '-' : '') + s + (s.includes('.') ? '' : '.');
}

function formatEntry(entry: string): string {
  return entry.includes('.') ? entry : entry + '.';
}

/** Value to put into a numeric-entry box (no trailing point). Empty string if ERROR. */
export function transferValue(s: CalcState): string {
  if (s.error) return '';
  return s.display.endsWith('.') ? s.display.slice(0, -1) : s.display;
}

function toError(s: CalcState): CalcState {
  return { ...s, vals: [], ops: [], entry: null, operand: null, shown: 0, display: 'ERROR', error: true, fresh: false };
}

/** Validates a computed value. Returns null if it must become ERROR. */
function checked(v: number): number | null {
  if (!Number.isFinite(v) || Math.abs(v) > MAX) return null;
  if (Math.abs(v) < 1e-7) return 0;
  return v;
}

function currentOperand(s: CalcState): number | null {
  if (s.entry !== null) return parseFloat(s.entry);
  return s.operand;
}

function show(s: CalcState, v: number): CalcState {
  return { ...s, shown: v, display: formatValue(v) };
}

/** Apply the top operator. Returns null on error. */
function applyTop(vals: number[], ops: (Op | '(')[]): boolean {
  const op = ops.pop() as Op;
  const b = vals.pop();
  const a = vals.pop();
  if (a === undefined || b === undefined) return true; // nothing to do (defensive)
  if (op === '/' && b === 0) return false;
  const raw = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
  const v = checked(raw);
  if (v === null) return false;
  vals.push(v);
  return true;
}

export function press(state: CalcState, key: CalcKey): CalcState {
  let s: CalcState = { ...state, vals: [...state.vals], ops: [...state.ops] };
  if (s.error && key !== 'C') return state;

  switch (key) {
    case 'C':
      return { ...initialCalc(), memory: s.memory };

    case 'CE': {
      if (s.fresh) s = { ...s, vals: [], ops: [], fresh: false };
      return { ...s, entry: '0', operand: null, shown: 0, display: '0.' };
    }

    case '.':
    case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
      if (s.fresh) s = { ...s, vals: [], ops: [], fresh: false };
      let entry = s.entry;
      if (entry === null) {
        s.operand = null;
        entry = key === '.' ? '0.' : key;
      } else if (key === '.') {
        if (!entry.includes('.')) entry += '.';
      } else if (entry === '0') entry = key;
      else if (entry === '-0') entry = '-' + key;
      else if (digitCount(entry) < MAX_DIGITS) entry += key;
      return { ...s, entry, shown: parseFloat(entry), display: formatEntry(entry) };
    }

    case '+': case '-': case '*': case '/': {
      s.fresh = false;
      const v = currentOperand(s);
      if (v !== null) {
        s.vals.push(v);
        s.entry = null;
        s.operand = null;
        while (s.ops.length && s.ops[s.ops.length - 1] !== '(' && prec(s.ops[s.ops.length - 1]) >= prec(key)) {
          if (!applyTop(s.vals, s.ops)) return toError(s);
        }
        s.ops.push(key);
        return show(s, s.vals[s.vals.length - 1]);
      }
      const top = s.ops[s.ops.length - 1];
      if (top && top !== '(') {
        s.ops[s.ops.length - 1] = key; // replace the pending operator
        return s;
      }
      if (!top && s.vals.length === 0) {
        s.vals.push(s.shown);
        s.ops.push(key);
        return s;
      }
      return state; // e.g. operator right after "(" — ignored
    }

    case '(': {
      if (s.fresh) s = { ...s, vals: [], ops: [], operand: null, fresh: false };
      if (currentOperand(s) !== null) return state; // no implicit multiplication
      s.ops.push('(');
      return s;
    }

    case ')': {
      if (!s.ops.includes('(')) return state;
      const v = currentOperand(s);
      if (v === null) return state;
      s.vals.push(v);
      s.entry = null;
      s.operand = null;
      while (s.ops.length && s.ops[s.ops.length - 1] !== '(') {
        if (!applyTop(s.vals, s.ops)) return toError(s);
      }
      s.ops.pop(); // remove '('
      const r = s.vals.pop()!;
      s.operand = r;
      return show(s, r);
    }

    case '=': {
      const v = currentOperand(s);
      if (v !== null) {
        s.vals.push(v);
      } else {
        const top = s.ops[s.ops.length - 1];
        if (top && top !== '(') s.ops.pop(); // drop a dangling operator
      }
      s.entry = null;
      s.operand = null;
      while (s.ops.length) {
        if (s.ops[s.ops.length - 1] === '(') {
          s.ops.pop();
          continue;
        }
        if (!applyTop(s.vals, s.ops)) return toError(s);
      }
      const result = s.vals.length ? s.vals[s.vals.length - 1] : s.shown;
      return show({ ...s, vals: [], ops: [], operand: result, fresh: true }, result);
    }

    case 'sqrt': {
      const v = currentOperand(s) ?? s.shown;
      if (v < 0) return toError(s);
      const r = checked(Math.sqrt(v));
      if (r === null) return toError(s);
      return show({ ...s, entry: null, operand: r }, r);
    }

    case 'neg': {
      if (s.entry !== null) {
        const entry = s.entry.startsWith('-') ? s.entry.slice(1) : '-' + s.entry;
        return { ...s, entry, shown: parseFloat(entry), display: formatEntry(entry) };
      }
      const v = -(currentOperand(s) ?? s.shown);
      return show({ ...s, operand: v === 0 ? 0 : v }, v === 0 ? 0 : v);
    }

    case 'MR': {
      if (s.fresh) s = { ...s, vals: [], ops: [], fresh: false };
      const m = s.memory ?? 0;
      return show({ ...s, entry: null, operand: m }, m);
    }

    case 'MC':
      return { ...s, memory: null };

    case 'M+': {
      const v = s.shown;
      const m = checked((s.memory ?? 0) + v);
      if (m === null) return toError(s);
      // the displayed number stays usable as an operand, but typing starts a new number
      const operand = currentOperand(s);
      return { ...s, memory: m, entry: null, operand: operand ?? s.operand };
    }
  }
}

/** Convenience for tests: press a sequence of keys. */
export function run(keys: CalcKey[], from: CalcState = initialCalc()): CalcState {
  return keys.reduce(press, from);
}

/** Split a typed number like "8.4" into digit keys. */
export function num(n: string): CalcKey[] {
  return n.split('') as CalcKey[];
}
