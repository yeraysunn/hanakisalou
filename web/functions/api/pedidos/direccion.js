// GET /api/pedidos/direccion?q=… — sugerencias de direcciones de Salou (calles y portales) para el formulario
import { json, handle, buscarDirecciones } from './_pedidos.js';

export const onRequestGet = handle(async ({ request }) => {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 3) return json({ resultados: [] });
  return json({ resultados: await buscarDirecciones(q) }, 200, { 'cache-control': 'public, max-age=3600' });
});
