// POST /api/fidelidad/admin/login  {password}   ·   GET = comprobar sesión   ·   DELETE = cerrar sesión
import { json, db, handle, body, HttpError, passwordCorrecta, cookieSesion, cookieCerrar, sesionValida } from '../_lib.js';
import { limitar, apuntar } from '../../_seguridad.js';

// GET = ¿hay sesión abierta? (la usa la pantalla de bienvenida /admin/)
export const onRequestGet = handle(async ({ request, env }) => json({ ok: await sesionValida(request, env) }));

export const onRequestPost = handle(async ({ request, env }) => {
  const { password } = await body(request);
  // Máximo 8 contraseñas fallidas cada 15 minutos por IP (y 60 al día): adivinarla a lo bruto es imposible
  const DB = db(env);
  const msg = 'Demasiados intentos fallidos. Espera 15 minutos y vuelve a probar.';
  const clave = await limitar(env, DB, request, 'login', 8, 900, { apuntar: false, mensaje: msg });
  await limitar(env, DB, request, 'login', 60, 86400, { apuntar: false, mensaje: msg });
  if (!(await passwordCorrecta(env, password))) {
    await apuntar(DB, clave);
    await new Promise((r) => setTimeout(r, 800)); // frena intentos a lo bruto
    throw new HttpError(401, 'Contraseña incorrecta.');
  }
  return json({ ok: true }, 200, { 'set-cookie': await cookieSesion(env) });
});

export const onRequestDelete = () => json({ ok: true }, 200, { 'set-cookie': cookieCerrar });
