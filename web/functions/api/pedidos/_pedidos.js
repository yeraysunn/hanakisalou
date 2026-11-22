// Pedidos a domicilio y para recoger — utilidades compartidas (no crea ninguna ruta)
// Pago al recibir (efectivo o datáfono del repartidor). Sin verificación: el cliente deja móvil y email,
// el local ve en Telegram si es cliente nuevo o habitual (y llama si hace falta). El email avisa al cliente de cada paso.
import { HttpError, enviarEmail, escapar } from '../fidelidad/_lib.js';
import { hoyMadrid, horaMadrid } from '../reservas/_comun.js';
import { CATALOGO, POR_ID, CATEGORIAS } from './_catalogo.js';
export { json, db, handle, body, HttpError, normalizarTelefono, nuevoToken, escapar } from '../fidelidad/_lib.js';
export { hoyMadrid, horaMadrid, CATALOGO, POR_ID, CATEGORIAS };

// ---------- reglas del negocio ----------
export const MINIMO = 1500;          // pedido mínimo (productos), céntimos
export const ENVIO = 250;            // gastos de envío
export const ENVIO_GRATIS = 2500;    // envío gratis a partir de este subtotal
export const MUNICIPIO = { nombre: 'Salou', codigo: '43905' }; // solo se reparte dentro del municipio de Salou (dirección comprobada en CartoCiudad)
export const DIAS_CERRADOS = [1];    // lunes
// Ventanas de pedido: «lo antes posible» dentro de ellas; horas programadas cada 15 min
export const TURNOS = [['12:30', '15:45'], ['19:30', '22:45']]; // la cocina cierra a las 16:00 y 23:00
export const MARGEN_MIN = 30;        // una hora programada tiene que estar al menos 30 min en el futuro
export const HORA_LIMITE_ALCOHOL = '22:00'; // no se entrega alcohol a partir de esta hora (prudencia: confirmar la ordenanza de Salou)
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
      email TEXT,
      previos INTEGER,                    -- pedidos entregados antes con ese teléfono (0 = cliente nuevo)
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
    DB.prepare(`CREATE TABLE IF NOT EXISTS pedidos_ajustes (clave TEXT PRIMARY KEY, valor TEXT)`),
  ]);
  // columnas añadidas después de crear la tabla
  const cols = new Set((await DB.prepare('PRAGMA table_info(pedidos)').all()).results.map((c) => c.name));
  for (const [c, t] of [['email', 'TEXT'], ['previos', 'INTEGER'], ['prueba', 'INTEGER NOT NULL DEFAULT 0'], ['lat', 'REAL'], ['lng', 'REAL']]) {
    if (cols.has(c)) continue;
    try { await DB.prepare(`ALTER TABLE pedidos ADD COLUMN ${c} ${t}`).run(); } catch (e) { if (!/duplicate column/i.test(String(e && e.message))) throw e; }
  }
  listo = true;
}

