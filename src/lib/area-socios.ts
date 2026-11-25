// Lógica de las páginas del área de socios: sesión (cookies), formularios y qué se muestra a quién.
// La usan los archivos de src/pages/{es/socios,en/members,pt/socios}/[...vista].astro y /api/socios/usuario/.
// Todo se decide en el servidor: sin sesión válida, el navegador nunca recibe datos de socios.
import type { AstroCookies, AstroGlobal } from 'astro';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { verificarTurnstile } from './contacto';
import { borrarMaterial } from './biblioteca';
import { buscarPagina, type PaginaDelSitio } from './paginas';
import * as supabase from './socios';
import type { ProblemaDeClave, ResultadoCambioUsuario, SesionSupabase, Socio } from './socios';
import { IDIOMAS, SUBPAGINAS_SOCIOS, esIdioma, rutaSocios, t, type Idioma, type SubpaginaSocios } from '../i18n';

// ---------- Sesión en cookies ----------

const COOKIE_ACCESO = 'abtcc_socio_acceso';
const COOKIE_RENOVACION = 'abtcc_socio_renovacion';
/** "1" si el socio marcó "Recordarme": las cookies duran 30 días; si no, hasta cerrar el navegador. */
const COOKIE_RECORDAR = 'abtcc_socio_recordar';
const TREINTA_DIAS = 30 * 24 * 60 * 60;

function opcionesCookie(url: URL, recordar: boolean) {
	return {
		httpOnly: true, // el JavaScript de la página no puede leerlas
		secure: url.protocol === 'https:',
		sameSite: 'lax' as const, // no viajan en formularios enviados desde otros sitios
		path: '/',
		...(recordar && { maxAge: TREINTA_DIAS }),
	};
}

export function guardarSesion(cookies: AstroCookies, url: URL, sesion: SesionSupabase, recordar: boolean): void {
	cookies.set(COOKIE_ACCESO, sesion.acceso, opcionesCookie(url, recordar));
	cookies.set(COOKIE_RENOVACION, sesion.renovacion, opcionesCookie(url, recordar));
	if (recordar) cookies.set(COOKIE_RECORDAR, '1', opcionesCookie(url, true));
	else cookies.delete(COOKIE_RECORDAR, { path: '/' });
}

export function borrarSesion(cookies: AstroCookies): void {
	for (const nombre of [COOKIE_ACCESO, COOKIE_RENOVACION, COOKIE_RECORDAR]) cookies.delete(nombre, { path: '/' });
}

export interface SesionActual {
	sesion: SesionSupabase;
	socio: Socio;
}

/**
 * Sesión del visitante, comprobada con Supabase en cada visita (así, un socio dado de baja pierde el acceso al instante).
 * Si el token de acceso venció, pide uno nuevo y actualiza las cookies.
 */
export async function sesionActual(cookies: AstroCookies, url: URL): Promise<SesionActual | null> {
	const acceso = cookies.get(COOKIE_ACCESO)?.value;
	const renovacion = cookies.get(COOKIE_RENOVACION)?.value;
	if (!acceso || !renovacion) {
		if (acceso || renovacion) borrarSesion(cookies);
		return null;
	}
	let sesion: SesionSupabase = { acceso, renovacion };
	let datos = await supabase.datosDelSocio(acceso);
	if (datos.tipo === 'vencida') {
		const nueva = await supabase.renovarSesion(renovacion);
		if (!nueva) {
			borrarSesion(cookies);
			return null;
		}
		guardarSesion(cookies, url, nueva, cookies.get(COOKIE_RECORDAR)?.value === '1');
		sesion = nueva;
		datos = await supabase.datosDelSocio(nueva.acceso);
	}
	if (datos.tipo !== 'ok') {
		if (datos.tipo === 'vencida') borrarSesion(cookies);
		return null;
	}
	// Una cuenta sin fila en "socios" no es de un socio: no tiene acceso.
	if (!datos.socio) {
		await supabase.cerrarSesion(sesion.acceso, 'local');
		borrarSesion(cookies);
		return null;
	}
	return { sesion, socio: datos.socio };
}

// ---------- Estado de la página ----------

/** Mensajes de éxito que llegan en la dirección (?aviso=) después de un formulario. */
const AVISOS = ['sesionCerrada', 'usuarioCambiado', 'claveCambiada', 'bienvenida', 'correoEnviado', 'materialBorrado', 'topeDescargas', 'noEncontrado'] as const;
export type Aviso = (typeof AVISOS)[number];

export type ErrorArea =
	| 'campos'
	| 'credenciales'
	| 'demasiados'
	| 'verificacion'
	| 'servidor'
	| 'correo'
	| 'enlace'
	| 'distintas'
	| 'claveActual'
	| 'misma'
	| ProblemaDeClave;

