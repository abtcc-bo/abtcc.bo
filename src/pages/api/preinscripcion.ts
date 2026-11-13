// Recibe la preinscripción a un evento. Corre en el servidor (Worker de Cloudflare), no en el navegador.
// Guarda la preinscripción en Supabase y avisa por correo a la asociación. Mismo antispam que /api/contacto/.
// Sin claves (p. ej. en local) funciona en modo prueba: muestra el correo en la consola y no guarda nada.
import type { APIRoute } from 'astro';
import { RESEND_API_KEY, TURNSTILE_SECRET_KEY, CONTACTO_DESTINO, SUPABASE_URL, SUPABASE_KEY } from 'astro:env/server';
import { correoDestino, enviarCorreo, superaLimite, verificarTurnstile } from '../../lib/contacto';
import { obtenerEventosPublicos, yaPaso } from '../../lib/contenido';
import { armarCorreo, filaParaGuardar, validar, type CampoConError } from '../../lib/preinscripcion';
import { insertar } from '../../lib/supabase';
import { ORGANIZACION } from '../../datos/organizacion';
import { esIdioma, ruta, t, type Idioma } from '../../i18n';

export const prerender = false;

type TipoError = 'campos' | 'demasiados' | 'verificacion' | 'general';

export const POST: APIRoute = async ({ request, clientAddress }) => {
	const quiereJson = request.headers.get('accept')?.includes('application/json') ?? false;
	let datos: FormData;
	try {
		datos = await request.formData();
	} catch {
		return responder({ quiereJson, idioma: 'es', estado: 400, error: 'general' });
	}

	const idiomaEnviado = String(datos.get('idioma') ?? '');
	const idioma: Idioma = esIdioma(idiomaEnviado) ? idiomaEnviado : 'es';
	const ip = clientAddress;

	if (superaLimite(ip)) return responder({ quiereJson, idioma, estado: 429, error: 'demasiados' });

	const resultado = validar(datos);
	if (resultado.tipo === 'spam') return responder({ quiereJson, idioma, estado: 200 });
	if (resultado.tipo === 'invalido') return responder({ quiereJson, idioma, estado: 422, error: 'campos', campos: resultado.campos });
	const { preinscripcion } = resultado;

	// Solo se aceptan eventos que tienen la preinscripción activada (`preinscripcion: true` en su evento.yaml).
	const evento = (await obtenerEventosPublicos('es')).find((e) => e.slug === preinscripcion.evento);
	if (!evento || !evento.datos.preinscripcion || evento.datos.estado !== 'programado' || yaPaso(evento)) {
		return responder({ quiereJson, idioma, estado: 400, error: 'general' });
	}

	if (TURNSTILE_SECRET_KEY) {
		const verificacion = await verificarTurnstile(String(datos.get('cf-turnstile-response') ?? ''), TURNSTILE_SECRET_KEY, ip);
		if (!verificacion.ok) {
			console.warn('[preinscripcion] Turnstile rechazó el envío:', verificacion.codigos.join(', '));
			return responder({ quiereJson, idioma, estado: 403, error: 'verificacion', detalle: verificacion.codigos.join(',') });
		}
	}

	const guardado = await insertar('preinscripciones', filaParaGuardar(preinscripcion), { url: SUPABASE_URL, clave: SUPABASE_KEY });
	// Quien ya estaba anotado recibe el mismo "listo", sin duplicar el registro ni el aviso.
	if (guardado === 'repetida') return responder({ quiereJson, idioma, estado: 200 });

	const avisado = await enviarCorreo(armarCorreo(preinscripcion, evento.texto.data.titulo, guardado), {
		claveResend: RESEND_API_KEY,
		destino: correoDestino(CONTACTO_DESTINO),
	});
	// Basta con que haya quedado en uno de los dos lados (registro o correo) para no perderla.
	const recibida = guardado === 'guardada' || avisado;
	return recibida ? responder({ quiereJson, idioma, estado: 200 }) : responder({ quiereJson, idioma, estado: 502, error: 'general' });
};

function responder(r: { quiereJson: boolean; idioma: Idioma; estado: number; error?: TipoError; campos?: CampoConError[]; detalle?: string }): Response {
	if (r.quiereJson) {
		return new Response(JSON.stringify({ ok: !r.error, error: r.error, campos: r.campos, detalle: r.detalle }), {
			status: r.estado,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		});
	}
	return new Response(paginaSinJavaScript(r.idioma, r.error, r.campos), {
		status: r.estado,
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}

/** Respuesta para navegadores sin JavaScript: mensaje de resultado y enlace a los eventos. */
function paginaSinJavaScript(idioma: Idioma, error?: TipoError, campos: CampoConError[] = []): string {
	const textos = t(idioma).preinscripcion;
	const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
	let cuerpo: string;
	if (!error) cuerpo = `<p><strong>${escapar(textos.exitoTitulo)}</strong></p><p>${escapar(textos.exito)}</p>`;
	else if (error === 'campos') cuerpo = `<p>${escapar(textos.errores.revisa)}</p><ul>${campos.map((c) => `<li>${escapar(textos.errores[c])}</li>`).join('')}</ul>`;
	else if (error === 'general') cuerpo = `<p>${escapar(textos.errores.general)} ${escapar(ORGANIZACION.correo ?? '')}.</p>`;
	else cuerpo = `<p>${escapar(textos.errores[error])}</p>`;
	return `<!doctype html><html lang="${idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapar(textos.titulo)} · ABTCC</title></head><body style="font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.6">${cuerpo}<p><a href="${ruta('eventos', idioma)}">${escapar(t(idioma).nav.eventos)}</a></p></body></html>`;
}
