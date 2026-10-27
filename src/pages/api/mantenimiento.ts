// Tarea diaria de mantenimiento. Vercel la ejecuta sola cada medianoche de Bolivia (ver "crons" en vercel.json),
// aunque nadie entre a la web ni se suban cambios durante meses.
//  1. Reconstruye el sitio, para que los eventos pasados dejen de aparecer como "próximos".
//  2. [Fase 3] Consulta Supabase para que el plan gratuito no pause el proyecto por inactividad.
import type { APIRoute } from 'astro';
import { CRON_SECRET, VERCEL_DEPLOY_HOOK_URL } from 'astro:env/server';

export const prerender = false;

type Resultado = 'ok' | 'sin configurar' | 'error';

export const GET: APIRoute = async ({ request }) => {
	// Solo Vercel conoce el secreto; así nadie más puede disparar reconstrucciones.
	if (!CRON_SECRET) return json({ error: 'CRON_SECRET no configurado' }, 503);
	if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) return json({ error: 'No autorizado' }, 401);

	const resultados = {
		reconstruccion: await reconstruirSitio(),
		// supabase: await mantenerSupabaseActivo(),  // [PENDIENTE fase 3]
	};
	const fallo = Object.values(resultados).includes('error');
	console.info('[mantenimiento]', JSON.stringify(resultados));
	return json(resultados, fallo ? 500 : 200);
};

async function reconstruirSitio(): Promise<Resultado> {
	if (!VERCEL_DEPLOY_HOOK_URL) return 'sin configurar';
	try {
		const respuesta = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
		return respuesta.ok ? 'ok' : 'error';
	} catch {
		return 'error';
	}
}

function json(datos: unknown, estado: number): Response {
	return new Response(JSON.stringify(datos), { status: estado, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
