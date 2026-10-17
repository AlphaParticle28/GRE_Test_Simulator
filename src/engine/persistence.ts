// Attempts are saved to localStorage (instant) and mirrored to disk via the local server (data/attempts/*.json).
import type { Attempt } from '../types.ts';

const PREFIX = 'gre-sim:attempt:';

export function saveLocal(a: Attempt): void {
  try {
    localStorage.setItem(PREFIX + a.id, JSON.stringify(a));
  } catch {
    /* storage unavailable or full — the disk copy still exists */
  }
}

export function loadLocal(): Attempt[] {
  const out: Attempt[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      try {
        out.push(JSON.parse(localStorage.getItem(k)!));
      } catch {
        /* skip corrupt entry */
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

export function removeLocal(id: string): void {
  try {
    localStorage.removeItem(PREFIX + id);
  } catch {
    /* ignore */
  }
}

export async function saveRemote(a: Attempt): Promise<boolean> {
  try {
    const body = JSON.stringify(a);
    const res = await fetch(`/api/attempts/${encodeURIComponent(a.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
      // Chrome rejects keepalive requests with bodies over 64 KB, so only use it for small payloads
      keepalive: body.length < 60_000,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadRemote(): Promise<Attempt[] | null> {
  try {
    const res = await fetch('/api/attempts');
    if (!res.ok) return null;
    return (await res.json()) as Attempt[];
  } catch {
    return null;
  }
}

export async function removeRemote(id: string): Promise<void> {
  try {
    await fetch(`/api/attempts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    /* ignore */
  }
}

/** Newer copy (by updatedAt) wins. */
export function mergeAttempts(local: Attempt[], remote: Attempt[]): Attempt[] {
  const m = new Map<string, Attempt>();
  for (const a of [...remote, ...local]) {
    const cur = m.get(a.id);
    if (!cur || (a.updatedAt ?? 0) >= (cur.updatedAt ?? 0)) m.set(a.id, a);
  }
  return [...m.values()];
}
