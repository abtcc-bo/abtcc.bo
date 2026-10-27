// Archivo .ics de cada evento ("Añadir a mi calendario" para Apple y Outlook): /es/calendario/slug.ics
import type { APIRoute } from 'astro';
import { obtenerEventosPublicos, type Evento } from '../../../lib/contenido';
import { generarIcs } from '../../../lib/eventos';
import { IDIOMAS, type Idioma } from '../../../i18n';

export async function getStaticPaths() {
	const rutas = await Promise.all(
		IDIOMAS.map(async (idioma) =>
			(await obtenerEventosPublicos(idioma)).filter((e) => !e.datos.por_confirmar).map((evento) => ({ params: { idioma, slug: evento.slug }, props: { evento } })),
		),
	);
	return rutas.flat();
}

export const GET: APIRoute = ({ params, props, site }) =>
	new Response(generarIcs([props.evento as Evento], params.idioma as Idioma, site!), {
		headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
	});
