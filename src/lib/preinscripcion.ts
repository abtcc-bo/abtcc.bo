// Lógica de la preinscripción a un evento (formulario de FormularioPreinscripcion.astro → /api/preinscripcion/).
// Cada preinscripción se guarda en Supabase (tabla `preinscripciones`) y se avisa por correo a la asociación.
import { esIdioma, formatearFecha, type Idioma } from '../i18n';
import type { ResultadoGuardar } from './supabase';

export const CATEGORIAS = ['profesional', 'estudiante', 'miembro_alapcco'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Nombre de cada categoría en el correo interno (siempre en español). */
const NOMBRE_CATEGORIA: Record<Categoria, string> = {
	profesional: 'Profesional',
	estudiante: 'Estudiante',
	miembro_alapcco: 'Miembro de ALAPCCO',
};

export interface Preinscripcion {
	evento: string;
	nombre: string;
	apellido: string;
	correo: string;
	pais: string;
	/** Solo números, con código de país; vacío si no lo dio. */
	whatsapp: string;
	categoria: Categoria;
	idioma: Idioma;
}

export type CampoConError = 'nombre' | 'apellido' | 'correo' | 'pais' | 'whatsapp' | 'consentimiento';

export type ResultadoValidacion =
	| { tipo: 'valido'; preinscripcion: Preinscripcion }
	/** Un bot llenó el campo trampa o envió demasiado rápido: se le responde "listo" sin guardar nada. */
	| { tipo: 'spam' }
	| { tipo: 'invalido'; campos: CampoConError[] };

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIEMPO_MINIMO_MS = 3000;

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? '').trim();

export function validar(datos: FormData, ahora = Date.now()): ResultadoValidacion {
	if (texto(datos, 'sitio_web')) return { tipo: 'spam' };
	const cargado = Number(texto(datos, 'cargado'));
	if (cargado && ahora - cargado < TIEMPO_MINIMO_MS) return { tipo: 'spam' };

	const idiomaEnviado = texto(datos, 'idioma');
	const idioma: Idioma = esIdioma(idiomaEnviado) ? idiomaEnviado : 'es';
	const nombre = texto(datos, 'nombre');
	const apellido = texto(datos, 'apellido');
	// En minúsculas, para que el mismo correo no se anote dos veces.
	const correo = texto(datos, 'correo').toLowerCase();
	const pais = texto(datos, 'pais');
	const whatsappEscrito = texto(datos, 'whatsapp');
	const whatsapp = whatsappEscrito.replace(/\D/g, '');
	const categoriaEnviada = texto(datos, 'categoria');
	const categoria: Categoria = (CATEGORIAS as readonly string[]).includes(categoriaEnviada) ? (categoriaEnviada as Categoria) : 'profesional';

	const campos: CampoConError[] = [];
	if (nombre.length < 2 || nombre.length > 100) campos.push('nombre');
	if (apellido.length < 2 || apellido.length > 100) campos.push('apellido');
	if (!CORREO.test(correo) || correo.length > 200) campos.push('correo');
	if (pais.length < 2 || pais.length > 60) campos.push('pais');
	if (whatsappEscrito && (whatsapp.length < 8 || whatsapp.length > 15)) campos.push('whatsapp');
	if (datos.get('consentimiento') !== 'si') campos.push('consentimiento');

	if (campos.length) return { tipo: 'invalido', campos };
	return { tipo: 'valido', preinscripcion: { evento: texto(datos, 'evento'), nombre, apellido, correo, pais, whatsapp, categoria, idioma } };
}

/** Fila tal como se guarda en la tabla `preinscripciones`. */
export function filaParaGuardar(p: Preinscripcion): Record<string, unknown> {
	return { ...p, whatsapp: p.whatsapp || null };
}

/** Correo de aviso para la asociación, con todos los datos y un enlace para escribirle a la persona. */
export function armarCorreo(p: Preinscripcion, tituloEvento: string, guardado: ResultadoGuardar) {
	const fecha = formatearFecha(new Date(), 'es', { dateStyle: 'long', timeStyle: 'short' });
	return {
		subject: `[Preinscripción] ${tituloEvento} — ${p.nombre} ${p.apellido}`,
		replyTo: p.correo,
		text: [
			`Nueva preinscripción a: ${tituloEvento}`,
			'',
			`Nombre completo: ${p.nombre} ${p.apellido}`,
			`Correo: ${p.correo}`,
			`País: ${p.pais}`,
			`WhatsApp: ${p.whatsapp ? `+${p.whatsapp}  →  https://wa.me/${p.whatsapp}` : 'no indicó'}`,
			`Participa como: ${NOMBRE_CATEGORIA[p.categoria]}`,
			`Idioma de la página: ${p.idioma}`,
			`Fecha: ${fecha} (hora de Bolivia)`,
			'',
			guardado === 'guardada'
				? 'Ya quedó guardada en el registro (Supabase → tabla "preinscripciones").'
				: guardado === 'sin_configurar'
					? 'El registro (Supabase) aún no está conectado: por ahora las preinscripciones solo llegan por correo. Conserva este mensaje.'
					: 'ATENCIÓN: no se pudo guardar en el registro. Anótala a mano a partir de este correo.',
			'',
			'—',
			'Enviado desde el formulario de preinscripción de la web. Responde a este correo para escribirle directamente a la persona.',
		].join('\n'),
	};
}
