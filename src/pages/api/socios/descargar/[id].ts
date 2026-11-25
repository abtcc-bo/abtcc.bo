// Descarga de un material de la biblioteca (GET /api/socios/descargar/<id>/?idioma=es).
// Solo socios activos con sesión abierta; cada descarga queda anotada y hay un tope de 30 por día.
// El archivo sale del depósito privado: no existe un enlace público que se pueda compartir.
import type { APIRoute } from 'astro';
import { sesionActual } from '../../../../lib/area-socios';
import { buscarMaterial, deposito, nombreDeDescarga } from '../../../../lib/biblioteca';
import { registrarDescarga } from '../../../../lib/socios';
import { esIdioma, rutaSocios } from '../../../../i18n';

export const prerender = false;

const TIPOS: Record<string, string> = {
	pdf: 'application/pdf',
	epub: 'application/epub+zip',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const GET: APIRoute = async ({ params, cookies, url, redirect }) => {
	const idiomaPedido = url.searchParams.get('idioma');
	const idioma = esIdioma(idiomaPedido) ? idiomaPedido : 'es';
	const volver = (aviso?: string) => redirect(`${rutaSocios(aviso ? 'biblioteca' : 'inicio', idioma)}${aviso ? `?aviso=${aviso}` : ''}`, 303);

	const actual = await sesionActual(cookies, url);
	if (!actual) return volver();
	if (actual.socio.estado !== 'activo') return volver('noEncontrado');

	const material = await buscarMaterial(params.id ?? '');
	const objeto = material ? await deposito()?.get(material.clave) : null;
	if (!material || !objeto) return volver('noEncontrado');

	const registro = await registrarDescarga(actual.sesion.acceso, material.id);
	if (registro === 'tope') return volver('topeDescargas');
	if (registro !== 'ok') return volver('noEncontrado');

	const nombre = nombreDeDescarga(material);
	// ?ver=1: se abre en el navegador (visor de PDF) en lugar de descargarse.
	const modo = url.searchParams.get('ver') === '1' ? 'inline' : 'attachment';
	return new Response(objeto.body, {
		headers: {
			'Content-Type': TIPOS[material.ext] ?? 'application/octet-stream',
			'Content-Length': String(objeto.size),
			'Content-Disposition': `${modo}; filename="${nombre.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
			'Cache-Control': 'private, no-store',
		},
	});
};
