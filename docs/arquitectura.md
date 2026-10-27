# Arquitectura web ABTCC

Oct 27, 2026 · @Leo · *Revisado el 27/10/2026: alojamiento en Vercel sin dominio propio por ahora, eventos en un solo archivo, ajustes de seguridad (ver sección 14).*

## 1. Resumen de decisiones

La web de ABTCC será un sitio mayormente estático, en tres idiomas (español, inglés y portugués), con un área de socios protegida por login, y con un contenido (eventos, blog, páginas) que tú mismo actualizas con Claude Code editando archivos de texto. Esa combinación es la que mejor resuelve las tres exigencias que planteas: que cargue rápido y no se trabe, que Google la encuentre, y que no dependa de un panel de administración complejo.

La idea central es separar la web en dos capas. La **capa pública** (quiénes somos, eventos, blog, contacto) se genera de antemano como páginas HTML ya hechas: cuando alguien entra, el servidor no tiene que "armar" nada, solo entregar un archivo. Eso la hace muy rápida, barata de alojar y casi imposible de tumbar. La **capa privada** (área de socios) sí necesita un servidor que verifique quién eres antes de mostrarte algo; esa parte se apoya en un servicio externo de autenticación y base de datos.

| Decisión | Elección propuesta | Por qué |
| --- | --- | --- |
| Tipo de sitio | Estático + rutas dinámicas solo en el área de socios | Velocidad, SEO y costo casi cero en la parte pública |
| Framework | Astro | Genera HTML sin JavaScript innecesario, trae rutas multilenguaje y "colecciones de contenido" en Markdown |
| Contenido | Archivos Markdown en el repositorio | Lo editas con Claude Code; queda versionado y respaldado |
| Idiomas | es (principal), en, pt en subcarpetas `/es/`, `/en/`, `/pt/` | Es la estructura que Google entiende mejor para sitios multilenguaje |
| Área de socios | Supabase (login, base de datos, archivos privados) | Autenticación segura sin programar un servidor propio |
| Código | Repositorio en GitHub | Historial de cambios, respaldo y despliegue automático |
| Alojamiento | Vercel (alternativas: Netlify, Cloudflare) | Red global (CDN), HTTPS gratis, publica sola cada vez que guardas cambios |
| Dirección web | Por ahora subdominio gratuito (`abtcc.vercel.app` o similar); dominio propio más adelante | Permite publicar ya; al comprar el dominio se redirige con 301 sin perder posicionamiento |

**Cómo usar este documento con Claude Code.** Expórtalo como Markdown y guárdalo en el proyecto como `docs/arquitectura.md`. Luego pide a Claude Code que cree un archivo `CLAUDE.md` en la raíz que resuma las convenciones (idiomas, campos de eventos, fuentes, colores). Así, cada vez que abras una sesión nueva, Claude Code lee las reglas del proyecto y no improvisa. Trabaja por fases (sección 13), no todo de una vez.

**Preguntas abiertas antes de empezar**

- [ ] Nombre oficial exacto tal como figura en el estatuto (aparece como "Terapia Cognitivo Conductual" y como "Terapias Cognitivas, Conductuales y Contextuales")
- [ ] Dominio: por ahora no hay; se publica en un subdominio gratuito. Decidir antes de la fase 3 (lo necesita el correo a socios)
- [ ] Categorías de socio y si las cuotas se pagarán fuera de la web por ahora
- [ ] Si la asociación tendrá dirección física pública (afecta Google Maps / Perfil de Empresa)
- [ ] Quién más de la comisión tendrá acceso administrativo a las cuentas

## 2. Mapa del sitio

El sitio tiene seis secciones públicas en el menú principal, una zona institucional de transparencia y un área privada de socios; cada página existe en los tres idiomas con la misma estructura. La organización sigue lo que suelen tener las asociaciones profesionales internacionales (ACBS, ABCT, EABCT): identidad institucional clara, oferta formativa visible, membresía con requisitos explícitos y documentos de gobierno accesibles.

La portada no es una página decorativa: es la puerta de entrada a lo más importante. Por eso el bloque **Próximos eventos** va arriba, justo después de la presentación breve, y se actualiza solo (ver sección 6).

&#91;embedded content: mapa del sitio · 6 secciones\]

Las secciones públicas se rastrean en Google; la de socios queda fuera del buscador y detrás del login.

| Página | Ruta (español) | Qué contiene | Por qué importa |
| --- | --- | --- | --- |
| Inicio | `/es/` | Presentación en una frase, próximos eventos (3 más cercanos), últimos artículos, llamado a hacerse socio | Es la página con más autoridad ante Google y la que define la primera impresión |
| Quiénes somos | `/es/nosotros/` | Misión, visión, valores, historia, enfoque (TCC y terapias contextuales) | Responde "¿quiénes son y en qué creen?" |
| Comisión directiva | `/es/nosotros/comision-directiva/` | Foto, cargo, formación y enlace de cada integrante | Da credibilidad profesional (Google valora autoría identificable) |
| Estatuto y ética | `/es/nosotros/transparencia/` | Estatuto, código de ética, personería jurídica, actas públicas | Estándar en asociaciones serias; genera confianza |
| Formación y eventos | `/es/eventos/` | Próximos eventos arriba, archivo de eventos pasados abajo, filtros por tipo | Sección prioritaria |
| Detalle de evento | `/es/eventos/[slug]/` | Fecha, hora con zona horaria, modalidad, lugar, costos, facilitadores, inscripción, botón "añadir al calendario" | Es la página que se comparte y la que Google muestra en resultados de eventos |
| Membresía | `/es/membresia/` | Categorías, requisitos, beneficios, cuota, formulario de solicitud | Convierte visitantes en socios |
| Blog / Publicaciones | `/es/blog/` y `/es/blog/[slug]/` | Artículos con autor, fecha, categorías | Principal motor de visitas desde Google a largo plazo |
| Recursos | `/es/recursos/` | Materiales descargables abiertos, enlaces recomendados | Opcional; atrae enlaces de otras webs |
| Contacto | `/es/contacto/` | Formulario, correo institucional, redes, ubicación | Datos de contacto consistentes en todo el sitio |
| Acceso socios | `/es/socios/` | Login; luego panel, perfil, material exclusivo, certificados | Área privada (sección 7) |
| Legales | `/es/privacidad/`, `/es/aviso-legal/` | Política de privacidad, términos | Obligatorio si se recogen datos personales |
| Error 404 | `/404` | Mensaje amable y enlaces a secciones | Evita que el visitante se pierda |

