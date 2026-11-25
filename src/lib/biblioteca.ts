// Biblioteca del área de socios. Los archivos y el catálogo viven en el depósito privado de Cloudflare R2
// "abtcc-biblioteca" (binding BIBLIOTECA en wrangler.jsonc), nunca en GitHub ni en enlaces públicos:
//  - catalogo.json: lista de materiales (título, temática, tipo, tamaño y la clave del archivo).
//  - libros/<id>.<ext>: cada archivo.
// Los sube Claude desde la computadora de Leo (docs/area-socios.md). La web solo los entrega a socios con sesión.
import { env } from 'cloudflare:workers';

export interface Material {
	id: string;
	titulo: string;
	tema: string;
	tipo: string;
	/** Tamaño en MB. */
	mb: number;
	ext: string;
	/** Clave del archivo en el depósito (libros/<id>.<ext>). */
	clave: string;
	/** Fecha en que se agregó (AAAA-MM-DD), para el sello "Nuevo". */
	agregado?: string;
}

const CATALOGO = 'catalogo.json';

export function deposito() {
	return env.BIBLIOTECA;
}

/** El catálogo tal como está guardado (sin leerlo: se entrega directo al navegador del socio). */
export async function catalogoCrudo() {
	return (await deposito()?.get(CATALOGO)) ?? null;
}

export async function leerCatalogo(): Promise<Material[]> {
	const objeto = await catalogoCrudo();
	return objeto ? await objeto.json<Material[]>() : [];
}

export async function buscarMaterial(id: string): Promise<Material | undefined> {
	if (!/^[a-f0-9]{8,32}$/.test(id)) return undefined;
	return (await leerCatalogo()).find((m) => m.id === id);
}

/** Borra un material: primero lo saca del catálogo (deja de verse al instante) y después borra el archivo. */
export async function borrarMaterial(id: string): Promise<boolean> {
	const bucket = deposito();
	if (!bucket) return false;
	const catalogo = await leerCatalogo();
	const material = catalogo.find((m) => m.id === id);
	if (!material) return false;
	await bucket.put(CATALOGO, JSON.stringify(catalogo.filter((m) => m.id !== id)), { httpMetadata: { contentType: 'application/json' } });
	await bucket.delete(material.clave);
	console.info(`[biblioteca] material borrado: ${id} (${material.titulo})`);
	return true;
}

/** Nombre de archivo para la descarga: el título, sin signos que los sistemas de archivos no aceptan. */
export function nombreDeDescarga(m: Material): string {
	const limpio = m.titulo
		.replace(/[\\/:*?"<>|]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 150);
	return `${limpio || m.id}.${m.ext}`;
}
