// Conexión con Supabase para el área de socios (cuentas, contraseñas y datos del socio). Corre solo en el servidor.
// Se usan las APIs de Supabase directamente con fetch (sin su biblioteca), porque la web solo necesita unas pocas llamadas.
// Las reglas de la base de datos están en supabase/migrations/; el plan, en docs/area-socios.md.
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_URL } from 'astro:env/server';

export interface Socio {
	codigo: string;
	usuario: string;
	nombre: string;
	categoria: 'asociado' | 'adherente' | 'honorario' | 'fundador';
	estado: 'activo' | 'inactivo';
	correo: string;
	/** Desde cuándo puede volver a cambiar su nombre de usuario (null = ya puede). */
	usuario_cambiable_desde: string | null;
}

export interface SesionSupabase {
	/** Token de acceso (vence en una hora). */
	acceso: string;
	/** Token para pedir uno nuevo cuando el de acceso vence. */
	renovacion: string;
}

type ResultadoSesion = { tipo: 'ok'; sesion: SesionSupabase } | { tipo: 'credenciales' | 'demasiados' | 'error' };

// ---------- Nombres de usuario ----------

/** Mismas reglas que la base de datos (constraint usuario_formato). */
const FORMATO_USUARIO = /^[a-z0-9][a-z0-9.-]{1,28}[a-z0-9]$/;

export function usuarioValido(usuario: string): boolean {
	return FORMATO_USUARIO.test(usuario) && !/[.-]{2}/.test(usuario);
}

/** "José Peña" → "jose.pena": sin tildes ni eñes, en minúsculas, espacios como punto y solo letras, números, punto y guion. */
export function normalizarUsuario(texto: string): string {
	return texto
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[\s_]+/g, '.')
		.replace(/[^a-z0-9.-]/g, '')
		.replace(/([.-])[.-]+/g, '$1')
		.replace(/^[.-]+/, '')
		.slice(0, 30)
		.replace(/[.-]+$/, '');
}

/** Candidatos para sugerir cuando un nombre está ocupado, armados con lo que escribió y con su nombre real. */
export function candidatosDeUsuario(pedido: string, nombre: string): string[] {
	const base = normalizarUsuario(pedido);
	const partes = normalizarUsuario(nombre).split('.').filter(Boolean);
	const [primero, segundo] = [partes[0], partes[1]];
	const lista = [
		primero && segundo && `${primero}.${segundo}`,
		primero && segundo && `${primero[0]}${segundo}`,
		primero && segundo && `${primero}${segundo}`,
		primero && segundo && `${primero}-${segundo}`,
		primero && partes.at(-1) && partes.length > 2 && `${primero}.${partes.at(-1)}`,
		base && `${base}.bo`,
		...[2, 3, 4, 5, 7, 10, 11, 12].map((n) => base && `${base}${n}`),
		primero && segundo && `${primero}.${segundo}.bo`,
		primero && segundo && `${primero}.${segundo}2`,
	];
	return [...new Set(lista.filter((c): c is string => Boolean(c)).map((c) => normalizarUsuario(c)))]
		.filter((c) => c !== base && usuarioValido(c))
		.slice(0, 20);
}

// ---------- Contraseñas ----------

/** Contraseñas que nadie debería usar (además del mínimo de largo). */
const CLAVES_COMUNES = new Set([
	'1234567890',
	'12345678910',
	'0123456789',
	'0987654321',
	'1111111111',
	'1q2w3e4r5t',
	'qwertyuiop',
	'asdfghjkl1',
	'password123',
	'contrasena1',
	'contraseña1',
	'contrasena123',
	'contraseña123',
	'bolivia123',
	'bolivia2026',
	'abtcc12345',
	'abtcc2026',
	'abtcc2027',
	'psicologia',
	'psicologia1',
	'psicologia123',
	'iloveyou12',
]);

export type ProblemaDeClave = 'corta' | 'larga' | 'comun' | 'parecida';

/** Revisa una contraseña nueva: 10 a 72 caracteres, que no sea común ni contenga el usuario, el código o el correo. */
export function problemaDeClave(clave: string, datos: string[] = []): ProblemaDeClave | null {
	if (clave.length < 10) return 'corta';
	// Supabase guarda las contraseñas con bcrypt, que solo usa los primeros 72 bytes.
	if (new TextEncoder().encode(clave).length > 72) return 'larga';
	const minuscula = clave.toLowerCase();
	if (CLAVES_COMUNES.has(minuscula) || /^(.)\1+$/.test(clave)) return 'comun';
	const propios = datos.map((d) => d.toLowerCase().split('@')[0]).filter((d) => d.length >= 4);
	if (propios.some((d) => minuscula.includes(d))) return 'parecida';
	return null;
}