export interface EstadoAreaSocios {
	idioma: Idioma;
	vista: SubpaginaSocios;
	socio: Socio | null;
	aviso?: Aviso;
	/** Error del formulario enviado y en qué formulario ocurrió. */
	error?: { tipo: ErrorArea; formulario: 'ingreso' | 'recuperar' | 'nuevaClave' | 'clave' };
	/** Resultado de un cambio de nombre de usuario que no se pudo hacer, con sugerencias libres. */
	usuario?: { resultado: ResultadoCambioUsuario; pedido: string; sugerencias: string[] };
	/** Lo que la persona escribió (nunca contraseñas), para no hacerla escribir de nuevo. */
	valores: Record<string, string>;
	/** Enlace del correo (recuperación o invitación) que se canjea al guardar la contraseña nueva. */
	enlace?: { tokenHash: string; tipo: 'recovery' | 'invite' };
	pagina: PaginaDelSitio;
}

/** Idioma según el comienzo de la dirección (/es/…, /en/…, /pt/…). */
function idiomaDe(url: URL): Idioma {
	const primero = url.pathname.split('/')[1];
	return esIdioma(primero) ? primero : 'es';
}

function subpaginaDe(vista: string | undefined, idioma: Idioma): SubpaginaSocios | undefined {
	const buscada = (vista ?? '').replace(/\/+$/, '');
	return (Object.keys(SUBPAGINAS_SOCIOS) as SubpaginaSocios[]).find((clave) => SUBPAGINAS_SOCIOS[clave][idioma] === buscada);
}

// ---------- Límites de intentos (por dirección IP) ----------

const superaLimiteIngreso = supabase.crearLimite(10, 10 * 60 * 1000);
const superaLimiteRecuperar = supabase.crearLimite(5, 60 * 60 * 1000);
const superaLimiteCambios = supabase.crearLimite(20, 10 * 60 * 1000);

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------- Página ----------

/**
 * Atiende una visita al área de socios. Devuelve una respuesta (redirección o 404) o deja el estado en
 * Astro.locals.areaSocios para que la página lo dibuje.
 */
export async function atenderAreaSocios(Astro: AstroGlobal): Promise<Response | undefined> {
	const idioma = idiomaDe(Astro.url);
	const vista = subpaginaDe(Astro.params.vista, idioma);
	// Dirección desconocida: una respuesta 404 sin contenido hace que Astro muestre la página 404 del sitio.
	if (!vista) return new Response(null, { status: 404 });

	// Nada de esta área se guarda en cachés intermedias.
	Astro.response.headers.set('Cache-Control', 'private, no-store');

	const actual = await sesionActual(Astro.cookies, Astro.url);
	const base = await buscarPagina(rutaSocios('inicio', idioma));
	const textos = t(idioma).socios;
	const estado: EstadoAreaSocios = {
		idioma,
		vista,
		socio: actual?.socio ?? null,
		valores: {},
		pagina: {
			...base,
			// Cada página interna enlaza a su versión en los otros idiomas.
			alternos: Object.fromEntries(IDIOMAS.map((otro) => [otro, rutaSocios(vista, otro)])),
			...(vista !== 'inicio' && { subpagina: textos.titulos[vista] }),
		},
	};

	const ir = (subpagina: SubpaginaSocios, aviso?: Aviso) =>
		Astro.redirect(`${rutaSocios(subpagina, idioma)}${aviso ? `?aviso=${aviso}` : ''}`, 303);

	if (Astro.request.method === 'POST') {
		const respuesta = await atenderFormulario(Astro, estado, actual, ir);
		if (respuesta) return respuesta;
	} else {
		const aviso = Astro.url.searchParams.get('aviso');
		if (AVISOS.includes(aviso as Aviso)) estado.aviso = aviso as Aviso;
	}

	// Qué puede ver cada quien.
	if (!actual && (vista === 'cuenta' || vista === 'biblioteca')) return ir('inicio');
	if (actual && vista === 'recuperar') return ir('cuenta');
	if (vista === 'nuevaClave' && !estado.enlace) {
		const tokenHash = Astro.url.searchParams.get('token_hash') ?? '';
		const tipo = Astro.url.searchParams.get('type');
		if (/^[A-Za-z0-9_-]{10,200}$/.test(tokenHash) && (tipo === 'recovery' || tipo === 'invite')) estado.enlace = { tokenHash, tipo };
	}

	Astro.locals.areaSocios = estado;
	return undefined;
}

