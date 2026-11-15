// Servidor local de pruebas para Hanaki (sustituye a wrangler, que no arranca en este Mac).
// Sirve una carpeta con URLs limpias y ejecuta el backend real de portfolio/functions
// sobre una base de datos SQLite en memoria (nada sale a la web publicada, ni emails ni Telegram).
//
//   node servidor-local.mjs [carpeta=rediseno-web] [puerto=8791]
//   Panel: /admin/  ·  contraseña local: hanaki
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, process.argv[2] || 'web');
const PUERTO = +(process.argv[3] || 8791);
const FUNCS = process.env.HK_FUNCS || path.join(RAIZ, 'functions');

/* ── D1 sobre node:sqlite ── */
const sql = new DatabaseSync(process.env.HK_DB || ':memory:');
sql.exec(fs.readFileSync(path.join(RAIZ, 'fidelidad', 'schema.sql'), 'utf8'));
const val = (v) => (v === undefined ? null : typeof v === 'boolean' ? +v : v);
class Stmt {
  constructor(q, args = []) { this.q = q; this.args = args; }
  bind(...a) { return new Stmt(this.q, a.map(val)); }
  async first(col) { const r = sql.prepare(this.q).get(...this.args); return r == null ? null : col ? r[col] : { ...r }; }
  async all() { return { success: true, results: sql.prepare(this.q).all(...this.args).map((r) => ({ ...r })) }; }
  async run() { const r = sql.prepare(this.q).run(...this.args); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; }
  _lote() { const s = sql.prepare(this.q); return /^\s*(select|with|pragma)/i.test(this.q) || /\breturning\b/i.test(this.q) ? { success: true, results: s.all(...this.args).map((r) => ({ ...r })) } : (() => { const r = s.run(...this.args); return { success: true, results: [], meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; })(); }
}
const DB = {
  prepare: (q) => new Stmt(q),
  async batch(lista) { sql.exec('BEGIN'); try { const r = lista.map((s) => s._lote()); sql.exec('COMMIT'); return r; } catch (e) { sql.exec('ROLLBACK'); throw e; } },
  async exec(q) { sql.exec(q); return { count: 1 }; },
};
const env = { DB, ADMIN_PASSWORD: process.env.HK_PASS || 'hanaki' };

/* ── Rutas de functions/ (con _middleware.js) ── */
async function api(req, res, url) {
  const partes = url.pathname.split('/').filter(Boolean);
  const fichero = path.join(FUNCS, ...partes) + '.js';
  if (partes.some((p) => p.startsWith('_')) || !fs.existsSync(fichero)) return false;
  const cadena = [];
  for (let i = 0; i < partes.length; i++) {
    const mw = path.join(FUNCS, ...partes.slice(0, i), '_middleware.js');
    if (fs.existsSync(mw)) cadena.push((await import(pathToFileURL(mw))).onRequest);
  }
  const mod = await import(pathToFileURL(fichero));
  const M = req.method[0] + req.method.slice(1).toLowerCase();
  const final = mod['onRequest' + M] || mod.onRequest;
  if (!final) { res.writeHead(405).end(); return true; }
  cadena.push(final);
  const cuerpo = await new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)).on('end', () => ok(Buffer.concat(c))); });
  const request = new Request(url, { method: req.method, headers: req.headers, body: /^(GET|HEAD)$/.test(req.method) ? undefined : cuerpo });
  const ctx = { request, env, params: {}, data: {}, waitUntil: (p) => Promise.resolve(p).catch((e) => console.error('waitUntil:', e.message)) };
  const paso = (i) => cadena[i]({ ...ctx, next: () => paso(i + 1) });
  let r;
  try { r = await paso(0); } catch (e) { console.error(e); r = new Response(JSON.stringify({ error: String(e.message) }), { status: 500 }); }
  const h = {}; r.headers.forEach((v, k) => { if (k !== 'set-cookie') h[k] = v; });
  const ck = r.headers.getSetCookie(); if (ck.length) h['set-cookie'] = ck;
  res.writeHead(r.status, h).end(Buffer.from(await r.arrayBuffer()));
  return true;
}

/* ── Archivos ── */
const TIPOS = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript', json: 'application/json', webmanifest: 'application/manifest+json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', mp4: 'video/mp4', ico: 'image/x-icon', txt: 'text/plain; charset=utf-8', xml: 'application/xml', woff2: 'font/woff2' };
function archivo(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  let f = path.join(RAIZ, p);
  if (!f.startsWith(RAIZ)) return res.writeHead(403).end();
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) return res.writeHead(301, { location: p + '/' + url.search }).end();
    f = path.join(f, 'index.html');
  } else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  let estado = 200;
  if (!fs.existsSync(f)) { f = path.join(RAIZ, '404.html'); estado = 404; if (!fs.existsSync(f)) return res.writeHead(404).end('404'); }
  const tam = fs.statSync(f).size, tipo = TIPOS[path.extname(f).slice(1).toLowerCase()] || 'application/octet-stream';
  const cab = { 'content-type': tipo, 'cache-control': 'no-store', 'accept-ranges': 'bytes' };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m && estado === 200) {
    const a = m[1] ? +m[1] : Math.max(0, tam - +m[2]), b = m[1] && m[2] ? Math.min(+m[2], tam - 1) : tam - 1;
    res.writeHead(206, { ...cab, 'content-range': `bytes ${a}-${b}/${tam}`, 'content-length': b - a + 1 });
    return fs.createReadStream(f, { start: a, end: b }).pipe(res);
  }
  res.writeHead(estado, { ...cab, 'content-length': tam });
  req.method === 'HEAD' ? res.end() : fs.createReadStream(f).pipe(res);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  try {
    if (url.pathname.startsWith('/api/') && (await api(req, res, url))) return;
    archivo(req, res, url);
  } catch (e) { console.error(e); res.headersSent || res.writeHead(500); res.end(String(e.message)); }
}).listen(PUERTO, () => { demo().catch((e) => console.error('demo:', e.message)); console.log(`Hanaki local: http://localhost:${PUERTO}/  (carpeta ${path.basename(RAIZ)}, panel /admin/ con contraseña "hanaki")`); });

