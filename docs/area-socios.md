# Área de socios: plan y lista de tareas

Plan acordado el 25/11/2026. Supabase: proyecto "abtcc.bo" de la organización "abtcc-bo". Primero que funcione; el diseño "bonito" va al final.
Se avanza una tarea a la vez. Al terminar una, se marca con [x].

---

## 1. Qué vamos a construir

Un apartado privado en `/es/socios/` (y `/en/members/`, `/pt/socios/`) donde cada socio:

1. **Entra** con su **código de socio** (o su correo) y su **contraseña**.
2. Si olvidó la contraseña, toca **"¿Olvidaste tu contraseña?"**, escribe su correo y le llega un enlace para crear una nueva.
3. Ve la **biblioteca**: libros, libros del docente, plataformas y otros materiales, ordenados por **tipo** y por **tema** (ACT, DBT, análisis funcional, neuropsicología, psicología forense…).
4. **Solo descarga.** Los archivos los sube la asociación (tú, a través de Claude).

Nadie se registra solo: la cuenta la crea la asociación cuando alguien ya es socio, y a esa persona le llega un correo para elegir su contraseña.

---

## 2. Con qué lo construimos (y por qué)

La web ya vive en **Cloudflare**. Le sumamos dos piezas gratuitas:

| Pieza | Para qué | Servicio | Gratis hasta |
| --- | --- | --- | --- |
| La **puerta** | Cuentas, contraseñas (guardadas cifradas), "olvidé mi contraseña" | **Supabase** (ya estaba previsto en `arquitectura.md`) | 50.000 socios activos al mes |
| El **depósito** | Guardar los PDF y entregarlos | **Cloudflare R2** (en la misma cuenta de la web) | 10 GB guardados; las descargas no se cobran |
| El **cartero** | Correos de bienvenida y de nueva contraseña | El **Gmail de la asociación** (abtcc.bo@gmail.com) | ~500 correos por día |

**Cómo se protege un archivo.** El depósito es privado: no hay enlaces públicos a los PDF. Cuando un socio toca "Descargar", la web primero comprueba en el servidor que tiene la sesión abierta y recién entonces le entrega el archivo. Si alguien copia el enlace y lo comparte, a quien no tenga sesión no le sirve.

**Por qué no otras opciones:**

- *Almacenamiento de Supabase:* solo 1 GB gratis; con libros se llena enseguida.
- *Google Drive:* da 15 GB, pero los enlaces se comparten fuera de la web y habría que dar permisos persona por persona a mano.
- *Firebase:* hace lo mismo que Supabase, pero el plan gratis ya no incluye almacenamiento de archivos sin tarjeta y obligaría a cambiar lo que ya estaba planeado.
- *Correo por Resend:* sin dominio propio solo puede escribirle al dueño de la cuenta. Cuando haya dominio, el cartero se cambia a Resend sin tocar nada más.

**Cuándo empezaría a costar:** si la biblioteca pasa de 10 GB (unos 1.000–2.000 libros en PDF), R2 cobra unos USD 0,015 por GB al mes. Llevaremos la cuenta del espacio usado.

**Cuidado con los derechos de autor.** Conviene subir solo material que la asociación puede compartir: manuales propios, presentaciones de los eventos, artículos de acceso abierto o libros con permiso de su autor o editorial. Repartir libros comerciales escaneados puede traer problemas legales a la asociación.

---

## 3. Cómo funcionará el día a día

- **Dar de alta a un socio:** me pasas nombre, correo, código y categoría. Yo creo la cuenta y le llega un correo "Crea tu contraseña".
- **Subir material:** me pasas el PDF (o lo dejas en una carpeta) y me dices título, tipo y tema. Yo lo subo al depósito y lo agrego al catálogo. Aparece en la biblioteca en un par de minutos.
- **Quitar un material o desactivar un socio:** me lo pides y queda hecho.
- **Temas nuevos:** se agregan a la lista cuando los necesitemos.

---

## 3 bis. Cómo se diseña (propuestas del 25/11/2026, por aprobar)

### Código de socio y nombre de usuario

Pedido de Leo: cada socio recibe un código al entrar y después puede cambiarlo por uno con su nombre. El sistema revisa que no esté repetido y, si está ocupado, lo dice y sugiere otro.

Propuesta: **dos cosas distintas**.

