// ¿Está libre este nombre de usuario? Lo consulta "Mi cuenta" mientras el socio escribe (GET /api/socios/usuario/?u=…).
// Solo responde a un socio con sesión abierta: desde afuera no se puede averiguar quién es socio.
import type { APIRoute } from 'astro';
import { sesionActual } from '../../../lib/area-socios';
import { candidatosDeUsuario, crearLimite, normalizarUsuario, revisarUsuario, usuarioValido } from '../../../lib/socios';

export const prerender = false;

const superaLimite = crearLimite(60, 60 * 1000);

export const GET: APIRoute = async ({ url, cookies, clientAddress }) => {
	const responder = (cuerpo: unknown, status = 200) =>
		new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' } });

	if (superaLimite(clientAddress)) return responder({ error: 'demasiados' }, 429);
	const actual = await sesionActual(cookies, url);
	if (!actual) return responder({ error: 'sin-sesion' }, 401);

	const normalizado = normalizarUsuario((url.searchParams.get('u') ?? '').slice(0, 60));
	if (!usuarioValido(normalizado)) return responder({ normalizado, estado: 'invalido', sugerencias: [] });
	const candidatos = candidatosDeUsuario(normalizado, actual.socio.nombre);
	const revision = await revisarUsuario(actual.sesion.acceso, normalizado, candidatos);
	if (!revision) return responder({ error: 'servidor' }, 502);
	return responder({ normalizado, ...revision });
};
