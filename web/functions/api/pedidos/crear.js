// POST /api/pedidos/crear — pedido a domicilio o para recoger. Exige móvil verificado por SMS (cookie).
// El total se recalcula aquí con los precios de _catalogo.js. Pago al recibir: efectivo o tarjeta (datáfono).
import { json, db, handle, body, HttpError, nuevoToken, tablas, ajustes, horario, calcular, telefonoVerificado, avisarTelegram, hoyMadrid, MAX_PENDIENTES, euros } from './_pedidos.js';

export const onRequestPost = handle(async (ctx) => {
  const { request, env } = ctx;
  const d = await body(request);
  if (d.web) return json({ ok: true });
  const tel = await telefonoVerificado(request, env);
  if (!tel) throw new HttpError(401, 'Verifica tu móvil para hacer el pedido.');
  const DB = db(env); await tablas(DB);
  const aj = await ajustes(DB);
  const h = horario(aj);
  if (!h.abierta) throw new HttpError(409, h.motivo);

  const limpio = (v, n) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, n);
  const tipo = d.tipo === 'recoger' ? 'recoger' : 'domicilio';
  const nombre = limpio(d.nombre, 60);
  if (nombre.length < 2) throw new HttpError(400, 'Escribe tu nombre.');
  let direccion = null, cp = null, notas = null;
  if (tipo === 'domicilio') {
    direccion = limpio(d.direccion, 160); cp = limpio(d.cp, 5); notas = limpio(d.notas_dir, 160) || null;
    if (direccion.length < 5) throw new HttpError(400, 'Escribe la dirección completa (calle y número).');
    if (!aj.cps.includes(cp)) throw new HttpError(400, `Lo sentimos, no repartimos en ese código postal. Repartimos en: ${aj.cps.join(', ')}. Puedes elegir «Recoger en el local».`);
  }
  let hora = null;
  if (d.hora) { hora = String(d.hora); if (!h.horas.includes(hora)) throw new HttpError(400, 'Esa hora ya no está disponible. Elige otra.'); }
  else if (!h.asap) throw new HttpError(400, 'Ahora estamos cerrados: elige una hora para más tarde.');
  const pago = d.pago === 'tarjeta' ? 'tarjeta' : 'efectivo';
  const { items, subtotal, envio, total } = calcular(d.items, tipo, aj);
  let cambio = null;
  if (pago === 'efectivo' && d.cambio) {
    cambio = Math.round(Number(d.cambio) * 100);
    if (!Number.isFinite(cambio) || cambio < total || cambio > 50000) throw new HttpError(400, `Indica con cuánto pagas (mínimo ${euros(total)}) o déjalo vacío si pagas justo.`);
  }
  if (!d.privacidad) throw new HttpError(400, 'Tienes que aceptar la política de privacidad.');
  const { n } = await DB.prepare(`SELECT COUNT(*) n FROM pedidos WHERE telefono = ? AND estado = 'pendiente'`).bind(tel).first();
  if (n >= MAX_PENDIENTES) throw new HttpError(429, 'Ya tienes pedidos esperando confirmación. Llámanos al 613 261 135.');

  const p = await DB.prepare(`INSERT INTO pedidos (token, tipo, nombre, telefono, direccion, cp, notas_dir, hora, pago, cambio, items, subtotal, envio, total, comentarios, ip, fecha)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`)
    .bind(nuevoToken(), tipo, nombre, tel, direccion, cp, notas, hora, pago, cambio, JSON.stringify(items), subtotal, envio, total,
      limpio(d.comentarios, 300) || null, request.headers.get('cf-connecting-ip') || '', hoyMadrid()).first();
  ctx.waitUntil(avisarTelegram(env, DB, p));
  return json({ ok: true, token: p.token, id: p.id }, 201);
});
