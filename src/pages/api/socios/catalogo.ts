// Catálogo de la biblioteca (GET /api/socios/catalogo/). Solo para socios activos con sesión abierta.
// Se entrega tal como está guardado en el depósito, sin procesarlo, para gastar lo mínimo del Worker.
import type { APIRoute } from 'astro';
import { sesionActual } from '../../../lib/area-socios';
import { catalogoCrudo } from '../../../lib/biblioteca';

export const prerender = false;

const ENCABEZADOS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' };

export const GET: APIRoute = async ({ cookies, url }) => {
	const actual = await sesionActual(cookies, url);
	if (!actual) return new Response(JSON.stringify({ error: 'sin-sesion' }), { status: 401, headers: ENCABEZADOS });
	if (actual.socio.estado !== 'activo') return new Response(JSON.stringify({ error: 'inactivo' }), { status: 403, headers: ENCABEZADOS });
	const objeto = await catalogoCrudo();
	return new Response(objeto ? objeto.body : '[]', { headers: ENCABEZADOS });
};
