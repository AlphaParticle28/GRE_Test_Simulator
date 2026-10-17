// Zero-dependency local server for the GRE simulator.
//  - serves dist/ (the built site)       http://127.0.0.1:PORT   (bound to 127.0.0.1 only: not reachable from the network)
//  - GET    /api/attempts                list saved attempts
//  - PUT    /api/attempts/:id            save one attempt (atomic write)
//  - DELETE /api/attempts/:id            delete one attempt
// Env: PORT (default 5173), DATA_DIR (default ./data), DIST_DIR (default ./dist)
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 5173);
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const DIST_DIR = path.resolve(ROOT, process.env.DIST_DIR || 'dist');
const ATTEMPTS = path.join(DATA_DIR, 'attempts');
fs.mkdirSync(ATTEMPTS, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

async function readBody(req, limit = 20 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new Error('body too large');
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api','attempts',id?]
  if (parts[1] !== 'attempts') return send(res, 404, '{"error":"not found"}');
  const id = parts[2] ? decodeURIComponent(parts[2]) : undefined;

  if (req.method === 'GET' && !id) {
    const files = (await fsp.readdir(ATTEMPTS)).filter((f) => f.endsWith('.json'));
    const out = [];
    for (const f of files) {
      try {
        out.push(JSON.parse(await fsp.readFile(path.join(ATTEMPTS, f), 'utf8')));
      } catch {
        /* skip unreadable file */
      }
    }
    return send(res, 200, JSON.stringify(out));
  }
  if (!id || !ID_RE.test(id)) return send(res, 400, '{"error":"bad id"}');
  const file = path.join(ATTEMPTS, `${id}.json`);

  if (req.method === 'PUT') {
    const body = await readBody(req);
    const obj = JSON.parse(body);
    if (obj.id !== id) return send(res, 400, '{"error":"id mismatch"}');
    // keep the newer copy if the disk already has a more recent one
    try {
      const cur = JSON.parse(await fsp.readFile(file, 'utf8'));
      if ((cur.updatedAt ?? 0) > (obj.updatedAt ?? 0)) return send(res, 200, '{"ok":true,"kept":"newer-on-disk"}');
    } catch {
      /* no existing file */
    }
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(obj));
    await fsp.rename(tmp, file);
    return send(res, 200, '{"ok":true}');
  }
  if (req.method === 'DELETE') {
    await fsp.rm(file, { force: true });
    return send(res, 200, '{"ok":true}');
  }
  return send(res, 405, '{"error":"method not allowed"}');
}

async function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || !path.extname(rel)) rel = '/index.html';
  const file = path.resolve(DIST_DIR, '.' + rel);
  if (!file.startsWith(DIST_DIR)) return send(res, 403, 'forbidden', 'text/plain');
  try {
    const data = await fsp.readFile(file);
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': rel === '/index.html' ? 'no-store' : 'public, max-age=31536000, immutable' });
    res.end(data);
  } catch {
    if (rel === '/index.html') return send(res, 503, '<h2>Site is being built — refresh in a few seconds.</h2>', 'text/html; charset=utf-8');
    send(res, 404, 'not found', 'text/plain');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  try {
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else await serveStatic(req, res, url);
  } catch (e) {
    send(res, 500, JSON.stringify({ error: String(e && e.message) }));
  }
});

const URL_TO_OPEN = `http://127.0.0.1:${PORT}/`;

function openBrowser() {
  if (!process.argv.includes('--open') || process.env.NO_OPEN || process.platform !== 'win32') return;
  const chromes = [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];
  const chrome = chromes.find((p) => p && fs.existsSync(p));
  if (chrome) spawn(chrome, [URL_TO_OPEN], { detached: true, stdio: 'ignore' }).unref();
  else spawn('cmd', ['/c', 'start', '', URL_TO_OPEN], { detached: true, stdio: 'ignore' }).unref();
}

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use — the simulator is probably already running in another window.`);
    console.error(`Opening ${URL_TO_OPEN} ...\n`);
    openBrowser();
    setTimeout(() => process.exit(0), 500);
    return;
  }
  throw e;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`GRE simulator running at ${URL_TO_OPEN}  (data: ${path.relative(ROOT, DATA_DIR) || '.'})`);
  console.log('Keep this window open while you use the simulator. Close it to stop the server.');
  openBrowser();
});
