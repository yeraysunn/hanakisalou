// Pedidos a domicilio y para recoger — utilidades compartidas (no crea ninguna ruta)
// Pago al recibir (efectivo o datáfono del repartidor). El cliente verifica su móvil por SMS antes de pedir.
import { HttpError, firmar, secretoAdmin } from '../fidelidad/_lib.js';
import { hoyMadrid, horaMadrid } from '../reservas/_comun.js';
import { CATALOGO, POR_ID, CATEGORIAS } from './_catalogo.js';
export { json, db, handle, body, HttpError, normalizarTelefono, nuevoToken, escapar } from '../fidelidad/_lib.js';
export { hoyMadrid, horaMadrid, CATALOGO, POR_ID, CATEGORIAS };

// ---------- reglas del negocio ----------
export const MINIMO = 1500;          // pedido mínimo (productos), céntimos
export const ENVIO = 250;            // gastos de envío
export const ENVIO_GRATIS = 2500;    // envío gratis a partir de este subtotal
export const CPS_DEFECTO = ['43840', '43481']; // Salou (incl. Cap Salou) y La Pineda — editable en el panel
export const DIAS_CERRADOS = [1];    // lunes
// Ventanas de pedido: «lo antes posible» dentro de ellas; horas programadas cada 15 min
export const TURNOS = [['12:30', '15:45'], ['19:30', '22:45']]; // la cocina cierra a las 16:00 y 23:00
export const MARGEN_MIN = 30;        // una hora programada tiene que estar al menos 30 min en el futuro
export const MAX_UDS = 30;           // unidades máximas de un mismo producto
export const MAX_PENDIENTES = 2;     // pedidos sin gestionar a la vez por teléfono
export const ESTADOS = ['pendiente', 'aceptado', 'en_camino', 'entregado', 'rechazado', 'cancelado'];
export const ESTADO_TXT = { pendiente: 'Esperando al restaurante', aceptado: 'Aceptado · en cocina', en_camino: 'En camino', entregado: 'Entregado', rechazado: 'Rechazado', cancelado: 'Cancelado' };

export const euros = (c) => (c / 100).toFixed(2).replace('.', ',') + ' €';
const aMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const aHora = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

// ---------- base de datos ----------
let listo = false;
export async function tablas(DB) {
  if (listo) return;
  await DB.batch([
    DB.prepare(`CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      tipo TEXT NOT NULL,                 -- domicilio | recoger
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      direccion TEXT, cp TEXT, notas_dir TEXT,
      hora TEXT,                          -- NULL = lo antes posible, o 'HH:MM'
      pago TEXT NOT NULL,                 -- efectivo | tarjeta
      cambio INTEGER,                     -- paga con billete de (céntimos)
      items TEXT NOT NULL,                -- JSON [{id, nombre, num, precio, uds}]
      subtotal INTEGER NOT NULL, envio INTEGER NOT NULL, total INTEGER NOT NULL,
      comentarios TEXT,
      minutos INTEGER,                    -- tiempo estimado que da el restaurante al aceptar
      motivo TEXT,                        -- motivo de rechazo
      impreso INTEGER NOT NULL DEFAULT 0,
      tg TEXT,                            -- JSON [[chat_id, message_id]] para editar los avisos
      ip TEXT,
      fecha TEXT NOT NULL,                -- día (Madrid) YYYY-MM-DD
      creado TEXT NOT NULL DEFAULT (datetime('now')),
      aceptado TEXT, actualizado TEXT)`),
    DB.prepare('CREATE INDEX IF NOT EXISTS idx_ped_fecha ON pedidos(fecha, id)'),
    DB.prepare('CREATE INDEX IF NOT EXISTS idx_ped_tel ON pedidos(telefono, estado)'),
    DB.prepare(`CREATE TABLE IF NOT EXISTS pedidos_sms (id INTEGER PRIMARY KEY AUTOINCREMENT, telefono TEXT NOT NULL, ip TEXT, creado TEXT NOT NULL DEFAULT (datetime('now')))`),
    DB.prepare('CREATE INDEX IF NOT EXISTS idx_pedsms ON pedidos_sms(telefono, creado)'),
    DB.prepare(`CREATE TABLE IF NOT EXISTS pedidos_ajustes (clave TEXT PRIMARY KEY, valor TEXT)`),
  ]);
  listo = true;
}

