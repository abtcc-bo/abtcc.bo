// Cálculos sobre eventos que no dependen de la plantilla: horarios, inscripción, calendario y datos para Google.
import { formatearHora, ruta, t, type Idioma } from '../i18n';
import type { Evento } from './contenido';

/** Bolivia está en UTC−4 todo el año (sin horario de verano). */
const DESFASE_BOLIVIA_MS = -4 * 60 * 60 * 1000;

/** Fecha en formato ISO con la zona de Bolivia: "2026-11-14T09:00:00-04:00" (Google prefiere la zona explícita). */
export function isoBolivia(fecha: Date): string {
	return new Date(fecha.getTime() + DESFASE_BOLIVIA_MS).toISOString().slice(0, 19) + '-04:00';
}

/** "09:00 – 13:00 hora de Bolivia (UTC−4)". */
export function horario(inicio: Date, fin: Date | undefined, idioma: Idioma): string {
	const desde = formatearHora(inicio, idioma);
	const hasta = fin ? ` – ${formatearHora(fin, idioma)}` : '';
	return `${desde}${hasta} ${t(idioma).hora.zonaBolivia}`;
}

/** Si un evento no tiene fin, para el calendario se asumen 2 horas. */
export function finEfectivo(inicio: Date, fin: Date | undefined): Date {
	return fin ?? new Date(inicio.getTime() + 2 * 60 * 60 * 1000);
}

/** Se puede inscribir: está programado, tiene enlace y no pasó la fecha límite ni el inicio. */
export function inscripcionAbierta(evento: Evento, ahora = new Date()): boolean {
	const { estado, inscripcion, inicio } = evento.datos;
	if (estado !== 'programado' || !inscripcion) return false;
	return (inscripcion.limite ?? inicio) > ahora;
}

/** Bloques de calendario: una por sesión si las hay; si no, el evento completo. */
export function bloquesDeCalendario(evento: Evento): { inicio: Date; fin: Date }[] {
	const { sesiones, inicio, fin } = evento.datos;
	const lista = sesiones.length ? sesiones : [{ inicio, fin }];
	return lista.map((s) => ({ inicio: s.inicio, fin: finEfectivo(s.inicio, s.fin) }));
}

function lugarEnTexto(evento: Evento, idioma: Idioma): string {
	const { lugar, modalidad, plataforma } = evento.datos;
	const presencial = lugar ? [lugar.nombre, lugar.direccion, lugar.ciudad].filter(Boolean).join(', ') : '';
	const online = modalidad !== 'presencial' ? `${t(idioma).eventos.modalidades.online}${plataforma ? ` (${plataforma})` : ''}` : '';
	return [presencial, online].filter(Boolean).join(' / ');
}

// ---------- Calendario ----------

