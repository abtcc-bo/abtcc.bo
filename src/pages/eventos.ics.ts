// Calendario suscribible con todos los eventos públicos (en español): /eventos.ics
// Quien se suscribe una vez ve los eventos nuevos sin hacer nada más.
import type { APIRoute } from 'astro';
import { obtenerEventosPublicos } from '../lib/contenido';
import { generarIcs } from '../lib/eventos';
import { t } from '../i18n';

export const GET: APIRoute = async ({ site }) =>
	new Response(generarIcs(await obtenerEventosPublicos('es'), 'es', site!, `${t('es').sitio.sigla} · ${t('es').nav.eventos}`), {
		headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
	});