// Ajustes del panel: activo (pedidos online abiertos), cps, pausa (hasta 'YYYY-MM-DD HH:MM'), agotados {id: fecha}
export async function ajustes(DB) {
  await tablas(DB);
  const { results } = await DB.prepare('SELECT clave, valor FROM pedidos_ajustes').all();
  const a = Object.fromEntries(results.map((r) => [r.clave, r.valor]));
  const hoy = hoyMadrid();
  let agotados = {}; try { agotados = JSON.parse(a.agotados || '{}'); } catch {}
  for (const k of Object.keys(agotados)) if (agotados[k] !== hoy) delete agotados[k]; // «agotado» solo vale ese día
  return {
    activo: a.activo === '1',
    cps: (a.cps ? a.cps.split(/[\s,;]+/).filter((x) => /^\d{5}$/.test(x)) : CPS_DEFECTO),
    pausa: a.pausa || '',
    agotados,
    ocultos: (() => { try { return JSON.parse(a.ocultos || '[]'); } catch { return []; } })(),
  };
}
export async function guardarAjuste(DB, clave, valor) {
  await tablas(DB);
  await DB.prepare('INSERT INTO pedidos_ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').bind(clave, String(valor)).run();
}

// ---------- horario ----------
// Estado de la tienda ahora: { abierta, ahora (asap posible), horas: ['HH:MM' programables hoy], motivo }
export function horario(aj) {
  const hoy = hoyMadrid(), ahora = horaMadrid(), mAhora = aMin(ahora);
  const dia = new Date(hoy + 'T12:00:00Z').getUTCDay();
  if (!aj.activo) return { abierta: false, motivo: 'Los pedidos online están cerrados ahora mismo.', horas: [], asap: false };
  if (DIAS_CERRADOS.includes(dia)) return { abierta: false, motivo: 'Hoy lunes estamos cerrados. ¡Te esperamos mañana!', horas: [], asap: false };
  if (aj.pausa && aj.pausa > `${hoy} ${ahora}`) return { abierta: false, motivo: `Tenemos mucho trabajo: volvemos a aceptar pedidos a las ${aj.pausa.slice(11)}.`, horas: [], asap: false };
  const asap = TURNOS.some(([a, b]) => mAhora >= aMin(a) && mAhora <= aMin(b));
  const horas = [];
  for (const [a, b] of TURNOS) for (let m = aMin(a) + 15; m <= aMin(b); m += 15) if (m >= mAhora + MARGEN_MIN) horas.push(aHora(m));
  if (!asap && !horas.length) return { abierta: false, motivo: 'Por hoy ya no aceptamos más pedidos. Horario de pedidos: 12:30–15:45 y 19:30–22:45, de martes a domingo.', horas: [], asap: false };
  return { abierta: true, asap, horas, motivo: asap ? '' : 'Ahora estamos cerrados: puedes dejar tu pedido programado para más tarde.' };
}

// Carta pública con agotados y ocultos del día
export function cartaPublica(aj) {
  return CATALOGO.filter((x) => !aj.ocultos.includes(x.id)).map((x) => ({ ...x, agotado: !!aj.agotados[x.id] }));
}

// ---------- verificación del móvil (cookie firmada) ----------
const COOKIE_TEL = 'hk_tel';
const DIAS_TEL = 90;
const b64 = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => { try { return atob(s.replace(/-/g, '+').replace(/_/g, '/')); } catch { return ''; } };
const secretoTel = (env) => 'hanaki-pedidos-tel:' + secretoAdmin(env);

export async function cookieTelefono(env, tel, seguro = true) {
  const exp = Math.floor(Date.now() / 1000) + DIAS_TEL * 86400;
  const v = `${b64(tel)}.${exp}`;
  const f = await firmar(v, secretoTel(env));
  return `${COOKIE_TEL}=${v}.${f}; Path=/; Max-Age=${DIAS_TEL * 86400}; HttpOnly;${seguro ? ' Secure;' : ''} SameSite=Lax`;
}
export const cookieTelefonoFuera = `${COOKIE_TEL}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

// Teléfono verificado de esta petición, o null
export async function telefonoVerificado(request, env) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(COOKIE_TEL + '=([A-Za-z0-9_-]+)\\.(\\d+)\\.([a-f0-9]{64})'));
  if (!m || Number(m[2]) < Date.now() / 1000) return null;
  const f = await firmar(`${m[1]}.${m[2]}`, secretoTel(env));
  let d = 0; for (let i = 0; i < 64; i++) d |= f.charCodeAt(i) ^ m[3].charCodeAt(i);
  return d === 0 ? unb64(m[1]) || null : null;
}

// Solo móviles españoles (evita fraude de SMS a números internacionales de pago)
export function movilEspanol(tel) { return /^\+34[67]\d{8}$/.test(tel || ''); }
export const telBonito = (t) => String(t || '').replace(/^\+34(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');

// ---------- SMS (Twilio Verify) ----------
// Variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID. SMS_PRUEBA=1 → sin SMS, código 123456 (solo pruebas locales).
export const smsPrueba = (env) => String(env.SMS_PRUEBA || '') === '1';
export const smsConfigurado = (env) => smsPrueba(env) || !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SID);
async function twilio(env, ruta, datos) {
  const r = await fetch(`https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SID}/${ruta}`, {
    method: 'POST',
    headers: { authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`), 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(datos),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!r) throw new HttpError(502, 'No se pudo enviar el SMS. Inténtalo de nuevo.');
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}
export async function enviarCodigo(env, tel) {
  if (smsPrueba(env)) return;
  const { ok, j } = await twilio(env, 'Verifications', { To: tel, Channel: 'sms', Locale: 'es' });
  if (!ok) { console.error('twilio verify', j.code, j.message); throw new HttpError(502, 'No se pudo enviar el SMS a ese número. Revísalo o llámanos al 613 261 135.'); }
}
export async function comprobarCodigo(env, tel, codigo) {
  if (smsPrueba(env)) return codigo === '123456';
  const { ok, status, j } = await twilio(env, 'VerificationCheck', { To: tel, Code: codigo });
  if (status === 404) return false; // caducado o demasiados intentos
  if (!ok) { console.error('twilio check', j.code, j.message); throw new HttpError(502, 'No se pudo comprobar el código. Inténtalo de nuevo.'); }
  return j.status === 'approved';
}

