// GET /api/pedidos/estado?t=<token> — seguimiento del pedido para el cliente
import { json, db, handle, HttpError, tablas, vistaCliente } from './_pedidos.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const t = new URL(request.url).searchParams.get('t') || '';
  if (!/^[a-f0-9]{32}$/.test(t)) throw new HttpError(400, 'Enlace no válido.');
  const DB = db(env); await tablas(DB);
  const p = await DB.prepare('SELECT * FROM pedidos WHERE token = ?').bind(t).first();
  if (!p) throw new HttpError(404, 'No encontramos ese pedido.');
  return json({ pedido: vistaCliente(p) });
});
