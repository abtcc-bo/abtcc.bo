# Tareas para ti (mientras se construye la web)

No hace falta programar nada. Están ordenadas por urgencia: lo de arriba se necesita antes.
Cuando termines algo, márcalo con [x] o simplemente avísame en el chat.

---


## 🔵 Área de socios (empezamos el 25/11/2026)

El plan completo y la lista de tareas están en `docs/area-socios.md`. Primero hay que preparar las cuentas gratuitas; hazlas **en este orden** y avísame al terminar cada una. Si algo en pantalla no coincide con lo que dice aquí, mándame una captura.

### A1. Gmail: verificación en dos pasos y contraseña de aplicación
Sirve para que la web pueda mandar los correos de "crea tu contraseña" desde abtcc.bo@gmail.com.

- [ ] Entra a https://myaccount.google.com con abtcc.bo@gmail.com.
- [ ] Menú **Seguridad** → **Verificación en 2 pasos** → actívala (te pedirá un celular).
- [ ] Luego entra a https://myaccount.google.com/apppasswords
- [ ] En "Nombre de la app" escribe `Web ABTCC` y toca **Crear**.
- [ ] Aparece una clave de 16 letras. **Cópiala y guárdala** donde guardas las contraseñas de la asociación. **No me la pegues en el chat**: en el paso A2 te digo dónde ponerla tú.

### A2. Supabase: usamos el proyecto que ya tiene la ABTCC
La ABTCC ya tiene cuenta en Supabase, con un proyecto que se hizo para inscribir participantes y cobrarles (y que ya no se usará). **No hace falta crear otro ni borrarlo**: lo reutilizamos. Primero yo reviso qué tiene adentro; si guarda datos de personas inscritas, decidimos juntos qué hacer con ellos antes de tocar nada.

- [x] Entra a https://supabase.com/dashboard con la cuenta de la ABTCC.
- [x] Verás un cuadro con el nombre del proyecto. Si dice **Paused** (pausado), tócalo y luego toca el botón **Restore project** (restaurar). Espera unos minutos hasta que deje de decir "Restoring". *(Supabase pone en pausa los proyectos gratis que nadie usa durante una semana; es normal.)*
- [x] **No lo borres** por ahora.
- [x] Invita a tu correo personal (el mismo con el que tienes tus otros proyectos de Supabase, "psico-web-db" y "dbt-app") para que yo pueda trabajar en el proyecto:
  1. Arriba a la izquierda, toca el **nombre de la organización** (lo primero que aparece, antes del nombre del proyecto).
  2. En el menú de la izquierda toca **Team** (equipo).
  3. Toca el botón **Invite member** (invitar).
  4. Escribe tu correo personal, en "Role" elige **Owner** (dueño) y toca **Invite**.
  5. Abre tu correo personal: llega un mensaje de Supabase. Toca **Accept invite** (aceptar).
- [x] Proyecto activo: se llama **abtcc.bo** ✔ (25/11/2026)
- [x] ✔ Hecho (25/11/2026). Comprobar que aceptaste la invitación: entra a Supabase con tu correo personal; arriba a la izquierda, al tocar el nombre de la organización, tienen que aparecer **dos**: la tuya y la de la ABTCC.
- [x] ✔ Hecho (25/11/2026): Claude ya ve la organización "abtcc-bo" y el proyecto "abtcc.bo" (vacío, listo para empezar). Volver a conectar a Claude con Supabase eligiendo la organización de la ABTCC (cuando se conectó por primera vez solo se le dio permiso para tu organización personal):
  1. En la app de Claude, abre **Configuración** (Settings) → **Conectores** (Connectors).
  2. Busca **Supabase**, toca **Desconectar** (Disconnect) y luego **Conectar** (Connect).
  3. Entra con tu correo personal. En la pantalla de Supabase que pide permiso, en **Organization** elige la de la **ABTCC** y toca **Authorize**.
  4. Avísame. El paso de pegar la clave del Gmail en Supabase lo hacemos juntos.

