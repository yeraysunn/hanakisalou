// GET /api/pedidos/info — carta, reglas, horario de hoy y si este navegador ya tiene el móvil verificado
import { json, db, handle, ajustes, horario, cartaPublica, CATEGORIAS, MINIMO, ENVIO, ENVIO_GRATIS, telefonoVerificado, telBonito, smsConfigurado } from './_pedidos.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const aj = await ajustes(db(env));
  const h = horario(aj);
  if (h.abierta && !smsConfigurado(env)) Object.assign(h, { abierta: false, motivo: 'Los pedidos online abren muy pronto. Mientras tanto, llámanos al 613 261 135.' });
  const tel = await telefonoVerificado(request, env);
  return json({
    ...h, minimo: MINIMO, envio: ENVIO, envioGratis: ENVIO_GRATIS, cps: aj.cps,
    categorias: CATEGORIAS, carta: cartaPublica(aj), telefono: tel ? telBonito(tel) : null,
  });
});
