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
	// Claves y ajustes que se cargan en Vercel (o en un archivo .env local que nunca se sube a GitHub).
	// Sin ellas el formulario funciona en modo prueba: no envía correos y no pide verificación antispam.
	env: {
		schema: {
			RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
			TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
			TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
			CONTACTO_DESTINO: envField.string({ context: 'server', access: 'secret', optional: true }),
		},
	},
});
