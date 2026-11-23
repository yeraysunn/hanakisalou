// POST /api/pedidos/crear — pedido a domicilio o para recoger (nombre, móvil, email; sin verificación).
// El total se recalcula aquí con los precios de _catalogo.js. Pago al recibir: efectivo o tarjeta (datáfono).
// Aviso al local por Telegram (marca cliente nuevo / habitual) y email «Hemos recibido tu pedido» al cliente.
import { sesionValida } from '../fidelidad/_lib.js';
import { horarioPrueba } from './_pedidos.js';
import { json, db, handle, body, HttpError, nuevoToken, comprobarDireccion, alcoholPermitido, HORA_LIMITE_ALCOHOL, normalizarTelefono, tablas, ajustes, horario, calcular, avisarTelegram, avisarCliente, previos, hoyMadrid, MAX_PENDIENTES, euros } from './_pedidos.js';

export const onRequestPost = handle(async (ctx) => {
  const { request, env } = ctx;
  const d = await body(request);
  if (d.web) return json({ ok: true });
  const DB = db(env); await tablas(DB);
  const aj = await ajustes(DB);
  const prueba = await sesionValida(request, env).catch(() => false);
  const h = prueba ? horarioPrueba() : horario(aj);
  if (!h.abierta) throw new HttpError(409, h.motivo);

  const limpio = (v, n) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, n);
  const tipo = d.tipo === 'recoger' ? 'recoger' : 'domicilio';
  const nombre = limpio(d.nombre, 60);
  if (nombre.length < 2) throw new HttpError(400, 'Escribe tu nombre.');
  const tel = normalizarTelefono(d.telefono);
  if (!tel) throw new HttpError(400, 'Escribe un teléfono válido.');
  const email = String(d.email || '').trim().toLowerCase().slice(0, 120);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'Escribe un email válido.');
  let direccion = null, cp = null, notas = null, lat = null, lng = null;
  if (tipo === 'domicilio') {
    if (!d.confirma_ubicacion) throw new HttpError(400, 'Confirma que la dirección y el punto del mapa son correctos.');
    ({ direccion, cp, lat, lng } = await comprobarDireccion(limpio(d.direccion, 160))); // solo portales reales de Salou
    notas = limpio(d.notas_dir, 160) || null;
  }
  let hora = null;
  if (d.hora) { hora = String(d.hora); if (!h.horas.includes(hora)) throw new HttpError(400, 'Esa hora ya no está disponible. Elige otra.'); }
  else if (!h.asap) throw new HttpError(400, 'Ahora estamos cerrados: elige una hora para más tarde.');
  const pago = d.pago === 'tarjeta' ? 'tarjeta' : 'efectivo';
  const { items, subtotal, envio, total, alcohol } = calcular(d.items, tipo, aj);
  if (alcohol) {
    if (!alcoholPermitido(hora)) throw new HttpError(400, `Las bebidas con alcohol solo se venden para entregar antes de las ${HORA_LIMITE_ALCOHOL}. Quítalas del pedido o elige una hora anterior.`);
    if (!d.mayor18) throw new HttpError(400, 'Tu pedido lleva alcohol: confirma que eres mayor de 18 años. Te pediremos el DNI al entregarlo.');
  }
  let cambio = null;
  if (pago === 'efectivo' && d.cambio) {
    cambio = Math.round(Number(d.cambio) * 100);
    if (!Number.isFinite(cambio) || cambio < total || cambio > 50000) throw new HttpError(400, `Indica con cuánto pagas (mínimo ${euros(total)}) o déjalo vacío si pagas justo.`);
  }
  if (!d.privacidad) throw new HttpError(400, 'Tienes que aceptar las condiciones de venta y la política de privacidad.');
  const { n } = await DB.prepare(`SELECT COUNT(*) n FROM pedidos WHERE telefono = ? AND estado = 'pendiente'`).bind(tel).first();
  if (n >= MAX_PENDIENTES) throw new HttpError(429, 'Ya tienes pedidos esperando confirmación. Llámanos al 613 261 135.');

  const p = await DB.prepare(`INSERT INTO pedidos (lat, lng, prueba, token, tipo, nombre, telefono, email, previos, direccion, cp, notas_dir, hora, pago, cambio, items, subtotal, envio, total, comentarios, ip, fecha)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`)
    .bind(lat, lng, prueba ? 1 : 0, nuevoToken(), tipo, nombre, tel, email, await previos(DB, tel), direccion, cp, notas, hora, pago, cambio, JSON.stringify(items), subtotal, envio, total,
      limpio(d.comentarios, 300) || null, request.headers.get('cf-connecting-ip') || '', hoyMadrid()).first();
  ctx.waitUntil(avisarTelegram(env, DB, p));
  ctx.waitUntil(avisarCliente(env, p, new URL(request.url).origin));
  return json({ ok: true, token: p.token, id: p.id }, 201);
});
