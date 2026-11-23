/* Ventana de bienvenida de la portada: «¿Qué te apetece hoy?» → a domicilio · recoger · comer en el restaurante.
   Sale una vez por visita (sessionStorage). APAGADA mientras los pedidos online sigan ocultos:
   para activarla al abrir los pedidos al público, poner PUBLICO = true.
   Vista previa sin activarla: hanakisalou.com/?pedidos=ver */
(function () {
  var PUBLICO = false;
  var verAhora = /[?&]pedidos=ver\b/.test(location.search);
  if (!PUBLICO && !verAhora) return;
  try { if (!verAhora && sessionStorage.getItem('hk-portada-vista')) return; } catch (e) {}
  if (navigator.webdriver && !verAhora) return;

  var ICO = {"moto": "<svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><circle cx=\"11\" cy=\"36\" r=\"5\"/><circle cx=\"38\" cy=\"36\" r=\"5\"/><rect class=\"a\" x=\"5.5\" y=\"11\" width=\"14\" height=\"10.5\" rx=\"2\"/><path class=\"a\" d=\"M5.5 16.25h14\"/><path d=\"M5 33.5c0-5.5 3.8-9 9.5-9h9.5l1 8.5H31\"/><path d=\"M31 33c1.8-6.5 2.4-13 1.6-19.5\"/><path d=\"M29 13.5h7\"/><path d=\"M34 21.5l4 14.5\"/></svg>", "caja": "<svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path d=\"M10.5 17h27l-3.4 23.3a2 2 0 0 1-2 1.7H15.9a2 2 0 0 1-2-1.7z\"/><path d=\"M10.5 17l4.5-7.5h18l4.5 7.5\"/><path class=\"a\" d=\"M19 9.5c0-5.5 10-5.5 10 0\"/><circle class=\"a\" cx=\"24\" cy=\"29\" r=\"4.5\"/></svg>", "bol": "<svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path d=\"M6.5 25h35c0 9-7.8 15-17.5 15S6.5 34 6.5 25z\"/><path d=\"M17 43h14\"/><path d=\"M12.5 25c1.6-4 5.4-6.5 9.5-6.5s7.9 2.5 9.5 6.5\"/><path class=\"a\" d=\"M27 19.5L36.5 4.5M31.5 20L42 7.5\"/></svg>"};
  var css = document.createElement('style');
  css.textContent =
    '.hkp{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;background:rgba(5,5,5,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .35s}' +
    '.hkp.on{opacity:1}' +
    '.hkp__in{position:relative;width:100%;max-width:520px;background:#0A0A0A;color:#B9B3A9;border:1px solid rgba(243,239,232,.14);border-radius:26px 26px 0 0;padding:26px 20px calc(24px + env(safe-area-inset-bottom));transform:translateY(30px);transition:transform .45s cubic-bezier(.2,.8,.2,1);font-family:Barlow,system-ui,sans-serif}' +
    '.hkp.on .hkp__in{transform:none}' +
    '@media (min-width:700px){.hkp{align-items:center}.hkp__in{border-radius:26px}}' +
    '.hkp__x{position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(243,239,232,.25);background:none;color:#F3EFE8;font-size:17px;cursor:pointer}' +
    '.hkp__etq{display:flex;align-items:center;gap:10px;font-size:11.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#9A948A}' +
    '.hkp__etq:before{content:"";width:8px;height:8px;border-radius:50%;background:#E0452E}' +
    '.hkp h2{font:900 clamp(44px,12vw,64px)/.9 "Big Shoulders Display",Impact,sans-serif;text-transform:uppercase;color:#F3EFE8;margin:12px 0 20px}' +
    '.hkp h2 em{font-style:normal;color:#E0452E}' +
    '.hkp__op{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;text-decoration:none;background:#161514;border:1px solid rgba(243,239,232,.14);border-radius:18px;padding:16px;margin-bottom:10px;color:#B9B3A9;transition:border-color .25s,transform .25s}' +
    '.hkp__op:hover{border-color:#E0452E;transform:translateY(-2px)}' +
    '.hkp__op i{display:grid;place-items:center;width:58px;height:58px;border-radius:16px;background:#0A0A0A}' +
    '.hkp__op i svg{width:42px;height:42px;fill:none;stroke:#F3EFE8;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.hkp__op i svg .a{stroke:#E0452E}' +
    '.hkp__op--rojo i{background:rgba(10,10,10,.12)}.hkp__op--rojo i svg,.hkp__op--rojo i svg .a{stroke:#0A0A0A}' +
    '.hkp__op b{display:block;font:900 24px/1 "Big Shoulders Display",Impact,sans-serif;text-transform:uppercase;color:#F3EFE8}' +
    '.hkp__op small{display:block;font-size:13px;line-height:1.4;margin-top:4px;color:#9A948A}' +
    '.hkp__op span:last-child{color:#E0452E;font-size:20px}' +
    '.hkp__op--rojo{background:#E0452E;border-color:#E0452E;color:#0A0A0A}.hkp__op--rojo b,.hkp__op--rojo small,.hkp__op--rojo span:last-child{color:#0A0A0A}' +
    '.hkp__no{display:block;width:100%;margin-top:6px;background:none;border:0;color:#9A948A;font-size:13.5px;text-decoration:underline;cursor:pointer;padding:10px}';
  document.head.appendChild(css);

  var d = document.createElement('div');
  d.className = 'hkp';
  d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'hkpTit');
  d.innerHTML = '<div class="hkp__in">' +
    '<button class="hkp__x" type="button" aria-label="Cerrar">✕</button>' +
    '<div class="hkp__etq">Hanaki Salou</div>' +
    '<h2 id="hkpTit">¿Qué te apetece<br>hoy<em>?</em></h2>' +
    '<a class="hkp__op hkp__op--rojo" href="/pedir/?modo=domicilio" data-ev="portada_domicilio"><i>' + ICO.moto + '</i><span><b>Pedir a domicilio</b><small>Te lo llevamos a casa en Salou · pago al recibir</small></span><span>→</span></a>' +
    '<a class="hkp__op" href="/pedir/?modo=recoger" data-ev="portada_recoger"><i>' + ICO.caja + '</i><span><b>Recoger en el local</b><small>Pide online y pásate a recogerlo</small></span><span>→</span></a>' +
    '<a class="hkp__op" href="/reservas/" data-ev="portada_reservar"><i>' + ICO.bol + '</i><span><b>Comer en el restaurante</b><small>Reserva tu mesa en el buffet libre</small></span><span>→</span></a>' +
    '<button class="hkp__no" type="button">Solo quiero ver la web</button>' +
    '</div>';

  function cerrar() {
    d.classList.remove('on'); document.documentElement.style.overflow = '';
    setTimeout(function () { d.remove(); }, 350);
  }
  function abrir() {
    try { sessionStorage.setItem('hk-portada-vista', '1'); } catch (e) {}
    document.body.appendChild(d); document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { d.classList.add('on'); });
    var b = d.querySelector('.hkp__op'); if (b) b.focus({ preventScroll: true });
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-ev]');
    if (a && window.HK_STATS) window.HK_STATS.evento(a.dataset.ev);
    if (e.target === d || e.target.closest('.hkp__x,.hkp__no')) cerrar();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.isConnected) cerrar(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(abrir, 600); });
  else setTimeout(abrir, 600);
})();