**Elementos que se repiten en todas las páginas**

- **Encabezado:** logo, menú principal, selector de idioma (ES · EN · PT) y botón "Acceso socios".
- **Pie de página:** nombre legal completo, correo, redes sociales, enlaces legales, suscripción al boletín y año.
- **Migas de pan** (Inicio › Eventos › Taller X) en páginas internas: ayudan al usuario y a Google a entender la jerarquía.

**Secciones opcionales para fases posteriores:** directorio público de profesionales socios (muy usado en asociaciones internacionales para "encontrar un terapeuta", siempre con consentimiento explícito de cada socio), noticias, convenios e instituciones aliadas, preguntas frecuentes.

## 3. Stack técnico

El stack son cinco piezas que se conectan solas: GitHub guarda el código y el contenido, Astro construye el sitio, Vercel lo publica en todo el mundo, Supabase maneja socios y datos privados, y un proveedor de correo envía los mensajes. Tú solo trabajas en la primera pieza; el resto se activa automáticamente cada vez que guardas un cambio.

El flujo es así: con Claude Code creas o editas un archivo (por ejemplo, un evento nuevo); haces *commit* y *push* a GitHub; el servicio de alojamiento detecta el cambio, vuelve a construir el sitio en uno o dos minutos y lo publica. No hay que subir archivos por FTP ni entrar a ningún panel.

&#91;embedded content: arquitectura del sitio · 8 piezas\]

Cada cambio guardado en GitHub se publica solo; Supabase solo interviene cuando un socio inicia sesión o recibe un correo de acceso.

| Pieza | Herramienta | Función | Alternativa |
| --- | --- | --- | --- |
| Repositorio | GitHub (privado, cuenta de la asociación) | Guarda código y contenido con historial completo; si algo se rompe, se vuelve atrás | GitLab |
| Generador del sitio | Astro | Convierte Markdown + plantillas en HTML; manda JavaScript solo donde hace falta ("islas") | Eleventy (más simple, sin área de socios integrada) |
| Estilos | CSS propio con variables, o Tailwind | Colores y tipografía definidos una sola vez | — |
| Alojamiento + CDN | Vercel | Sirve el sitio desde servidores cercanos a cada visitante; HTTPS automático; ejecuta las rutas protegidas | Netlify, Cloudflare |
| Autenticación y datos | Supabase | Login de socios, tabla de socios y pagos de cuota, archivos privados | Firebase |
| Correo transaccional | Resend o el SMTP del correo institucional | Envía enlaces de acceso, confirmaciones de formularios | Brevo |
| Correo institucional | Google Workspace o Zoho Mail | `contacto@`, `secretaria@`, `socios@` con el dominio propio | — |
| Boletín | Brevo o MailerLite | Envío de novedades y eventos a suscriptores | — |
| Antispam en formularios | Cloudflare Turnstile + campo trampa | Bloquea bots sin molestar con captchas | hCaptcha |

**Por qué Astro y no WordPress.** WordPress es cómodo para quien edita desde un panel, pero como tú vas a trabajar con Claude Code ese panel no te aporta. A cambio, WordPress exige servidor con base de datos, actualizaciones de plugins constantes y es el blanco más atacado de internet; mal configurado, es la causa típica de webs lentas. Astro genera archivos estáticos: no hay base de datos pública que hackear ni plugins que se desactualicen.

**Por qué el área de socios necesita algo más.** Una página estática la puede ver cualquiera que tenga el enlace. Para que el material exclusivo sea realmente privado, el servidor debe comprobar la sesión *antes* de entregar la página o el archivo. Astro permite marcar solo esas rutas (`/socios/...`) como "renderizadas en el servidor" mientras el resto sigue siendo estático.

**Regla de cuentas:** todas las cuentas (GitHub, Vercel, Supabase, correo y, cuando exista, dominio) se crean con un correo institucional, no personal, con verificación en dos pasos y al menos dos administradores de la comisión. Si una persona deja la asociación, la web no se pierde con ella.

## 4. Estructura del proyecto y modelo de contenido

Todo el contenido editable vive en una sola carpeta, `src/content/`, separado del diseño; así, agregar un evento o un artículo nunca toca el código de las plantillas. Cada tipo de contenido (eventos, blog, personas, páginas) es una "colección" con campos obligatorios definidos en un esquema: si a un evento le falta la fecha, el sitio no se construye y Claude Code te avisa del error antes de publicar. Eso evita páginas rotas o incompletas en línea.

