// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	// Dirección pública (gratuita de Cloudflare hasta tener dominio propio). Se usa para URLs absolutas (canonical, hreflang, sitemap).
	site: 'https://abtcc.abtcc-bo.workers.dev',
	trailingSlash: 'always',
	// Se publica como Worker de Cloudflare (configuración en wrangler.jsonc, código propio en src/worker.ts).
	// Casi todo es estático; solo las rutas con `export const prerender = false` corren en el servidor:
	// la portada y el listado de eventos (siempre al día) y /api/contacto/.
	// Imágenes optimizadas al construir (`compile`), sin el servicio de pago Cloudflare Images.
	adapter: cloudflare({ imageService: 'compile' }),
	// Sin sesiones de Astro: la web no las usa y el adaptador crearía un almacén KV ("SESSION") que hacía fallar
	// la publicación. El área de socios guarda su sesión en cookies propias (src/lib/area-socios.ts).
	session: false,
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
	// Sin resaltado de código: Shiki usa estilos en línea que la política de seguridad bloquearía.
	markdown: { syntaxHighlight: false },
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
	// Claves y ajustes que se cargan en Cloudflare (o en un archivo .env local que nunca se sube a GitHub).
	// Sin ellas el formulario funciona en modo prueba: no envía correos y no pide verificación antispam.
	env: {
		schema: {
			RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
			TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
			// Clave del sitio de Turnstile: es pública (aparece en el HTML de la página), por eso puede ir aquí.
			TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '0x4AAAAAAFvKbPiV2OAM-Zmp' }),
			CONTACTO_DESTINO: envField.string({ context: 'server', access: 'secret', optional: true }),
			// Área de socios (Supabase, proyecto "abtcc.bo"). La dirección y la clave publicable son públicas por diseño:
			// lo que protege los datos son las reglas de la base de datos (supabase/migrations/).
			SUPABASE_URL: envField.string({ context: 'server', access: 'public', default: 'https://wovpcapdjvxiarbdwmyf.supabase.co' }),
			SUPABASE_PUBLISHABLE_KEY: envField.string({ context: 'server', access: 'public', default: 'sb_publishable_T-OOxRo-wUVPRaGo-eSrcA_Rq1rU_Fg' }),
			// Clave secreta: solo como Secreto en Cloudflare y en el .env local. Sin ella se entra solo con el correo.
			SUPABASE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
		},
	},
});
