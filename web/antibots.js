/* Antibots invisible de Cloudflare (Turnstile) para los formularios de reservas, pedidos y tarjeta.
   Solo se activa si en Cloudflare Pages existen TURNSTILE_SITE_KEY y TURNSTILE_SECRET (lo dice /api/seguridad).
   Uso en un formulario: var ts = await HK_ANTIBOTS.token();  → mandar como «ts» en el JSON. Después: HK_ANTIBOTS.reset(). */
(function () {
  var clave = null, widget = null, token = '', esperando = [];
  function avisar() { var e = esperando; esperando = []; e.forEach(function (f) { f(token); }); }
  window.HK_ANTIBOTS = {
    token: function () {
      if (!clave) return Promise.resolve('');
      if (token) return Promise.resolve(token);
      return new Promise(function (ok) { esperando.push(ok); setTimeout(function () { ok(token); }, 15000); });
    },
    reset: function () { token = ''; if (widget !== null && window.turnstile) window.turnstile.reset(widget); },
  };
  fetch('/api/seguridad').then(function (r) { return r.json(); }).then(function (j) {
    if (!j || !j.turnstile) return;
    clave = j.turnstile;
    window.hkTurnstileListo = function () {
      var caja = document.createElement('div'); caja.style.cssText = 'position:fixed;bottom:0;left:0;z-index:1';
      document.body.appendChild(caja);
      widget = window.turnstile.render(caja, {
        sitekey: clave, appearance: 'interaction-only', language: 'es',
        callback: function (t) { token = t; avisar(); },
        'expired-callback': function () { token = ''; window.turnstile.reset(widget); },
        'error-callback': function () { token = ''; },
      });
    };
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=hkTurnstileListo&render=explicit';
    s.async = true; document.head.appendChild(s);
  }).catch(function () {});
})();
