import { describe, expect, test } from 'vitest';
import { run, num, press, initialCalc, formatValue, transferValue, type CalcKey } from '../src/calculator/calcEngine.ts';

const k = (...parts: (string | CalcKey)[]): CalcKey[] =>
  parts.flatMap((p) => (/^-?\d+(\.\d+)?$/.test(p) ? num(p) : [p as CalcKey]));

describe('ETS guideline examples', () => {
  test('order of operations: 1+2x4= is 9', () => {
    expect(run(k('1', '+', '2', '*', '4', '=')).display).toBe('9.');
  });
  test('4 + 6.73 / 2 = 7.365', () => {
    expect(run(k('4', '+', '6.73', '/', '2', '=')).display).toBe('7.365');
  });
  test('6.73/2= then +4= is 7.365', () => {
    const s = run(k('6.73', '/', '2', '='));
    expect(s.display).toBe('3.365');
    expect(run(k('+', '4', '='), s).display).toBe('7.365');
  });
  test('(8.4+9.3)/70=± is -0.2528571', () => {
    expect(run(k('(', '8.4', '+', '9.3', ')', '/', '70', '=', 'neg')).display).toBe('-0.2528571');
  });
  test('8.4+9.3=/70=± is -0.2528571', () => {
    expect(run(k('8.4', '+', '9.3', '=', '/', '70', '=', 'neg')).display).toBe('-0.2528571');
  });
  test('without the first =, 8.4+9.3/70=± computes -(8.4 + 9.3/70)', () => {
    expect(run(k('8.4', '+', '9.3', '/', '70', '=', 'neg')).shown).toBeCloseTo(-(8.4 + 9.3 / 70), 6);
  });
  test('21x21+54x54= sqrt is 57.939624', () => {
    expect(run(k('21', '*', '21', '+', '54', '*', '54', '=', 'sqrt')).display).toBe('57.939624');
  });
  test('21x21+54x54 sqrt = computes 21^2 + 54*sqrt(54)', () => {
    expect(run(k('21', '*', '21', '+', '54', '*', '54', 'sqrt', '=')).shown).toBeCloseTo(441 + 54 * Math.sqrt(54), 4);
  });
  test('(21x21)+(54x54)= sqrt also works', () => {
    expect(run(k('(', '21', '*', '21', ')', '+', '(', '54', '*', '54', ')', '=', 'sqrt')).display).toBe('57.939624');
  });
  test('15±x15±x15±= is -3375', () => {
    expect(run(k('15', 'neg', '*', '15', 'neg', '*', '15', 'neg', '=')).display).toBe('-3375.');
  });
  test('6x5280/3600= is 8.8', () => {
    expect(run(k('6', '*', '5280', '/', '3600', '=')).display).toBe('8.8');
  });
  test('6x5280= then /3600= is 8.8', () => {
    const s = run(k('6', '*', '5280', '='));
    expect(s.display).toBe('31680.');
    expect(run(k('/', '3600', '='), s).display).toBe('8.8');
  });
  test('memory example: weighted mean is 73.25, MR shows 5860', () => {
    let s = run(k('43', '*', '60', '=', 'M+', '21', '*', '80', '=', 'M+', '16', '*', '100', '=', 'M+'));
    expect(s.memory).toBe(5860);
    s = press(s, 'MR');
    expect(s.display).toBe('5860.');
    s = run(k('/', '(', '43', '+', '21', '+', '16', ')', '='), s);
    expect(s.display).toBe('73.25');
  });
  test('MC clears memory (M indicator off)', () => {
    const s = run(k('5', 'M+', 'MC'));
    expect(s.memory).toBeNull();
  });
});

describe('errors and limits', () => {
  test('10,000,000 x 10 = ERROR', () => {
    expect(run(k('10000000', '*', '10', '=')).display).toBe('ERROR');
  });
  test('6 / 0 = ERROR', () => {
    expect(run(k('6', '/', '0', '=')).display).toBe('ERROR');
  });
  test('1 ± sqrt = ERROR', () => {
    expect(run(k('1', 'neg', 'sqrt')).display).toBe('ERROR');
  });
  test('ERROR ignores everything except C', () => {
    let s = run(k('6', '/', '0', '='));
    s = run(k('5', '+', 'CE', 'MR', '='), s);
    expect(s.display).toBe('ERROR');
    s = press(s, 'C');
    expect(s.display).toBe('0.');
    expect(s.error).toBe(false);
  });
  test('tiny positive results display as 0', () => {
    expect(run(k('1', '/', '10000000', '/', '10', '=')).display).toBe('0.');
    expect(run(k('1', '/', '10000000', '=')).display).toBe('0.0000001');
  });
  test('typing is limited to 8 digits', () => {
    expect(run(k('123456789')).display).toBe('12345678.');
  });
  test('C keeps memory', () => {
    const s = run(k('7', 'M+', 'C'));
    expect(s.memory).toBe(7);
    expect(s.display).toBe('0.');
  });
});

describe('behaviour details', () => {
  test('operator shows reducible partial result: 2x3+ shows 6', () => {
    expect(run(k('2', '*', '3', '+')).display).toBe('6.');
  });
  test('consecutive operators replace the previous one', () => {
    expect(run(k('8', '+', '*', '2', '=')).display).toBe('16.');
  });
  test('digit after = starts a new calculation', () => {
    expect(run(k('2', '+', '3', '=', '4', '+', '1', '=')).display).toBe('5.');
  });
  test('operator after = continues from result', () => {
    expect(run(k('2', '+', '3', '=', '*', '2', '=')).display).toBe('10.');
  });
  test('CE clears only current entry', () => {
    expect(run(k('5', '+', '9', 'CE', '3', '=')).display).toBe('8.');
  });
  test('unclosed parenthesis is closed by =', () => {
    expect(run(k('2', '*', '(', '3', '+', '4', '=')).display).toBe('14.');
  });
  test('rounds to 8 significant display digits', () => {
    expect(run(k('2', '/', '3', '=')).display).toBe('0.6666667');
    expect(run(k('200', '/', '3', '=')).display).toBe('66.666667');
  });
  test('decimal entry shows as typed', () => {
    expect(run(k('0', '.', '5', '0')).display).toBe('0.50');
  });
  test('transfer value drops trailing point', () => {
    expect(transferValue(run(k('3375')))).toBe('3375');
    expect(transferValue(run(k('2', '/', '8', '=')))).toBe('0.25');
    expect(transferValue(run(k('6', '/', '0', '=')))).toBe('');
  });
  test('formatValue', () => {
    expect(formatValue(0)).toBe('0.');
    expect(formatValue(-3375)).toBe('-3375.');
    expect(formatValue(99999999)).toBe('99999999.');
    expect(formatValue(1234.56789)).toBe('1234.5679');
  });
  test('initial display is 0.', () => {
    expect(initialCalc().display).toBe('0.');
  });
});