```
abtcc-web/
├── CLAUDE.md                  ← reglas del proyecto para Claude Code
├── docs/arquitectura.md       ← este documento
├── astro.config.mjs           ← idiomas, dominio, adaptador de servidor
├── public/
│   ├── favicon.svg, robots.txt
│   └── docs/                  ← PDFs públicos (estatuto, código de ética)
├── src/
│   ├── content/
│   │   ├── eventos/             ← UN archivo .md por evento (datos comunes + textos por idioma)
│   │   ├── blog/{es,en,pt}/
│   │   ├── personas/            ← comisión directiva, facilitadores, autores
│   │   └── paginas/{es,en,pt}/  ← nosotros, membresía, etc.
│   ├── content.config.ts      ← esquemas (campos obligatorios)
│   ├── i18n/{es,en,pt}.json   ← textos de interfaz (menú, botones)
│   ├── assets/                ← imágenes que Astro optimiza
│   ├── components/            ← piezas reutilizables (TarjetaEvento, Header…)
│   ├── layouts/               ← plantilla base con SEO y fuentes
│   ├── pages/[...ruta].astro  ← genera las secciones fijas en los 3 idiomas (rutas traducidas)
│   ├── vistas/                ← contenido de cada sección
│   ├── pages/[lang]/socios/   ← rutas protegidas (servidor)
│   ├── lib/supabase.ts        ← conexión al área de socios
│   └── styles/                ← variables de color y tipografía
└── .env                       ← claves secretas (NUNCA se sube a GitHub)
```

**Colecciones y sus campos principales**

| Colección | Campos obligatorios | Campos opcionales |
| --- | --- | --- |
| Eventos | tipo, fecha y hora de inicio, modalidad, estado; y por cada idioma publicado: título y resumen | fecha de fin, lugar, enlace online, costos, cupos, facilitadores, imagen, horas certificadas (detalle en sección 6) |
| Blog | título, idioma, clave de traducción, autor (referencia a Personas), fecha de publicación, resumen, categoría | fecha de actualización, imagen de portada, etiquetas, referencias bibliográficas |
| Personas | nombre, foto; cargo y biografía breve por idioma (es obligatorio, en/pt opcionales) | título profesional, enlaces (ORCID, LinkedIn, Instagram), orden de aparición |
| Páginas | título, idioma, clave de traducción, descripción para Google | imagen para redes |

**Eventos: un solo archivo.** Los datos que no dependen del idioma (fechas, modalidad, costos, estado, cupos, facilitadores) se escriben una sola vez; solo los textos (título, resumen, descripción) van por idioma dentro del mismo archivo. Así es imposible que la fecha en español y en portugués queden distintas. Un evento aparece en `/en/` o `/pt/` solo si tiene textos en ese idioma.

**La "clave de traducción"** (blog y páginas) es un identificador común (por ejemplo `taller-act-estres-2026`) que une las tres versiones de un mismo contenido. Gracias a ella el selector de idioma lleva a la página equivalente, no a la portada, y Google sabe que son traducciones entre sí (sección 5).

**Nombres de archivo:** en minúsculas, sin tildes ni espacios, con guiones; en eventos conviene empezar por la fecha (`2026-11-14-taller-act-estres.md`) para que se ordenen solos en la carpeta.

## 5. Tres idiomas: español, inglés y portugués

Cada idioma vive en su propia subcarpeta (`/es/`, `/en/`, `/pt/`) dentro del mismo dominio, y cada página declara a Google cuáles son sus versiones en los otros idiomas. Esa combinación hace que alguien en Brasil que busca en portugués vea la versión `/pt/`, y que alguien en Bolivia vea la `/es/`, sin que Google las considere contenido duplicado.

**Qué debe implementarse**

1. **Rutas por idioma.** Astro tiene enrutamiento multilenguaje incorporado. La raíz (`abtcc.org.bo/`) redirige a `/es/` por defecto; no conviene redirigir automáticamente según el idioma del navegador, porque Google rastrea desde EE. UU. y podría no ver nunca la versión en español.
2. **Etiquetas `hreflang`.** En el `<head>` de cada página, un enlace por cada versión (`es`, `en`, `pt`) más `x-default` apuntando al español. Deben ser recíprocas: si la página en inglés apunta a la portuguesa, la portuguesa debe apuntar a la inglesa.
3. **Atributo `lang`** correcto en `<html lang="pt">`, que también usan los lectores de pantalla para pronunciar bien.
4. **Selector de idioma** visible en el encabezado, con el nombre de cada idioma escrito en ese mismo idioma (Español · English · Português), nunca con banderas: una bandera representa un país, no una lengua.
5. **Textos de interfaz** (menú, botones, "Inscribirme", "Próximos eventos") en archivos `i18n/es.json`, `en.json`, `pt.json`, nunca escritos dentro de las plantillas.
6. **Fechas, horas y monedas** formateadas según el idioma con las funciones nativas del navegador (`Intl`): "14 de noviembre de 2026" / "November 14, 2026" / "14 de novembro de 2026".
7. **Zona horaria explícita en eventos.** Toda hora se guarda con zona (`2026-11-14T09:00-04:00`) y se muestra como "09:00 hora de Bolivia (UTC−4)". Para eventos online, añadir la conversión automática a la hora local del visitante. Un error de hora en un webinar internacional es el fallo más común de las asociaciones latinoamericanas.

**Política de traducción (decisión editorial, no técnica)**

| Contenido | Español | Inglés | Portugués |
| --- | --- | --- | --- |
| Páginas institucionales (nosotros, membresía, contacto, legales) | Sí | Sí | Sí |
| Eventos | Sí | Si son online o abiertos a extranjeros | Si son online o abiertos a extranjeros |
| Blog | Sí | Selección de artículos | Selección de artículos |
| Área de socios | Sí | Interfaz sí, material no necesariamente | Interfaz sí, material no necesariamente |

