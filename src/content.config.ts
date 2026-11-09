// Esquemas del contenido: qué campos lleva cada cosa y cuáles son obligatorios.
// Si un archivo no cumple, `npm run build` falla y dice qué campo corregir.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SECCIONES } from './i18n/rutas';
import { NOMBRES_ICONOS } from './datos/iconos';

const sinExtension = ({ entry }: { entry: string }) => entry.replace(/\.(md|ya?ml)$/, '');

const FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/;
const AVISO_FECHA_HORA = 'Fecha y hora con zona horaria y entre comillas, p. ej. "2026-11-14T09:00-04:00".';
const fechaHora = z
	.string({ error: AVISO_FECHA_HORA })
	.regex(FECHA_HORA, AVISO_FECHA_HORA)
	.transform((texto) => new Date(texto));

const pregunta = z.object({ pregunta: z.string(), respuesta: z.string() });

/**
 * Eventos: una carpeta por evento, `src/content/eventos/AAAA-MM-DD-slug/`, con:
 *  - `evento.yaml`: datos comunes a todos los idiomas (colección `eventos`)
 *  - `es.md` (obligatorio), `en.md`, `pt.md`: textos de cada idioma (colección `eventosTextos`)
 *  - el afiche, si lo hay, en la misma carpeta
 */
const eventos = defineCollection({
	loader: glob({ pattern: '*/evento.yaml', base: './src/content/eventos', generateId: ({ entry }) => entry.split('/')[0] }),
	schema: ({ image }) =>
		z
			.object({
				tipo: z.enum(['taller', 'curso', 'diplomado', 'jornada', 'congreso', 'webinar', 'supervision', 'asamblea']),
				inicio: fechaHora,
				fin: fechaHora.optional(),
				/** Para cursos en varias sesiones. */
				sesiones: z.array(z.object({ inicio: fechaHora, fin: fechaHora.optional() })).default([]),
				/** Obligatoria, salvo en un anuncio previo (`por_confirmar`). */
				modalidad: z.enum(['presencial', 'online', 'hibrido']).optional(),
				lugar: z
					.object({
						/** Puede faltar si la sede aún no está definida (se muestra solo la ciudad). */
						nombre: z.string().optional(),
						direccion: z.string().optional(),
						ciudad: z.string(),
						mapa: z.url().optional(),
					})
					.optional(),
				/** Zoom, Meet... El enlace de acceso NO se publica: se envía a los inscritos. */
				plataforma: z.string().optional(),
				estado: z.enum(['programado', 'agotado', 'pospuesto', 'cancelado']).default('programado'),
				facilitadores: z.array(reference('personas')).default([]),
				gratuito: z.boolean().default(false),
				/**
				 * Precios. `desde` / `hasta`: vigencia de un precio (preventa); el vencido deja de mostrarse solo.
				 * `internacional`: tarifa para quienes pagan desde fuera de Bolivia (normalmente en `usd`).
				 */
				costos: z
					.array(
						z.object({
							categoria: z.enum(['general', 'socio', 'no_socio', 'estudiante', 'internacional']),
							bob: z.number().nonnegative().optional(),
							usd: z.number().nonnegative().optional(),
							desde: fechaHora.optional(),
							hasta: fechaHora.optional(),
						}),
					)
					.default([]),
				inscripcion: z.object({ url: z.url(), limite: fechaHora.optional() }).optional(),
				cupos: z.number().int().positive().optional(),
				certificacion: z.object({ horas: z.number().positive().optional(), aval: z.string().optional() }).optional(),
				imagen: image().optional(),
				solo_socios: z.boolean().default(false),
				/**
				 * Anuncio previo: solo se conoce el mes. Se muestra "marzo de 2027 (fecha exacta por confirmar)", sin horario,
				 * sin botones de calendario ni datos para Google; costos, modalidad y sede pueden faltar.
				 * Poner `inicio` el día 1 y `fin` el último día del mes; quitar este campo cuando se confirme la fecha.
				 */
				por_confirmar: z.boolean().default(false),
				/** Evento principal del año: aparece en la portada con cuenta regresiva. */
				destacado: z.boolean().default(false),
				/** Decoración de temporada para la página del evento y su anuncio en la portada. */
				tema: z.enum(['navidad']).optional(),
				/** WhatsApp para consultas, con código de país y sin espacios ni "+": "59170623387". */
				whatsapp: z.string().regex(/^\d{8,15}$/, 'WhatsApp con código de país, solo números: "59170623387".').optional(),
				/** true mientras la inscripción está abierta pero aún no se publican los costos (se muestra "Por confirmar"). */
				costos_por_confirmar: z.boolean().default(false),
				/**
				 * Fotos del evento, en la subcarpeta `galeria/` (WebP de hasta 1600 px). `descripcion` describe la foto para
				 * quien no la ve (lectores de pantalla y Google). Solo personas que aceptaron aparecer; nunca terceros reconocibles.
				 */
				galeria: z.array(z.object({ imagen: image(), descripcion: z.string() })).default([]),
			})
			.refine((e) => e.modalidad || e.por_confirmar, { error: 'Indica la "modalidad" (presencial, online o hibrido).', path: ['modalidad'] })
			.refine((e) => !e.modalidad || e.modalidad === 'online' || e.lugar, { error: 'Un evento presencial o híbrido necesita "lugar".', path: ['lugar'] })
			.refine((e) => !e.fin || e.fin > e.inicio, { error: '"fin" debe ser posterior a "inicio".', path: ['fin'] })
			.refine((e) => e.gratuito || e.costos.length > 0 || e.costos_por_confirmar || e.solo_socios || e.por_confirmar || (e.fin ?? e.inicio) < new Date(), {
				error: 'Indica los "costos" o marca "gratuito: true" (no hace falta en eventos ya realizados).',
				path: ['costos'],
			}),
});