// ---------- Llamadas a Supabase ----------

function encabezados(token?: string): Record<string, string> {
	return {
		apikey: SUPABASE_PUBLISHABLE_KEY,
		'Content-Type': 'application/json',
		...(token && { Authorization: `Bearer ${token}` }),
	};
}

async function auth(ruta: string, cuerpo: unknown, opciones: { token?: string; metodo?: 'POST' | 'PUT' } = {}): Promise<Response | null> {
	try {
		return await fetch(`${SUPABASE_URL}/auth/v1/${ruta}`, {
			method: opciones.metodo ?? 'POST',
			headers: encabezados(opciones.token),
			body: JSON.stringify(cuerpo),
		});
	} catch (error) {
		console.error('[socios] No se pudo contactar a Supabase Auth', error);
		return null;
	}
}

async function rpc(funcion: string, argumentos: Record<string, unknown>, token: string): Promise<Response | null> {
	try {
		return await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcion}`, {
			method: 'POST',
			headers: encabezados(token),
			body: JSON.stringify(argumentos),
		});
	} catch (error) {
		console.error(`[socios] No se pudo llamar a ${funcion}`, error);
		return null;
	}
}

async function leerSesion(respuesta: Response): Promise<SesionSupabase | null> {
	const datos = (await respuesta.json().catch(() => null)) as { access_token?: string; refresh_token?: string } | null;
	return datos?.access_token && datos.refresh_token ? { acceso: datos.access_token, renovacion: datos.refresh_token } : null;
}

async function resultadoDeSesion(respuesta: Response | null): Promise<ResultadoSesion> {
	if (!respuesta) return { tipo: 'error' };
	if (respuesta.ok) {
		const sesion = await leerSesion(respuesta);
		return sesion ? { tipo: 'ok', sesion } : { tipo: 'error' };
	}
	if (respuesta.status === 429) return { tipo: 'demasiados' };
	if (respuesta.status >= 400 && respuesta.status < 500) return { tipo: 'credenciales' };
	console.error('[socios] Supabase Auth respondió', respuesta.status, await respuesta.text().catch(() => ''));
	return { tipo: 'error' };
}

/** Correo + contraseña → sesión. */
export async function iniciarSesion(correo: string, clave: string): Promise<ResultadoSesion> {
	return resultadoDeSesion(await auth('token?grant_type=password', { email: correo, password: clave }));
}

/** Pide un token de acceso nuevo cuando el anterior venció. */
export async function renovarSesion(renovacion: string): Promise<SesionSupabase | null> {
	const respuesta = await auth('token?grant_type=refresh_token', { refresh_token: renovacion });
	return respuesta?.ok ? leerSesion(respuesta) : null;
}

/** Cierra la sesión: `local` = este aparato; `others` = todos los demás. */
export async function cerrarSesion(acceso: string, alcance: 'local' | 'others'): Promise<void> {
	await auth(`logout?scope=${alcance}`, {}, { token: acceso });
}

/** Pide el correo para crear una contraseña nueva. Supabase no avisa si el correo no existe (y así debe ser). */
export async function pedirRecuperacion(correo: string, redirigirA: string): Promise<'ok' | 'demasiados' | 'error'> {
	const respuesta = await auth(`recover?redirect_to=${encodeURIComponent(redirigirA)}`, { email: correo });
	if (!respuesta) return 'error';
	if (respuesta.status === 429) return 'demasiados';
	if (!respuesta.ok) console.error('[socios] recover respondió', respuesta.status, await respuesta.text().catch(() => ''));
	return respuesta.ok ? 'ok' : 'error';
}

/** Canjea el enlace del correo (recuperación o invitación) por una sesión. Sirve una sola vez. */
export async function canjearEnlace(tokenHash: string, tipo: 'recovery' | 'invite'): Promise<ResultadoSesion> {
	return resultadoDeSesion(await auth('verify', { type: tipo, token_hash: tokenHash }));
}

/** Pone una contraseña nueva a la cuenta de la sesión. */
export async function cambiarClave(acceso: string, clave: string): Promise<'ok' | 'misma' | 'debil' | 'error'> {
	const respuesta = await auth('user', { password: clave }, { token: acceso, metodo: 'PUT' });
	if (respuesta?.ok) return 'ok';
	const datos = (await respuesta?.json().catch(() => null)) as { error_code?: string; code?: string } | null;
	const codigo = datos?.error_code ?? datos?.code;
	if (codigo === 'same_password') return 'misma';
	if (codigo === 'weak_password') return 'debil';
	console.error('[socios] No se pudo cambiar la contraseña', respuesta?.status, codigo);
	return 'error';
}

/** Datos del socio dueño del token. `vencida` = el token ya no sirve (hay que renovarlo). */
export async function datosDelSocio(acceso: string): Promise<{ tipo: 'ok'; socio: Socio | null } | { tipo: 'vencida' | 'error' }> {
	const respuesta = await rpc('mi_socio', {}, acceso);
	if (!respuesta) return { tipo: 'error' };
	if (respuesta.status === 401) return { tipo: 'vencida' };
	if (!respuesta.ok) {
		console.error('[socios] mi_socio respondió', respuesta.status, await respuesta.text().catch(() => ''));
		return { tipo: 'error' };
	}
	const filas = (await respuesta.json()) as Socio[];
	return { tipo: 'ok', socio: filas[0] ?? null };
}

export type EstadoUsuario = 'disponible' | 'ocupado' | 'reservado' | 'invalido' | 'tuyo' | 'sin-sesion' | 'sin-socio';

/** ¿Está libre este nombre? Devuelve también hasta 3 sugerencias libres de la lista de candidatos. */
export async function revisarUsuario(acceso: string, usuario: string, candidatos: string[]): Promise<{ estado: EstadoUsuario; sugerencias: string[] } | null> {
	const respuesta = await rpc('revisar_usuario', { p_usuario: usuario, p_candidatos: candidatos }, acceso);
	return respuesta?.ok ? ((await respuesta.json()) as { estado: EstadoUsuario; sugerencias: string[] }) : null;
}

export type ResultadoCambioUsuario = 'cambiado' | 'sin-cambios' | 'muy-pronto' | 'inactivo' | EstadoUsuario | 'error';

export async function cambiarUsuario(acceso: string, usuario: string): Promise<ResultadoCambioUsuario> {
	const respuesta = await rpc('cambiar_usuario', { p_usuario: usuario }, acceso);
	return respuesta?.ok ? ((await respuesta.json()) as ResultadoCambioUsuario) : 'error';
}

/**
 * Usuario, código o correo → correo de la cuenta. Usa la clave secreta (solo existe en el servidor).
 * Un correo se usa tal cual; sin clave secreta (pruebas locales) solo se puede entrar con el correo.
 */
export async function correoDeIngreso(identificador: string): Promise<string | null> {
	const limpio = identificador.trim();
	if (limpio.includes('@')) return limpio.toLowerCase();
	if (!SUPABASE_SECRET_KEY || limpio.length < 3 || limpio.length > 120) return null;
	try {
		const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/correo_de_ingreso`, {
			method: 'POST',
			headers: {
				apikey: SUPABASE_SECRET_KEY,
				'Content-Type': 'application/json',
				// Las claves antiguas (JWT) también van como Authorization; las nuevas (sb_secret_…) no.
				...(SUPABASE_SECRET_KEY.startsWith('eyJ') && { Authorization: `Bearer ${SUPABASE_SECRET_KEY}` }),
			},
			body: JSON.stringify({ p_identificador: limpio }),
		});
		if (!respuesta.ok) {
			console.error('[socios] correo_de_ingreso respondió', respuesta.status);
			return null;
		}
		return ((await respuesta.json()) as string | null) || null;
	} catch (error) {
		console.error('[socios] No se pudo buscar el correo de ingreso', error);
		return null;
	}
}

// ---------- Límite de intentos ----------

/** Cuenta intentos por clave (IP) en memoria. Freno básico: Supabase tiene además sus propios límites. */
export function crearLimite(maximo: number, ventanaMs: number) {
	const registro = new Map<string, number[]>();
	return (clave: string, ahora = Date.now()): boolean => {
		const recientes = (registro.get(clave) ?? []).filter((momento) => ahora - momento < ventanaMs);
		recientes.push(ahora);
		registro.set(clave, recientes);
		return recientes.length > maximo;
	};
}
