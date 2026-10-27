// Fuente RSS de próximos eventos por idioma: /es/eventos.xml
import type { APIRoute } from 'astro';
import { obtenerEventosPublicos, yaPaso } from '../../lib/contenido';
import { IDIOMAS, ruta, t, type Idioma } from '../../i18n';

export function getStaticPaths() {
	return IDIOMAS.map((idioma) => ({ params: { idioma } }));
}

const xml = (texto: string) => texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ params, site }) => {
	const idioma = params.idioma as Idioma;
	const textos = t(idioma);
	const eventos = (await obtenerEventosPublicos(idioma)).filter((e) => !yaPaso(e));
	const items = eventos.map((evento) => {
		const url = new URL(ruta('eventos', idioma, evento.slug), site).href;
		return `<item><title>${xml(evento.texto.data.titulo)}</title><link>${url}</link><guid>${url}</guid><description>${xml(evento.texto.data.resumen)}</description><pubDate>${evento.datos.inicio.toUTCString()}</pubDate></item>`;
	});
	const cuerpo = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${xml(`${textos.sitio.sigla} · ${textos.nav.eventos}`)}</title><link>${new URL(ruta('eventos', idioma), site).href}</link><description>${xml(textos.eventos.rssDescripcion)}</description><language>${idioma}</language>${items.join('')}</channel></rss>
`;
	return new Response(cuerpo, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
