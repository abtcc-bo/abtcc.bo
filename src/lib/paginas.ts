// Lista única de las páginas HTML del sitio. La usan el generador de páginas ([...ruta].astro) y el sitemap,
// así lo que se publica y lo que se anuncia a Google nunca difieren.
import type { CollectionEntry } from 'astro:content';
import { VISTAS } from '../vistas';
import { obtenerEventosPublicos, paginaDeSeccion, type Evento } from './contenido';
import { IDIOMAS, SECCIONES, ruta, type Alternos, type Idioma, type Seccion } from '../i18n';

export type PaginaDelSitio =
	| {
			tipo: 'seccion';
			idioma: Idioma;
			seccion: Seccion;
			pagina?: CollectionEntry<'paginas'>;
			/** Versiones con contenido real en cada idioma. */
			alternos: Alternos;
			/** false = no se muestra en Google (área de socios o sección en construcción). */
			indexable: boolean;
	  }
	| { tipo: 'evento'; idioma: Idioma; evento: Evento; alternos: Alternos; indexable: true };

let cache: Promise<{ url: string; datos: PaginaDelSitio }[]> | undefined;

export function paginasDelSitio() {
	if (cache && !import.meta.env.DEV) return cache;
	cache = (async () => {
		const secciones = await Promise.all(
			(Object.keys(SECCIONES) as Seccion[]).map(async (seccion) => {
				const paginas = Object.fromEntries(await Promise.all(IDIOMAS.map(async (idioma) => [idioma, await paginaDeSeccion(seccion, idioma)] as const)));
				const conContenido = IDIOMAS.filter((idioma) => VISTAS[seccion] || paginas[idioma]);
				const alternos: Alternos = Object.fromEntries(conContenido.map((idioma) => [idioma, ruta(seccion, idioma)]));
				return IDIOMAS.map((idioma) => ({
					url: ruta(seccion, idioma),
					datos: {
						tipo: 'seccion' as const,
						idioma,
						seccion,
						pagina: paginas[idioma],
						alternos,
						indexable: seccion !== 'socios' && conContenido.includes(idioma),
					},
				}));
			}),
		);
		const eventos = await Promise.all(
			IDIOMAS.map(async (idioma) =>
				(await obtenerEventosPublicos(idioma)).map((evento) => ({
					url: ruta('eventos', idioma, evento.slug),
					datos: { tipo: 'evento' as const, idioma, evento, alternos: evento.alternos, indexable: true as const },
				})),
			),
		);
		return [...secciones.flat(), ...eventos.flat()];
	})();
	return cache;
}
