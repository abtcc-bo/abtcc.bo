// Acceso mínimo a Supabase desde el servidor (Worker), sin bibliotecas: solo agregar filas y el "latido" diario.
// La clave que se usa es la pública ("publishable"/"anon") del proyecto, que por las reglas de la base
// (supabase/preinscripciones.sql) solo puede AGREGAR preinscripciones: aunque se filtrara, no permite leer datos.
// Aun así se guarda como secreto del Worker y nunca llega al navegador.

export interface ConexionSupabase {
	url?: string;
	clave?: string;
}

function cabeceras(clave: string): Record<string, string> {
	return { apikey: clave, Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' };
}

export type ResultadoGuardar = 'guardada' | 'repetida' | 'sin_configurar' | 'error';

/** Agrega una fila a una tabla. "repetida": ya existía (misma persona y evento). */
export async function insertar(tabla: string, fila: Record<string, unknown>, conexion: ConexionSupabase): Promise<ResultadoGuardar> {
	if (!conexion.url || !conexion.clave) return 'sin_configurar';
	try {
		const respuesta = await fetch(`${conexion.url.replace(/\/$/, '')}/rest/v1/${tabla}`, {
			method: 'POST',
			headers: { ...cabeceras(conexion.clave), Prefer: 'return=minimal' },
			body: JSON.stringify(fila),
		});
		if (respuesta.ok) return 'guardada';
		if (respuesta.status === 409) return 'repetida';
		console.error(`[supabase] No se pudo guardar en "${tabla}":`, respuesta.status, await respuesta.text());
		return 'error';
	} catch (error) {
		console.error('[supabase] Sin conexión', error);
		return 'error';
	}
}

/** Consulta diaria para que el plan gratuito no pause el proyecto por inactividad (función `latido` de la base). */
export async function latido(conexion: ConexionSupabase): Promise<boolean> {
	if (!conexion.url || !conexion.clave) return false;
	try {
		const respuesta = await fetch(`${conexion.url.replace(/\/$/, '')}/rest/v1/rpc/latido`, {
			method: 'POST',
			headers: cabeceras(conexion.clave),
			body: '{}',
		});
		if (!respuesta.ok) console.error('[supabase] El latido falló:', respuesta.status, await respuesta.text());
		return respuesta.ok;
	} catch (error) {
		console.error('[supabase] Sin conexión para el latido', error);
		return false;
	}
}
