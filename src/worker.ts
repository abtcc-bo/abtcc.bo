// Punto de entrada del Worker de Cloudflare (lo indica `main` en wrangler.jsonc).
//  - fetch: Astro responde las páginas y se añaden los encabezados de seguridad.
//  - scheduled: tarea diaria (cron en wrangler.jsonc, medianoche de Bolivia). Corre aunque nadie entre a la web.
import { handle } from '@astrojs/cloudflare/handler';
import { ENCABEZADOS_SEGURIDAD } from './lib/seguridad';

type Parametros = Parameters<typeof handle>;

export default {
	async fetch(request: Parametros[0], env: Parametros[1], contexto: Parametros[2]) {
		const original = await handle(request, env, contexto);
		const respuesta = new Response(original.body, original);
		for (const [nombre, valor] of Object.entries(ENCABEZADOS_SEGURIDAD)) {
			if (!respuesta.headers.has(nombre)) respuesta.headers.set(nombre, valor);
		}
		return respuesta;
	},

	async scheduled(evento: { scheduledTime: number }) {
		console.info('[mantenimiento] tarea diaria', new Date(evento.scheduledTime).toISOString());
		// [PENDIENTE fase 3] Consultar Supabase para que el plan gratuito no pause el proyecto por inactividad.
	},
};