// ---------- cálculo del pedido (siempre en el servidor) ----------
export function calcular(lineas, tipo, aj) {
  if (!Array.isArray(lineas) || !lineas.length) throw new HttpError(400, 'Tu pedido está vacío.');
  const items = [];
  for (const l of lineas.slice(0, 80)) {
    const p = POR_ID[String(l && l.id)];
    const uds = Math.min(MAX_UDS, Math.max(0, parseInt(l && l.uds, 10) || 0));
    if (!p || !uds) continue;
    if (aj.ocultos.includes(p.id)) throw new HttpError(409, `«${p.nombre}» ya no está disponible. Quítalo del pedido.`);
    if (aj.agotados[p.id]) throw new HttpError(409, `«${p.nombre}» está agotado hoy. Quítalo del pedido.`);
    const ya = items.find((x) => x.id === p.id);
    if (ya) ya.uds = Math.min(MAX_UDS, ya.uds + uds);
    else items.push({ id: p.id, num: p.num || '', nombre: p.nombre, precio: p.precio, uds });
  }
  if (!items.length) throw new HttpError(400, 'Tu pedido está vacío.');
  const subtotal = items.reduce((s, x) => s + x.precio * x.uds, 0);
  if (subtotal < MINIMO) throw new HttpError(400, `El pedido mínimo es de ${euros(MINIMO)} (llevas ${euros(subtotal)}).`);
  const envio = tipo === 'domicilio' && subtotal < ENVIO_GRATIS ? ENVIO : 0;
  return { items, subtotal, envio, total: subtotal + envio };
}

// ---------- textos ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const horaTexto = (p) => (p.hora ? `a las ${p.hora}` : 'lo antes posible');
export const pagoTexto = (p) => (p.pago === 'tarjeta' ? 'Tarjeta (datáfono)' : 'Efectivo' + (p.cambio ? ` · paga con ${euros(p.cambio)} → cambio ${euros(p.cambio - p.total)}` : ' · importe justo'));
export const itemsDe = (p) => { try { return JSON.parse(p.items); } catch { return []; } };

const TITULO = { domicilio: '🛵 <b>PEDIDO A DOMICILIO</b>', recoger: '🥡 <b>PEDIDO PARA RECOGER</b>' };
const PIE = { aceptado: '✅ <b>ACEPTADO</b>', en_camino: '🛵 <b>EN CAMINO</b>', entregado: '✔️ <b>ENTREGADO</b>', rechazado: '❌ <b>RECHAZADO</b>', cancelado: '🚫 <b>CANCELADO</b>' };

export function textoTelegram(p) {
  let t = `${TITULO[p.tipo]} · Nº ${p.id}\n\n`;
  t += `🕐 <b>${esc(p.hora ? 'Para las ' + p.hora : 'Lo antes posible')}</b>\n`;
  t += `👤 ${esc(p.nombre)} · 📞 ${esc(telBonito(p.telefono))} (verificado)\n`;
  if (p.tipo === 'domicilio') t += `📍 <b>${esc(p.direccion)}</b>, ${esc(p.cp)}${p.notas_dir ? `\n     ${esc(p.notas_dir)}` : ''}\n`;
  t += '\n' + itemsDe(p).map((x) => `${x.uds} × ${x.num ? esc(x.num) + '. ' : ''}${esc(x.nombre)}  <i>${euros(x.precio * x.uds)}</i>`).join('\n') + '\n';
  if (p.comentarios) t += `\n💬 <b>${esc(p.comentarios)}</b>\n`;
  t += `\nSubtotal ${euros(p.subtotal)}${p.tipo === 'domicilio' ? ` · Envío ${p.envio ? euros(p.envio) : 'gratis'}` : ''}\n`;
  t += `💶 <b>TOTAL ${euros(p.total)}</b> · ${esc(pagoTexto(p))}\n`;
  const pie = PIE[p.estado];
  if (pie) t += `\n${pie}${p.minutos && ['aceptado', 'en_camino'].includes(p.estado) ? ` · ${p.minutos} min` : ''}${p.motivo ? ` · ${esc(p.motivo)}` : ''}${p._quien ? ` · ${esc(p._quien)}` : ''}`;
  return t;
}

