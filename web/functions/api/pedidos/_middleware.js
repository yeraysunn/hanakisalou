// APIs de cliente de pedidos cerradas si PEDIDOS_PRIVADOS (el webhook de Telegram y /admin/ no pasan por aquí o piden contraseña)
import { cerrar, PEDIDOS_PRIVADOS } from '../../_privado.js';
export const onRequest = cerrar(PEDIDOS_PRIVADOS, ['/api/pedidos/info', '/api/pedidos/sms', '/api/pedidos/verificar', '/api/pedidos/crear', '/api/pedidos/estado'], { mensaje: 'Los pedidos online todavía no están disponibles.' });
