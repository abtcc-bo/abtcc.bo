import es from './es.json';
import en from './en.json';
import pt from './pt.json';
import { IDIOMAS, type Idioma } from './rutas';

export * from './rutas';

export type Diccionario = typeof es;

const DICCIONARIOS: Record<Idioma, Diccionario> = { es, en, pt };

/** Textos de interfaz de un idioma. */
export function t(idioma: Idioma): Diccionario {
	return DICCIONARIOS[idioma];
}

/** Reemplaza {variables} en un texto: formato('{n} horas', { n: 4 }) → "4 horas". */
export function formato(texto: string, variables: Record<string, string | number>): string {
	return texto.replace(/\{(\w+)\}/g, (_, nombre) => String(variables[nombre] ?? `{${nombre}}`));
}

// Si a en.json o pt.json le falta (o le sobra) una clave respecto a es.json, la construcción falla.
function claves(objeto: object, prefijo = ''): string[] {
	return Object.entries(objeto).flatMap(([clave, valor]) =>
		typeof valor === 'object' && valor !== null ? claves(valor, `${prefijo}${clave}.`) : [`${prefijo}${clave}`],
	);
}
const clavesEs = new Set(claves(es));
for (const idioma of IDIOMAS) {
	const propias = new Set(claves(DICCIONARIOS[idioma]));
	const faltan = [...clavesEs].filter((c) => !propias.has(c));
	const sobran = [...propias].filter((c) => !clavesEs.has(c));
	if (faltan.length || sobran.length) {
		throw new Error(`src/i18n/${idioma}.json no coincide con es.json. Faltan: ${faltan.join(', ') || '—'}. Sobran: ${sobran.join(', ') || '—'}.`);
	}
}

export const LOCALE_INTL: Record<Idioma, string> = { es: 'es-BO', en: 'en-US', pt: 'pt-BR' };

/** Formato de idioma para Open Graph (es_BO, en_US, pt_BR). */
export function localeOpenGraph(idioma: Idioma): string {
	return LOCALE_INTL[idioma].replace('-', '_');
}
export const ZONA_HORARIA = 'America/La_Paz';

/** "14 de noviembre de 2026" / "November 14, 2026" / "14 de novembro de 2026". */
export function formatearFecha(fecha: Date, idioma: Idioma, opciones: Intl.DateTimeFormatOptions = { dateStyle: 'long' }): string {
	return new Intl.DateTimeFormat(LOCALE_INTL[idioma], { timeZone: ZONA_HORARIA, ...opciones }).format(fecha);
}

/** Hora en Bolivia, p. ej. "09:00". */
export function formatearHora(fecha: Date, idioma: Idioma): string {
	return new Intl.DateTimeFormat(LOCALE_INTL[idioma], { timeZone: ZONA_HORARIA, hour: '2-digit', minute: '2-digit', hour12: false }).format(fecha);
}

/** "14 de noviembre de 2026" o "14–15 de noviembre de 2026" si dura varios días. */
export function formatearRangoFechas(inicio: Date, fin: Date | undefined, idioma: Idioma): string {
	const formato = new Intl.DateTimeFormat(LOCALE_INTL[idioma], { timeZone: ZONA_HORARIA, dateStyle: 'long' });
	return fin ? formato.formatRange(inicio, fin) : formato.format(inicio);
}

/** "marzo de 2027". */
export function formatearMes(fecha: Date, idioma: Idioma): string {
	return new Intl.DateTimeFormat(LOCALE_INTL[idioma], { timeZone: ZONA_HORARIA, month: 'long', year: 'numeric' }).format(fecha);
}

export function formatearMoneda(monto: number, moneda: 'BOB' | 'USD', idioma: Idioma): string {
	const decimales = Number.isInteger(monto) ? 0 : 2;
	return new Intl.NumberFormat(LOCALE_INTL[idioma], {
		style: 'currency',
		currency: moneda,
		minimumFractionDigits: decimales,
		maximumFractionDigits: decimales,
	}).format(monto);
}
