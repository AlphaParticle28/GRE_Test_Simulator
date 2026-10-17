// Practice tests. A test moves from PENDING to RELEASED only after it passes validation + blind-solve review.
import type { TestDef } from '../types.ts';
import { demoTest } from './demo.ts';
import { test as t1 } from './t1/index.ts';
import { test as t2 } from './t2/index.ts';
import { test as t3 } from './t3/index.ts';

const RELEASED: TestDef[] = [t1, t2, t3];
/** Built but still being verified: visible only in dev builds or with ?demo. */
const PENDING: TestDef[] = [];

export function showDemo(): boolean {
  return import.meta.env.DEV || new URLSearchParams(location.search).has('demo');
}

export function allTests(): TestDef[] {
  return showDemo() ? [...RELEASED, ...PENDING, demoTest] : RELEASED;
}

export function getTest(id: string): TestDef | undefined {
  return [...RELEASED, ...PENDING, demoTest].find((t) => t.id === id);
}
