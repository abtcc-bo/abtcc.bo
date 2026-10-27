# ABTCC web — reglas del proyecto

Sitio de la Asociación Boliviana de Terapias Cognitivas, Conductuales y Contextuales (nombre oficial pendiente de confirmar, ver `docs/datos-pendientes.md`).
La arquitectura completa está en `docs/arquitectura.md`. Leerla antes de decisiones estructurales.

## Estado y forma de trabajo

- Etapa actual: **construir la estructura funcional**. El diseño visual va al final: estilos mínimos y legibles, todo en variables CSS (`src/styles/`) para poder rediseñar sin tocar la estructura.
- Los datos reales se cargan al final. Mientras tanto se usa relleno marcado con `[PENDIENTE: ...]` y cada dato faltante se anota en `docs/datos-pendientes.md`.
- Se avanza paso a paso; cada paso termina con algo que se pueda ver funcionando en el navegador.
- El usuario escribe en español; responder en español. No programa: avisarle claramente cuando tenga que hacer algo y mantener `docs/tareas-para-ti.md` al día.

## Stack

- Astro (sitio estático; solo `/[lang]/socios/` se renderiza en el servidor, fase 3).
- Código en GitHub. Publicación en Vercel, subdominio gratuito por ahora (sin dominio propio).
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
- Datos institucionales sin idioma (correo, ciudad, redes, logo, imagen para redes) en `src/datos/organizacion.ts`; `null` = pendiente.
- Menú de celular: botón con `aria-expanded`; sin JavaScript el menú queda visible (clase `js` en `<html>`).
- Fechas y monedas con `Intl`. Horas siempre con zona horaria (`2026-11-14T09:00-04:00`), mostradas como "hora de Bolivia (UTC−4)".
- Selector de idioma con nombres (Español · English · Português), sin banderas.
- No publicar traducciones automáticas sin revisión humana.

## Contenido (`src/content/`)

Los esquemas en `src/content.config.ts` son la fuente de verdad de los campos. Las vistas leen el contenido con las funciones de `src/lib/contenido.ts`, no con `getCollection` directamente.

- **Eventos:** una carpeta por evento, `src/content/eventos/AAAA-MM-DD-slug/`, con `evento.yaml` (datos comunes: fechas, modalidad, costos, estado...), `es.md` obligatorio y `en.md`/`pt.md` opcionales (título, resumen y descripción de cada idioma), y el afiche en la misma carpeta. La URL es el nombre de la carpeta sin la fecha. Un evento sale en un idioma solo si tiene su .md.
- **Fechas y horas** de eventos siempre entre comillas y con zona: `"2026-11-14T09:00-04:00"`.
- **Blog:** `src/content/blog/{es,en,pt}/slug.md`; las traducciones comparten `clave`. `borrador: true` lo oculta al publicar.
- **Personas:** `src/content/personas/nombre-apellido.yaml`; cargo y bio por idioma; `comision: true` para la comisión directiva. Eventos y artículos las referencian por el nombre del archivo.
- **Páginas:** `src/content/paginas/{es,en,pt}/nombre.md`; `clave` = sección de `SECCIONES` donde se muestra.
- Contenido de muestra: lleva `[EJEMPLO]` en el título; se borra cuando llegue el real.
- Nombres de archivo y carpeta en minúsculas, sin tildes ni espacios, con guiones.

## Eventos (cómo se muestran)

- Todo sale de la carpeta del evento: tarjeta en portada (3 próximos), listado `/es/eventos/` (próximos con filtros + archivo por año), detalle `/es/eventos/slug/`, `.ics` en `/es/calendario/slug.ics`, calendario suscribible `/eventos.ics`, RSS `/es/eventos.xml` y JSON-LD `Event`.
- Lógica en `src/lib/eventos.ts` (horarios, inscripción abierta, calendario, datos para Google). Bolivia es UTC−4 fijo.
- Un evento cancelado NO se borra: `estado: cancelado`. `solo_socios: true` lo saca de las páginas públicas.
- Los eventos pasados se ocultan de "próximos" al reconstruir el sitio (reconstrucción diaria, pendiente al publicar) y, por si falla, con un script en el navegador.

## Formulario de contacto

- Formulario: `src/components/FormularioContacto.astro` → envía a `/api/contacto/` (`src/pages/api/contacto.ts`, única ruta en servidor por ahora, `prerender = false`, adaptador Vercel). Lógica en `src/lib/contacto.ts`.
- Antispam: campo trampa `sitio_web`, tiempo mínimo de 3 s, límite de 5 envíos/10 min por IP y Turnstile si hay clave. Los bots reciben "ok" sin que se envíe nada.
- Claves en variables de entorno (`astro.config.mjs` → `env.schema`, ejemplo en `.env.example`). Sin claves funciona en **modo prueba**: el mensaje se muestra en la consola del servidor y no se envía.
- Sin dominio propio, Resend solo envía desde `onboarding@resend.dev` al correo dueño de la cuenta: no hay respuesta automática a quien escribe hasta tener dominio.

## SEO técnico y seguridad

- La lista de páginas del sitio sale de `src/lib/paginas.ts` (`paginasDelSitio`); la usan `[...ruta].astro` y `/sitemap.xml`. Solo las páginas `indexable` entran al sitemap.
- `/robots.txt` (`src/pages/robots.txt.ts`) bloquea el área de socios y `/api/`.
- CSP: `security.csp` en `astro.config.mjs` (meta tag con hashes que Astro calcula). Todo script `is:inline` necesita su hash en `scriptDirective.hashes`; un script externo nuevo, su dominio en `resources`. No se puede probar en `npm run dev`: construir y servir `.vercel/output/static`.
- Resto de encabezados de seguridad en `vercel.json` (verificar en securityheaders.com al publicar).

## Tarea diaria de mantenimiento

- `/api/mantenimiento/` (`src/pages/api/mantenimiento.ts`), programada en `vercel.json` → `crons` a las 04:00 UTC (medianoche en Bolivia). Vercel la llama con `Authorization: Bearer CRON_SECRET`.
- Hoy: llama a `VERCEL_DEPLOY_HOOK_URL` para reconstruir el sitio (eventos pasados). Fase 3: agregar ahí la consulta a Supabase para que el plan gratuito no se pause.
- No usar tareas programadas de GitHub Actions para esto: se desactivan tras 60 días sin cambios en el repositorio.

## Prohibiciones

- No subir `.env` ni claves a GitHub.
- No añadir bibliotecas pesadas (carruseles, animaciones, frameworks de UI) sin preguntar.
- No ocultar contenido privado con JavaScript: lo privado se verifica en el servidor.

## Comandos

- `npm run dev` — servidor local (http://localhost:4321)
- `npm run build` — construir (falla si falta un campo obligatorio)
- `npm run preview` — ver la versión construida
