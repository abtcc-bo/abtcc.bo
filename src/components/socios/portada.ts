// Piezas de la biblioteca que se dibujan en el navegador y se usan en la biblioteca y en el panel del socio:
//  - portada(): la tapa de cada material, generada (los PDF no traen imagen): color de su estante,
//    título con la letra del sitio y un dibujo según el tipo (libro, manual, artículo, instrumento).
//  - lomos(): los lomos de colores de la tarjeta de cada estante.
//  - recientes: lo último que el socio abrió en ESTE navegador (localStorage; si falla, no pasa nada).
// Los colores se pasan como variables CSS con style.setProperty (CSSOM: la CSP lo permite; style="" no).
// Estilos en src/styles/biblioteca.css.

export interface Material {
	id: string;
	titulo: string;
	tema: string;
	tipo: string;
	mb: number;
	ext: string;
	agregado?: string;
	seccion?: string;
	subtema?: string;
	carpeta?: string;
}

export interface Estante {
	nombre: string;
	icono: string;
	color: string;
}

export function el<K extends keyof HTMLElementTagNameMap>(etiqueta: K, clase?: string, texto?: string) {
	const nodo = document.createElement(etiqueta);
	if (clase) nodo.className = clase;
	if (texto !== undefined) nodo.textContent = texto;
	return nodo;
}

