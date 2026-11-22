// /pedir/ (pedidos a domicilio) cerrado al público si PEDIDOS_PRIVADOS: solo con la sesión del panel abierta
import { cerrar, PEDIDOS_PRIVADOS } from '../_privado.js';
export const onRequest = cerrar(PEDIDOS_PRIVADOS, ['/pedir/', '/pedir', '/pedir/pedido', '/pedir/condiciones'], { pagina: true });
