// Decoración de temporada. En Navidad: gorrito en el logo del encabezado y nieve en la portada.
// La portada se arma en cada visita, así que se apaga sola; las demás páginas se arman al publicar, por eso el
// gorrito del encabezado desaparece de ellas con la primera publicación después del 6 de enero.

/** Del 1 de noviembre al 6 de enero (Reyes), en hora de Bolivia. */
export function esNavidad(fecha = new Date()): boolean {
	const enBolivia = new Date(fecha.getTime() - 4 * 60 * 60 * 1000);
	const mes = enBolivia.getUTCMonth() + 1;
	const dia = enBolivia.getUTCDate();
	return mes === 11 || mes === 12 || (mes === 1 && dia <= 6);
}
