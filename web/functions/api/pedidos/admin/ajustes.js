// POST /api/pedidos/admin/ajustes — {activo} · {pausa: minutos | 0} · {agotado: id, valor} · {oculto: id, valor}
import { json, db, handle, body, HttpError, ajustes, guardarAjuste, hoyMadrid, horaMadrid, POR_ID } from '../_pedidos.js';

export const onRequestPost = handle(async ({ request, env }) => {
  const d = await body(request);
  const DB = db(env);
  const aj = await ajustes(DB);
  if ('activo' in d) await guardarAjuste(DB, 'activo', d.activo ? '1' : '0');
  if ('pausa' in d) {
    const m = Math.max(0, Math.min(240, parseInt(d.pausa, 10) || 0));
    if (!m) await guardarAjuste(DB, 'pausa', '');
    else {
      const [h, mi] = horaMadrid().split(':').map(Number), t = Math.min(23 * 60 + 59, h * 60 + mi + m);
      await guardarAjuste(DB, 'pausa', `${hoyMadrid()} ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
    }
  }
  if ('agotado' in d) {
    if (!POR_ID[d.agotado]) throw new HttpError(400, 'Producto no válido.');
    const a = { ...aj.agotados }; if (d.valor) a[d.agotado] = hoyMadrid(); else delete a[d.agotado];
    await guardarAjuste(DB, 'agotados', JSON.stringify(a));
  }
  if ('oculto' in d) {
    if (!POR_ID[d.oculto]) throw new HttpError(400, 'Producto no válido.');
    const o = new Set(aj.ocultos); if (d.valor) o.add(d.oculto); else o.delete(d.oculto);
    await guardarAjuste(DB, 'ocultos', JSON.stringify([...o]));
  }
  return json({ ok: true, ajustes: await ajustes(DB) });
});