const HORA = /^\d{2}:\d{2}$/;
const AVISO_HORA = 'Hora de Bolivia en formato 24 h, entre comillas: "18:30".';

/**
 * Programa de un evento, por día. Las horas son de Bolivia. `tipo`: taller, conferencia, bienvenida, cierre o pausa
 * (descanso, almuerzo). `pais`: código de dos letras (bo, mx, co, de...). `persona`: archivo de src/content/personas/
 * si quien expone tiene ficha (se muestra su foto).
 */
const programa = z
	.array(
		z.object({
			fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha del día: "2026-12-05".'),
			titulo: z.string(),
			/** Momento del día ("Noche", "Día completo"), una descripción corta y una nota ("Incluido en la inscripción"). */
			momento: z.string().optional(),
			descripcion: z.string().optional(),
			nota: z.string().optional(),
			actividades: z.array(
				z.object({
					inicio: z.string().regex(HORA, AVISO_HORA),
					fin: z.string().regex(HORA, AVISO_HORA),
					tipo: z.enum(['taller', 'conferencia', 'bienvenida', 'cierre', 'pausa']).default('conferencia'),
					titulo: z.string().optional(),
					ponente: z.string().optional(),
					pais: z.string().regex(/^[a-z]{2}$/, 'País con su código de dos letras en minúsculas: "bo".').optional(),
					persona: reference('personas').optional(),
				}),
			),
		}),
	)
	.default([]);

const eventosTextos = defineCollection({
	loader: glob({ pattern: '*/{es,en,pt}.md', base: './src/content/eventos', generateId: sinExtension }),
	schema: z.object({
		titulo: z.string().max(100),
		resumen: z.string().max(200, 'El resumen debe tener como máximo 200 caracteres.'),
		/** Tema central o lema del evento (una frase). */
		lema: z.string().optional(),
		dirigido_a: z.string().optional(),
		/** Página con programa: título de la presentación (con su parte en cursiva) y temas que se tratan. */
		presentacion: z.object({ antetitulo: z.string(), titulo: z.string(), cursiva: z.string() }).optional(),
		temas: z.array(z.string()).default([]),
		/** Leyendas de las cifras: debajo de "2 días" y de "1 + 8". */
		cifras: z.object({ dias: z.string(), actividades: z.string() }).optional(),
		/** Título del bloque que presenta cada día ("Dos días, dos formatos"). */
		titulo_formatos: z.string().optional(),
		/** Qué incluye la inscripción: una frase y la lista que va en cada entrada. */
		incluye: z.object({ texto: z.string(), lista: z.array(z.string()) }).optional(),
		/** Título de la banda final (con su parte en cursiva). */
		cierre: z.object({ titulo: z.string(), cursiva: z.string() }).optional(),
		programa,
		preguntas: z.array(pregunta).default([]),
	}),
});

