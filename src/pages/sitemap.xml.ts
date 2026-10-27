// Mapa del sitio para Google: /sitemap.xml
// Incluye solo las páginas indexables y, para cada una, sus versiones en otros idiomas (hreflang).
import type { APIRoute } from 'astro';
import { paginasDelSitio } from '../lib/paginas';
import { IDIOMA_PRINCIPAL } from '../i18n';

export const GET: APIRoute = async ({ site }) => {
	const absoluta = (ruta: string) => new URL(ruta, site).href;
	const urls = (await paginasDelSitio())
		.filter(({ datos }) => datos.indexable)
		.map(({ url, datos }) => {
			const alternos = Object.entries(datos.alternos);
			const enlaces = alternos.map(([idioma, ruta]) => `<xhtml:link rel="alternate" hreflang="${idioma}" href="${absoluta(ruta)}"/>`);
			const principal = datos.alternos[IDIOMA_PRINCIPAL];
			if (principal) enlaces.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${absoluta(principal)}"/>`);
			return `<url><loc>${absoluta(url)}</loc>${enlaces.join('')}</url>`;
		});
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