/** Formato de fecha de iCalendar en UTC: 20261114T130000Z. */
function fechaIcs(fecha: Date): string {
	return fecha.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function textoIcs(texto: string): string {
	return texto.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Las líneas de iCalendar no deben pasar de 75 octetos; las largas se parten con salto + espacio. */
function plegar(linea: string): string {
	const partes: string[] = [];
	let actual = '';
	for (const caracter of linea) {
		if (new TextEncoder().encode(actual + caracter).length > 73) {
			partes.push(actual);
			actual = '';
		}
		actual += caracter;
	}
	partes.push(actual);
	return partes.join('\r\n ');
}

const ESTADO_ICS = { programado: 'CONFIRMED', agotado: 'CONFIRMED', pospuesto: 'TENTATIVE', cancelado: 'CANCELLED' } as const;

function veventos(evento: Evento, idioma: Idioma, sitio: URL): string[] {
	const url = new URL(ruta('eventos', idioma, evento.slug), sitio).href;
	const { titulo, resumen } = evento.texto.data;
	const ahora = fechaIcs(new Date());
	return bloquesDeCalendario(evento).flatMap((bloque, i) => [
		'BEGIN:VEVENT',
		`UID:${evento.id}-${i}-${idioma}@abtcc`,
		`DTSTAMP:${ahora}`,
		`DTSTART:${fechaIcs(bloque.inicio)}`,
		`DTEND:${fechaIcs(bloque.fin)}`,
		`SUMMARY:${textoIcs(titulo)}`,
		`DESCRIPTION:${textoIcs(`${resumen}\n\n${url}`)}`,
		`LOCATION:${textoIcs(lugarEnTexto(evento, idioma))}`,
		`URL:${url}`,
		`STATUS:${ESTADO_ICS[evento.datos.estado]}`,
		'END:VEVENT',
	]);
}

/** Archivo .ics con uno o varios eventos. */
export function generarIcs(eventos: Evento[], idioma: Idioma, sitio: URL, nombreCalendario?: string): string {
	const lineas = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//ABTCC//Eventos//ES',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		...(nombreCalendario ? [`X-WR-CALNAME:${textoIcs(nombreCalendario)}`, 'X-WR-TIMEZONE:America/La_Paz'] : []),
		...eventos.flatMap((evento) => veventos(evento, idioma, sitio)),
		'END:VCALENDAR',
	];
	return lineas.map(plegar).join('\r\n') + '\r\n';
}

/** Enlace que abre Google Calendar con el evento ya cargado (primera sesión si hay varias). */
export function enlaceGoogleCalendar(evento: Evento, idioma: Idioma, sitio: URL): string {
	const [bloque] = bloquesDeCalendario(evento);
	const url = new URL(ruta('eventos', idioma, evento.slug), sitio).href;
	const parametros = new URLSearchParams({
		action: 'TEMPLATE',
		text: evento.texto.data.titulo,
		dates: `${fechaIcs(bloque.inicio)}/${fechaIcs(bloque.fin)}`,
		details: `${evento.texto.data.resumen}\n\n${url}`,
		location: lugarEnTexto(evento, idioma),
		ctz: 'America/La_Paz',
	});
	return `https://calendar.google.com/calendar/render?${parametros}`;
}

// ---------- Datos para Google (schema.org Event) ----------

const ESTADO_SCHEMA = {
	programado: 'https://schema.org/EventScheduled',
	agotado: 'https://schema.org/EventScheduled',
	pospuesto: 'https://schema.org/EventPostponed',
	cancelado: 'https://schema.org/EventCancelled',
} as const;

const MODALIDAD_SCHEMA = {
	presencial: 'https://schema.org/OfflineEventAttendanceMode',
	online: 'https://schema.org/OnlineEventAttendanceMode',
	hibrido: 'https://schema.org/MixedEventAttendanceMode',
} as const;

export function datosEstructurados(
	evento: Evento,
	idioma: Idioma,
	sitio: URL,
	extra: { facilitadores: string[]; imagen?: string },
): Record<string, unknown> {
	const { datos } = evento;
	const url = new URL(ruta('eventos', idioma, evento.slug), sitio).href;
	const lugares: Record<string, unknown>[] = [];
	if (datos.lugar) {
		lugares.push({
			'@type': 'Place',
			name: datos.lugar.nombre,
			address: {
				'@type': 'PostalAddress',
				...(datos.lugar.direccion && { streetAddress: datos.lugar.direccion }),
				addressLocality: datos.lugar.ciudad,
				addressCountry: 'BO',
			},
		});
	}
	// El enlace real de la reunión no se publica; se indica la página del evento.
	if (datos.modalidad !== 'presencial') lugares.push({ '@type': 'VirtualLocation', url });

	const disponibilidad = datos.estado === 'agotado' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock';
	const ofertas = datos.gratuito
		? [{ '@type': 'Offer', price: 0, priceCurrency: 'BOB', availability: disponibilidad, url }]
		: datos.costos
				.filter((c) => c.bob !== undefined)
				.map((c) => ({
					'@type': 'Offer',
					name: t(idioma).eventos.categorias[c.categoria],
					price: c.bob,
					priceCurrency: 'BOB',
					availability: disponibilidad,
					url: datos.inscripcion?.url ?? url,
				}));

	return {
		'@type': 'Event',
		name: evento.texto.data.titulo,
		description: evento.texto.data.resumen,
		url,
		inLanguage: idioma,
		startDate: isoBolivia(datos.inicio),
		...(datos.fin && { endDate: isoBolivia(datos.fin) }),
		eventStatus: ESTADO_SCHEMA[datos.estado],
		eventAttendanceMode: MODALIDAD_SCHEMA[datos.modalidad],
		location: lugares.length === 1 ? lugares[0] : lugares,
		...(extra.imagen && { image: [extra.imagen] }),
		...(ofertas.length && { offers: ofertas }),
		...(extra.facilitadores.length && { performer: extra.facilitadores.map((name) => ({ '@type': 'Person', name })) }),
		organizer: { '@id': new URL('/#organizacion', sitio).href },
	};
}