### A3. Crear el "depósito" de archivos en Cloudflare (R2)
**✔ Hecho el 25/11/2026:** el depósito `abtcc-biblioteca` ya existe y está vacío. No actives nunca "Acceso público" en su pestaña Configuración: los archivos tienen que pasar por la web, que revisa quién es socio.

**Qué es:** R2 es como un **disco duro en internet** (parecido a un Google Drive, pero privado), dentro de la misma cuenta de Cloudflare donde ya está publicada la web. Ahí van a vivir los PDF. Cloudflare a la carpeta grande la llama **bucket** (cubeta); acá le decimos **depósito**. Tú solo lo creas vacío: los archivos los subo yo.

1. - [ ] Abre https://dash.cloudflare.com y entra con **abtcc.bo@gmail.com** (la misma cuenta de la web).
2. - [ ] Ya adentro, a la izquierda hay un menú. Busca **R2 object storage**. Suele estar dentro de un grupo que se llama **Storage & databases** (almacenamiento y bases de datos): tócalo para que se abra y aparezca R2.
   - *Atajo:* arriba hay una **lupa** o un cuadro de búsqueda. Escribe `R2` y toca el resultado que dice "R2".
3. - [ ] La primera vez sale una página de presentación con un **botón azul**. Puede decir **Purchase R2 Plan**, **Get started** o **Enable R2**. Tócalo.
   - Aunque diga "Purchase" (comprar), es el **plan gratuito**: en la pantalla tiene que figurar **$0.00**. Si ves otro monto, no sigas y mándame una captura.
4. - [ ] Si te pide una **forma de pago** (tarjeta de débito, de crédito o PayPal): Cloudflare la pide solo para verificar que eres una persona. **No cobra nada** mientras usemos menos de 10 GB, y yo vigilo el espacio. Complétala y confirma.
   - Si no tienes cómo poner una tarjeta, **para aquí y avísame**: buscamos otra opción.
5. - [ ] Ya en la página de R2, toca el botón azul **Create bucket** (crear depósito).
6. - [ ] Llena el formulario así:
   - **Bucket name** (nombre): `abtcc-biblioteca` (todo en minúsculas, con el guion del medio, sin espacios).
   - **Location** (ubicación): déjalo en **Automatic**.
   - **Default storage class** (si aparece): deja **Standard**. *(Lo gratis vale solo para "Standard".)*
   - Toca **Create bucket**.
7. - [ ] Aparece una página que dice **abtcc-biblioteca** y que está vacía. ¡Listo! No subas nada ahí.
8. - [ ] Avísame o mándame una captura de esa pantalla.

Si en algún momento la pantalla no se parece a lo que dice aquí (Cloudflare cambia sus botones de vez en cuando), mándame una captura y te digo dónde tocar.

### A4. Darme permiso para subir archivos
**✔ Hecho el 25/11/2026:** Claude ya puede ver y usar el depósito.

- [ ] En la pestaña **Terminal** de esta app, escribe `npx wrangler login` y presiona Enter.
- [ ] Se abre el navegador: entra con la cuenta de Cloudflare de la web y toca **Allow**.
- [ ] Avísame. Con eso puedo subir los PDF al depósito por ti.

### A5. Ajustes de Supabase para que funcionen los correos (nuevo, 25/11/2026)
La página de ingreso ya funciona. Faltan estos ajustes en el panel de Supabase, que solo puedes hacer tú. Entra a https://supabase.com/dashboard con tu correo personal y abre el proyecto **abtcc.bo**. Todo está en el menú de la izquierda, en **Authentication** (el ícono de la persona).

