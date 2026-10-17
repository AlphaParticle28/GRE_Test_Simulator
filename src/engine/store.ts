// Global app store: attempts (mutated via update()), persisted locally on every change and to disk (throttled).
import { useSyncExternalStore } from 'react';
import type { Attempt } from '../types.ts';
import { loadLocal, loadRemote, mergeAttempts, removeLocal, removeRemote, saveLocal, saveRemote } from './persistence.ts';

const REMOTE_EVERY_MS = 10_000;

class Store {
  attempts = new Map<string, Attempt>();
  version = 0;
  serverOk = false;
  private listeners = new Set<() => void>();
  private lastRemote = new Map<string, number>();
  private pendingRemote = new Map<string, ReturnType<typeof setTimeout>>();

  async init(): Promise<void> {
    const local = loadLocal();
    const remote = await loadRemote();
    this.serverOk = remote !== null;
    for (const a of mergeAttempts(local, remote ?? [])) this.attempts.set(a.id, a);
    // make sure both copies are current
    for (const a of this.attempts.values()) {
      saveLocal(a);
      if (this.serverOk && !(remote ?? []).some((r) => r.id === a.id && r.updatedAt === a.updatedAt)) void saveRemote(a);
    }
    this.emit();
  }

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  getVersion = () => this.version;

  emit(): void {
    this.version++;
    for (const l of this.listeners) l();
  }

  get(id: string): Attempt | undefined {
    return this.attempts.get(id);
  }

  list(): Attempt[] {
    return [...this.attempts.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  add(a: Attempt): void {
    this.attempts.set(a.id, a);
    this.persist(a, true);
    this.emit();
  }

  /** Mutate an attempt. `remoteNow` forces an immediate disk sync (section transitions, completion). */
  update(id: string, fn: (a: Attempt) => void, opts: { remoteNow?: boolean; silent?: boolean } = {}): void {
    const a = this.attempts.get(id);
    if (!a) return;
    fn(a);
    a.updatedAt = Date.now();
    this.persist(a, !!opts.remoteNow);
    if (!opts.silent) this.emit();
  }

  remove(id: string): void {
    this.attempts.delete(id);
    removeLocal(id);
    void removeRemote(id);
    this.emit();
  }

  /** Replace/insert attempts from an imported backup. */
  importAll(list: Attempt[]): number {
    let n = 0;
    for (const a of list) {
      if (!a?.id || !a.testId) continue;
      const cur = this.attempts.get(a.id);
      if (!cur || a.updatedAt >= cur.updatedAt) {
        this.attempts.set(a.id, a);
        this.persist(a, true);
        n++;
      }
    }
    this.emit();
    return n;
  }

  flush(id: string): void {
    const a = this.attempts.get(id);
    if (a) this.persist(a, true);
  }

  private persist(a: Attempt, remoteNow: boolean): void {
    saveLocal(a);
    const last = this.lastRemote.get(a.id) ?? 0;
    const now = Date.now();
    if (remoteNow || now - last >= REMOTE_EVERY_MS) {
      clearTimeout(this.pendingRemote.get(a.id));
      this.pendingRemote.delete(a.id);
      this.lastRemote.set(a.id, now);
      void saveRemote(a).then((ok) => {
        if (ok !== this.serverOk) {
          this.serverOk = ok;
          this.emit();
        }
      });
    } else if (!this.pendingRemote.has(a.id)) {
      this.pendingRemote.set(
        a.id,
        setTimeout(() => {
          this.pendingRemote.delete(a.id);
          const cur = this.attempts.get(a.id);
          if (cur) this.persist(cur, true);
        }, REMOTE_EVERY_MS - (now - last)),
      );
    }
  }
}

export const store = new Store();

export function useStore(): number {
  return useSyncExternalStore(store.subscribe, store.getVersion);
}
