// POST /api/pedidos/admin/estado {id, estado, minutos?, motivo?} — aceptar/rechazar/en camino/entregado desde el panel
// POST {id, impreso: 1} — marca el ticket como impreso
import { json, db, handle, body, HttpError, tablas, cambiarEstado, refrescarTelegram, avisarCliente, itemsDe } from '../_pedidos.js';

export const onRequestPost = handle(async (ctx) => {
  const { request, env } = ctx;
  const d = await body(request);
  const DB = db(env); await tablas(DB);
  if (d.impreso) {
    await DB.prepare('UPDATE pedidos SET impreso = impreso + 1 WHERE id = ?').bind(Number(d.id)).run();
    return json({ ok: true });
  }
  const motivo = d.motivo ? String(d.motivo).slice(0, 120) : null;
  const { pedido, ya } = await cambiarEstado(DB, d.id, String(d.estado || ''), { minutos: d.minutos, motivo });
  if (ya && pedido.estado !== d.estado) throw new HttpError(409, 'Ese pedido ya estaba gestionado (' + pedido.estado + ').');
  ctx.waitUntil(refrescarTelegram(env, { ...pedido, _quien: 'panel' }));
  if (!ya) ctx.waitUntil(avisarCliente(env, pedido, new URL(request.url).origin)); // email al cliente: aceptado, en camino, rechazado…
  const { tg, ip, token, ...p } = pedido;
  return json({ ok: true, pedido: { ...p, items: itemsDe(pedido) } });
});