1. - [x] ✔ **Que nadie pueda crearse una cuenta solo.** Authentication → **Sign In / Providers**. Apaga la opción **Allow new users to sign up** y toca **Save**.
2. - [x] ✔ **Largo mínimo de contraseña.** En esa misma pantalla, toca **Email** y busca **Minimum password length**: escribe `10` y toca **Save**.
3. - [x] ✔ **Adónde llevan los enlaces de los correos.** Authentication → **URL Configuration**:
   - En **Site URL** escribe `https://abtcc.abtcc-bo.workers.dev` y toca **Save**.
   - En **Redirect URLs** toca **Add URL**, escribe `https://abtcc.abtcc-bo.workers.dev/**` y guarda. Repite con `http://localhost:4321/**` (sirve para mis pruebas).
4. - [ ] **El texto del correo (hacerlo DESPUÉS del paso 6).** Supabase no deja cambiar los correos mientras use su cartero propio: el asunto queda bloqueado en "Reset your password". Primero el paso A1 (Gmail) y el paso 6 (cartero); recién ahí se puede escribir. Authentication → **Emails** → pestaña **Templates** → **Reset Password**:
   - En **Subject** escribe: `Tu contraseña del área de socios de la ABTCC`
   - En el cuadro grande (**Source**), borra todo y pega el contenido del archivo `supabase/plantillas/recuperar-contrasena.html` (si quieres, pídeme que te lo copie aquí en el chat). Toca **Save**.