No hace falta que todo exista en los tres idiomas. Si un artículo solo está en español, la versión inglesa del blog simplemente no lo lista, y el selector de idioma de ese artículo indica "disponible solo en español". Lo que **no** debe hacerse es publicar traducciones automáticas sin revisión: Google las penaliza como contenido de baja calidad y, en un sitio de psicología, afectan la credibilidad. La terminología técnica (RFT, ACT, marcos relacionales) conviene fijarla en un glosario dentro del proyecto para que Claude Code traduzca siempre igual.

## 6. Próximos eventos

Cada evento es un archivo con campos fijos, y a partir de ese único archivo el sitio genera solo la tarjeta en la portada, la entrada en el listado, la página de detalle, el archivo de calendario y la ficha que Google lee para mostrarlo en sus resultados de eventos. Escribes una vez; aparece en cinco lugares sin riesgo de que una fecha quede distinta en uno de ellos.

**Campos de cada evento**

| Campo | Ejemplo | Para qué sirve |
| --- | --- | --- |
| `titulo` | Taller: ACT para el manejo del estrés | Encabezado y título en Google |
| `tipo` | taller · curso · diplomado · jornada · congreso · webinar · supervisión · asamblea | Filtros y etiqueta de color |
| `inicio` / `fin` | `2026-11-14T09:00-04:00` | Orden, cuenta regresiva, calendario; siempre con zona horaria |
| `sesiones` | lista de fechas | Para cursos en varias sesiones |
| `modalidad` | presencial · online · híbrido | Google distingue eventos virtuales y presenciales |
| `lugar` | nombre, dirección, ciudad, enlace a mapa | Solo si es presencial o híbrido |
| `plataforma` | Zoom, Meet | El enlace de acceso se envía a inscritos, no se publica |
| `estado` | programado · cupos agotados · pospuesto · cancelado | Evita que alguien se inscriba a algo cancelado |
| `facilitadores` | referencia a Personas | Muestra foto y credenciales; da autoría |
| `costos` | socio / no socio / estudiante, en Bs y USD | Transparencia; Google muestra el precio |
| `inscripcion` | enlace al formulario + fecha límite | El botón principal de la página |
| `cupos` | 30 | Opcional |
| `certificacion` | horas académicas, aval | Valor clave para profesionales |
| `dirigido_a` | psicólogos clínicos, estudiantes de último año | Filtra el público correcto |
| `imagen` | afiche del evento | Tarjeta, redes sociales y Google |
| `solo_socios` | verdadero / falso | Eventos internos que se ven solo con login |

**Dónde aparecen**

- **Portada:** los tres eventos futuros más cercanos, ordenados por fecha, con tipo, fecha, modalidad y botón de inscripción. Si no hay ninguno, un mensaje con enlace al boletín ("Avísame del próximo evento"), nunca un bloque vacío.
- **`/eventos/`:** arriba los próximos, con filtros por tipo y modalidad; abajo el archivo de eventos realizados, agrupado por año. El archivo es valioso: demuestra trayectoria a quien evalúa a la asociación.
- **Página de detalle:** toda la información, botón de inscripción fijo en móvil, facilitadores, preguntas frecuentes del evento y botones para compartir.
- **Calendario:** botón "Añadir a mi calendario" que descarga un archivo `.ics` (funciona en Google Calendar, Outlook y Apple) y un enlace directo a Google Calendar. Además, un calendario suscribible con todos los eventos (`/eventos.ics`) que los socios pueden agregar una sola vez y se actualiza solo.
- **Fuente RSS de eventos** para quien quiera seguirlos y para automatizar publicaciones.

**El problema de los sitios estáticos y su solución.** Como las páginas se construyen de antemano, un evento que ya pasó seguiría apareciendo como "próximo" hasta la siguiente publicación. Se resuelve de dos formas complementarias: (1) una reconstrucción automática diaria del sitio a medianoche hora de Bolivia, programada con un *deploy hook* de Vercel disparado por un cron (las tareas programadas de GitHub Actions se desactivan solas tras 60 días sin cambios en el repositorio, así que no conviene depender solo de ellas); y (2) un pequeño script en la portada que oculta en el navegador cualquier evento cuya fecha ya pasó, por si la reconstrucción falla un día.

**Para que Google muestre los eventos.** Cada página de detalle incluye datos estructurados `Event` de schema.org (formato JSON-LD) con nombre, fechas con zona horaria, `eventStatus` (programado, cancelado, pospuesto), `eventAttendanceMode` (online, presencial, mixto), lugar o URL virtual, precio y organizador. Con eso, el evento puede aparecer en la experiencia de búsqueda de eventos de Google. Si un evento se cancela, **no se borra la página**: se cambia el estado a cancelado, para que Google actualice la información en vez de mostrar un enlace roto.

**Inscripciones.** En la fase inicial basta con un enlace a un formulario (Google Forms o el formulario propio con Supabase). Más adelante, la inscripción puede guardarse en la base de datos de socios para emitir certificados descargables desde el área privada.

## 7. Área de socios con login

El área de socios es la única parte del sitio que maneja datos personales, así que es la que más cuidado técnico exige: el acceso lo controla Supabase y cada dato queda protegido en la base de datos misma, no solo ocultándolo en la página. La regla que guía todo es que nadie se registra solo: una persona solicita la membresía, la comisión la aprueba, y recién entonces obtiene acceso.

**Flujo de alta de un socio**

