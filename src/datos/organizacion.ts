// Datos institucionales que no dependen del idioma. Se usan en el pie, en contacto y en los datos para Google.
// Un valor `null` se muestra como [PENDIENTE] y se omite en los datos estructurados.

export interface Red {
	nombre: string;
	url: string;
}

export const ORGANIZACION: {
	correo: string | null;
	/** Sede legal. Solo se muestra en Contacto y en los datos para Google: la asociación trabaja en todo el país. */
	sede: string;
	pais: string;
	redes: Red[];
	/** Ruta en /public o URL; idealmente un PNG cuadrado de al menos 112 px para Google. */
	logo: string | null;
	/** Imagen por defecto al compartir en redes (1200×630 px), en /public. */
	imagenRedes: string | null;
} = {
	correo: 'abtcc.bo@gmail.com',
	sede: 'Santa Cruz de la Sierra',
	pais: 'Bolivia',
	redes: [], // [PENDIENTE: redes sociales] p. ej. { nombre: 'Instagram', url: 'https://instagram.com/...' }
	logo: '/logo.png', // [PENDIENTE: reemplazar por el archivo original del diseñador (SVG) cuando llegue]
	imagenRedes: '/imagen-redes.png',
};
