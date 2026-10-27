# ABTCC web — reglas del proyecto

Sitio de la Asociación Boliviana de Terapias Cognitivas, Conductuales y Contextuales (nombre oficial pendiente de confirmar, ver `docs/datos-pendientes.md`).
La arquitectura completa está en `docs/arquitectura.md`. Leerla antes de decisiones estructurales.

## Estado y forma de trabajo

- Etapa actual: **construir la estructura funcional**. El diseño visual va al final: estilos mínimos y legibles, todo en variables CSS (`src/styles/`) para poder rediseñar sin tocar la estructura.
- Los datos reales se cargan al final. Mientras tanto se usa relleno marcado con `[PENDIENTE: ...]` y cada dato faltante se anota en `docs/datos-pendientes.md`.
- Se avanza paso a paso; cada paso termina con algo que se pueda ver funcionando en el navegador.
- El usuario escribe en español; responder en español.

## Stack

- Astro (sitio estático; solo `/[lang]/socios/` se renderiza en el servidor, fase 3).
- Código en GitHub. Publicación en Vercel, subdominio gratuito por ahora (sin dominio propio).
- Supabase solo para el área de socios (fase 3).

## Idiomas

- `es` (principal), `en`, `pt`, en rutas `/es/`, `/en/`, `/pt/`. La raíz redirige a `/es/`; nunca redirigir según el idioma del navegador.
- Las rutas se traducen (`/es/nosotros/`, `/en/about/`, `/pt/sobre/`). El mapa está en `src/i18n/rutas.ts` (`SECCIONES`); generar enlaces siempre con `ruta(seccion, idioma)`, nunca escribir URLs a mano.
- Las secciones fijas se generan todas desde `src/pages/[...ruta].astro`; el contenido de cada una va en `src/vistas/` y se registra en `VISTAS`. Sin vista registrada, se muestra "en construcción".
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

- **Eventos:** UN archivo por evento en `src/content/eventos/`, nombrado `AAAA-MM-DD-slug.md`. Datos comunes (fechas, modalidad, costos, estado...) una sola vez; textos por idioma dentro del mismo archivo. Un evento sale en un idioma solo si tiene textos en ese idioma.
- **Blog y páginas:** un archivo por idioma, unidos por la `clave` de traducción.
- **Personas:** un archivo por persona; cargo y bio por idioma.
- Nombres de archivo en minúsculas, sin tildes ni espacios, con guiones.
- Los esquemas en `src/content.config.ts` son la fuente de verdad de los campos.

## Prohibiciones

- No subir `.env` ni claves a GitHub.
- No añadir bibliotecas pesadas (carruseles, animaciones, frameworks de UI) sin preguntar.
- No ocultar contenido privado con JavaScript: lo privado se verifica en el servidor.

## Comandos

- `npm run dev` — servidor local (http://localhost:4321)
- `npm run build` — construir (falla si falta un campo obligatorio)
- `npm run preview` — ver la versión construida