5. - [x] ✔ **La clave secreta para entrar con usuario o código.** Sin ella, en la web publicada solo se puede entrar con el correo.
   - En Supabase: **Project Settings** (el engranaje, abajo a la izquierda) → **API Keys** → en **Secret keys**, toca el ícono de copiar de la clave `default`. **No me la pegues en el chat.**
   - En Cloudflare (https://dash.cloudflare.com): **Workers & Pages** → **abtcc** → **Settings** → **Variables and Secrets** → **+ Add**. En **Type** elige **Secret** (no "Text": esas se borran al publicar), en **Variable name** escribe `SUPABASE_SECRET_KEY`, en **Value** pega la clave y toca **Deploy**.
6. - [ ] **El cartero (después del paso A1).** Authentication → **Emails** → pestaña **SMTP Settings** → activa **Enable custom SMTP** y llena: Sender email `abtcc.bo@gmail.com` · Sender name `ABTCC` · Host `smtp.gmail.com` · Port `465` · Username `abtcc.bo@gmail.com` · Password: la contraseña de aplicación de 16 letras del paso A1. Toca **Save**. Hasta hacer esto, Supabase solo manda correos a quienes son parte del equipo del proyecto (por ejemplo, a tu correo personal), lo que alcanza para probar.
7. - [ ] Avísame y creamos **tu cuenta de socio** para probarlo todo de verdad.

### Datos que necesito (sin apuro, pero antes de la biblioteca)
- [x] **Código de socio:** decidido `ABTCC-0001`, `ABTCC-0002`… (lo pone el sistema solo y no cambia); cada socio puede elegir además su nombre de usuario ✔
- [ ] ¿Estás de acuerdo con los **tipos** de material (Libros · Libros del docente · Plataformas · Guías y manuales · Presentaciones · Artículos) y los **temas** (ACT · DBT · Análisis funcional · Neuropsicología · Psicología forense)? Agrega o quita lo que quieras.
- [ ] Revisar con la comisión que el material que se suba se pueda compartir (derechos de autor).

---

## 🟡 Datos que la web dejó de mostrar hasta tenerlos (revisión de credibilidad, 23/11/2026)

La web ya no muestra rellenos como "[PENDIENTE]" ni avisos de "en preparación". Lo que faltaba se quitó o se escribió de otra forma. Cuando tengas estos datos, pásamelos y vuelven a aparecer:

- [ ] **Quiénes somos:** año de fundación (para la línea de tiempo) y 2–3 líneas más de presentación (desde cuándo existimos y a quiénes reunimos).
- [ ] **Estatuto y ética:** PDF del Estatuto y del Reglamento Interno (hoy dice que están a disposición por correo) y las actas que se quieran hacer públicas.
- [ ] **Personería jurídica:** número y fecha, cuando salga (hoy no se menciona).
- [ ] **Aviso legal:** domicilio legal confirmado y nombre de quien representa a la asociación (hoy dice "Santa Cruz de la Sierra" y "Presidencia de la Comisión Directiva").
- [ ] **Preguntas de eventos:** condiciones para recibir el certificado (p. ej. asistencia mínima) y si se comparten las grabaciones de los eventos en línea (esa pregunta se quitó).
- [ ] **Portada, "Busco atención psicológica":** ¿la ABTCC orienta o deriva a profesionales?
- [ ] **Comisión directiva:** institución y país de la especialidad en Psiquiatría de Guillermo Rivera, y la maestría de Carmen Barrón (se quitó).
- [ ] **Privacidad:** cuánto tiempo se guardan los mensajes de contacto (hoy: "el necesario para responderte").
- [ ] **Blog:** los dos artículos de ejemplo quedaron ocultos y el Blog no sale en el menú hasta que haya un artículo real.
- [ ] **Textos en inglés y portugués:** revisar la frase de presentación de la asociación y los textos del área de socios, que escribí yo.

---

## 🔴 Pronto (antes de publicar la primera versión)

### 1. Crear un Gmail de la asociación
Sirve para abrir las cuentas de la web (Cloudflare, Resend y más adelante Supabase) y para recibir los mensajes del formulario de contacto. **No uses tu correo personal**: si algún día dejas la comisión, la web no debe depender de ti.

- [x] Crear el Gmail ✔
- [ ] Activa la verificación en dos pasos (Cuenta de Google → Seguridad → Verificación en 2 pasos).
- [ ] Guarda la contraseña en un lugar seguro que otra persona de la comisión también pueda consultar.
- [x] Pásame la dirección → **abtcc.bo@gmail.com** ✔
- [ ] Confirma que tiene la verificación en dos pasos activada y que al menos otra persona de la comisión tiene acceso.

### 2. Ir reuniendo los datos básicos
Abre el archivo `docs/datos-pendientes.md` (está en la carpeta del proyecto). Lo más urgente:

- [x] Nombre oficial ✔ (pero revisa en el estatuto: en una bio aparece otro nombre)
- [ ] Una frase que presente a la asociación (aparece en la portada y en Google).
- [x] Correo de contacto público y ciudad ✔
- [ ] Enlaces a las redes sociales.

Puedes pegármelos en el chat tal cual, sin formato. Yo los acomodo.

### 3. Pedir a la comisión los datos de cada integrante
Para la página "Comisión directiva", de cada persona:

- [x] Nombre completo ✔
- [x] **Cargo** de cada uno ✔
- [x] Título profesional y formación ✔
- [x] Fotos de Guillermo, Halder, Carmen y Leonardo ✔
- [x] Foto de Alix ✔
- [x] Hojas de vida de Guillermo, Halder y Leonardo ✔ (23/11/2026): sus perfiles ya están actualizados.
- [ ] **Hoja de vida de Carmen** (como la que mandó Alix). Con ella completo su maestría, que ahora dice [PENDIENTE].
- [ ] **Guillermo:** dónde hizo la especialidad en Psiquiatría (universidad o institución y país).
- [ ] Enlaces opcionales: LinkedIn, ORCID, Instagram profesional.
- [ ] **Su permiso** para publicar su foto y datos. Las hojas de vida traen datos privados (carnet, dirección, teléfono, fecha de nacimiento): esos **nunca** se publican.

### 4. Textos de las páginas institucionales
Las páginas ya están armadas con los títulos de cada parte; solo falta el texto. Puedes escribirlo tú o pedirlo a la comisión, y pegármelo tal cual.

- [ ] **Quiénes somos:** ya completé objetivo, actividades y principios con el estatuto. Falta: 2–3 líneas de presentación (desde cuándo existe la asociación) y la historia.
- [x] **Membresía:** completada con el estatuto y el reglamento ✔
- [ ] **Aviso legal:** confirmar el domicilio (Calle 2, N° 1, barrio Las Palmas), nombre del representante legal (según el estatuto, quien ejerza la Presidencia) y número de personería jurídica (cuando salga).
- [ ] **Revisión legal:** te dejé un **borrador** de Política de privacidad y de Aviso legal. Conviene que lo lea alguien con formación legal antes de publicar.

### 5. III Jornadas Navideñas (4 y 5 de diciembre)
Ya están en la web con su programa, ponentes, inscripción y WhatsApp, y la portada tiene decoración navideña. Falta (detalle en `docs/datos-pendientes.md`):

- [x] **Costos** de inscripción ✔
- [ ] **Plataforma** (Zoom, Meet...) y si hay **certificado** (horas y aval).
- [ ] Confirmar que el **formulario de inscripción** es el correcto: https://forms.gle/JNJT2veLtfBcMcFV8
- [ ] **Fotos** (cuadradas) de los 6 ponentes que hoy salen con iniciales en el programa: Andrómeda Valencia, Fabiola Chamas, Daniel Enríquez, Laura Rivera, Peter Hoegen y Fredy Romero. Con el nuevo diseño cada ponente cuelga como una esfera con su foto, así que se nota mucho cuando falta.

La decoración navideña (gorrito del logo y nieve) se apaga sola después del 6 de enero en la portada; en las demás páginas, con la primera publicación posterior a esa fecha.

### 5 bis. XI SIALAPCCO Bolivia (12 y 13 de marzo de 2027)

La página completa del evento **ya es pública** (desde el 22/11/2026, cuando se aprueba el cambio en GitHub). Ojo: el botón "Inscribirme por WhatsApp" ya funciona, aunque el plan decía abrir inscripciones el 15 de diciembre; si llegan mensajes antes, se pueden atender o pedir que esperen. Para completarla necesito:

- [x] Sede: Hotel Radisson ✔
- [ ] Horario de cada día.
- [ ] Confirmar que se llama "simposio" (como dice el plan) y no "seminario".
- [ ] Lema del evento.
- [ ] Programa y ponentes (foto, país y tema de cada uno).
- [x] Forma de inscripción: QR, PayPal y comprobante por WhatsApp (+591 71402980) ✔ ya está en la página.
- [x] Montos de cada tarifa (preventa y regular, en Bs y en USD) ✔
- [ ] **Hasta qué fecha vale la preventa.**
- [ ] Cuando la ABTCC tenga cuenta propia: mandarme el QR y el PayPal nuevos para cambiarlos.
- [ ] El QR actual vence el **18/11/2027**: si el evento se mueve después de esa fecha, pedir uno nuevo al banco.
- [ ] Horas del certificado (ya dice "certificado digital").
- [ ] Si el Radisson tendrá precio especial para quienes vienen de fuera.
- [ ] Logos de los auspiciantes.
- [x] **Foto de Santa Cruz de la cabecera:** cambiada el 20/11/2026 por una de uso libre de Wikimedia Commons (catedral con tajibos, de Rômulo Gama Ferreira, CC BY 2.0). Se puede usar sin pedir permiso; el crédito al autor ya sale en la cabecera.
- [ ] Preguntar a ALAPCCO qué significa exactamente la sigla y confirmar la lista de ediciones anteriores.

### 5 ter. Para la sección "La institución"

- [ ] Estatuto y reglamento aprobados y firmados, en PDF.
- [ ] Nombres de los socios fundadores.
- [ ] Enlaces de interés que quieran recomendar.

### 6. Revisar las novedades de diseño (noviembre 2026)
Se agregaron preguntas frecuentes, los "tres caminos" de la portada y el blog. Lo que falta está anotado en `docs/datos-pendientes.md` → "Mejoras de diseño". Lo más importante:

- [ ] **Número de emergencias y línea de crisis en Bolivia** para el aviso de la portada (tarjeta "Busco atención psicológica"). Que lo confirme alguien de la comisión.
- [ ] **¿La asociación orienta a quien busca terapia?** (por ejemplo, recomendando profesionales). Según la respuesta ajusto el texto de esa tarjeta.
- [ ] **Leer las preguntas frecuentes** de Membresía y de Formación y eventos, y decirme qué cambiar. Faltan dos datos: condiciones del certificado y si se comparten grabaciones.

---

## 🟡 Cuando te avise (al publicar)

### Para la comisión: inconsistencias que encontré en los documentos
No afectan a la web, pero conviene corregirlas antes de aprobarlos:

- [ ] **Nombre:** la web usa "Terapias Cognitivas Conductuales y Contextuales" (sin coma, como pediste). El borrador del estatuto lo escribe con coma ("Cognitivas, Conductuales") y el logo dice "Cognitivo Conductuales": conviene unificar los tres.
- [ ] **Recargo por mora:** el estatuto (Art. 15) dice 2 % mensual; el reglamento (Art. 34) dice 0,5 % mensual "conforme al estatuto".
- [ ] **Quiénes pagan cuota:** el estatuto (Art. 7) dice todos menos los honorarios (incluye fundadores); el reglamento (Art. 34) dice solo asociados y adherentes.
- [ ] **Cargos:** el estatuto define Presidencia, Vicepresidencia, Secretaría General, Tesorería y dos Vocalías, y el reglamento prohíbe otros cargos. En la web el Dr. Rivera figura como "Coordinador". ¿Qué cargo ocupa cada integrante?
- [ ] **Fecha de aprobación** del estatuto: está en blanco.

---

### 6. Cuentas gratuitas (te guío paso a paso)
Todas con el Gmail de la asociación (abtcc.bo@gmail.com).

- [x] **Resend y Turnstile** ✔ (formulario funcionando desde el 01/11/2026; los mensajes llegan a abtcc.bo@gmail.com desde onboarding@resend.dev): envía a abtcc.bo@gmail.com los mensajes del formulario de contacto. Mientras no haya dominio propio, solo puede enviar al correo con el que se crea la cuenta; por eso debe ser el de la asociación.
- [x] **Cloudflare** ✔ (web publicada en https://abtcc.abtcc-bo.workers.dev): donde se publica la web (se conecta con el GitHub `abtcc-bo`) y, con su servicio Turnstile, la verificación antispam del formulario.

Ninguna pide tarjeta de crédito. Las "claves" que generan **no me las pegues en el chat**: se cargan directamente en Cloudflare y te mostraré dónde.

---

## 🟢 Sin apuro (antes de las fases siguientes)

- [ ] **Traducciones:** si alguien de la asociación habla inglés o portugués, que revise los nombres del menú y las páginas. Te pasaré una lista.
- [ ] **Dominio propio** (ej. `abtcc.org.bo`): averiguar con NIC Bolivia los requisitos y el costo. Se necesita antes del área de socios (fase 3).
- [ ] **Estatuto y código de ética** en PDF.
- [x] Membresía: categorías, requisitos, beneficios y cuotas ✔ (sacados del estatuto y el reglamento)
- [ ] **Logo** en buena calidad: pide al diseñador el archivo original (SVG, o PNG grande con fondo transparente) y una versión blanca para fondos oscuros. El de la web ya es el nuevo, pero recortado de una imagen.

---

## 📋 Próximos proyectos de la web (lista de pendientes, 22/11/2026)

Ideas que pediste anotar. Ninguna está empezada. Van en este orden porque cada una se apoya en la anterior.

### A. CLAPCCO de Argentina (el congreso grande de ALAPCCO)

Es lo más fácil: es un evento más, como el SIALAPCCO.

- **Cómo lo organizaría:** una carpeta de evento nueva (`src/content/eventos/AAAA-MM-DD-clapcco-argentina/`) con `tipo: congreso` y `modalidad: presencial`. Como lo organiza ALAPCCO (no la ABTCC), el botón principal llevaría a la inscripción en la web de ALAPCCO, no a nuestro WhatsApp. Saldría en el listado de eventos, en el calendario y en la portada.
- **Opcional:** un tema de color propio (como "tajibo" para Santa Cruz de la Sierra), por ejemplo con los colores de Argentina.
- **Lo que necesito de ti:**
  - [ ] Nombre exacto y número de edición (¿"X CLAPCCO"?).
  - [ ] Fechas, ciudad y sede.
  - [ ] Enlace oficial de inscripción y de información (web de ALAPCCO).
  - [ ] Afiche o logo del congreso.
  - [ ] Si hay descuento o beneficio para miembros de la ABTCC.

### B. Busca tu terapeuta (directorio público)

Una página donde cualquier persona busca un terapeuta de la red por ciudad, enfoque o modalidad (presencial o en línea).

- **Cómo lo organizaría:**
  - Una ficha por terapeuta (como las de la comisión): nombre, foto, títulos, enfoques (TCC, ACT, DBT…), poblaciones (niños, adolescentes, adultos, parejas), ciudad, modalidad y forma de contacto (WhatsApp o correo profesional).
  - Una página `/es/terapeutas/` con filtros (ciudad, enfoque, población, modalidad) que funcionan en el mismo navegador, sin servidor.
  - Solo aparecen **miembros activos** que **firmaron su consentimiento** para publicar sus datos. Nunca se publica nada sin permiso escrito.
  - Se puede empezar con la "Red de terapeutas" que ya existe (centros y profesionales) y sumar personas de a poco.
- **Lo que necesito de ti:**
  - [ ] Decidir quién entra (¿solo Miembros Asociados?, ¿con qué requisito de formación?).
  - [ ] Un formulario de consentimiento para cada terapeuta (te puedo redactar el texto).
  - [ ] Los datos de cada terapeuta con su foto.

### C. Acceso para socios: inscribirse y bajar libros

El área privada que ya está prevista (hoy dice "en preparación"). Es el proyecto más grande, la "fase 3".

- **Cómo lo organizaría:**
  - **Entrar con usuario:** cada socio entra con su correo (con Supabase, que es gratuito). Lo privado se verifica en el servidor: nadie sin cuenta puede ver ni descargar nada, aunque tenga el enlace.
  - **Inscribirse:** un formulario de solicitud de membresía que llega a la comisión. Al aprobarla, la persona recibe su acceso. Más adelante, inscribirse a eventos con un clic y ver sus certificados.
  - **Biblioteca:** libros, manuales y grabaciones para descargar, solo para socios con la cuota al día. Cada archivo con su ficha (título, autor, tema).
  - **Panel del socio:** sus datos, el estado de su cuota y sus certificados.
- **Importante sobre los libros:** solo podemos subir material propio de la ABTCC o de sus autores, o con permiso escrito. Los libros de editoriales no se pueden compartir aunque sea solo para socios.
- **Lo que necesito de ti:**
  - [ ] **Dominio propio** (ej. `abtcc.org.bo`): hace falta para mandar correos a los socios.
  - [ ] Un Gmail de la asociación para crear la cuenta de Supabase.
  - [ ] La lista de socios actuales (nombre, correo, categoría, cuota al día).
  - [ ] Los primeros libros o materiales, con el permiso de sus autores.
  - [ ] Quién de la comisión aprueba las solicitudes nuevas.

---

## 🔎 Para aparecer en Google

Primer lugar nadie lo garantiza, pero **buscando "ABTCC" o el nombre completo** es muy alcanzable en pocas semanas. En búsquedas generales ("terapia cognitivo conductual Bolivia", "curso DBT Bolivia") se sube poco a poco con contenido y enlaces. La parte técnica ya está hecha (velocidad, celular, mapa del sitio, datos para Google de la asociación, las personas y los eventos).

**Lo tuyo** (en este orden):

- [ ] **Dominio propio** (`abtcc.org.bo` o `abtcc.org`): conviene tenerlo *antes* de promocionar la web, porque al mudarse se pierde parte de lo que Google ya aprendió. (Mismo punto que en "Sin apuro", pero es el más importante para Google.)
- [ ] **Completar los [PENDIENTE]** visibles (cargos, frase de presentación, historia, redes): Google ya puede leer la web.
- [x] **Google Search Console** ✔ verificada el 01/11/2026 (propiedad https://abtcc.abtcc-bo.workers.dev/, con abtcc.bo@gmail.com). Revisarla una vez al mes. Al tener dominio propio, registrar la nueva dirección.
- [ ] **Bing Webmaster Tools** (gratis, 5 minutos; alimenta también a otros buscadores y asistentes de IA).
- [ ] **Perfil de Empresa de Google** (gratis): la ficha con logo y sede que sale a la derecha de los resultados y en Google Maps.
- [ ] **Pedir enlaces a la web** (cada enlace es un "voto de confianza" para Google):
  - [ ] ALAPCCO: que figure la ABTCC como grupo de trabajo en Bolivia, con enlace.
  - [ ] Universidades e institutos con los que trabajan (Unifranz, UAGRM, Instituto de Halder, KAIROS).
  - [ ] Bio de Instagram y Facebook de la asociación.
  - [ ] Perfiles de los cinco integrantes (LinkedIn, Instagram profesional).
  - [ ] Notas de prensa sobre el XI SIALAPCCO.
- [ ] **Pasarme los enlaces de las redes sociales** de la asociación (también ayudan a que Google la reconozca).
- [ ] **Artículos para el blog:** 1 o 2 por mes, escritos por la comisión (yo los publico). Ideas: "¿Qué es la terapia de aceptación y compromiso?", "DBT en Bolivia: dónde formarse", "Diferencias entre TCC y terapias contextuales". De cada artículo pásame: el texto (con sus subtítulos), quién lo escribe, un resumen de 1–2 líneas, la categoría (divulgación, práctica clínica, investigación, formación o institucional), 2–4 temas, las referencias y, si quieren, una imagen de portada horizontal. Una frase importante del texto se puede marcar para que salga como cita destacada.

**Lo mío** (avísame cuándo):

- [ ] Una página propia para cada integrante de la comisión (la gente busca a los profesionales por su nombre).
- [x] Armar el blog, listo para publicar artículos ✔ (con barra de avance, minutos de lectura, autor y "Sigue leyendo").
- [x] Preguntas frecuentes de membresía y formación ✔ (Google ya casi no muestra preguntas frecuentes en sus resultados, así que no hace falta marcarlas para él).
- [ ] Conectar las redes sociales a los datos de la asociación.
- [ ] Revisar con las herramientas de Google (resultados enriquecidos, velocidad en celular) y en securityheaders.com.

---

## 🔁 Para que nada se desactive en los meses sin actividad

La web se mantiene sola: la portada y los eventos se actualizan solos en cada visita, y cada medianoche (hora de Bolivia) Cloudflare ejecuta una tarea automática que, cuando exista el área de socios, mantendrá activo Supabase. No hace falta entrar a la web. Lo que sí depende de personas, una vez al año (por ejemplo, en enero, al iniciar la gestión):

- [ ] **Iniciar sesión en abtcc.bo@gmail.com** y revisar que la verificación en dos pasos siga activa. Google borra las cuentas que pasan 2 años sin uso, y con ella se perderían Cloudflare y Resend.
- [ ] **Entrar una vez a Cloudflare y Resend** con ese Gmail, para confirmar que todo sigue en orden.
- [ ] **Renovar el dominio** (cuando exista): dejar activada la renovación automática y revisar que la tarjeta o el pago siga vigente.
- [ ] **Revisar que la comisión nueva tenga acceso** a las cuentas, si cambió la directiva.

---

## Cómo ver la web en tu computadora

No es necesario, pero si quieres verla mientras avanzo:

1. Abre la carpeta del proyecto en la terminal (o pídemelo a mí).
2. Escribe `npm run dev` y presiona Enter.
3. Abre en el navegador http://localhost:4321

Para apagarla: en la terminal presiona `Ctrl + C`.
