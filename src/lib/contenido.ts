// Acceso al contenido ya combinado y validado. Las vistas usan estas funciones, no getCollection directamente.
import { getCollection, type CollectionEntry } from 'astro:content';
import { IDIOMAS, esIdioma, ruta, type Alternos, type Idioma, type Seccion } from '../i18n';

/** "es/mi-articulo" → "es". */
export function idiomaDeEntrada(id: string): Idioma {
	const idioma = id.split('/')[0];
	if (!esIdioma(idioma)) throw new Error(`"${id}" no está dentro de una carpeta de idioma (es, en, pt).`);
	return idioma;
}

// ---------- Páginas institucionales ----------

export async function paginaDeSeccion(seccion: Seccion, idioma: Idioma): Promise<CollectionEntry<'paginas'> | undefined> {
	const encontradas = await getCollection('paginas', (p) => p.data.clave === seccion && idiomaDeEntrada(p.id) === idioma);
	if (encontradas.length > 1) {
		throw new Error(`Hay ${encontradas.length} páginas con clave "${seccion}" en ${idioma}: ${encontradas.map((p) => p.id).join(', ')}.`);
	}
	return encontradas[0];
}

// ---------- Eventos ----------

export interface Evento {
	/** Nombre de la carpeta, p. ej. "2026-11-14-taller-act-estres". */
	id: string;
	/** Parte de la URL, sin la fecha: "taller-act-estres". */
	slug: string;
	datos: CollectionEntry<'eventos'>['data'];
	/** Textos en el idioma pedido. */
	texto: CollectionEntry<'eventosTextos'>;
	/** URL del evento en cada idioma en que existe. */
	alternos: Alternos;
}

let cacheEventos: Promise<Map<string, { datos: CollectionEntry<'eventos'>; textos: Partial<Record<Idioma, CollectionEntry<'eventosTextos'>>> }>> | undefined;

/** Une datos y textos de cada evento y comprueba que todo evento tenga su texto en español. */
function eventosCombinados() {
	// En desarrollo no se guarda en caché, para ver al instante los cambios en los archivos.
	if (cacheEventos && !import.meta.env.DEV) return cacheEventos;
	cacheEventos = (async () => {
		const [datos, textos] = await Promise.all([getCollection('eventos'), getCollection('eventosTextos')]);
		const mapa = new Map(datos.map((d) => [d.id, { datos: d, textos: {} as Partial<Record<Idioma, CollectionEntry<'eventosTextos'>>> }]));
		for (const texto of textos) {
			const [carpeta, idioma] = texto.id.split('/');
			const evento = mapa.get(carpeta);
			if (!evento) throw new Error(`La carpeta de evento "${carpeta}" tiene ${idioma}.md pero le falta evento.yaml.`);
			evento.textos[idioma as Idioma] = texto;
		}
		const slugs = new Map<string, string>();
		for (const [id, evento] of mapa) {
			if (!evento.textos.es) throw new Error(`Al evento "${id}" le falta su texto en español (es.md).`);
			const slug = slugDeEvento(id);
			if (slugs.has(slug)) throw new Error(`Los eventos "${slugs.get(slug)}" y "${id}" tendrían la misma dirección (/${slug}/). Cambia el nombre de una carpeta.`);
			slugs.set(slug, id);
		}
		return mapa;
	})();
	return cacheEventos;
}

function slugDeEvento(id: string): string {
	return id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

/** Eventos con texto en `idioma`, ordenados por fecha de inicio (el más próximo primero). */
export async function obtenerEventos(idioma: Idioma): Promise<Evento[]> {
	const mapa = await eventosCombinados();
	const lista: Evento[] = [];
	for (const [id, { datos, textos }] of mapa) {
		const texto = textos[idioma];
		if (!texto) continue;
		const slug = slugDeEvento(id);
		const alternos = Object.fromEntries(IDIOMAS.filter((i) => textos[i]).map((i) => [i, ruta('eventos', i, slug)]));
		lista.push({ id, slug, datos: datos.data, texto, alternos });
	}
	return lista.sort((a, b) => a.datos.inicio.getTime() - b.datos.inicio.getTime());
}

/** Un evento ya terminó cuando pasó su fin (o su inicio, si no tiene fin). */
export function yaPaso(evento: Evento, ahora = new Date()): boolean {
	return (evento.datos.fin ?? evento.datos.inicio) < ahora;
}

// ---------- Personas ----------

/** Integrantes de la comisión directiva, en su orden de aparición. */
export async function obtenerComision(): Promise<CollectionEntry<'personas'>[]> {
	const personas = await getCollection('personas', (p) => p.data.comision);
	return personas.sort((a, b) => a.data.orden - b.data.orden || a.data.nombre.localeCompare(b.data.nombre));
}

/** Cargo y bio en `idioma`; si no están traducidos, los de español (con `idioma: 'es'` para marcarlo en el HTML). */
export function textosDePersona(persona: CollectionEntry<'personas'>, idioma: Idioma) {
	const propios = persona.data.textos[idioma];
	return propios ? { ...propios, idioma } : { ...persona.data.textos.es, idioma: 'es' as Idioma };
}

// ---------- Blog ----------

/** Artículos publicados en `idioma`, del más reciente al más antiguo. Los borradores solo se ven en desarrollo. */
export async function obtenerArticulos(idioma: Idioma): Promise<CollectionEntry<'blog'>[]> {
	const articulos = await getCollection('blog', (a) => idiomaDeEntrada(a.id) === idioma && (import.meta.env.DEV || !a.data.borrador));
	return articulos.sort((a, b) => b.data.publicado.getTime() - a.data.publicado.getTime());
}
