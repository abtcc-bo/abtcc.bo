// Estantes de la biblioteca del área de socios, en el orden en que se muestran: nombre (el `seccion` del
// catálogo), ícono (src/datos/iconos.ts) y color de sus portadas y lomos. Los usan la biblioteca y el panel.
import { ICONOS } from './iconos';

export const ESTANTES = [
	{ nombre: 'Terapias contextuales', icono: ICONOS.hoja, color: '#127052' },
	{ nombre: 'DBT', icono: ICONOS.dialogo, color: '#0c4030' },
	{ nombre: 'Análisis funcional y conducta', icono: ICONOS.investigacion, color: '#15795a' },
	{ nombre: 'Problemas clínicos', icono: ICONOS.cuidado, color: '#2f6f8f' },
	{ nombre: 'Infancia y adolescencia', icono: ICONOS.personas, color: '#8a5a12' },
	{ nombre: 'Evaluación', icono: ICONOS.check, color: '#5b4a8a' },
	{ nombre: 'Terapia cognitivo-conductual', icono: ICONOS.diana, color: '#7a2f45' },
	{ nombre: 'Salud y estilos de vida', icono: ICONOS.sol, color: '#4f7a1f' },
	{ nombre: 'Más temas', icono: ICONOS.libro, color: '#5a5a5a' },
];
