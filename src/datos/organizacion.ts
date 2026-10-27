// Datos institucionales que no dependen del idioma. Se usan en el pie, en contacto y en los datos para Google.
// Un valor `null` se muestra como [PENDIENTE] y se omite en los datos estructurados.

export interface Red {
	nombre: string;
	url: string;
}

export const ORGANIZACION: {
	correo: string | null;
	ciudad: string | null;
	pais: string;
	redes: Red[];
	/** Ruta en /public o URL; idealmente un PNG cuadrado de al menos 112 px para Google. */
	logo: string | null;
	/** Imagen por defecto al compartir en redes (1200×630 px), en /public. */
	imagenRedes: string | null;
} = {
	correo: null, // [PENDIENTE: correo de contacto]
	ciudad: null, // [PENDIENTE: ciudad]
	pais: 'Bolivia',
	redes: [], // [PENDIENTE: redes sociales] p. ej. { nombre: 'Instagram', url: 'https://instagram.com/...' }
	logo: null,
	imagenRedes: null,
};
