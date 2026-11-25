// Datos que una página deja a sus componentes durante una visita (Astro.locals).
declare namespace App {
	interface Locals {
		/** Estado del área de socios (sesión, formulario enviado, qué mostrar). Lo llena src/lib/area-socios.ts. */
		areaSocios?: import('./lib/area-socios').EstadoAreaSocios;
	}
}

// Recursos de Cloudflare del Worker (wrangler.jsonc). Solo lo que usa la web.
declare module 'cloudflare:workers' {
	interface ObjetoR2 {
		body: ReadableStream;
		size: number;
		httpEtag: string;
		text(): Promise<string>;
		json<T>(): Promise<T>;
	}
	interface DepositoR2 {
		get(clave: string): Promise<ObjetoR2 | null>;
		put(clave: string, valor: string, opciones?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
		delete(clave: string): Promise<void>;
	}
	export const env: { BIBLIOTECA?: DepositoR2 };
}
