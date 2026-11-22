// POST /api/pedidos/sms {telefono} — manda un código por SMS para verificar el móvil
// Límites: solo móviles españoles, 1 SMS por minuto y 5 al día por número, 15 al día por IP.
import { json, db, handle, body, HttpError, normalizarTelefono, tablas, movilEspanol, enviarCodigo, smsConfigurado, smsPrueba } from './_pedidos.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const d = await body(request);
  if (d.web) return json({ ok: true });
  if (!smsConfigurado(env)) throw new HttpError(503, 'La verificación por SMS aún no está activa. Llámanos al 613 261 135.');
  const tel = normalizarTelefono(d.telefono);
  if (!tel || !movilEspanol(tel)) throw new HttpError(400, 'Escribe un móvil español válido (empieza por 6 o 7).');
  const DB = db(env); await tablas(DB);
  const ip = request.headers.get('cf-connecting-ip') || '';
  const q = (sql, ...a) => DB.prepare(sql).bind(...a).first().then((r) => r.n);
  if (await q(`SELECT COUNT(*) n FROM pedidos_sms WHERE telefono = ? AND creado > datetime('now','-60 seconds')`, tel)) throw new HttpError(429, 'Espera un minuto antes de pedir otro código.');
  if (await q(`SELECT COUNT(*) n FROM pedidos_sms WHERE telefono = ? AND creado > datetime('now','-1 day')`, tel) >= 5) throw new HttpError(429, 'Demasiados códigos para este número hoy. Llámanos al 613 261 135.');
  if (ip && await q(`SELECT COUNT(*) n FROM pedidos_sms WHERE ip = ? AND creado > datetime('now','-1 day')`, ip) >= 15) throw new HttpError(429, 'Demasiados intentos. Llámanos al 613 261 135.');
  await enviarCodigo(env, tel);
  await DB.prepare('INSERT INTO pedidos_sms (telefono, ip) VALUES (?, ?)').bind(tel, ip).run();
  return json({ ok: true, ...(smsPrueba(env) ? { prueba: 'Modo prueba: el código es 123456' } : {}) });
});
