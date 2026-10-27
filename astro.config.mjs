// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	// [PENDIENTE: dirección definitiva] Se usa para URLs absolutas (canonical, hreflang, sitemap).
	site: 'https://abtcc.vercel.app',
	trailingSlash: 'always',
	// El sitio es estático; solo las rutas con `export const prerender = false` (p. ej. /api/contacto) corren en el servidor.
	adapter: vercel(),
	i18n: {
		defaultLocale: 'es',
		locales: ['es', 'en', 'pt'],
		routing: {
			prefixDefaultLocale: true,
			redirectToDefaultLocale: false,
		},
	},
	// La raíz siempre lleva al español; nunca se redirige según el idioma del navegador.
	redirects: {
		'/': '/es/',
	},
	// Política de seguridad de contenido (CSP): el navegador solo ejecuta los scripts y estilos de este sitio.
	// Astro calcula las huellas (hashes) de sus propios scripts; aquí se añaden las excepciones necesarias.
	// No funciona en `npm run dev`; se comprueba sobre la versión construida.
	security: {
		csp: {
			scriptDirective: {
				// Huella del script en línea de Base.astro que marca <html class="js">. Si se cambia ese script, recalcular.
				hashes: ['sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw='],
				// Cloudflare Turnstile (antispam del formulario de contacto).
				resources: ["'self'", 'https://challenges.cloudflare.com'],
			},
			directives: [
				"default-src 'self'",
				"img-src 'self' data:",
				"connect-src 'self'",
				'frame-src https://challenges.cloudflare.com',
				"form-action 'self'",
				"base-uri 'self'",
				"object-src 'none'",
			],
		},
	},
	// Claves y ajustes que se cargan en Vercel (o en un archivo .env local que nunca se sube a GitHub).
	// Sin ellas el formulario funciona en modo prueba: no envía correos y no pide verificación antispam.
	env: {
		schema: {
			RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
			TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
			TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
			CONTACTO_DESTINO: envField.string({ context: 'server', access: 'secret', optional: true }),
			// Tarea diaria (/api/mantenimiento/): Vercel la llama con este secreto; el enlace reconstruye el sitio.
			CRON_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
			VERCEL_DEPLOY_HOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
		},
	},
});
