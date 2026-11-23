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
    '.hkp__op i{font-style:normal;font-size:32px;line-height:1}' +
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
    '<a class="hkp__op hkp__op--rojo" href="/pedir/?modo=domicilio" data-ev="portada_domicilio"><i>🛵</i><span><b>Pedir a domicilio</b><small>Te lo llevamos a casa en Salou · pago al recibir</small></span><span>→</span></a>' +
    '<a class="hkp__op" href="/pedir/?modo=recoger" data-ev="portada_recoger"><i>🥡</i><span><b>Recoger en el local</b><small>Pide online y pásate por Carrer Major, 6</small></span><span>→</span></a>' +
    '<a class="hkp__op" href="/reservas/" data-ev="portada_reservar"><i>🍣</i><span><b>Comer en el restaurante</b><small>Reserva tu mesa en el buffet libre</small></span><span>→</span></a>' +
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