1. La persona llena el formulario de solicitud en `/membresia/` (datos, formación, categoría, documentos de respaldo). **No crea cuenta**: los avisos sobre su solicitud le llegan por correo.
2. La solicitud queda guardada con estado "pendiente" y llega un aviso al correo de la asociación.
3. Un administrador revisa y cambia el estado a "activo" (desde un panel simple dentro del área, o desde Supabase al principio).
4. El sistema envía al socio un correo de bienvenida con un enlace de acceso.
5. El socio entra con **enlace mágico** (recibe un enlace por correo, sin contraseña que olvidar) o con correo y contraseña si lo prefiere.

**Roles**

| Rol | Qué puede ver y hacer |
| --- | --- |
| Socio activo | Panel, perfil, material exclusivo, certificados, eventos solo para socios |
| Socio con cuota vencida | Su perfil y un aviso para regularizar; no el material exclusivo |
| Administrador | Aprobar solicitudes, marcar cuotas pagadas, subir material, ver listado de socios |

**Contenido del área (por fases)**

- Fase inicial: panel de bienvenida, perfil editable, estado de cuota, material exclusivo (grabaciones, presentaciones, documentos), eventos internos.
- Después: certificados de eventos descargables, actas y convocatorias a asamblea, directorio interno, opción de aparecer en el directorio público de profesionales.
- Más adelante, si se decide: pago de cuotas en línea (requiere una pasarela que opere en Bolivia; se evalúa aparte).

**Seguridad del área (no negociable)**

- **Verificación en el servidor:** las páginas `/socios/` se generan en el servidor solo después de comprobar la sesión. Ocultar contenido con JavaScript en el navegador no protege nada.
- **Seguridad a nivel de fila (RLS) en Supabase:** cada tabla tiene reglas que dicen quién puede leer o modificar cada fila. Un socio solo puede ver y editar su propio perfil, aunque alguien manipule la página.
- **Archivos privados:** el material exclusivo va en un almacenamiento privado de Supabase y se entrega con enlaces firmados que caducan en minutos; así, compartir el enlace no sirve.
- **Claves:** la clave pública de Supabase puede estar en el sitio; la clave de servicio (con permisos totales) solo en variables de entorno del servidor, jamás en GitHub.
- **Datos mínimos:** pedir solo lo que se usa. No guardar números de carnet ni datos bancarios en la web.
- **Sesiones:** cierre de sesión visible, expiración automática y cookies seguras.
- **Registro abierto desactivado:** en Supabase se desactiva "Allow new users to sign up" y el enlace mágico se pide con `shouldCreateUser: false`. Si no, cualquiera podría crearse una cuenta solo pidiendo un enlace.
- **Pausa del plan gratuito:** Supabase pausa los proyectos gratuitos tras una semana sin actividad. Se evita con una consulta automática diaria (cron) o pasando al plan de pago; decidir al iniciar la fase 3.

**Tablas básicas en Supabase:** `socios` (perfil, categoría, estado, fechas), `cuotas` (año, monto, fecha de pago, registrado por), `materiales` (título, archivo, categoría, visible para), `inscripciones` (socio, evento, asistencia, certificado). Claude Code puede crearlas con migraciones versionadas para que la estructura quede documentada en el repositorio.

## 8. Rendimiento: que no se trabe

Una web se "traba" casi siempre por tres causas: imágenes demasiado pesadas, exceso de JavaScript (sliders, animaciones, widgets de terceros) y fuentes tipográficas mal cargadas. La arquitectura estática ya elimina la cuarta causa (un servidor lento armando cada página); el resto depende de disciplina en el diseño. Importa doble en Bolivia y la región, donde mucha gente entra desde el celular con datos móviles.

**Metas medibles (Core Web Vitals de Google, en móvil)**

| Métrica | Qué mide | Meta |
| --- | --- | --- |
| LCP | Cuánto tarda en verse el elemento principal | Menos de 2,5 s |
| INP | Cuánto tarda la página en responder a un toque o clic | Menos de 200 ms |
| CLS | Cuánto "salta" el contenido mientras carga | Menos de 0,1 |
| Lighthouse (rendimiento, accesibilidad, SEO) | Auditoría general de Chrome | 90 o más en las tres |

Google usa estas métricas como factor de posicionamiento, así que rendimiento y visibilidad van juntos.

**Imágenes**

- Todas las imágenes en `src/assets/` para que Astro las convierta a formatos modernos (AVIF/WebP) y genere varios tamaños; el navegador del celular descarga la pequeña.
- Siempre con ancho y alto declarados: así el navegador reserva el espacio y el contenido no salta.
- La imagen principal de cada página carga con prioridad; el resto, en diferido (solo cuando el usuario se acerca a ellas).
- Afiches de eventos: exportar a un tamaño razonable (máximo unos 1600 px de ancho) antes de subirlos; un afiche de 8 MB directo de Canva es el error más frecuente.

**Tipografía (2–3 fuentes, como ya decidiste)**

- Alojadas en el propio sitio en formato `woff2`, no cargadas desde Google Fonts en cada visita.
- Solo los pesos que se usan (por ejemplo, regular y negrita), con el subconjunto de caracteres latinos (incluye tildes, ñ y caracteres del portugués como ã, õ, ç).
- Preferir fuentes variables: un archivo cubre todos los pesos.
- `font-display: swap` para que el texto se vea de inmediato con una fuente de respaldo similar.
- Precarga solo de la fuente de títulos.

**JavaScript**

- Por defecto, cero. Astro solo envía código a los componentes que lo necesitan (filtro de eventos, menú móvil, selector de idioma).
- Nada de carruseles automáticos ni bibliotecas de animación pesadas; para la estética editorial bastan transiciones CSS sutiles, respetando la preferencia "reducir movimiento" del sistema.
- Contenido de terceros (YouTube, mapas, publicaciones de Instagram) con **fachada**: se muestra una imagen estática y el reproductor real carga solo al hacer clic. Un solo video de YouTube embebido puede pesar más que todo el resto del sitio.

