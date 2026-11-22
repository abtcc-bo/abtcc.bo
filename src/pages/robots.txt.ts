// Reglas para buscadores: /robots.txt
// Todo lo público se puede rastrear; el área de socios y la API no.
import type { APIRoute } from 'astro';
import { IDIOMAS, ruta } from '../i18n';
import { VISTA_PREVIA } from '../lib/vistaPrevia';

export const GET: APIRoute = ({ site }) => {
	// Versión de prueba (rama distinta de `main`): nada se rastrea.
	if (VISTA_PREVIA) return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
	const lineas = [
		'User-agent: *',
		'Allow: /',
		...IDIOMAS.map((idioma) => `Disallow: ${ruta('socios', idioma)}`),
		'Disallow: /api/',
		'',
		`Sitemap: ${new URL('/sitemap.xml', site).href}`,
		'',
	];
	return new Response(lineas.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
