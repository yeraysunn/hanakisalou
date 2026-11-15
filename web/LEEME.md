# Hanaki Salou · web nueva (mismo diseño que Barcelona)

Ver en este Mac: doble clic en `ver-web-nueva.command` (carpeta de arriba) → http://localhost:8792/ · panel /admin/ (contraseña local: hanaki). Datos de prueba, no envía nada.

## Qué hay
- Inicio, carta (platos, fotos, alérgenos y bebidas de Salou), ubicación, legal (Hanakisalou S.L.), 404.
- Reservas online visibles: /reservas/ (turnos 12:30–16:15 y 19:30–23:15, cada 15 min). Aviso por Telegram y email.
- Tarjeta de puntos montada pero OCULTA: `FIDELIDAD_PRIVADA = true` en `functions/_privado.js`.
  Para abrirla: ponerlo a false, quitar los `<template id="fid-privado">` de index.html y carta.html y añadir /fidelidad/ a sitemap.xml.
- Panel /admin/: reservas, fidelización, carta editable, estadísticas y promos.

## Publicar (Cloudflare Pages, una vez)
La web anterior está en Hostinger; esta necesita Cloudflare (funciones + base de datos).
1. Cloudflare → Workers & Pages → Create → Pages → conectar el repo `hanakisalou` → *Root directory*: `web` → sin comando de build.
2. D1 → Create → `hanaki-salou` → Console → pegar `fidelidad/schema.sql` → Execute.
3. Proyecto → Settings → Bindings → D1 → variable `DB` → `hanaki-salou`.
4. Settings → Variables and Secrets (tipo Secret):
   - `ADMIN_PASSWORD` (contraseña del panel)
   - `RESEND_API_KEY` (emails) · opcional `EMAIL_FROM` = `Hanaki Salou <reservas@hanakisalou.com>`, `EMAIL_RESPUESTAS` = hanakisalou@gmail.com
   - `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` (bot propio de Hanaki Salou)
     Las reservas pendientes llegan al grupo con botones ✅ Aceptar / ❌ Rechazar (confirman o rechazan y mandan el email al cliente).
     Para conectar los botones, una vez (o si cambia la clave del bot): abrir `/api/telegram/setup?key=<secreto>`, donde el secreto es
     `TELEGRAM_WEBHOOK_SECRET` si existe o, si no, los 48 primeros caracteres hex de SHA-256(`hanaki-webhook:` + clave del bot).
     Opcional `TELEGRAM_STAFF_IDS`: IDs de Telegram del personal que pueden pulsar los botones fuera del grupo.
   - opcional `GOOGLE_RESENA_URL` (enlace «Pedir reseñas» de Google Business)
5. Deployments → Retry deployment.
6. Dominio: Custom domains → hanakisalou.com (mover los DNS a Cloudflare o apuntar el CNAME). Hasta entonces se prueba en la URL *.pages.dev.

## Resend
Plan gratis: 3.000 emails/mes, máx. 100 al día, 1 dominio. Cuenta con cualquier email (vale hanakisalou@gmail.com);
para enviar como @hanakisalou.com hay que verificar el dominio añadiendo sus registros DNS.