// Botones según el estado del pedido
export function botonesTelegram(p) {
  if (p.estado === 'pendiente') return { inline_keyboard: [
    [20, 30, 45, 60].map((m) => ({ text: `✅ ${m} min`, callback_data: `pa:${p.id}:${m}` })),
    [{ text: '❌ Rechazar', callback_data: `pr:${p.id}` }],
  ] };
  if (p.estado === 'aceptado') return { inline_keyboard: [[
    p.tipo === 'domicilio' ? { text: '🛵 Sale el repartidor', callback_data: `pc:${p.id}` } : { text: '📦 Listo para recoger', callback_data: `pc:${p.id}` },
    { text: '✔️ Entregado', callback_data: `pe:${p.id}` },
  ]] };
  if (p.estado === 'en_camino') return { inline_keyboard: [[{ text: '✔️ Entregado', callback_data: `pe:${p.id}` }]] };
  return { inline_keyboard: [] };
}

// Cambia el estado (Telegram o panel). Devuelve { pedido, ya } — ya = no había nada que cambiar.
const PASOS = { aceptado: ['pendiente'], en_camino: ['aceptado'], entregado: ['aceptado', 'en_camino'], rechazado: ['pendiente'], cancelado: ['pendiente', 'aceptado', 'en_camino'] };
export async function cambiarEstado(DB, id, estado, { minutos = null, motivo = null } = {}) {
  await tablas(DB);
  if (!PASOS[estado]) throw new HttpError(400, 'Estado no válido.');
  const p = await DB.prepare('SELECT * FROM pedidos WHERE id = ?').bind(Number(id)).first();
  if (!p) throw new HttpError(404, 'No encuentro ese pedido.');
  if (!PASOS[estado].includes(p.estado)) return { pedido: p, ya: true };
  const min = estado === 'aceptado' ? Math.max(5, Math.min(180, parseInt(minutos, 10) || 45)) : p.minutos;
  const r = await DB.prepare(`UPDATE pedidos SET estado = ?, minutos = ?, motivo = COALESCE(?, motivo), actualizado = datetime('now'),
      aceptado = CASE WHEN ? = 'aceptado' THEN datetime('now') ELSE aceptado END WHERE id = ? AND estado = ? RETURNING *`)
    .bind(estado, min, motivo, estado, p.id, p.estado).first();
  return r ? { pedido: r, ya: false } : { pedido: await DB.prepare('SELECT * FROM pedidos WHERE id = ?').bind(p.id).first(), ya: true };
}

// Envía el aviso al grupo de Telegram y guarda los ids de mensaje para editarlos después
export async function avisarTelegram(env, DB, p) {
  const token = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  const chats = String(env.TELEGRAM_PEDIDOS_CHAT_ID || env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return;
  const ids = [];
  for (const chat_id of chats) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id, text: textoTelegram(p), parse_mode: 'HTML', reply_markup: botonesTelegram(p) }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.ok) ids.push([chat_id, j.result.message_id]); else console.error('telegram pedido', r.status);
    } catch { console.error('telegram pedido: fallo de red'); }
  }
  if (ids.length) await DB.prepare('UPDATE pedidos SET tg = ? WHERE id = ?').bind(JSON.stringify(ids), p.id).run();
}

// Actualiza los avisos de Telegram de un pedido (tras cambiarlo desde el panel)
export async function refrescarTelegram(env, p) {
  const token = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  let ids = []; try { ids = JSON.parse(p.tg || '[]'); } catch {}
  if (!token || !ids.length) return;
  for (const [chat_id, message_id] of ids) {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id, message_id, text: textoTelegram(p).trim(), parse_mode: 'HTML', reply_markup: botonesTelegram(p) }),
    }).catch(() => {});
  }
}

// Datos que ve el cliente en su página de seguimiento
export function vistaCliente(p) {
  return {
    id: p.id, estado: p.estado, estadoTxt: ESTADO_TXT[p.estado], tipo: p.tipo, nombre: p.nombre, hora: p.hora,
    direccion: p.direccion, cp: p.cp, pago: p.pago, cambio: p.cambio, items: itemsDe(p), subtotal: p.subtotal, envio: p.envio, total: p.total,
    minutos: p.minutos, aceptado: p.aceptado ? p.aceptado.replace(' ', 'T') + 'Z' : null, creado: p.creado.replace(' ', 'T') + 'Z', motivo: p.motivo,
  };
}
