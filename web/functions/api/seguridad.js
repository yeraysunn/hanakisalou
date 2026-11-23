// GET /api/seguridad — clave pública del antibots (Turnstile) para los formularios, o null si no está activado
import { json } from './fidelidad/_lib.js';
import { turnstileActivo } from './_seguridad.js';

export const onRequestGet = ({ env }) => json({ turnstile: turnstileActivo(env) ? env.TURNSTILE_SITE_KEY : null }, 200, { 'cache-control': 'public, max-age=300' });
