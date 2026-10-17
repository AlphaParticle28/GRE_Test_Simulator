// Build into dist-next/, then swap it into dist/ so a running site never serves a half-built folder.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(ROOT, 'dist');
const next = path.join(ROOT, 'dist-next');
const old = path.join(ROOT, 'dist-old');

execFileSync(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', 'dist-next', '--emptyOutDir'], {
  cwd: ROOT,
  stdio: 'inherit',
});

function retry(fn, tries = 20) {
  for (let i = 0; ; i++) {
    try {
      return fn();
    } catch (e) {
      if (i >= tries) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
    }
  }
}

fs.rmSync(old, { recursive: true, force: true });
if (fs.existsSync(dist)) retry(() => fs.renameSync(dist, old));
retry(() => fs.renameSync(next, dist));
fs.rmSync(old, { recursive: true, force: true });
console.log('Released: dist/ updated.');