// Ajustes del panel: activo (pedidos online abiertos), pausa (hasta 'YYYY-MM-DD HH:MM'), agotados {id: fecha}
export async function ajustes(DB) {
  await tablas(DB);
  const { results } = await DB.prepare('SELECT clave, valor FROM pedidos_ajustes').all();
  const a = Object.fromEntries(results.map((r) => [r.clave, r.valor]));
  const hoy = hoyMadrid();
  let agotados = {}; try { agotados = JSON.parse(a.agotados || '{}'); } catch {}
  for (const k of Object.keys(agotados)) if (agotados[k] !== hoy) delete agotados[k]; // «agotado» solo vale ese día
  return {
    activo: a.activo === '1',
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

// ---------- direcciones (CartoCiudad, callejero oficial del IGN; gratis) ----------
const quitarTildes = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
export async function buscarDirecciones(q) {
  const u = new URL('https://www.cartociudad.es/geocoder/api/geocoder/candidates');
  u.searchParams.set('q', String(q).slice(0, 120) + ' salou'); u.searchParams.set('limit', '20');
  const r = await fetch(u, { signal: AbortSignal.timeout(8000), cf: { cacheTtl: 86400, cacheEverything: true } }).catch(() => null);
  if (!r || !r.ok) throw new HttpError(502, 'Ahora no podemos comprobar direcciones. Llámanos al 613 261 135 para hacer el pedido.');
  const lista = await r.json().catch(() => []);
  const out = [], vistos = new Set();
  for (const x of Array.isArray(lista) ? lista : []) {
    if (x.muniCode !== MUNICIPIO.codigo || !['portal', 'callejero'].includes(x.type)) continue;
    const texto = String(x.address || '').replace(/,\s*Salou.*$/i, '').replace(/\s*\((DE|DEL|DE LA|DE LOS|DE LAS|DELS|DE L')\)/i, '').trim();
    if (!texto || vistos.has(texto)) continue; vistos.add(texto);
    out.push(x.type === 'portal'
      ? { tipo: 'portal', texto, num: x.portalNumber, cp: x.postalCode, lat: x.lat, lng: x.lng }
      : { tipo: 'calle', texto });
  }
  return out.slice(0, 8);
}
// Comprueba que la dirección elegida es un portal real de Salou. Devuelve { direccion, cp, lat, lng }.
export async function comprobarDireccion(texto) {
  const t = String(texto || '').trim();
  if (!/\d/.test(t)) throw new HttpError(400, 'Escribe la calle y el número, y elige tu dirección de la lista.');
  const r = (await buscarDirecciones(t)).find((x) => x.tipo === 'portal' && quitarTildes(x.texto) === quitarTildes(t));
  if (!r) throw new HttpError(400, 'No encontramos esa dirección en Salou. Elígela de la lista (solo repartimos en Salou) o llámanos al 613 261 135.');
  return { direccion: r.texto, cp: r.cp, lat: r.lat, lng: r.lng };
}

// Modo prueba: con la sesión del panel abierta se puede pedir a cualquier hora (el pedido va marcado 🧪 PRUEBA)
export function horarioPrueba() {
  const m = aMin(horaMadrid()), horas = [];
  for (let x = Math.ceil((m + MARGEN_MIN) / 15) * 15; x < 24 * 60 && horas.length < 8; x += 15) horas.push(aHora(x));
  return { abierta: true, asap: true, horas, motivo: '🧪 Modo prueba (sesión del panel abierta): puedes pedir aunque esté cerrado. El pedido llegará marcado como PRUEBA.' };
}

// ¿Se puede vender alcohol para esa hora de entrega? (hora = 'HH:MM' o null = lo antes posible)
export function alcoholPermitido(hora) {
  const h = hora || horaMadrid();
  return h < HORA_LIMITE_ALCOHOL && h >= '08:00';
}

// Carta pública con agotados y ocultos del día
export function cartaPublica(aj) {
  return CATALOGO.filter((x) => !aj.ocultos.includes(x.id)).map((x) => ({ ...x, agotado: !!aj.agotados[x.id] }));
}

export const telBonito = (t) => String(t || '').replace(/^\+34(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');

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
    else items.push({ id: p.id, num: p.num || '', nombre: p.nombre, precio: p.precio, uds, ...(p.alcohol ? { alcohol: 1 } : {}) });
  }
  if (!items.length) throw new HttpError(400, 'Tu pedido está vacío.');
  const subtotal = items.reduce((s, x) => s + x.precio * x.uds, 0);
  if (subtotal < MINIMO) throw new HttpError(400, `El pedido mínimo es de ${euros(MINIMO)} (llevas ${euros(subtotal)}).`);
  const envio = tipo === 'domicilio' && subtotal < ENVIO_GRATIS ? ENVIO : 0;
  return { items, subtotal, envio, total: subtotal + envio, alcohol: items.some((x) => x.alcohol) };
}

// ---------- textos ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const horaTexto = (p) => (p.hora ? `a las ${p.hora}` : 'lo antes posible');
export const pagoTexto = (p) => (p.pago === 'tarjeta' ? 'Tarjeta (datáfono)' : 'Efectivo' + (p.cambio ? ` · paga con ${euros(p.cambio)} → cambio ${euros(p.cambio - p.total)}` : ' · importe justo'));
export const itemsDe = (p) => { try { return JSON.parse(p.items); } catch { return []; } };

const TITULO = { domicilio: '🛵 <b>PEDIDO A DOMICILIO</b>', recoger: '🥡 <b>PEDIDO PARA RECOGER</b>' };
const PIE = { aceptado: '✅ <b>ACEPTADO</b>', en_camino: '🛵 <b>EN CAMINO</b>', entregado: '✔️ <b>ENTREGADO</b>', rechazado: '❌ <b>RECHAZADO</b>', cancelado: '🚫 <b>CANCELADO</b>' };

export function textoTelegram(p) {
  let t = `${p.prueba ? '🧪 <b>PRUEBA · NO PREPARAR</b>\n' : ''}${TITULO[p.tipo]} · Nº ${p.id}\n\n`;
  t += `🕐 <b>${esc(p.hora ? 'Para las ' + p.hora : 'Lo antes posible')}</b>\n`;
  t += `👤 ${esc(p.nombre)} · 📞 ${esc(telBonito(p.telefono))}\n`;
  if (p.email) t += `📧 ${esc(p.email)}\n`;
  if (p.previos != null) t += p.previos ? `⭐ Cliente habitual · ${p.previos} pedido${p.previos === 1 ? '' : 's'} entregado${p.previos === 1 ? '' : 's'}\n` : '🆕 <b>Cliente nuevo</b>\n';
  if (p.tipo === 'domicilio') t += `📍 <b>${esc(p.direccion)}</b>, ${esc(p.cp)} Salou${p.notas_dir ? ` · ${esc(p.notas_dir)}` : ''}${p.lat ? ` · <a href="https://maps.google.com/?q=${p.lat},${p.lng}">mapa</a>` : ''}\n`;
  t += '\n' + itemsDe(p).map((x) => `${x.uds} × ${x.num ? esc(x.num) + '. ' : ''}${esc(x.nombre)}  <i>${euros(x.precio * x.uds)}</i>`).join('\n') + '\n';
  if (itemsDe(p).some((x) => x.alcohol)) t += `\n🔞 <b>LLEVA ALCOHOL · pedir DNI al entregar (solo mayores de 18)</b>\n`;
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

// Pedidos entregados antes con este teléfono (para marcar cliente nuevo / habitual)
export async function previos(DB, tel, sinId = 0) {
  const r = await DB.prepare(`SELECT COUNT(*) n FROM pedidos WHERE telefono = ? AND estado = 'entregado' AND id != ?`).bind(tel, sinId).first();
  return r.n;
}

// ---------- emails al cliente ----------
const ASUNTO = {
  pendiente: 'Hemos recibido tu pedido', aceptado: 'Tu pedido está aceptado', en_camino: 'Tu pedido está en camino',
  rechazado: 'No podemos atender tu pedido', cancelado: 'Tu pedido se ha cancelado',
};
function horaLlegada(p) {
  if (!p.aceptado || !p.minutos) return p.hora || '';
  const t = new Date(Date.parse(p.aceptado.replace(' ', 'T') + 'Z') + p.minutos * 60000);
  const h = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).format(t);
  return p.hora && p.hora > h ? p.hora : h;
}
export function emailPedido(p, base) {
  const dom = p.tipo === 'domicilio', titulo = p.estado === 'en_camino' && !dom ? 'Tu pedido está listo para recoger' : ASUNTO[p.estado];
  const llega = horaLlegada(p);
  const intro = {
    pendiente: 'gracias por tu pedido. El restaurante lo está revisando y te avisaremos por email en cuanto lo acepte.',
    aceptado: dom ? `ya lo estamos preparando. Llegará aproximadamente a las <b style="color:#F2EEE8">${llega}</b>.` : `ya lo estamos preparando. Estará listo aproximadamente a las <b style="color:#F2EEE8">${llega}</b> en Carrer Major, 6.`,
    en_camino: dom ? 'el repartidor ya ha salido hacia tu casa.' : 'ya puedes pasar a recogerlo por Carrer Major, 6 · Salou.',
    rechazado: 'lo sentimos mucho: ahora mismo no podemos atender tu pedido. No se te ha cobrado nada.' + (p.motivo && p.motivo !== 'desde Telegram' ? ` Motivo: ${escapar(p.motivo)}.` : '') + ' Si quieres, llámanos al 613 261 135.',
    cancelado: 'tu pedido se ha cancelado. Si crees que es un error, llámanos al 613 261 135.',
  }[p.estado];
  const enlace = `${base}/pedir/pedido?t=${p.token}`;
  const filas = itemsDe(p).map((x) => `<tr><td style="padding:8px 16px;border-top:1px solid #2a2a2a">${x.uds} × ${escapar(x.nombre)}</td><td style="padding:8px 16px;border-top:1px solid #2a2a2a;text-align:right;white-space:nowrap">${euros(x.precio * x.uds)}</td></tr>`).join('')
    + (dom ? `<tr><td style="padding:8px 16px;border-top:1px solid #2a2a2a">Envío</td><td style="padding:8px 16px;border-top:1px solid #2a2a2a;text-align:right">${p.envio ? euros(p.envio) : 'Gratis'}</td></tr>` : '')
    + `<tr><td style="padding:12px 16px;border-top:1px solid #6b5a3a;font-weight:bold">Total · ${p.pago === 'tarjeta' ? 'tarjeta' : 'efectivo'} al ${dom ? 'recibir' : 'recoger'}</td><td style="padding:12px 16px;border-top:1px solid #6b5a3a;text-align:right;font-weight:bold">${euros(p.total)}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#0A0A0A;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:36px 24px;color:#BDB7AE">
    <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:.3em;color:#F2EEE8">HANAKI</div>
    <div style="font-size:11px;letter-spacing:.26em;color:#C9A45C;margin-top:4px">PEDIDO Nº ${p.id} · ${dom ? 'A DOMICILIO' : 'PARA RECOGER'}</div>
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:28px;color:#F2EEE8;margin:28px 0 10px">${titulo}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px">Hola ${escapar(p.nombre)}, ${intro}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14.5px;color:#F2EEE8;background:#141414;border:1px solid #6b5a3a">${filas}</table>
    ${dom ? `<p style="font-size:14px;line-height:1.6;margin:16px 0 0">Entrega en: ${escapar(p.direccion)}, ${escapar(p.cp)}${p.notas_dir ? ' · ' + escapar(p.notas_dir) : ''}</p>` : ''}
    ${['pendiente', 'aceptado', 'en_camino'].includes(p.estado) ? `<a href="${enlace}" style="display:block;margin:22px 0 0;padding:15px 18px;background:#E0452E;border-radius:999px;color:#0A0A0A;text-align:center;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:.2em">VER MI PEDIDO</a>` : ''}
    <p style="font-size:13px;line-height:1.6;margin:22px 0 0">Hanaki Salou · Carrer Major, 6 · 43840 Salou<br>Teléfono: 613 261 135</p>
  </div></body></html>`;
  const texto = `${titulo}. Pedido nº ${p.id}, total ${euros(p.total)}.${llega && ['aceptado'].includes(p.estado) ? ' Hora aproximada: ' + llega + '.' : ''} Sigue tu pedido: ${enlace} · Hanaki Salou, 613 261 135`;
  return { asunto: `${titulo} · Pedido nº ${p.id}`, html, texto };
}
// Envía el email del estado actual (si el cliente dejó email). Nunca lanza: el pedido no debe fallar por un email.
export async function avisarCliente(env, p, base) {
  if (!p.email || !ASUNTO[p.estado]) return;
  if (!base || /pages\.dev/.test(base)) base = 'https://hanakisalou.com'; // el webhook de Telegram puede llegar por *.pages.dev
  try {
    const m = emailPedido(p, base);
    await enviarEmail(env, { para: p.email, asunto: m.asunto, html: m.html, texto: m.texto, de: 'Hanaki Salou <pedidos@hanakisalou.com>', idem: `hanaki-pedido-${p.id}-${p.estado}` });
  } catch (e) { console.error('email pedido', p.id, e && e.message); }
}