- **Código de socio** (`ABTCC-0012`): lo asigna la asociación y **no cambia nunca**. Es el número de membresía: sirve para certificados, cuotas y para ubicar a la persona aunque cambie su usuario.
- **Nombre de usuario** (`leo.eyzaguirre`): al principio es igual al código, y el socio lo cambia cuando quiera desde "Mi cuenta".
- Para entrar sirven **cualquiera de los tres**: usuario, código o correo. Si alguien olvida su usuario, entra con el código o el correo.

Reglas del nombre de usuario:

- De 3 a 30 caracteres: letras, números, punto y guion. Sin espacios.
- Tildes, eñes y mayúsculas se convierten solas: "José Peña" → `jose.pena`. Así `Jose.Pena` y `jose.pena` son el mismo y no se pueden duplicar.
- Mientras la persona escribe, aparece al lado ✓ "Disponible" o ✗ "Ocupado", con 2 o 3 sugerencias que sí están libres (`jose.pena2`, `jpena`, `jose.pena.lp`).
- Al guardar, la base de datos vuelve a comprobar que no se repite (por si dos personas eligen el mismo nombre en el mismo segundo).
- Nombres reservados que nadie puede usar: `admin`, `abtcc`, `soporte`, `secretaria`, `comision` y parecidos, para que nadie se haga pasar por la asociación.
- Se puede cambiar como máximo una vez cada 30 días, para evitar confusiones.
- Solo un socio que ya entró puede comprobar si un nombre está libre. Desde afuera no se puede averiguar quién es socio.

### Seguridad

| Riesgo | Qué hacemos |
| --- | --- |
| Alguien prueba contraseñas una y otra vez | Límite de intentos y verificación anti-robots de Cloudflare (Turnstile, la que ya usa el formulario de contacto). |
| Averiguar quién es socio | El error siempre dice "Usuario o contraseña incorrectos", sin aclarar cuál falló. "Olvidé mi contraseña" siempre responde "Si el correo está registrado, te llegó un enlace". |
| Contraseñas débiles | Mínimo 10 caracteres y rechazo de las más comunes (`12345678`, `abtcc2026`…). Se guardan cifradas: ni la asociación puede verlas. |
| Enlace de "nueva contraseña" robado | Sirve una sola vez y caduca en una hora. |
| Sesión abierta en una compu ajena | La sesión dura 30 días con "Recordarme" y hasta cerrar el navegador sin esa casilla. Botón "Cerrar sesión" siempre visible. Al cambiar la contraseña se cierran las sesiones en los demás aparatos. |
| Un socio deja de serlo | Se marca "inactivo" y pierde el acceso al instante: la web revisa el estado en cada página, no solo al entrar. |
| Un socio presta su cuenta o reparte los PDF | No se puede impedir del todo. Se registra quién descargó qué y cuándo, con un tope diario (p. ej. 30 descargas) que avisa si hay algo raro, y cada descarga muestra "uso personal, no compartir". Marcar cada PDF con el nombre del socio no entra en el plan gratis de Cloudflare: no se descarta para más adelante. |
| Se pierde la base de datos | El plan gratis de Supabase no guarda copias de seguridad. Claude exporta la lista de socios una vez al mes, y los PDF originales quedan también en una carpeta de la asociación (el depósito no es una copia de seguridad). |
| Supabase se "duerme" | La tarea diaria de la web (medianoche) le hace una consulta para que no se pause. |
| Datos personales | Solo nombre, correo, código, categoría y estado. Se actualiza la política de privacidad para contar que hay cuentas de socios. |

### Experiencia de uso

- **Primer ingreso:** llega un correo "Bienvenida a la ABTCC: crea tu contraseña" → la persona elige su contraseña → la web le propone elegir su nombre de usuario (puede saltarlo) → entra a la biblioteca.
- **Página de ingreso:** un campo "Usuario, código o correo", la contraseña con un ojito para verla, "Recordarme", "¿Olvidaste tu contraseña?" y "¿Problemas para entrar? Escríbenos por WhatsApp".
- **En el encabezado:** "Acceso socios" pasa a decir "Mi cuenta" cuando la sesión está abierta.
- **Mi cuenta:** código de socio (fijo), nombre de usuario (editable), cambiar contraseña, estado de la membresía y cerrar sesión.
- **Biblioteca:** buscador, filtros por tipo y tema, y en cada material la portada, el tamaño (MB) y las páginas antes de descargar, pensando en quien usa datos del celular. Sello "Nuevo" en lo subido en los últimos 30 días.
- **Socio inactivo:** ve un mensaje amable ("Tu membresía no está activa. Escríbenos para regularizarla") en vez de un error.
- **Correos:** pueden llegar a "Spam" mientras usemos el Gmail; la pantalla lo avisa ("Revisa también Spam y Promociones").
- **Idiomas:** todo en español; inglés y portugués con revisión humana.

