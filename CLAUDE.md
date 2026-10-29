# ABTCC web — reglas del proyecto

Sitio de la Asociación Boliviana de Terapias Cognitivas, Conductuales y Contextuales (nombre oficial pendiente de confirmar, ver `docs/datos-pendientes.md`).
La arquitectura completa está en `docs/arquitectura.md`. Leerla antes de decisiones estructurales.

## Estado y forma de trabajo

- Etapa actual: estructura funcional con el **diseño "Rediseño ABTCC"** (PDF del usuario): crema, verde profundo (#134e36), azul noche y dorado; títulos Cormorant Garamond (con cursivas) y texto Inter (autoalojadas con @fontsource); cabecera verde en cada sección (`CabeceraPagina`, slot "cabecera" de `Base` con `conCabecera`); bandas `.banda` / `.banda-clara` / `.banda-verde` / `.banda-azul`; los colores del logo solo como franja tricolor y puntos. Todo en variables CSS (`src/styles/global.css`).
- Movimiento (elegante, siempre con "reducir movimiento"): fondo de puntos con luces, aparición al bajar, carrusel de eventos, franja de fotos, cinta de conceptos y figuras de ciencia del comportamiento (`RegistroAcumulativo`: registro acumulativo de Skinner; `Contingencia`: triple relación de contingencia). Sin estilos en línea (`style=""`): la CSP los bloquea.
- Los datos reales se cargan al final. Mientras tanto se usa relleno marcado con `[PENDIENTE: ...]` y cada dato faltante se anota en `docs/datos-pendientes.md`.
- Se avanza paso a paso; cada paso termina con algo que se pueda ver funcionando en el navegador.
- El usuario escribe en español; responder en español. No programa: avisarle claramente cuando tenga que hacer algo y mantener `docs/tareas-para-ti.md` al día.

## Stack

- Astro (sitio estático; solo `/[lang]/socios/` se renderiza en el servidor, fase 3).
- Código en GitHub. Publicación como Worker de Cloudflare (`@astrojs/cloudflare`, `wrangler.jsonc`, entrada `src/worker.ts`), en subdominio gratuito `workers.dev` por ahora (sin dominio propio). Se intentó Vercel y su verificación por SMS bloqueó la cuenta.
- Casi todo es estático. Dinámicas (`prerender = false`): la portada y el listado de eventos (`SECCIONES_DINAMICAS` en `src/lib/paginas.ts`, un archivo idéntico por idioma en `src/pages/{es,en,pt}/…/index.astro`) y `/api/contacto/`. Si cambia la ruta de esas secciones en `SECCIONES`, mover esos archivos.
- Para probar como en producción: `npm run build` y luego `npx wrangler dev --config dist/server/wrangler.json`.
- Supabase solo para el área de socios (fase 3).

## Idiomas

- `es` (principal), `en`, `pt`, en rutas `/es/`, `/en/`, `/pt/`. La raíz redirige a `/es/`; nunca redirigir según el idioma del navegador.
- Las rutas se traducen (`/es/nosotros/`, `/en/about/`, `/pt/sobre/`). El mapa está en `src/i18n/rutas.ts` (`SECCIONES`); generar enlaces siempre con `ruta(seccion, idioma)`, nunca escribir URLs a mano.
- Todas las páginas HTML se generan desde `src/pages/[...ruta].astro` (secciones y detalle de eventos). Las vistas propias de sección se registran en `src/vistas/index.ts` (`VISTAS`) y reciben `idioma` y la `pagina` de texto si existe. Sin vista ni página de texto, la sección muestra "en construcción", queda con `noindex` y no se anuncia en hreflang.
- Toda página pasa `alternos` (sus versiones por idioma) al layout `Base`: con eso salen `hreflang` y el selector de idioma.
- Textos de interfaz en `src/i18n/{es,en,pt}.json`, nunca escritos dentro de las plantillas. Los tres JSON deben tener las mismas claves; si no, la construcción falla.
- Rutas con barra final siempre (`trailingSlash: 'always'`).

## Plantilla base (`src/layouts/Base.astro`)

- Genera title, description, canonical, hreflang, Open Graph y los JSON-LD `Organization` y `BreadcrumbList`. Las páginas no repiten estas etiquetas; datos extra para Google van en el slot `head` con `<JsonLd>`.
- Título: "Nombre de la página · ABTCC" (hasta ~60 caracteres). Descripción: ~150 caracteres.
- Migas: se pasan `migas` (ancestros) y `nombreEnMigas` (página actual). La jerarquía de secciones está en `PADRES` (`src/i18n/rutas.ts`).
- `noIndexar` para área de socios y 404.
- Datos institucionales sin idioma (correo, sede, redes, logo, imagen para redes). No listar ciudades: la asociación trabaja en todo el país; la sede solo va en Contacto y en los datos para Google en `src/datos/organizacion.ts`; `null` = pendiente.
- Menú de celular: botón con `aria-expanded`; sin JavaScript el menú queda visible (clase `js` en `<html>`).
- Desplegables del menú y del idioma con `<details>` (estilos en `global.css`, comportamiento en `Encabezado.astro`). Submenús: subsecciones de `PADRES`, próximos eventos (hasta 4) y los títulos `##` de la página de Membresía.
- Fechas y monedas con `Intl`. Horas siempre con zona horaria (`2026-11-14T09:00-04:00`), mostradas como "hora de Bolivia (UTC−4)".
- Selector de idioma con nombres (Español · English · Português), sin banderas.
- No publicar traducciones automáticas sin revisión humana.

## Contenido (`src/content/`)

Los esquemas en `src/content.config.ts` son la fuente de verdad de los campos. Las vistas leen el contenido con las funciones de `src/lib/contenido.ts`, no con `getCollection` directamente.

- **Eventos:** una carpeta por evento, `src/content/eventos/AAAA-MM-DD-slug/`, con `evento.yaml` (datos comunes: fechas, modalidad, costos, estado...), `es.md` obligatorio y `en.md`/`pt.md` opcionales (título, resumen y descripción de cada idioma), y el afiche en la misma carpeta. La URL es el nombre de la carpeta sin la fecha. Un evento sale en un idioma solo si tiene su .md.
- **Fechas y horas** de eventos siempre entre comillas y con zona: `"2026-11-14T09:00-04:00"`.
- **Blog:** `src/content/blog/{es,en,pt}/slug.md`; las traducciones comparten `clave`. `borrador: true` lo oculta al publicar.
- **Personas:** `src/content/personas/nombre-apellido.yaml`, foto en `personas/fotos/` (cuadrada, 600 px); `comision: true` para la comisión directiva. Eventos y artículos las referencian por el nombre del archivo.
- **Hoja de vida, mismo formato para todos** (detalle en `content.config.ts`): `bio` de 3 oraciones (profesión y enfoque → experiencia → cargos y aportes), `formacion` (máx. 4 títulos, "Título — Institución (país)") y `areas` (3–5). Nunca datos privados de los CV (carnet, dirección, teléfono, nacimiento).
- **Páginas:** `src/content/paginas/{es,en,pt}/nombre.md`; `clave` = sección de `SECCIONES` donde se muestra. Portada, Quiénes somos y Membresía tienen su contenido en bloques del frontmatter (`portada`, `nosotros`, `membresia`) que dibujan `Inicio.astro`, `Nosotros.astro` y `Membresia.astro`.
- Contenido de muestra: lleva `[EJEMPLO]` en el título; se borra cuando llegue el real.
- Nombres de archivo y carpeta en minúsculas, sin tildes ni espacios, con guiones.

## Eventos (cómo se muestran)

- Todo sale de la carpeta del evento: carrusel automático en portada (hasta 6 próximos, `CarruselEventos.astro`, sin bibliotecas, con pausa y respetando "reducir movimiento"), listado `/es/eventos/` (próximos con filtros + archivo por año), detalle `/es/eventos/slug/`, `.ics` en `/es/calendario/slug.ics`, calendario suscribible `/eventos.ics`, RSS `/es/eventos.xml` y JSON-LD `Event`.
- Lógica en `src/lib/eventos.ts` (horarios, inscripción abierta, calendario, datos para Google). Bolivia es UTC−4 fijo.
- Fotos de un evento: `galeria` en `evento.yaml` (fotos en `galeria/NN.webp`, hasta 1600 px, sin EXIF, con `descripcion`) y una miniatura con el mismo nombre en `galeria/mini/` (360 px de alto) para la franja de la portada. Nunca terceros reconocibles.
- `destacado: true`: el evento aparece en la portada con cuenta regresiva (días/horas/min/seg; "faltan unos N meses" si está `por_confirmar`).
- Animación al bajar por la página: script al final de `Base.astro` (clase `.aparecer`); nunca anima lo que ya está en pantalla y se desactiva con "reducir movimiento".
- Anuncio sin fecha exacta: `por_confirmar: true`, `inicio` día 1 y `fin` último día del mes. Muestra solo mes y año, sin calendario ni datos para Google; costos y sede pueden faltar.
- Un evento cancelado NO se borra: `estado: cancelado`. `solo_socios: true` lo saca de las páginas públicas.
- Los eventos pasados salen solos de "próximos": la portada y el listado se generan en cada visita (y un script del navegador los oculta igual si una página quedó en caché).

## Formulario de contacto

- Formulario: `src/components/FormularioContacto.astro` → envía a `/api/contacto/` (`src/pages/api/contacto.ts`, `prerender = false`). Lógica en `src/lib/contacto.ts`.
- Antispam: campo trampa `sitio_web`, tiempo mínimo de 3 s, límite de 5 envíos/10 min por IP y Turnstile si hay clave. Los bots reciben "ok" sin que se envíe nada.
- Claves en variables de entorno (`astro.config.mjs` → `env.schema`, ejemplo en `.env.example`). Sin claves funciona en **modo prueba**: el mensaje se muestra en la consola del servidor y no se envía.
- Sin dominio propio, Resend solo envía desde `onboarding@resend.dev` al correo dueño de la cuenta: no hay respuesta automática a quien escribe hasta tener dominio.

## SEO técnico y seguridad

- La lista de páginas del sitio sale de `src/lib/paginas.ts` (`paginasDelSitio`); la usan `[...ruta].astro` y `/sitemap.xml`. Solo las páginas `indexable` entran al sitemap.
- `/robots.txt` (`src/pages/robots.txt.ts`) bloquea el área de socios y `/api/`.
- CSP: `security.csp` en `astro.config.mjs` (meta tag con hashes que Astro calcula). Todo script `is:inline` necesita su hash en `scriptDirective.hashes`; un script externo nuevo, su dominio en `resources`. No se puede probar en `npm run dev`: construir y usar `npx wrangler dev --config dist/server/wrangler.json`.
- En páginas dinámicas Astro envía la CSP como encabezado; en estáticas, como `<meta>`.
- Resto de encabezados de seguridad: `public/_headers` (archivos estáticos) y `src/lib/seguridad.ts` (respuestas del Worker). Mantenerlos iguales. Verificar en securityheaders.com al publicar.

## Tarea diaria de mantenimiento

- `scheduled` en `src/worker.ts`, programado en `wrangler.jsonc` → `triggers.crons` a las 04:00 UTC (medianoche en Bolivia). Corre aunque nadie entre a la web.
- Hoy solo deja un registro (los eventos pasados ya no requieren reconstruir: la portada y el listado son dinámicos). Fase 3: agregar ahí la consulta a Supabase para que el plan gratuito no se pause.
- No usar tareas programadas de GitHub Actions para esto: se desactivan tras 60 días sin cambios en el repositorio.

## Prohibiciones

- No subir `.env` ni claves a GitHub.
- No añadir bibliotecas pesadas (carruseles, animaciones, frameworks de UI) sin preguntar.
- No ocultar contenido privado con JavaScript: lo privado se verifica en el servidor.

## Comandos

- `npm run dev` — servidor local (http://localhost:4321)
- `npm run build` — construir (falla si falta un campo obligatorio)
- `npm run preview` — ver la versión construida
