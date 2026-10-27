// Encabezados de seguridad de todas las respuestas.
// Las páginas estáticas los reciben desde public/_headers (Cloudflare lo lee al servir archivos);
// las que genera el servidor, desde src/worker.ts. Si cambias uno, cambia el otro.
export const ENCABEZADOS_SEGURIDAD: Record<string, string> = {
	'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
	'X-Frame-Options': 'DENY',
};
