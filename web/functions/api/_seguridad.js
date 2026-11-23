// Protección contra bots y abusos (no crea ninguna ruta).
//  · limitar(): límite de peticiones por IP con D1 (la IP se guarda cifrada, nunca en claro, y se borra en 1 día).
//  · comprobarTurnstile(): antibots invisible de Cloudflare. Solo se exige si existen TURNSTILE_SITE_KEY y TURNSTILE_SECRET
//    en las variables de Cloudflare Pages; sin ellas no hace nada (la web sigue funcionando igual).
import { HttpError } from './fidelidad/_lib.js';

let lista = false;
async function tabla(DB) {
  if (lista) return;
  await DB.prepare('CREATE TABLE IF NOT EXISTS limites (clave TEXT NOT NULL, momento INTEGER NOT NULL)').run();
  await DB.prepare('CREATE INDEX IF NOT EXISTS idx_limites ON limites(clave, momento)').run();
  lista = true;
}

export const ipDe = (request) => request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'local';

async function huella(env, texto) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hanaki-limite:' + (env.ADMIN_PASSWORD || '') + ':' + texto));
  return [...new Uint8Array(h)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ¿Cuántas veces ha pasado esto en la ventana? Lanza 429 si se supera «max».
// apuntar = false → solo comprueba (p. ej. el login apunta solo los intentos fallidos con apuntarFallo)
export async function limitar(env, DB, request, tipo, max, segundos, { apuntar = true, mensaje } = {}) {
  await tabla(DB);
  const clave = tipo + ':' + (await huella(env, ipDe(request)));
  const ahora = Math.floor(Date.now() / 1000);
  const { n } = await DB.prepare('SELECT COUNT(*) n FROM limites WHERE clave = ? AND momento > ?').bind(clave, ahora - segundos).first();
  if (n >= max) throw new HttpError(429, mensaje || 'Demasiados intentos seguidos. Espera un rato y vuelve a probar, o llámanos al 613 261 135.');
  if (apuntar) await DB.prepare('INSERT INTO limites (clave, momento) VALUES (?, ?)').bind(clave, ahora).run();
  if (Math.random() < 0.02) await DB.prepare('DELETE FROM limites WHERE momento < ?').bind(ahora - 86400).run(); // limpieza
  return clave;
}
export async function apuntar(DB, clave) {
  await DB.prepare('INSERT INTO limites (clave, momento) VALUES (?, ?)').bind(clave, Math.floor(Date.now() / 1000)).run();
}

// Antibots de Cloudflare Turnstile
export const turnstileActivo = (env) => !!(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET);
export async function comprobarTurnstile(env, request, token) {
  if (!turnstileActivo(env)) return;
  if (!token) throw new HttpError(400, 'Comprobación antibots pendiente. Espera un segundo y vuelve a pulsar el botón.');
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token).slice(0, 2048), remoteip: ipDe(request) }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  const j = r ? await r.json().catch(() => ({})) : {};
  if (!j.success) throw new HttpError(403, 'No hemos podido comprobar que no eres un robot. Recarga la página y vuelve a intentarlo.');
}
