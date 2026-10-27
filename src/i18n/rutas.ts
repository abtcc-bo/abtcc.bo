export const IDIOMAS = ['es', 'en', 'pt'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_PRINCIPAL: Idioma = 'es';

/**
 * Ruta de cada sección en cada idioma (sin el prefijo de idioma).
 * Para agregar una sección: añadirla aquí y su nombre en `nav` de los tres JSON.
 */
export const SECCIONES = {
	inicio: { es: '', en: '', pt: '' },
	nosotros: { es: 'nosotros', en: 'about', pt: 'sobre' },
	comision: { es: 'nosotros/comision-directiva', en: 'about/board', pt: 'sobre/diretoria' },
	transparencia: { es: 'nosotros/transparencia', en: 'about/transparency', pt: 'sobre/transparencia' },
	eventos: { es: 'eventos', en: 'events', pt: 'eventos' },
	membresia: { es: 'membresia', en: 'membership', pt: 'filiacao' },
	blog: { es: 'blog', en: 'blog', pt: 'blog' },
	recursos: { es: 'recursos', en: 'resources', pt: 'recursos' },
	contacto: { es: 'contacto', en: 'contact', pt: 'contato' },
	socios: { es: 'socios', en: 'members', pt: 'socios' },
	privacidad: { es: 'privacidad', en: 'privacy', pt: 'privacidade' },
	avisoLegal: { es: 'aviso-legal', en: 'legal-notice', pt: 'aviso-legal' },
} as const satisfies Record<string, Record<Idioma, string>>;

export type Seccion = keyof typeof SECCIONES;

/** Sección que contiene a otra (para las migas de pan). Sin entrada, cuelga directamente de Inicio. */
export const PADRES: Partial<Record<Seccion, Seccion>> = {
	comision: 'nosotros',
	transparencia: 'nosotros',
};

/** Subsecciones de una sección según PADRES (p. ej. nosotros → comisión, transparencia). Forman su submenú. */
export function hijasDe(seccion: Seccion): Seccion[] {
	return (Object.entries(PADRES) as [Seccion, Seccion][]).filter(([, padre]) => padre === seccion).map(([hija]) => hija);
}

/** Cadena de secciones desde Inicio hasta `seccion`, ambas incluidas. */
export function cadenaDeSecciones(seccion: Seccion): Seccion[] {
	const cadena: Seccion[] = [];
	for (let actual: Seccion | undefined = seccion; actual && actual !== 'inicio'; actual = PADRES[actual]) {
		cadena.unshift(actual);
	}
	return ['inicio', ...cadena];
}

/** Secciones del menú principal, en orden. */
export const MENU: Seccion[] = ['nosotros', 'eventos', 'membresia', 'blog', 'contacto'];

/** Secciones enlazadas en el pie de página. */
export const MENU_LEGAL: Seccion[] = ['transparencia', 'privacidad', 'avisoLegal'];

/** URL de una sección (o de un contenido dentro de ella, con `slug`), siempre con barra final. */
export function ruta(seccion: Seccion, idioma: Idioma, slug?: string): string {
	const partes = [idioma, SECCIONES[seccion][idioma], slug].filter(Boolean);
	return `/${partes.join('/')}/`;
}

/** Versiones de una página por idioma; un idioma ausente significa que no existe en ese idioma. */
export type Alternos = Partial<Record<Idioma, string>>;

export function alternosDeSeccion(seccion: Seccion): Alternos {
	return Object.fromEntries(IDIOMAS.map((idioma) => [idioma, ruta(seccion, idioma)]));
}

export function esIdioma(valor: unknown): valor is Idioma {
	return IDIOMAS.includes(valor as Idioma);
}