**Entrega**

- CDN de Vercel: el sitio se sirve desde el servidor más cercano al visitante (São Paulo, Santiago, Miami…).
- Archivos con nombres únicos por versión y caché de larga duración; HTML con caché corta para que los cambios se vean enseguida.
- Compresión automática (Brotli), activada por defecto en esos servicios.

**Cómo comprobarlo:** antes de cada fase, correr PageSpeed Insights sobre la portada, una página de evento y un artículo, siempre en modo móvil.

## 9. Visibilidad en Google (SEO)

Que la encuentren depende de tres capas: que Google pueda **leer** el sitio (estructura técnica), que lo **entienda** (datos estructurados y metadatos) y que lo considere **confiable** (contenido propio, autores identificables y enlaces desde otras webs). Las dos primeras se resuelven una vez en la plantilla base; la tercera se construye con el tiempo, sobre todo con el blog y con la red de instituciones aliadas.

**Capa 1 — Que Google pueda leerlo (se configura una vez)**

- `sitemap.xml` generado automáticamente, con las tres versiones de idioma de cada página.
- `robots.txt` que permita rastrear todo lo público y excluya `/socios/`.
- URL limpias y descriptivas: `/es/eventos/taller-act-estres/`, no `/evento?id=37`.
- Una URL canónica por página, para que versiones con o sin barra final o con parámetros no compitan entre sí.
- HTML semántico: un solo `<h1>` por página, jerarquía de `<h2>`, `<h3>`, etiquetas `<nav>`, `<main>`, `<article>`, `<footer>`.
- Redirecciones 301 si alguna vez cambia una URL; nunca dejar enlaces rotos.

**Capa 2 — Que Google lo entienda**

- `title` único por página e idioma (hasta unos 60 caracteres) con el formato "Taller ACT para el estrés · ABTCC".
- `meta description` única (unos 150 caracteres) que invite a hacer clic.
- Etiquetas Open Graph y de X/Twitter con imagen de 1200×630 px: es lo que aparece cuando alguien comparte el enlace por WhatsApp, Facebook o LinkedIn. Para eventos, la imagen es el afiche.
- Datos estructurados JSON-LD (schema.org):

| Tipo | Dónde | Qué aporta |
| --- | --- | --- |
| `Organization` (o `ProfessionalService`) | Todo el sitio | Nombre legal, sigla, logo, correo, redes (`sameAs`); puede alimentar el panel de información de Google |
| `WebSite` | Portada | Nombre del sitio en resultados |
| `Event` | Cada evento | Fechas, lugar, precio, estado en la búsqueda de eventos |
| `BlogPosting` | Cada artículo | Autor, fecha, imagen |
| `Person` | Comisión y autores | Credenciales, refuerza la autoridad del contenido |
| `BreadcrumbList` | Páginas internas | Muestra la ruta en el resultado de búsqueda |

**Capa 3 — Que Google confíe en el sitio**

- **Nombre completo y sigla juntos** en títulos, pie y datos estructurados, para que aparezca tanto si buscan "ABTCC" como "Asociación Boliviana de Terapias…" o "terapia contextual Bolivia".
- **Autoría visible:** cada artículo con autor, formación y fecha. Google exige más pruebas de experiencia en temas de salud.
- **Blog regular:** uno o dos artículos al mes rinden más que diez juntos y luego nada. El blog es lo que atrae búsquedas como "qué es ACT" o "formación DBT Bolivia".
- **Enlaces desde otras webs:** universidades, colegios de psicólogos, instituciones con convenio, perfiles de los socios, redes de las que se forme parte. Cada enlace funciona como un voto de confianza.
- **Coherencia de datos de contacto** (nombre, correo, ciudad) idéntica en la web, Instagram, Facebook, LinkedIn y directorios.

**Registros externos el día del lanzamiento**

- [ ] **Google Search Console:** verificar el dominio, enviar el sitemap, revisar errores de indexación y la sección de eventos. Es la herramienta más importante para este objetivo.
- [ ] **Bing Webmaster Tools** (también alimenta otros buscadores y asistentes de IA).
- [ ] **Perfil de Empresa en Google** (Google Maps), solo si hay dirección o sede pública.
- [ ] Enlazar la web desde la bio de Instagram y demás redes de la asociación y de la comisión.

## 10. Accesibilidad, legal y privacidad

Una asociación de psicología debería ser coherente con sus valores también en su web: accesible para personas con discapacidad y transparente con los datos que recoge. La referencia internacional es el estándar WCAG 2.1 nivel AA, y casi todo se resuelve en la plantilla base, sin costo adicional.

**Accesibilidad (WCAG 2.1 AA)**

- Contraste suficiente entre texto y fondo (al menos 4,5:1 en texto normal); cuidado con grises claros y textos sobre fotos, frecuentes en diseños editoriales.
- Texto alternativo descriptivo en cada imagen con contenido; las decorativas, con alternativo vacío.
- Navegable completamente con teclado, con el foco siempre visible.
- Enlace "Saltar al contenido" al inicio de cada página.
- Formularios con etiquetas visibles y mensajes de error claros, no solo en color rojo.
- Afiches de eventos: la información del afiche (fecha, lugar, costo) también escrita como texto en la página; una imagen no la leen ni Google ni los lectores de pantalla.
- Tamaño de texto base generoso (16–18 px) y áreas táctiles de al menos 44 px en móvil.
- Respetar la preferencia del sistema de reducir movimiento.

**Documentos legales e institucionales**

