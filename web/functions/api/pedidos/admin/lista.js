// GET /api/pedidos/admin/lista?fecha=YYYY-MM-DD — pedidos del día + ajustes (el panel lo consulta cada pocos segundos)
import { json, db, handle, tablas, ajustes, horario, hoyMadrid, itemsDe, CATALOGO } from '../_pedidos.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const DB = db(env); await tablas(DB);
  let fecha = new URL(request.url).searchParams.get('fecha') || hoyMadrid();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) fecha = hoyMadrid();
  const { results } = await DB.prepare('SELECT * FROM pedidos WHERE fecha = ? ORDER BY id DESC').bind(fecha).all();
  const aj = await ajustes(DB);
  return json({
    fecha, ajustes: aj, horario: horario(aj),
    pedidos: results.map(({ tg, ip, token, ...p }) => ({ ...p, items: itemsDe(p) })),
    carta: CATALOGO.map(({ id, num, nombre, cat }) => ({ id, num, nombre, cat })),
  });
});