/** Blog: `src/content/blog/{es,en,pt}/slug.md`. Las traducciones comparten `clave`. */
const blog = defineCollection({
	loader: glob({ pattern: '{es,en,pt}/*.md', base: './src/content/blog', generateId: sinExtension }),
	schema: ({ image }) =>
		z.object({
			titulo: z.string().max(100),
			clave: z.string(),
			autor: reference('personas'),
			publicado: z.coerce.date(),
			actualizado: z.coerce.date().optional(),
			resumen: z.string().max(200, 'El resumen debe tener como máximo 200 caracteres.'),
			/** Nombres que se muestran: `blog.categorias` en src/i18n/{es,en,pt}.json. */
			categoria: z.enum(['divulgacion', 'clinica', 'investigacion', 'formacion', 'institucional']),
			etiquetas: z.array(z.string()).default([]),
			portada: image().optional(),
			referencias: z.array(z.string()).default([]),
			borrador: z.boolean().default(false),
		}),
});

/**
 * Hoja de vida resumida, con el mismo formato para todas las personas:
 *  - bio: un párrafo en tercera persona, de 3 oraciones (60–90 palabras), en este orden:
 *    1) profesión y enfoque, 2) experiencia y temas clínicos, 3) cargos actuales y aportes.
 *  - formacion: títulos principales, del más alto al más antiguo, "Título — Institución (país)". Máximo 4.
 *  - areas: 3 a 5 áreas de trabajo, cortas.
 * Nunca datos privados (documento de identidad, dirección, teléfono, fecha de nacimiento).
 */
const textoPersona = z.object({
	cargo: z.string(),
	bio: z.string(),
	formacion: z.array(z.string()).max(4, 'Como máximo 4 títulos en "formacion".').default([]),
	areas: z.array(z.string()).max(5, 'Como máximo 5 "areas".').default([]),
});

/** Personas: comisión directiva, facilitadores y autores. `src/content/personas/nombre-apellido.yaml`. */
const personas = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/personas', generateId: sinExtension }),
	schema: ({ image }) =>
		z.object({
			nombre: z.string(),
			foto: image().optional(),
			titulo_profesional: z.string().optional(),
			enlaces: z
				.object({
					orcid: z.url().optional(),
					linkedin: z.url().optional(),
					instagram: z.url().optional(),
					web: z.url().optional(),
				})
				.default({}),
			/** true = aparece en la página de la comisión directiva. */
			comision: z.boolean().default(false),
			/** Orden de aparición (menor primero). */
			orden: z.number().default(100),
			textos: z.object({ es: textoPersona, en: textoPersona.optional(), pt: textoPersona.optional() }),
		}),
});

/**
 * Páginas amigas y aliados: `src/content/aliados/nombre.yaml`, con su logo (o foto) en `aliados/logos/`.
 * `tipo`: institucion (instituciones y proyectos) o profesional. `persona`: su ficha, si integra la comisión.
 * Teléfonos tal como se escriben en Bolivia ("71402980", "3 3222080"); el enlace agrega el +591.
 */
const aliados = defineCollection({
	loader: glob({ pattern: '*.yaml', base: './src/content/aliados', generateId: sinExtension }),
	schema: ({ image }) =>
		z.object({
			nombre: z.string(),
			tipo: z.enum(['institucion', 'profesional']),
			imagen: image(),
			/** true = la imagen es una foto (se recorta en círculo); si no, un logo que se muestra completo. */
			imagen_es_foto: z.boolean().default(false),
			descripcion: z.object({ es: z.string(), en: z.string().optional(), pt: z.string().optional() }),
			ciudad: z.string().optional(),
			direccion: z.string().optional(),
			telefonos: z.array(z.string()).default([]),
			enlaces: z
				.object({ instagram: z.url().optional(), facebook: z.url().optional(), web: z.url().optional() })
				.default({}),
			persona: reference('personas').optional(),
			orden: z.number().default(100),
		}),
});

const textoTitulado = z.object({ titulo: z.string(), texto: z.string() });
/** Con `icono` opcional: uno de los nombres de src/datos/iconos.ts (titulo, investigacion, redes...). */
const textoConIcono = textoTitulado.extend({ icono: z.enum(NOMBRES_ICONOS).optional() });

