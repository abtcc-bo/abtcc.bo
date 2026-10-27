// Reglas para buscadores: /robots.txt
// Todo lo público se puede rastrear; el área de socios y la API no.
import type { APIRoute } from 'astro';
import { IDIOMAS, ruta } from '../i18n';

export const GET: APIRoute = ({ site }) => {
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
