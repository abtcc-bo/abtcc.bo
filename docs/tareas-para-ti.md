# Tareas para ti (mientras se construye la web)

No hace falta programar nada. Están ordenadas por urgencia: lo de arriba se necesita antes.
Cuando termines algo, márcalo con [x] o simplemente avísame en el chat.

---

## 🔴 Pronto (antes de publicar la primera versión)

### 1. Crear un Gmail de la asociación
Sirve para abrir las cuentas de la web (Vercel, más adelante Supabase) y para recibir los mensajes del formulario de contacto. **No uses tu correo personal**: si algún día dejas la comisión, la web no debe depender de ti.

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
- [ ] **Cargo** de cada uno (falta de 4 personas).
- [x] Título profesional y formación ✔
- [ ] **Fotos originales** (no capturas de pantalla): de frente, buena luz, todas con estilo parecido.
- [ ] Enlaces opcionales: LinkedIn, ORCID, Instagram profesional.
- [ ] **Su permiso** para publicar su foto y datos.

### 4. Textos de las páginas institucionales
Las páginas ya están armadas con los títulos de cada parte; solo falta el texto. Puedes escribirlo tú o pedirlo a la comisión, y pegármelo tal cual.

- [ ] **Quiénes somos:** ya completé objetivo, actividades y principios con el estatuto. Falta: 2–3 líneas de presentación (desde cuándo existe la asociación) y la historia.
- [x] **Membresía:** completada con el estatuto y el reglamento ✔
- [ ] **Aviso legal:** confirmar el domicilio (Calle 2, N° 1, barrio Las Palmas), nombre del representante legal (según el estatuto, quien ejerza la Presidencia) y número de personería jurídica (cuando salga).
- [ ] **Revisión legal:** te dejé un **borrador** de Política de privacidad y de Aviso legal. Conviene que lo lea alguien con formación legal antes de publicar.

---

## 🟡 Cuando te avise (al publicar)

### Para la comisión: inconsistencias que encontré en los documentos
No afectan a la web, pero conviene corregirlas antes de aprobarlos:

- [ ] **Nombre:** el estatuto dice "Terapias Cognitivas, Conductuales y Contextuales"; el logo dice "Cognitivo Conductuales y Contextuales".
- [ ] **Recargo por mora:** el estatuto (Art. 15) dice 2 % mensual; el reglamento (Art. 34) dice 0,5 % mensual "conforme al estatuto".
- [ ] **Quiénes pagan cuota:** el estatuto (Art. 7) dice todos menos los honorarios (incluye fundadores); el reglamento (Art. 34) dice solo asociados y adherentes.
- [ ] **Cargos:** el estatuto define Presidencia, Vicepresidencia, Secretaría General, Tesorería y dos Vocalías, y el reglamento prohíbe otros cargos. En la web el Dr. Rivera figura como "Coordinador". ¿Qué cargo ocupa cada integrante?
- [ ] **Fecha de aprobación** del estatuto: está en blanco.

---

### 5. Crear tres cuentas gratuitas (te guiaré paso a paso)
Todas con el Gmail de la asociación (abtcc.bo@gmail.com). Te avisaré cuando sea el momento.

- [ ] **Vercel**: donde se publica la web. Se conecta con el GitHub `abtcc-bo`.
- [ ] **Resend**: envía a abtcc.bo@gmail.com los mensajes del formulario de contacto. Mientras no haya dominio propio, solo puede enviar al correo con el que se crea la cuenta; por eso debe ser el de la asociación.
- [ ] **Cloudflare** (servicio Turnstile): la verificación antispam del formulario.

Ninguna pide tarjeta de crédito. Las "claves" que generan **no me las pegues en el chat**: se cargan directamente en Vercel y te mostraré dónde.

---

## 🟢 Sin apuro (antes de las fases siguientes)

- [ ] **Traducciones:** si alguien de la asociación habla inglés o portugués, que revise los nombres del menú y las páginas. Te pasaré una lista.
- [ ] **Dominio propio** (ej. `abtcc.org.bo`): averiguar con NIC Bolivia los requisitos y el costo. Se necesita antes del área de socios (fase 3).
- [ ] **Estatuto y código de ética** en PDF.
- [ ] **Membresía:** categorías de socio, requisitos, beneficios y cuotas.
- [ ] **Logo** en buena calidad (idealmente el archivo original del diseñador: SVG, AI o PDF).

---

## 🔁 Para que nada se desactive en los meses sin actividad

La web se mantiene sola: cada medianoche (hora de Bolivia) Vercel ejecuta una tarea automática que la reconstruye y, cuando exista el área de socios, mantiene activo Supabase. No hace falta entrar a la web. Lo que sí depende de personas, una vez al año (por ejemplo, en enero, al iniciar la gestión):

- [ ] **Iniciar sesión en abtcc.bo@gmail.com** y revisar que la verificación en dos pasos siga activa. Google borra las cuentas que pasan 2 años sin uso, y con ella se perderían Vercel, Resend y Cloudflare.
- [ ] **Entrar una vez a Vercel, Resend y Cloudflare** con ese Gmail, para confirmar que todo sigue en orden.
- [ ] **Renovar el dominio** (cuando exista): dejar activada la renovación automática y revisar que la tarjeta o el pago siga vigente.
- [ ] **Revisar que la comisión nueva tenga acceso** a las cuentas, si cambió la directiva.

---

## Cómo ver la web en tu computadora

No es necesario, pero si quieres verla mientras avanzo:

1. Abre la carpeta del proyecto en la terminal (o pídemelo a mí).
2. Escribe `npm run dev` y presiona Enter.
3. Abre en el navegador http://localhost:4321

Para apagarla: en la terminal presiona `Ctrl + C`.