/** Contenido estructurado de "Quiénes somos" (vista Nosotros.astro). */
const nosotros = z.object({
	/** Párrafos de presentación (arriba de todo). */
	presentacion: z.array(z.string()),
	objetivo: z.string(),
	lineas: z.array(textoConIcono),
	congreso: z.object({ antetitulo: z.string(), titulo: z.string() }),
	evidencia: z.object({ titulo: z.string(), texto: z.string(), pilares: z.array(z.string()) }),
	principios: z.array(z.string()),
	/** Línea de tiempo. Año como texto para admitir "[PENDIENTE]". */
	hitos: z.array(z.object({ anio: z.string(), texto: z.string() })),
});

/** Contenido estructurado de "Membresía" (vista Membresia.astro). */
const membresia = z.object({
	categorias: z.array(z.object({ nombre: z.string(), participacion: z.string(), texto: z.string() })),
	beneficios: z.array(z.string()),
	cuota: z.object({ monto: z.number(), unidad: z.string(), texto: z.string(), detalles: z.array(textoTitulado) }),
	requisitos: z.array(z.object({ icono: z.enum(NOMBRES_ICONOS), texto: z.string() })),
	pasos: z.array(textoTitulado),
	solicitud: z.object({ titulo: z.string(), texto: z.string() }),
});

/** Una sección del sitio por su nombre en SECCIONES (src/i18n/rutas.ts): nosotros, eventos, membresia, contacto... */
const seccion = z.enum(Object.keys(SECCIONES) as [keyof typeof SECCIONES, ...(keyof typeof SECCIONES)[]]);

/**
 * "¿Por dónde empiezo?" de la portada: una tarjeta por tipo de visitante, con enlaces a las secciones que le sirven.
 * `ancla` lleva a un apartado de la sección (p. ej. `categorias` en Membresía).
 */
const camino = z.object({
	icono: z.enum(NOMBRES_ICONOS),
	titulo: z.string(),
	texto: z.string(),
	enlaces: z.array(z.object({ texto: z.string(), seccion, ancla: z.string().optional() })),
});

/** Textos de la portada (vista Inicio.astro), en src/content/paginas/{idioma}/inicio.md. */
const portada = z.object({
	antetitulo: z.string(),
	/** Título en tres partes: "Asociación Boliviana de" (cursiva dorada) + "Terapias Cognitivas Conductuales y" + "Contextuales" (cursiva). */
	tituloPrevio: z.string(),
	titulo: z.string(),
	tituloCursiva: z.string(),
	bajada: z.string(),
	datos: z.array(z.string()),
	/** Conceptos de la ciencia del comportamiento que pasan en la cinta animada. */
	conceptos: z.array(z.string()),
	/** `aviso`: nota destacada debajo de las tarjetas (p. ej. qué hacer en una emergencia). */
	caminos: z.object({ antetitulo: z.string(), titulo: z.string(), opciones: z.array(camino), aviso: z.string().optional() }).optional(),
	quienes: z.object({ antetitulo: z.string(), titulo: z.string(), texto: z.string(), puntos: z.array(textoConIcono) }),
	cita: z.object({ texto: z.string(), fuente: z.string() }),
	membresia: z.object({ antetitulo: z.string(), titulo: z.string(), texto: z.string(), beneficios: z.array(z.string()) }),
	red: z.object({ antetitulo: z.string(), titulo: z.string(), texto: z.string() }),
});

/** Páginas institucionales: `src/content/paginas/{es,en,pt}/nombre.md`. `clave` es la sección donde se muestra. */
const paginas = defineCollection({
	loader: glob({ pattern: '{es,en,pt}/*.md', base: './src/content/paginas', generateId: sinExtension }),
	schema: ({ image }) =>
		z.object({
			titulo: z.string().max(100),
			clave: seccion,
			descripcion: z.string().max(160, 'La descripción para Google debe tener como máximo 160 caracteres.'),
			imagen: image().optional(),
			/** Solo en la página de Quiénes somos. */
			nosotros: nosotros.optional(),
			/** Solo en la página de Membresía. */
			membresia: membresia.optional(),
			/** Solo en la portada. */
			portada: portada.optional(),
			/** Preguntas frecuentes, en acordeón al final de la sección (por ahora, Membresía y Eventos). */
			preguntas: z.array(pregunta).default([]),
		}),
});

export const collections = { eventos, eventosTextos, blog, personas, paginas, aliados };