export function icono(trazo: string) {
	const ns = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(ns, 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('aria-hidden', 'true');
	const path = document.createElementNS(ns, 'path');
	path.setAttribute('d', trazo);
	svg.append(path);
	return svg;
}

/** Mezcla dos colores #rrggbb: t = 0 → el primero, t = 1 → el segundo. */
export function mezclar(hex: string, otro: string, t: number): string {
	const a = parseInt(hex.slice(1), 16);
	const b = parseInt(otro.slice(1), 16);
	const canal = (desplazar: number) => Math.round(((a >> desplazar) & 255) * (1 - t) + ((b >> desplazar) & 255) * t);
	return `#${((1 << 24) + (canal(16) << 16) + (canal(8) << 8) + canal(0)).toString(16).slice(1)}`;
}

/** Pone el color de un estante (y sus tonos) como variables CSS en un elemento. */
export function pintar(nodo: HTMLElement, color: string) {
	nodo.style.setProperty('--c', color);
	nodo.style.setProperty('--c-tinte', mezclar(color, '#ffffff', 0.9));
	nodo.style.setProperty('--c-claro', mezclar(color, '#ffffff', 0.35));
	nodo.style.setProperty('--c-oscuro', mezclar(color, '#000000', 0.3));
}

/**
 * Cuánto se parece un texto a un nombre de autor ("Hayes", "Kaminski et al.", "Embry, D.", "Páez y Montesinos").
 * > 0 = parece autor. Los títulos llevan palabras en minúscula ("de", "la", "en") y palabras de tema.
 */
function puntajeAutor(texto: string): number {
	const t = texto.trim();
	if (!t || t.length > 60 || /\d/.test(t) || /^[A-Z]{2,5}( [A-Z]{2,5})*$/.test(t)) return -9;
	let p = 0;
	if (/\bet al\.?|\((coords?|eds?)\.\)/i.test(t)) p += 3;
	if (/[A-ZÁÉÍÓÚÑ][\p{L}'’-]+,\s*[A-Z]\./u.test(t)) p += 3;
	if (/\b[A-Z]\.\s?/.test(t)) p += 1;
	if (/\s(y|&)\s/.test(t)) p += 1;
	const palabras = t.replace(/\(.*?\)/g, '').split(/\s+/).filter(Boolean);
	if (palabras.length > 6) p -= 3;
	const minusculas = palabras.filter((x) => /^[a-záéíóúñ]/.test(x));
	const enlaces = minusculas.filter((x) => /^(y|e|van|von|da|dos|et|al\.?)$/.test(x));
	if (minusculas.length > enlaces.length) p -= 2;
	if (/an[aá]lisis|terapia|conducta|gu[ií]a|manual|psicolog|tratamiento|parte|versi[oó]n|cap[ií]tulo|programa|evaluaci|econom|historia|principios/i.test(t)) p -= 3;
	if (!minusculas.length) p += 1;
	return p;
}

/**
 * "Título - Autor (2011)" o "Autor - Título" → título, autor y año por separado.
 * Los nombres de archivo vienen de los dos modos: se elige como autor la parte que más se parece a un nombre.
 */
export function partes(m: Material) {
	const anio = m.titulo.match(/\((\d{4})\)\s*$/)?.[1] ?? m.titulo.match(/\b(19|20)\d{2}\b/)?.[0];
	const sinAnio = m.titulo
		.replace(/\s*\(\d{4}\)\s*$/, '')
		.replace(/^(19|20)\d{2}\s+-\s+/, '')
		.replace(/-?FREELIBROS\.ME/i, '')
		.trim();
	const corte = sinAnio.lastIndexOf(' - ');
	if (corte < 0) return { titulo: sinAnio, autor: '', anio };
	const antes = sinAnio.slice(0, corte).trim();
	const despues = sinAnio.slice(corte + 3).trim();
	const pAntes = puntajeAutor(antes);
	const pDespues = puntajeAutor(despues);
	if (pDespues >= 1 && pDespues >= pAntes) return { titulo: antes, autor: despues, anio };
	if (pAntes >= 1) return { titulo: despues, autor: antes, anio };
	return { titulo: sinAnio, autor: '', anio };
}

/** Qué dibujo lleva la tapa según el tipo del catálogo. */
export function claseDeTipo(tipo: string): 'libro' | 'manual' | 'instrumento' | 'articulo' {
	const t = tipo.toLowerCase();
	if (t.startsWith('libro')) return 'libro';
	if (t.startsWith('manual')) return 'manual';
	if (t.startsWith('instrumento')) return 'instrumento';
	return 'articulo';
}

/**
 * La tapa generada de un material. Es decorativa (aria-hidden): el nombre accesible va en el enlace que la contiene.
 * `mini` = tapa chica (miniatura de lista), sin textos.
 */
export function portada(m: Material, color: string, opciones: { mini?: boolean } = {}) {
	const { titulo, autor } = partes(m);
	const tipo = claseDeTipo(m.tipo);
	const tapa = el('span', `cubierta cubierta-${tipo}${opciones.mini ? ' cubierta-mini' : ''}`);
	tapa.setAttribute('aria-hidden', 'true');
	pintar(tapa, color);
	tapa.append(el('span', 'cubierta-deco'), el('span', 'cubierta-canto'));
	if (!opciones.mini) {
		const largo = titulo.length <= 24 ? 'corto' : titulo.length <= 56 ? 'medio' : 'largo';
		const texto = el('span', 'cubierta-texto');
		texto.append(el('span', 'cubierta-tipo', m.tipo), el('span', 'cubierta-raya'), el('span', `cubierta-titulo cubierta-titulo-${largo}`, titulo));
		if (autor) texto.append(el('span', 'cubierta-autor', autor));
		tapa.append(texto);
	}
	return tapa;
}

/** Lomos de colores para la tarjeta de un estante: siempre los mismos para el mismo nombre. */
export function lomos(nombre: string, color: string, cantidad = 12) {
	let semilla = [...nombre].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
	const azar = () => {
		semilla = (semilla * 1103515245 + 12345) >>> 0;
		return (semilla >>> 8) / 0xffffff;
	};
	const fila = el('span', 'lomos');
	fila.setAttribute('aria-hidden', 'true');
	const dorado = 3 + Math.floor(azar() * (cantidad - 5));
	for (let i = 0; i < cantidad; i++) {
		const lomo = el('span', i === cantidad - 1 ? 'lomo-estante inclinado' : 'lomo-estante');
		const tono = azar() * 0.8 - 0.35;
		const c = i === dorado ? '#f2c94c' : tono >= 0 ? mezclar(color, '#ffffff', tono) : mezclar(color, '#000000', -tono);
		lomo.style.setProperty('--lomo', c);
		lomo.style.setProperty('--alto', `${58 + Math.round(azar() * 36)}%`);
		lomo.style.setProperty('--ancho', `${0.8 + azar() * 0.6}rem`);
		lomo.style.setProperty('--i', String(i));
		fila.append(lomo);
	}
	return fila;
}

// ---------- Lo último que abrió el socio (solo en este navegador) ----------

const CLAVE_RECIENTES = 'abtcc-biblioteca-recientes';

export function leerRecientes(): string[] {
	try {
		const lista = JSON.parse(localStorage.getItem(CLAVE_RECIENTES) ?? '[]');
		return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string').slice(0, 12) : [];
	} catch {
		return [];
	}
}

export function anotarReciente(id: string) {
	try {
		localStorage.setItem(CLAVE_RECIENTES, JSON.stringify([id, ...leerRecientes().filter((x) => x !== id)].slice(0, 12)));
	} catch {
		/* sin almacenamiento: no se recuerda */
	}
}

/** Desordena una copia de la lista (para "Para descubrir"). */
export function barajar<T>(lista: T[]): T[] {
	const copia = [...lista];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

/** Colores e íconos de los estantes vienen del servidor (Biblioteca.astro); este es el de respaldo. */
export const COLOR_RESPALDO = '#5a5a5a';