async function atenderFormulario(
	Astro: AstroGlobal,
	estado: EstadoAreaSocios,
	actual: SesionActual | null,
	ir: (subpagina: SubpaginaSocios, aviso?: Aviso) => Response,
): Promise<Response | undefined> {
	let datos: FormData;
	try {
		datos = await Astro.request.formData();
	} catch {
		return Astro.redirect(Astro.url.pathname, 303);
	}
	const texto = (campo: string) => String(datos.get(campo) ?? '').trim();
	const clave = (campo: string) => String(datos.get(campo) ?? '');
	const ip = Astro.clientAddress;
	const fallar = (tipo: ErrorArea, formulario: NonNullable<EstadoAreaSocios['error']>['formulario'], status: number) => {
		estado.error = { tipo, formulario };
		Astro.response.status = status;
		return undefined;
	};
	const pasaTurnstile = async () => {
		if (!TURNSTILE_SECRET_KEY) return true;
		const verificacion = await verificarTurnstile(texto('cf-turnstile-response'), TURNSTILE_SECRET_KEY, ip);
		if (!verificacion.ok) console.warn('[socios] Turnstile rechazó el envío:', verificacion.codigos.join(', '));
		return verificacion.ok;
	};

	switch (texto('accion')) {
		case 'ingresar': {
			const identificador = texto('identificador').slice(0, 200);
			const recordar = datos.get('recordar') === 'si';
			estado.valores.identificador = identificador;
			if (recordar) estado.valores.recordar = 'si';
			if (superaLimiteIngreso(ip)) return fallar('demasiados', 'ingreso', 429);
			if (!identificador || !clave('clave')) return fallar('campos', 'ingreso', 422);
			if (!(await pasaTurnstile())) return fallar('verificacion', 'ingreso', 403);
			const correo = await supabase.correoDeIngreso(identificador);
			if (!correo) return fallar('credenciales', 'ingreso', 401);
			const resultado = await supabase.iniciarSesion(correo, clave('clave'));
			if (resultado.tipo !== 'ok') {
				return fallar(resultado.tipo === 'credenciales' ? 'credenciales' : resultado.tipo === 'demasiados' ? 'demasiados' : 'servidor', 'ingreso', 401);
			}
			const socio = await supabase.datosDelSocio(resultado.sesion.acceso);
			if (socio.tipo !== 'ok' || !socio.socio) {
				await supabase.cerrarSesion(resultado.sesion.acceso, 'local');
				return fallar(socio.tipo === 'ok' ? 'credenciales' : 'servidor', 'ingreso', 401);
			}
			guardarSesion(Astro.cookies, Astro.url, resultado.sesion, recordar);
			return ir('inicio');
		}

		case 'salir': {
			if (actual) await supabase.cerrarSesion(actual.sesion.acceso, 'local');
			borrarSesion(Astro.cookies);
			return ir('inicio', 'sesionCerrada');
		}

		case 'recuperar': {
			const correo = texto('correo').toLowerCase().slice(0, 200);
			estado.valores.correo = correo;
			if (superaLimiteRecuperar(ip)) return fallar('demasiados', 'recuperar', 429);
			if (!CORREO.test(correo)) return fallar('correo', 'recuperar', 422);
			if (!(await pasaTurnstile())) return fallar('verificacion', 'recuperar', 403);
			const destino = new URL(rutaSocios('nuevaClave', estado.idioma), Astro.url).href;
			const resultado = await supabase.pedirRecuperacion(correo, destino);
			if (resultado === 'demasiados') return fallar('demasiados', 'recuperar', 429);
			if (resultado === 'error') return fallar('servidor', 'recuperar', 502);
			// Mismo mensaje exista o no el correo: así nadie puede averiguar quién es socio.
			return ir('recuperar', 'correoEnviado');
		}

		case 'nueva-clave': {
			const tokenHash = texto('token_hash');
			const tipo = texto('tipo');
			// Dos formas de llegar desde el correo:
			//  - plantilla propia (supabase/plantillas/): ?token_hash=… que se canjea aquí;
			//  - plantilla estándar de Supabase (mientras no se pueda editar): Supabase ya validó el enlace y deja la sesión
			//    en la dirección (#access_token=…); el script de NuevaClave.astro la pasa a este formulario.
			const sesionDelCorreo = { acceso: texto('acceso'), renovacion: texto('renovacion') };
			const conSesion = Boolean(sesionDelCorreo.acceso && sesionDelCorreo.renovacion);
			if ((!tokenHash && !conSesion) || (tipo !== 'recovery' && tipo !== 'invite')) return fallar('enlace', 'nuevaClave', 400);
			if (tokenHash) estado.enlace = { tokenHash, tipo };
			// Si algo falla (p. ej. contraseñas distintas), el formulario vuelve con la sesión del correo para reintentar.
			else Object.assign(estado.valores, { acceso: sesionDelCorreo.acceso, renovacion: sesionDelCorreo.renovacion, tipo });
			if (superaLimiteCambios(ip)) return fallar('demasiados', 'nuevaClave', 429);
			const nueva = clave('clave');
			if (nueva !== clave('clave2')) return fallar('distintas', 'nuevaClave', 422);
			const problema = supabase.problemaDeClave(nueva);
			if (problema) return fallar(problema, 'nuevaClave', 422);
			// El enlace se canjea recién aquí (no al abrirlo): así los antivirus del correo que "visitan" los enlaces no lo gastan.
			const canje: Awaited<ReturnType<typeof supabase.canjearEnlace>> = conSesion
				? { tipo: 'ok', sesion: sesionDelCorreo }
				: await supabase.canjearEnlace(tokenHash, tipo);
			if (canje.tipo !== 'ok') return fallar(canje.tipo === 'demasiados' ? 'demasiados' : 'enlace', 'nuevaClave', 400);
			const cambio = await supabase.cambiarClave(canje.sesion.acceso, nueva);
			// Con la sesión del correo, un token falso o vencido hace fallar el cambio: el enlace no sirve.
			if (conSesion && cambio === 'error') return fallar('enlace', 'nuevaClave', 400);
			if (cambio === 'debil' || cambio === 'error') return fallar(cambio === 'debil' ? 'comun' : 'servidor', 'nuevaClave', 422);
			const socio = await supabase.datosDelSocio(canje.sesion.acceso);
			if (socio.tipo !== 'ok' || !socio.socio) {
				await supabase.cerrarSesion(canje.sesion.acceso, 'local');
				return fallar('enlace', 'nuevaClave', 400);
			}
			await supabase.cerrarSesion(canje.sesion.acceso, 'others');
			guardarSesion(Astro.cookies, Astro.url, canje.sesion, false);
			return tipo === 'invite' ? ir('cuenta', 'bienvenida') : ir('inicio', 'claveCambiada');
		}

		case 'cambiar-usuario': {
			if (!actual) return ir('inicio');
			const escrito = texto('usuario').slice(0, 60);
			const pedido = supabase.normalizarUsuario(escrito);
			estado.valores.usuario = escrito;
			if (superaLimiteCambios(ip)) {
				estado.usuario = { resultado: 'error', pedido, sugerencias: [] };
				return undefined;
			}
			const resultado = supabase.usuarioValido(pedido) ? await supabase.cambiarUsuario(actual.sesion.acceso, pedido) : 'invalido';
			if (resultado === 'cambiado') return ir('cuenta', 'usuarioCambiado');
			let sugerencias: string[] = [];
			if (resultado === 'ocupado' || resultado === 'reservado' || resultado === 'invalido') {
				const candidatos = supabase.candidatosDeUsuario(pedido || actual.socio.nombre, actual.socio.nombre);
				sugerencias = (await supabase.revisarUsuario(actual.sesion.acceso, pedido, candidatos))?.sugerencias ?? [];
			}
			estado.usuario = { resultado, pedido, sugerencias };
			Astro.response.status = 422;
			return undefined;
		}

		case 'cambiar-clave': {
			if (!actual) return ir('inicio');
			if (superaLimiteIngreso(ip)) return fallar('demasiados', 'clave', 429);
			const nueva = clave('clave');
			if (!clave('actual') || !nueva) return fallar('campos', 'clave', 422);
			if (nueva !== clave('clave2')) return fallar('distintas', 'clave', 422);
			const { socio } = actual;
			const problema = supabase.problemaDeClave(nueva, [socio.usuario, socio.codigo, socio.correo]);
			if (problema) return fallar(problema, 'clave', 422);
			// Se comprueba la contraseña actual iniciando sesión con ella: así nadie cambia la clave en una compu ajena abierta.
			const comprobacion = await supabase.iniciarSesion(socio.correo, clave('actual'));
			if (comprobacion.tipo !== 'ok') return fallar(comprobacion.tipo === 'credenciales' ? 'claveActual' : comprobacion.tipo === 'demasiados' ? 'demasiados' : 'servidor', 'clave', 401);
			const cambio = await supabase.cambiarClave(comprobacion.sesion.acceso, nueva);
			if (cambio !== 'ok') return fallar(cambio === 'misma' ? 'misma' : cambio === 'debil' ? 'comun' : 'servidor', 'clave', 422);
			await supabase.cerrarSesion(comprobacion.sesion.acceso, 'others');
			guardarSesion(Astro.cookies, Astro.url, comprobacion.sesion, Astro.cookies.get(COOKIE_RECORDAR)?.value === '1');
			return ir('cuenta', 'claveCambiada');
		}

		case 'borrar-material': {
			// Solo un administrador (es_admin en Supabase) puede borrar; se comprueba aquí, en el servidor.
			if (!actual?.socio.es_admin) return new Response(null, { status: 403 });
			await borrarMaterial(texto('id'));
			return ir('biblioteca', 'materialBorrado');
		}

		default:
			return Astro.redirect(Astro.url.pathname, 303);
	}
}
