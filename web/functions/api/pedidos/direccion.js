// GET /api/pedidos/direccion?q=… — sugerencias de direcciones de Salou (calles y portales) para el formulario
import { json, db, handle, buscarDirecciones } from './_pedidos.js';
import { limitar } from '../_seguridad.js';

export const onRequestGet = handle(async ({ request, env }) => {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 3) return json({ resultados: [] });
  await limitar(env, db(env), request, 'direccion', 150, 600, { mensaje: 'Demasiadas búsquedas seguidas. Espera un momento.' }); // evita usarlo como proxy gratis
  return json({ resultados: await buscarDirecciones(q) }, 200, { 'cache-control': 'public, max-age=3600' });
});
