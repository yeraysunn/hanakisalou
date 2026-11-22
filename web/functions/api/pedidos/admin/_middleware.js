// Protege /api/pedidos/admin/* con la sesión del panel (contraseña ADMIN_PASSWORD)
import { json, handle, sesionValida } from '../../reservas/_comun.js';

export const onRequest = handle(async ({ request, env, next }) => {
  if (!(await sesionValida(request, env))) return json({ error: 'Sesión caducada. Vuelve a entrar.' }, 401);
  return next();
});
