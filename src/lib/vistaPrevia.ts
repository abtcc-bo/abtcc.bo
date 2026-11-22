// true solo en las versiones de prueba que Cloudflare construye para ramas distintas de `main` (ver astro.config.mjs).
// En ellas se ven los borradores y Google no indexa nada.
declare const __VISTA_PREVIA__: boolean;

export const VISTA_PREVIA: boolean = typeof __VISTA_PREVIA__ !== 'undefined' && __VISTA_PREVIA__;

/** Mostrar lo que está en preparación: al trabajar en la web (`npm run dev`) o en una versión de prueba. */
export const VER_BORRADORES: boolean = import.meta.env.DEV || VISTA_PREVIA;
