// GET /api/pedidos/info — carta, reglas y horario de hoy
import { json, db, handle, ajustes, horario, cartaPublica, CATEGORIAS, MINIMO, ENVIO, ENVIO_GRATIS } from './_pedidos.js';

export const onRequestGet = handle(async ({ env }) => {
  const aj = await ajustes(db(env));
  return json({ ...horario(aj), minimo: MINIMO, envio: ENVIO, envioGratis: ENVIO_GRATIS, cps: aj.cps, categorias: CATEGORIAS, carta: cartaPublica(aj) });
});
