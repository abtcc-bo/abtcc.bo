// Esquemas del contenido: qué campos lleva cada cosa y cuáles son obligatorios.
// Si un archivo no cumple, `npm run build` falla y dice qué campo corregir.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SECCIONES } from './i18n/rutas';

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
				costos: z
					.array(
						z.object({
							categoria: z.enum(['general', 'socio', 'no_socio', 'estudiante']),
							bob: z.number().nonnegative().optional(),
							usd: z.number().nonnegative().optional(),
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
			})
			.refine((e) => e.modalidad || e.por_confirmar, { error: 'Indica la "modalidad" (presencial, online o hibrido).', path: ['modalidad'] })
			.refine((e) => !e.modalidad || e.modalidad === 'online' || e.lugar, { error: 'Un evento presencial o híbrido necesita "lugar".', path: ['lugar'] })
			.refine((e) => !e.fin || e.fin > e.inicio, { error: '"fin" debe ser posterior a "inicio".', path: ['fin'] })
			.refine((e) => e.gratuito || e.costos.length > 0 || e.solo_socios || e.por_confirmar, {
				error: 'Indica los "costos" o marca "gratuito: true".',
				path: ['costos'],
			}),
});

const eventosTextos = defineCollection({
	loader: glob({ pattern: '*/{es,en,pt}.md', base: './src/content/eventos', generateId: sinExtension }),
	schema: z.object({
		titulo: z.string().max(100),
		resumen: z.string().max(200, 'El resumen debe tener como máximo 200 caracteres.'),
		dirigido_a: z.string().optional(),
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
			categoria: z.string(),
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

/** Páginas institucionales: `src/content/paginas/{es,en,pt}/nombre.md`. `clave` es la sección donde se muestra. */
const paginas = defineCollection({
	loader: glob({ pattern: '{es,en,pt}/*.md', base: './src/content/paginas', generateId: sinExtension }),
	schema: ({ image }) =>
		z.object({
			titulo: z.string().max(100),
			clave: z.enum(Object.keys(SECCIONES) as [keyof typeof SECCIONES, ...(keyof typeof SECCIONES)[]]),
			descripcion: z.string().max(160, 'La descripción para Google debe tener como máximo 160 caracteres.'),
			imagen: image().optional(),
		}),
});

export const collections = { eventos, eventosTextos, blog, personas, paginas };
