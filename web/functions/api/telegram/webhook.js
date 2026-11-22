// POST /api/telegram/webhook — lo llama Telegram cuando alguien pulsa ✅ Aceptar / ❌ Rechazar en un aviso de reserva
// · Exige la cabecera X-Telegram-Bot-Api-Secret-Token = secreto del webhook (TELEGRAM_WEBHOOK_SECRET o derivado de la clave del bot; si no, 403).
// · Solo valen los botones pulsados en el grupo configurado (TELEGRAM_CHAT_ID) o por el personal (TELEGRAM_STAFF_IDS, opcional).
// · Solo cambia reservas pendientes. Al pulsar: estado en la base de datos (el mismo del panel), email al cliente
//   y el mensaje se edita con «✅ ACEPTADA · nombre» o «❌ RECHAZADA · nombre», sin botones.
// · Siempre responde 200 a Telegram (aunque falle algo dentro), para que no reintente en bucle.
import { db, tabla, HttpError } from '../reservas/_comun.js';
import { cambiarEstado } from '../reservas/_estado.js';
import { tg, textoReserva, mismoSecreto, secretoWebhook } from '../reservas/_telegram.js';
import { cambiarEstado as estadoPedido, textoTelegram as textoPedido, botonesTelegram as botonesPedido } from '../pedidos/_pedidos.js';

const vale = () => new Response('ok', { status: 200 });
const lista = (v) => String(v || '').split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nombreDe = (f = {}) => [f.first_name, f.last_name].filter(Boolean).join(' ').trim() || (f.username ? '@' + f.username : 'personal');
const PIE = { confirmada: '✅ <b>ACEPTADA</b>', cancelada: '❌ <b>RECHAZADA</b>', llego: '🙌 <b>HA LLEGADO</b>', no_vino: '👻 <b>NO VINO</b>' };

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  if (!mismoSecreto(request.headers.get('X-Telegram-Bot-Api-Secret-Token'), await secretoWebhook(env))) return new Response('Forbidden', { status: 403 });
  let u;
  try { u = await request.json(); } catch { return vale(); }
  const cq = u && u.callback_query;
  if (!cq) return vale(); // solo interesan los botones
  try { await boton(ctx, cq); }
  catch (e) { console.error('telegram webhook:', e && e.message); }
  return vale();
}

async function boton(ctx, cq) {
  const { request, env } = ctx;
  const responder = (text, alerta = false) => tg(env, 'answerCallbackQuery', { callback_query_id: cq.id, text, show_alert: alerta }).catch((e) => console.error(e.message));
  const chat = cq.message && cq.message.chat ? String(cq.message.chat.id) : '';
  const ok = lista(env.TELEGRAM_CHAT_ID).includes(chat) || lista(env.TELEGRAM_PEDIDOS_CHAT_ID).includes(chat) || lista(env.TELEGRAM_STAFF_IDS).includes(String(cq.from && cq.from.id));
  const mp = /^(pa|pr|pc|pe):(\d+)(?::(\d+))?$/.exec(String(cq.data || ''));
  if (mp) return ok ? botonPedido(ctx, cq, mp, responder) : responder('No autorizado', true);
  const m = /^(ok|no):(\d+)$/.exec(String(cq.data || ''));
  if (!m) return responder('Botón no válido');
  if (!ok) return responder('No autorizado', true);

  const DB = db(env);
  await tabla(DB);
  const estado = m[1] === 'ok' ? 'confirmada' : 'cancelada';
  const quien = nombreDe(cq.from);
  let res;
  try {
    res = await cambiarEstado({ env, DB, base: new URL(request.url).origin, waitUntil: (p) => ctx.waitUntil(p) }, Number(m[2]), estado, { soloPendiente: true, rechazo: estado === 'cancelada' });
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return responder('No encuentro esa reserva', true);
    await responder('Error: hazlo desde el panel', true);
    throw e;
  }
  const r = res.reserva;

  // Editar el mensaje pulsado: mismo texto + quién lo gestionó, y sin botones
  if (cq.message) {
    const pie = res.ya ? `${PIE[r.estado] || r.estado.toUpperCase()} · ya estaba gestionada` : `${PIE[estado]} · ${esc(quien)}`;
    await tg(env, 'editMessageText', {
      chat_id: cq.message.chat.id, message_id: cq.message.message_id, parse_mode: 'HTML',
      text: textoReserva(r).trim() + '\n\n' + pie, reply_markup: { inline_keyboard: [] },
    }).catch((e) => { if (!/not modified/i.test(e.descripcion || '')) console.error(e.message); });
  }
  if (res.ya) return responder(r.estado === 'confirmada' ? 'Ya estaba aceptada' : 'Ya estaba gestionada desde el panel');
  const em = res.email === true ? ' · email enviado' : res.email === 'error' ? ' · ⚠️ no se pudo enviar el email' : !r.email ? ' · sin email' : '';
  return responder((estado === 'confirmada' ? '✅ Aceptada' : '❌ Rechazada') + em, res.email === 'error');
}

// Botones de pedidos a domicilio: pa:<id>:<min> aceptar · pr:<id> rechazar · pc:<id> en camino / listo · pe:<id> entregado
const ACCION = { pa: 'aceptado', pr: 'rechazado', pc: 'en_camino', pe: 'entregado' };
const RESPUESTA = { aceptado: '✅ Aceptado', rechazado: '❌ Rechazado', en_camino: '🛵 En camino', entregado: '✔️ Entregado' };
async function botonPedido(ctx, cq, m, responder) {
  const { env } = ctx;
  const estado = ACCION[m[1]];
  let res;
  try { res = await estadoPedido(db(env), Number(m[2]), estado, { minutos: m[3], motivo: estado === 'rechazado' ? 'desde Telegram' : null }); }
  catch (e) {
    if (e instanceof HttpError && e.status === 404) return responder('No encuentro ese pedido', true);
    await responder('Error: hazlo desde el panel', true); throw e;
  }
  const p = { ...res.pedido, _quien: res.ya ? 'ya estaba gestionado' : nombreDe(cq.from) };
  if (cq.message) {
    await tg(env, 'editMessageText', { chat_id: cq.message.chat.id, message_id: cq.message.message_id, parse_mode: 'HTML', text: textoPedido(p).trim(), reply_markup: botonesPedido(p) })
      .catch((e) => { if (!/not modified/i.test(e.descripcion || '')) console.error(e.message); });
  }
  if (res.ya) return responder('Ya estaba gestionado');
  return responder(RESPUESTA[estado] + (estado === 'aceptado' ? ` · ${p.minutos} min` : ''));
}