/* ── Datos de demostración (solo con la base en memoria): reservas, socios con sellos y visitas inventadas ── */
async function demo() {
  if (process.env.HK_DB || process.env.HK_SIN_DEMO) return;
  const B = `http://localhost:${PUERTO}`, J = { 'content-type': 'application/json' };
  const post = (ruta, d, h = {}) => fetch(B + ruta, { method: 'POST', headers: { ...J, ...h }, body: JSON.stringify(d) });
  const dia = (n) => { const d = new Date(Date.now() + n * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const login = await post('/api/fidelidad/admin/login', { password: env.ADMIN_PASSWORD });
  const cookie = (login.headers.getSetCookie()[0] || '').split(';')[0];
  const socios = [['Marta Demo', '600100101', 'marta@example.com', [45.9, 68.85, 34.5, 91.8]], ['Jordi Demo', '600100102', 'jordi@example.com', [120, 96.4, 110.25]], ['Lucía Demo', '600100103', 'lucia@example.com', [33.9, 29]], ['Pau Demo', '600100104', 'pau@example.com', [16.95]]];
  const tokens = [];
  for (const [nombre, telefono, email, cuentas] of socios) {
    const j = await (await post('/api/fidelidad/registro', { nombre, telefono, email, privacidad: true, promos: false, web: '' })).json();
    tokens.push(j.token);
    for (const importe of cuentas) await post('/api/fidelidad/admin/accion', { accion: 'compra', importe, token: j.token, forzar: true }, { cookie });
  }
  const res = [[0, '13:30', 'Marta Demo', '600100101', 'marta@example.com', 2, 0, {}], [0, '14:00', 'Familia Ejemplo', '600200201', '', 4, 2, { trona: true, comentarios: 'Alergia a frutos secos' }], [0, '21:00', 'Jordi Demo', '600100102', 'jordi@example.com', 6, 0, { cumple: true }], [0, '21:30', 'Carla Prueba', '600200203', '', 2, 0, {}], [1, '13:00', 'Grupo Oficina', '600200204', '', 9, 0, {}], [2, '20:30', 'Lucía Demo', '600100103', 'lucia@example.com', 3, 1, {}]];
  const ahora = new Date(), hhmm = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
  for (const [d, hora, nombre, telefono, email, adultos, ninos, extra] of res) {
    const fecha = dia(d === 0 && hora <= hhmm ? 1 : d);
    await post('/api/reservas/crear', { fecha, hora, nombre, telefono, email, adultos, ninos, bebes: 0, comentarios: '', privacidad: true, web: '', ...extra });
  }
  await post('/api/reservas/admin/estado', { id: 1, estado: 'confirmada' }, { cookie }).catch(() => {});
  await post('/api/visita', { p: '/', r: '', u: '', e: 'vista' }, { 'user-agent': 'Mozilla/5.0 demo' });
  await new Promise((r) => setTimeout(r, 200));
  try {
    const cols = sql.prepare('PRAGMA table_info(visitas)').all().map((c) => c.name).filter((c) => c !== 'id');
    const ins = sql.prepare(`INSERT INTO visitas (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
    const rutas = ['/', '/', '/', '/carta', '/carta', '/reservas/', '/ubicacion', '/fidelidad/'], origenes = ['google', 'google', 'instagram', 'directo', 'directo', 'tiktok', 'facebook'], tipos = ['vista', 'vista', 'vista', 'vista', 'vista', 'vista', 'llamar', 'reservar', 'como_llegar', 'tarjeta', 'instagram'];
    let x = 7; const azar = (n) => ((x = (x * 1103515245 + 12345) % 2147483648) >>> 12) % n;
    for (let d = 0; d < 30; d++) for (let i = 0, n = 25 + azar(40) + (d % 7 < 2 ? 30 : 0); i < n; i++) {
      const v = { dia: dia(-d), hora: 12 + azar(11), tipo: tipos[azar(tipos.length)], ruta: rutas[azar(rutas.length)], origen: origenes[azar(origenes.length)], dispositivo: azar(4) ? 'movil' : 'ordenador', pais: 'ES', visitante: 'demo' + d + '-' + azar(n) };
      ins.run(...cols.map((c) => v[c] ?? null));
    }
  } catch (e) { console.error('demo visitas:', e.message); }
  console.log('Datos de demostración cargados. Tarjeta de ejemplo: ' + B + '/fidelidad/tarjeta.html?t=' + tokens[0]);
}
