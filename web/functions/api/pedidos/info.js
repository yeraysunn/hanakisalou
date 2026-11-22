// GET /api/pedidos/info — carta, reglas y horario de hoy
import { sesionValida } from '../fidelidad/_lib.js';
import { json, db, handle, ajustes, horario, horarioPrueba, cartaPublica, CATEGORIAS, MINIMO, ENVIO, ENVIO_GRATIS } from './_pedidos.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const aj = await ajustes(db(env));
  const h = await sesionValida(request, env).catch(() => false) ? horarioPrueba() : horario(aj);
  return json({ ...h, minimo: MINIMO, envio: ENVIO, envioGratis: ENVIO_GRATIS, categorias: CATEGORIAS, carta: cartaPublica(aj) });
});
