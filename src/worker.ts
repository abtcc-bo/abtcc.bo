// Punto de entrada del Worker de Cloudflare (lo indica `main` en wrangler.jsonc).
//  - fetch: Astro responde las páginas y se añaden los encabezados de seguridad.
//  - scheduled: tarea diaria (cron en wrangler.jsonc, medianoche de Bolivia). Corre aunque nadie entre a la web.
import { handle } from '@astrojs/cloudflare/handler';
import { ENCABEZADOS_SEGURIDAD } from './lib/seguridad';
import { latido } from './lib/supabase';

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

	async scheduled(evento: { scheduledTime: number }, env: { SUPABASE_URL?: string; SUPABASE_KEY?: string }) {
		console.info('[mantenimiento] tarea diaria', new Date(evento.scheduledTime).toISOString());
		// Consulta diaria a Supabase: el plan gratuito pausa los proyectos que pasan 7 días sin actividad.
		if (env.SUPABASE_URL && env.SUPABASE_KEY) {
			const activo = await latido({ url: env.SUPABASE_URL, clave: env.SUPABASE_KEY });
			console.info('[mantenimiento] Supabase', activo ? 'respondió: sigue activo' : 'NO respondió: revisar el proyecto');
		}
	},
};