---

## 4. Lista de tareas

### A. Cuentas (las haces tú, con los pasos de `tareas-para-ti.md`)

- [ ] A1. Gmail de la asociación: activar la verificación en dos pasos y crear una "contraseña de aplicación" para el cartero.
- [x] A2. **Supabase** ✔ (25/11/2026): organización "abtcc-bo", proyecto "abtcc.bo" (vacío; región EE. UU. oeste). Claude ya tiene acceso.
- [x] A3. **R2** ✔ (25/11/2026): depósito `abtcc-biblioteca` creado y vacío. Es privado: no activar "Acceso público" en su Configuración.
- [x] A4. Claude conectado a Cloudflare desde la terminal ✔ (25/11/2026): ya ve el depósito `abtcc-biblioteca`.

### B. La puerta: entrar y salir (lo hago yo)

Hecho el 25/11/2026 y probado en el navegador con dos cuentas de prueba (ya borradas):

- [x] B1. Conexión con Supabase: `src/lib/socios.ts` (llamadas directas, sin biblioteca). La dirección y la clave publicable están en `astro.config.mjs`; la clave secreta va solo como Secreto en Cloudflare (`SUPABASE_SECRET_KEY`).
- [x] B2. Tabla `socios` con reglas de seguridad (RLS) y funciones: `supabase/migrations/20261125120000_socios.sql`. Códigos automáticos `ABTCC-0001`, `ABTCC-0002`…
- [x] B3. Página de ingreso (`/es/socios/`): usuario, código o correo + contraseña; mensajes genéricos; límite de intentos y Turnstile.
- [x] B4. Sesión en cookies seguras (`httpOnly`, revisada en cada visita) y "Cerrar sesión".
- [x] B5. "¿Olvidaste tu contraseña?" (`/es/socios/recuperar-contrasena/`) y "Crea tu contraseña" (`/es/socios/nueva-contrasena/`). **Falta la configuración en Supabase** (ver más abajo) para que el correo llegue con el enlace correcto.
- [x] B6 bis. "Mi cuenta" (`/es/socios/mi-cuenta/`): nombre de usuario con revisión en vivo (disponible / ocupado + sugerencias, un cambio cada 30 días) y cambio de contraseña (pide la actual y cierra las otras sesiones).
- [x] B6. Alta de socios: Claude crea la cuenta y la fila en `socios`, y la web le manda el correo "Elegir mi contraseña" (el mismo de recuperación). Así se creó la cuenta ABTCC-0001 (Leonardo Eyzaguirre, fundador) el 25/11/2026. Mientras no haya cartero propio, el correo es el estándar de Supabase (en inglés) y la página "Crea tu contraseña" también acepta su enlace.
- [x] B7. Probado con la cuenta real ABTCC-0001 (25/11/2026): correo recibido, contraseña creada e ingreso en la web publicada. Falta confirmar el ingreso con el código o el usuario (eso prueba la clave secreta en Cloudflare).
- [ ] B8. Tarea diaria (`scheduled` en `src/worker.ts`): una consulta a Supabase para que el plan gratis no se pause.

**Configuración de Supabase pendiente (la hace Leo en el panel, pasos en `tareas-para-ti.md`):**

- Desactivar el registro abierto ("Allow new users to sign up").
- Site URL y direcciones permitidas para los enlaces de los correos.
- Plantilla del correo "Reset password": `supabase/plantillas/recuperar-contrasena.html`. Solo se puede editar con el cartero propio (SMTP) configurado: va después del SMTP.
- Largo mínimo de contraseña: 10.
- Cartero: SMTP del Gmail (contraseña de aplicación del paso A1). Mientras tanto, Supabase solo envía correos a quienes son parte del equipo del proyecto.
- Clave secreta en Cloudflare (`SUPABASE_SECRET_KEY`): sin ella, en la web publicada solo se puede entrar con el correo, no con usuario o código.

### C. La biblioteca (lo hago yo)

