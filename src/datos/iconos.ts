// Iconos de línea simples (decorativos), dibujados sobre una cuadrícula de 24 × 24. Se usan con <Icono nombre="..." />.
// Los nombres se pueden escribir en el contenido (campo `icono`); para sumar uno, agregarlo aquí.
export const ICONOS = {
	documento: 'M4 5h16v14H4z M8 10h3 M8 14h8 M14 9.5h3',
	titulo: 'M2 9l10-5 10 5-10 5z M6 11v5c3 2 9 2 12 0v-5',
	hoja: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7',
	compromiso: 'M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z M9 12l2 2 4-4',
	investigacion: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 1 0 0-13z M15.5 15.5L21 21',
	redes: 'M6 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z M18 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z M12 15.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5z M8.5 6h7 M7.2 8.2l3.6 7.6 M16.8 8.2l-3.6 7.6',
	dialogo: 'M4 5h16v11H9l-5 4z M8 9.5h8 M8 12.5h5',
	divulgacion: 'M3 10v4h3l7 4V6L6 10z M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11',
	cooperacion: 'M9 7a5 5 0 1 0 0 10 5 5 0 1 0 0-10z M15 7a5 5 0 1 0 0 10 5 5 0 1 0 0-10z',
	cuidado: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
	libro: 'M3 5c3-1 6-1 9 1 3-2 6-2 9-1v13c-3-1-6-1-9 1-3-2-6-2-9-1z M12 6v13',
	maletin: 'M3 8h18v11H3z M9 8V5h6v3 M3 13h18',
	reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z M12 7v5l3 2',
	calendario: 'M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5',
} as const;

export type NombreIcono = keyof typeof ICONOS;
export const NOMBRES_ICONOS = Object.keys(ICONOS) as [NombreIcono, ...NombreIcono[]];
