// Lógica del formulario de contacto, separada del endpoint para poder leerla y probarla sola.
import { ORGANIZACION } from '../datos/organizacion';
import { esIdioma, formatearFecha, t, type Idioma } from '../i18n';

export const ASUNTOS = ['general', 'eventos', 'membresia', 'otro'] as const;
export type Asunto = (typeof ASUNTOS)[number];

export interface Mensaje {
	nombre: string;
	correo: string;
	asunto: Asunto;
	mensaje: string;
	idioma: Idioma;
}

export type CampoConError = 'nombre' | 'correo' | 'mensaje' | 'consentimiento';

export type ResultadoValidacion =
	| { tipo: 'valido'; mensaje: Mensaje }
	/** Un bot llenó el campo trampa o envió demasiado rápido: se le responde "enviado" sin enviar nada. */
	| { tipo: 'spam' }
	| { tipo: 'invalido'; idioma: Idioma; campos: CampoConError[] };

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Nadie llena el formulario en menos de 3 segundos. */
const TIEMPO_MINIMO_MS = 3000;

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? '').trim();

export function validar(datos: FormData, ahora = Date.now()): ResultadoValidacion {
	const idiomaEnviado = texto(datos, 'idioma');
	const idioma: Idioma = esIdioma(idiomaEnviado) ? idiomaEnviado : 'es';

	if (texto(datos, 'sitio_web')) return { tipo: 'spam' };
	const cargado = Number(texto(datos, 'cargado'));
	if (cargado && ahora - cargado < TIEMPO_MINIMO_MS) return { tipo: 'spam' };

	const nombre = texto(datos, 'nombre');
	const correo = texto(datos, 'correo');
	const mensaje = texto(datos, 'mensaje');
	const asuntoEnviado = texto(datos, 'asunto');
	const asunto: Asunto = (ASUNTOS as readonly string[]).includes(asuntoEnviado) ? (asuntoEnviado as Asunto) : 'general';

	const campos: CampoConError[] = [];
	if (nombre.length < 2 || nombre.length > 100) campos.push('nombre');
	if (!CORREO.test(correo) || correo.length > 200) campos.push('correo');
	if (mensaje.length < 10 || mensaje.length > 5000) campos.push('mensaje');
	if (datos.get('consentimiento') !== 'si') campos.push('consentimiento');

	return campos.length ? { tipo: 'invalido', idioma, campos } : { tipo: 'valido', mensaje: { nombre, correo, asunto, mensaje, idioma } };
}

// ---------- Límite de envíos ----------

const VENTANA_MS = 10 * 60 * 1000;
const MAXIMO_POR_VENTANA = 5;
const envios = new Map<string, number[]>();

/** Máximo 5 mensajes cada 10 minutos por dirección IP. Vive en memoria: es un freno básico, no absoluto. */
export function superaLimite(ip: string, ahora = Date.now()): boolean {
	const recientes = (envios.get(ip) ?? []).filter((momento) => ahora - momento < VENTANA_MS);
	recientes.push(ahora);
	envios.set(ip, recientes);
	return recientes.length > MAXIMO_POR_VENTANA;
}

// ---------- Verificación antispam (Cloudflare Turnstile) ----------

export async function verificarTurnstile(token: string, secreto: string, ip?: string): Promise<boolean> {
	if (!token) return false;
	const cuerpo = new URLSearchParams({ secret: secreto, response: token, ...(ip && { remoteip: ip }) });
	try {
		const respuesta = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: cuerpo });
		const resultado = (await respuesta.json()) as { success?: boolean };
		return resultado.success === true;
	} catch {
		return false;
	}
}

// ---------- Envío del correo ----------

export function correoDestino(configurado?: string): string {
	return configurado || ORGANIZACION.correo || '';
}

function armarCorreo(m: Mensaje) {
	const asunto = t('es').contacto.formulario.asuntos[m.asunto];
	const fecha = formatearFecha(new Date(), 'es', { dateStyle: 'long', timeStyle: 'short' });
	return {
		subject: `[Web ABTCC] ${asunto} — ${m.nombre}`,
		text: [
			`Nombre: ${m.nombre}`,
			`Correo: ${m.correo}`,
			`Asunto: ${asunto}`,
			`Idioma de la página: ${m.idioma}`,
			`Fecha: ${fecha} (hora de Bolivia)`,
			'',
			m.mensaje,
			'',
			'—',
			'Enviado desde el formulario de contacto de la web. Responde a este correo para contestar directamente a la persona.',
		].join('\n'),
	};
}

/**
 * Envía el mensaje al correo de la asociación con Resend.
 * Sin clave de Resend (modo prueba) solo lo muestra en la consola del servidor.
 * Mientras no haya dominio propio, Resend solo permite enviar desde onboarding@resend.dev
 * y al correo con el que se creó la cuenta.
 */
export async function enviar(m: Mensaje, opciones: { claveResend?: string; destino: string }): Promise<boolean> {
	const { subject, text } = armarCorreo(m);
	if (!opciones.claveResend) {
		console.info(`[contacto · modo prueba] Para: ${opciones.destino}\n${subject}\n${text}`);
		return true;
	}
	try {
		const respuesta = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${opciones.claveResend}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: 'Web ABTCC <onboarding@resend.dev>',
				to: [opciones.destino],
				reply_to: m.correo,
				subject,
				text,
			}),
		});
		if (!respuesta.ok) console.error('[contacto] Resend respondió', respuesta.status, await respuesta.text());
		return respuesta.ok;
	} catch (error) {
		console.error('[contacto] No se pudo contactar a Resend', error);
		return false;
	}
}
