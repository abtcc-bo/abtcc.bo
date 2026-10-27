// Secciones con vista propia. Las demás muestran su página de texto (src/content/paginas/) o "en construcción".
// Cada vista recibe `idioma` y, si existe, la `pagina` de texto de esa sección.
import type { Seccion } from '../i18n';
import Inicio from './Inicio.astro';
import Comision from './Comision.astro';
import Contacto from './Contacto.astro';
import Eventos from './Eventos.astro';

export const VISTAS: Partial<Record<Seccion, typeof Contacto>> = {
	inicio: Inicio,
	comision: Comision,
	contacto: Contacto,
	eventos: Eventos,
};