- [x] C0. Lista de la carpeta "Biblioteca -Libros-" ordenada por temática (25/11/2026), sin la carpeta RFT ni "La terapia basada en procesos (PBT)": planilla "Biblioteca ABTCC por temática" en claude.ai (https://claude.ai/artifact/Us11HxLHLc3QUFqbeXoBDY). 1.419 archivos, 20,6 GB: 11,9 GB son videos (quedan para después) y el resto entra en los 10 GB gratis. Cada archivo tiene temática, tipo y una sugerencia (Subir · Revisar derechos · Revisar · Más adelante · No subir). Columna "Título" con el nombre limpio para la web. Decisión de Leo (25/11/2026): **1.083 archivos "Subir"**, 217 "No subir", 65 videos y 54 "Revisar" (posibles datos de consultantes —casos, fichas, registros, perfiles de tests— o contenido desconocido: **no se suben hasta que Leo los revise**). Títulos corregidos con el título guardado dentro de cada PDF cuando lo había. Se sube solo lo marcado "Subir".
- [x] C1. Catálogo (25/11/2026): `catalogo.json` en el depósito R2 (no en GitHub), con título, temática, tipo, tamaño y clave del archivo. Lo arma el script de subida desde la planilla.
- [x] C2. Página `/es/socios/biblioteca/` (`Biblioteca.astro`): buscador, filtros por temática y tipo, agrupada por temática. La lista se arma en el navegador desde `/api/socios/catalogo/` para no gastar el tiempo de CPU del Worker gratis.
- [x] C3. Descarga protegida `/api/socios/descargar/<id>/`: sesión y membresía activa, registro en la tabla `descargas` y tope de 30 por día; el archivo sale del depósito privado con el título como nombre.
- [x] C3 bis. Borrar materiales desde la web, solo administradores (`es_admin` en `socios`; hoy solo ABTCC-0001, Leo). Se cambia desde Supabase.
- [x] C4. Subidos 983 de 984 archivos aprobados (25/11/2026), con el catálogo ordenado en estantes. Falta 1 libro de más de 300 MB (Manual de tratamientos psicológicos: infancia y adolescencia, Fonseca Pedrero): hay que comprimirlo o subirlo de otra forma. Unos 60 materiales quedaron en "Más temas" por repartir. No se suben: CIPCO, ITEMA, hipnosis, diapositivas (irán en otra carpeta), videos ni los marcados "No subir". Quedan 9 hojas de respuesta y perfiles de tests en "Revisar".

### D. Diseño

- [x] D0. **Biblioteca más amigable (hecho el 25/11/2026)** (pedido de Leo, 25/11/2026; boceto mostrado):** estantes en lugar de lista (unas 8 secciones con ícono y cantidad → temas → separado por tipo: libros, manuales y guías, artículos, instrumentos), migas "Biblioteca › Sección › Tema", buscador siempre arriba con resultados por estante, tarjetas con título, autor y año, botón "Ver" (abrir en el navegador) además de "Descargar" y estante "Lo nuevo". Al terminar la subida: repartir los 160 de "Otros temas" en los estantes y publicar el catálogo ordenado. Después: "Mis descargas", "Lo más descargado" y favoritos.
- [ ] D1. Darle la cara "verde bosque" del sitio: ingreso, panel de bienvenida y biblioteca.
- [ ] D2. Revisarlo en celular.

### E. Más adelante (ideas, sin apuro)

- [ ] Socio con cuota vencida: ve su perfil pero no la biblioteca.
- [ ] Perfil editable del socio.
- [ ] Copia mensual de la lista de socios.
- [ ] Actualizar la política de privacidad (cuentas de socios).
- [ ] Certificados de eventos descargables.
- [ ] Grabaciones de eventos.

---

## 5. Lo que necesito de ti (datos)

- [ ] ¿Los socios **ya tienen un código**? Si sí, ¿cómo es (p. ej. `ABTCC-0012`)? Si no, propongo `ABTCC-0001`, `ABTCC-0002`…
- [ ] **Lista de tipos** de material. Propuesta: Libros · Libros del docente · Plataformas (enlaces) · Guías y manuales · Presentaciones · Artículos.
- [ ] **Lista de temas.** Propuesta inicial: ACT · DBT · Análisis funcional · Neuropsicología · Psicología forense. (¿Falta alguno? Entendí "ACT" donde dijiste "ADFAB"; corrígeme si era otra cosa.)
- [ ] Una **lista inicial de socios** (nombre, correo, código, categoría) para las primeras cuentas. Podemos empezar solo contigo para probar.
