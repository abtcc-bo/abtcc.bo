// Recibe el formulario de contacto. Corre en el servidor (Vercel), no en el navegador.
// Responde JSON si la página lo pide con JavaScript; si no, una página HTML simple (funciona sin JavaScript).
import type { APIRoute } from 'astro';
import { RESEND_API_KEY, TURNSTILE_SECRET_KEY, CONTACTO_DESTINO } from 'astro:env/server';
import { correoDestino, enviar, superaLimite, validar, verificarTurnstile, type CampoConError } from '../../lib/contacto';
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

	if (TURNSTILE_SECRET_KEY) {
		const valido = await verificarTurnstile(String(datos.get('cf-turnstile-response') ?? ''), TURNSTILE_SECRET_KEY, ip);
		if (!valido) return responder({ quiereJson, idioma, estado: 403, error: 'verificacion' });
	}

	const enviado = await enviar(resultado.mensaje, { claveResend: RESEND_API_KEY, destino: correoDestino(CONTACTO_DESTINO) });
	return enviado ? responder({ quiereJson, idioma, estado: 200 }) : responder({ quiereJson, idioma, estado: 502, error: 'general' });
};

function responder(r: { quiereJson: boolean; idioma: Idioma; estado: number; error?: TipoError; campos?: CampoConError[] }): Response {
	if (r.quiereJson) {
		return new Response(JSON.stringify({ ok: !r.error, error: r.error, campos: r.campos }), {
			status: r.estado,
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
		});
	}
	return new Response(paginaSinJavaScript(r.idioma, r.error, r.campos), {
		status: r.estado,
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}

/** Respuesta para navegadores sin JavaScript: mensaje de resultado y enlace de vuelta. */
function paginaSinJavaScript(idioma: Idioma, error?: TipoError, campos: CampoConError[] = []): string {
	const textos = t(idioma).contacto.formulario;
	const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
	let cuerpo: string;
	if (!error) cuerpo = `<p>${escapar(textos.exito)}</p>`;
	else if (error === 'campos') cuerpo = `<p>${escapar(textos.errores.revisa)}</p><ul>${campos.map((c) => `<li>${escapar(textos.errores[c])}</li>`).join('')}</ul>`;
	else if (error === 'general') cuerpo = `<p>${escapar(textos.errores.general)} ${escapar(ORGANIZACION.correo ?? '')}.</p>`;
	else cuerpo = `<p>${escapar(textos.errores[error])}</p>`;
	return `<!doctype html><html lang="${idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapar(textos.titulo)} · ABTCC</title></head><body style="font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.6">${cuerpo}<p><a href="${ruta('contacto', idioma)}">${escapar(error ? textos.volver : t(idioma).nav.contacto)}</a></p></body></html>`;
}
