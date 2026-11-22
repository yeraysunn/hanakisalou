// POST /api/pedidos/verificar {telefono, codigo} — comprueba el código y guarda el móvil verificado (cookie 90 días)
// DELETE /api/pedidos/verificar — «no soy yo»: olvida el móvil de este navegador
import { json, handle, body, HttpError, normalizarTelefono, movilEspanol, comprobarCodigo, cookieTelefono, cookieTelefonoFuera, telBonito } from './_pedidos.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const d = await body(request);
  const tel = normalizarTelefono(d.telefono);
  const codigo = String(d.codigo || '').replace(/\D/g, '');
  if (!tel || !movilEspanol(tel)) throw new HttpError(400, 'El móvil no es válido.');
  if (!/^\d{4,8}$/.test(codigo)) throw new HttpError(400, 'Escribe el código que te hemos enviado.');
  if (!(await comprobarCodigo(env, tel, codigo))) throw new HttpError(400, 'El código no es correcto o ha caducado. Pide otro.');
  const seguro = new URL(request.url).protocol === 'https:';
  return json({ ok: true, telefono: telBonito(tel) }, 200, { 'set-cookie': await cookieTelefono(env, tel, seguro) });
});
export const onRequestDelete = () => json({ ok: true }, 200, { 'set-cookie': cookieTelefonoFuera });