| Documento | Contenido mínimo |
| --- | --- |
| Aviso legal | Nombre legal, número de personería jurídica (cuando se obtenga), domicilio, correo, representante legal |
| Política de privacidad | Qué datos se recogen (formularios, socios, boletín), para qué, dónde se guardan (Supabase, proveedor de correo), cuánto tiempo, cómo pedir su eliminación |
| Política de cookies | Solo si se usan cookies no esenciales; con analítica sin cookies, basta una mención en la de privacidad |
| Estatuto y código de ética | PDF descargable y, mejor, también como página de texto |
| Condiciones de inscripción a eventos | Política de reembolso, cambios de fecha, certificación |

**Privacidad en la práctica**

- Casilla de consentimiento explícito (no pre-marcada) en formularios de contacto, solicitud de membresía y boletín.
- Elegir analítica que no use cookies ni rastree personas (sección 12): evita el banner de cookies, que empeora la experiencia y el rendimiento.
- El directorio público de profesionales, si se crea, solo con consentimiento activo de cada socio y con la posibilidad de retirarse.
- Como el sitio estará en portugués e inglés y recibirá visitas de Brasil y Europa, conviene redactar la política siguiendo los principios de la LGPD brasileña y el RGPD europeo (finalidad, minimización, derecho de acceso y eliminación), además de la normativa boliviana vigente. La redacción final conviene revisarla con asesoría legal.

## 11. Seguridad, formularios, correo y respaldos

La mayoría de los problemas de seguridad de webs pequeñas no vienen de ataques sofisticados, sino de cuentas sin verificación en dos pasos, claves subidas por error a GitHub, formularios llenos de spam y dominios que vencen sin que nadie lo note. Esta sección cubre esos cuatro frentes.

**Dominio y DNS**

- Registrar el dominio a nombre de la asociación, con renovación automática y un correo institucional de contacto. Un dominio vencido es la forma más común de perder una web.
- Si se usa `.org.bo`, verificar con NIC Bolivia los requisitos documentales (puede pedir la personería jurídica, que está en trámite). Mientras tanto, puede registrarse un `.org` y redirigir después.
- Gestionar el DNS en Cloudflare o en Vercel cuando exista el dominio.
- **Mientras no haya dominio:** se usa un correo Gmail de la asociación (no personal) para las cuentas y para recibir formularios. Para enviar correos a terceros (enlaces de acceso a socios) hace falta dominio verificado, por eso el dominio debe estar antes de la fase 3.

**Correo institucional que no caiga en spam**

- Configurar los registros **SPF, DKIM y DMARC** del dominio. Sin ellos, los correos de bienvenida a socios y confirmaciones de inscripción terminan en la carpeta de correo no deseado (Gmail y Outlook ya los exigen).
- Direcciones por función, no por persona: `contacto@`, `socios@`, `eventos@`, `secretaria@`. Cuando cambia la comisión, se reasignan.

**Formularios (contacto, membresía, boletín)**

- Procesados en el servidor (una función de Vercel o de Supabase; en la fase 1 puede usarse un servicio de formularios que reenvía al correo de la asociación), nunca enviando el correo directamente desde el navegador.
- Antispam: Cloudflare Turnstile (verificación invisible) más un campo oculto "trampa" que solo llenan los bots.
- Límite de envíos por minuto desde una misma dirección.
- Validación de datos tanto en el navegador como en el servidor.
- Respuesta automática al remitente confirmando la recepción.

**Encabezados de seguridad del sitio**

