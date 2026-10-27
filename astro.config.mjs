// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// [PENDIENTE: dirección definitiva] Se usa para URLs absolutas (canonical, hreflang, sitemap).
	site: 'https://abtcc.vercel.app',
	trailingSlash: 'always',
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
});
