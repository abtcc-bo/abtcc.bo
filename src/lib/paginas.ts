// Lista única de las páginas HTML del sitio. La usan el generador de páginas ([...ruta].astro) y el sitemap,
// así lo que se publica y lo que se anuncia a Google nunca difieren.
import type { CollectionEntry } from 'astro:content';
import { VISTAS } from '../vistas';
import { obtenerEventosPublicos, paginaDeSeccion, type Evento } from './contenido';
import { IDIOMAS, SECCIONES, ruta, type Alternos, type Idioma, type Seccion } from '../i18n';

/**
 * Secciones que se generan en cada visita en lugar de al publicar, para que los eventos pasados
 * desaparezcan solos de "próximos". Cada una necesita su archivo en src/pages/{es,en,pt}/ (ver CLAUDE.md).
 */
export const SECCIONES_DINAMICAS: Seccion[] = ['inicio', 'eventos'];

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
			/** true = se genera en cada visita (SECCIONES_DINAMICAS). */
			dinamica: boolean;
	  }
	| { tipo: 'evento'; idioma: Idioma; evento: Evento; alternos: Alternos; indexable: true; dinamica: false };

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
						dinamica: SECCIONES_DINAMICAS.includes(seccion),
					},
				}));
			}),
		);
		const eventos = await Promise.all(
			IDIOMAS.map(async (idioma) =>
				(await obtenerEventosPublicos(idioma)).map((evento) => ({
					url: ruta('eventos', idioma, evento.slug),
					datos: { tipo: 'evento' as const, idioma, evento, alternos: evento.alternos, indexable: true as const, dinamica: false as const },
				})),
			),
		);
		return [...secciones.flat(), ...eventos.flat()];
	})();
	return cache;
}

/** Página del sitio por su URL (p. ej. "/es/eventos/"). Para las páginas dinámicas de src/pages/{es,en,pt}/. */
export async function buscarPagina(url: string): Promise<PaginaDelSitio> {
	const encontrada = (await paginasDelSitio()).find((p) => p.url === url);
	if (!encontrada) throw new Error(`No hay ninguna página del sitio en "${url}". Revisa SECCIONES y SECCIONES_DINAMICAS.`);
	return encontrada.datos;
}