- HTTPS obligatorio en todo el sitio, con HSTS.
- `Content-Security-Policy` que limite de dónde pueden cargarse scripts.
- `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Se configuran una sola vez en `vercel.json`; Claude Code puede generarlo y luego se verifica en securityheaders.com.

**Claves y cuentas**

- Archivo `.env` incluido en `.gitignore` desde el primer día; las claves de producción se cargan en el panel del alojamiento.
- Verificación en dos pasos en GitHub, Vercel, Supabase, correo y dominio.
- Un documento interno (fuera de la web) con quién administra cada cuenta, guardado en un gestor de contraseñas compartido de la asociación.
- Actualizaciones de dependencias automáticas con Dependabot de GitHub.

**Respaldos**

| Qué | Dónde está respaldado | Frecuencia |
| --- | --- | --- |
| Código y contenido (eventos, blog, páginas) | GitHub, con historial completo | Cada cambio |
| Base de datos de socios | Exportación de Supabase a una carpeta segura de la asociación | Mensual (el plan gratuito tiene respaldos limitados) |
| Archivos privados de socios | Copia en el almacenamiento de la asociación | Cuando se sube material nuevo |
| Configuración DNS y de cuentas | Documento interno | Cuando cambie |

## 12. Analítica, mantenimiento y flujo con Claude Code

Una vez publicada, la web se mantiene con una rutina corta: cargar eventos y artículos como archivos con Claude Code, revisar una vez al mes qué dice Search Console, y medir visitas con una analítica que no invada la privacidad. Si el proyecto tiene buenas reglas escritas en `CLAUDE.md`, cada actualización es una conversación de pocos minutos.

**Analítica**

| Opción | Ventaja | Limitación |
| --- | --- | --- |
| Vercel Web Analytics | Sin cookies, integrada en Vercel | El plan gratuito tiene cupo limitado de eventos |
| Cloudflare Web Analytics | Gratis, sin cookies, funciona en cualquier alojamiento | Métricas básicas |
| Plausible o Umami | Sin cookies, más detalle (orígenes, campañas, clics en "Inscribirme") | Plausible es de pago; Umami requiere alojarlo |
| Google Analytics 4 | Muy completo | Usa cookies, exige banner de consentimiento y añade peso |

Lo que conviene medir: visitas por idioma y país, páginas de eventos más vistas, clics en el botón de inscripción, solicitudes de membresía y artículos que más tráfico atraen desde Google.

**Flujo típico para cargar un evento con Claude Code**

1. Abres el proyecto y pides: "Crea el evento del taller de ACT y estrés del 14 de noviembre, presencial en La Paz, en español y portugués", adjuntando el afiche.
2. Claude Code crea un archivo en `src/content/eventos/` con los datos comunes y los textos en español y portugués, y optimiza la imagen.
3. Ejecuta la construcción local: si falta un campo obligatorio, el esquema lo detecta.
4. Revisas la vista previa en el navegador.
5. *Commit* y *push*: en uno o dos minutos está publicado, con su ficha para Google y su archivo de calendario.

**Qué debe incluir el `CLAUDE.md` del proyecto**

- Resumen de la arquitectura y enlace a `docs/arquitectura.md`.
- Idiomas, rutas y regla de la clave de traducción.
- Campos obligatorios de cada colección y ejemplos completos de un evento y un artículo.
- Paleta de colores, fuentes y componentes existentes (para no crear duplicados).
- Glosario de terminología técnica es/en/pt.
- Prohibiciones: no subir `.env`, no añadir bibliotecas pesadas sin preguntar, no publicar traducciones sin revisión.
- Comandos: construir, vista previa, comprobar enlaces rotos.

**Rutina de mantenimiento**

| Frecuencia | Tarea |
| --- | --- |
| Cada evento o artículo | Cargar contenido, revisar vista previa, publicar |
| Mensual | Revisar Search Console (errores, búsquedas que traen visitas), exportar base de socios, revisar analítica |
| Trimestral | PageSpeed Insights en páginas clave, revisar enlaces rotos, aplicar actualizaciones pendientes de Dependabot |
| Anual | Renovación de dominio, actualizar comisión directiva y documentos institucionales, revisar política de privacidad |
| Siempre activo | Monitor de disponibilidad gratuito (UptimeRobot o similar) que avise por correo si la web cae |

## 13. Orden de construcción y checklist de lanzamiento

Conviene construir en cuatro fases y publicar al terminar la primera: una web sencilla en línea empieza a acumular antigüedad y enlaces ante Google, mientras que una web perfecta que nunca sale no posiciona nada. Cada fase deja algo usable y no obliga a rehacer la anterior, porque la arquitectura ya contempla todo desde el inicio.

**Fases**

1. **Base pública en español.** Cuentas institucionales, repositorio, plantilla base con SEO y tipografía, portada, Quiénes somos, Comisión, Eventos (con calendario y datos estructurados), Membresía informativa, Contacto, legales. Registro en Search Console. *Se publica aquí, en el subdominio gratuito.*
2. **Contenido e idiomas.** Blog con los primeros 3–5 artículos, versiones en inglés y portugués de las páginas institucionales, glosario, boletín, reconstrucción diaria automática.
3. **Área de socios.** Dominio propio y correo verificado (requisito), Supabase, formulario de solicitud conectado, login, roles, panel, material exclusivo, administración básica de solicitudes y cuotas.
4. **Ampliaciones.** Certificados descargables, directorio público de profesionales, inscripción a eventos integrada, y pago en línea si se decide.

**Checklist antes de publicar cada fase**

- [ ] Todas las páginas tienen `title` y `description` únicos en cada idioma
- [ ] `sitemap.xml` y `robots.txt` accesibles; `/socios/` excluido
- [ ] Etiquetas `hreflang` recíprocas comprobadas (fase 2 en adelante)
- [ ] Datos estructurados validados con la Prueba de resultados enriquecidos de Google
- [ ] Vista previa al compartir por WhatsApp y LinkedIn verificada (imagen y texto)
- [ ] PageSpeed Insights móvil: 90 o más en portada, evento y artículo
- [ ] Navegación completa con teclado y contraste revisado
- [ ] Formularios probados: llegan los correos, funciona el antispam, no caen en spam
- [ ] SPF, DKIM y DMARC configurados
- [ ] HTTPS y encabezados de seguridad verificados
- [ ] Página 404 personalizada y sin enlaces rotos
- [ ] `.env` fuera del repositorio; claves cargadas en el alojamiento
- [ ] Verificación en dos pasos en todas las cuentas; dos administradores por cuenta
- [ ] Analítica funcionando
- [ ] Revisión en celular real (Android y iPhone) y con conexión lenta
- [ ] (Fase 3) Un usuario sin sesión no puede abrir ninguna URL de `/socios/` ni ningún archivo privado, aun teniendo el enlace
- [ ] (Fase 3) Un socio no puede ver ni editar datos de otro socio

## 14. Registro de cambios

**27/10/2026 — Revisión inicial**

- Alojamiento: Vercel en lugar de Cloudflare Pages. Sin dominio propio por ahora: subdominio gratuito; el dominio pasa a ser requisito de la fase 3.
- Eventos: un solo archivo por evento con datos comunes y textos por idioma (antes: un archivo por idioma, con riesgo de fechas distintas).
- Personas: cargo y biografía por idioma.
- Socios: el solicitante no crea cuenta; se desactiva el registro abierto de Supabase; se contempla la pausa del plan gratuito.
- Reconstrucción diaria: cron con *deploy hook* en lugar de depender solo de GitHub Actions.

**Pendiente de verificar:** el plan gratuito (Hobby) de Vercel está pensado para uso personal y no comercial. Como la asociación cobra cuotas y eventos, confirmar si corresponde el plan gratuito o si conviene Netlify/Cloudflare (que sí permiten este uso gratis). La parte pública es estática, así que cambiar de alojamiento es sencillo.
