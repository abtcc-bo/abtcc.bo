// Datos que una página deja a sus componentes durante una visita (Astro.locals).
declare namespace App {
	interface Locals {
		/** Estado del área de socios (sesión, formulario enviado, qué mostrar). Lo llena src/lib/area-socios.ts. */
		areaSocios?: import('./lib/area-socios').EstadoAreaSocios;
	}
}
