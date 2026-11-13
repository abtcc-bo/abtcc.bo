-- Registro de preinscripciones a eventos (etapa 1 del XI SIALAPCCO Bolivia).
-- Se pega UNA vez en Supabase → SQL Editor → Run (pasos en docs/tareas-para-ti.md).
--
-- Seguridad: la web solo puede AGREGAR filas; no puede leer, cambiar ni borrar nada.
-- Los datos solo se ven entrando al panel de Supabase con la cuenta de la asociación.

create table public.preinscripciones (
	id uuid primary key default gen_random_uuid(),
	creado timestamptz not null default now(),
	evento text not null check (char_length(evento) between 1 and 100),
	nombre text not null check (char_length(nombre) between 2 and 100),
	apellido text not null check (char_length(apellido) between 2 and 100),
	correo text not null check (char_length(correo) between 5 and 200),
	pais text not null check (char_length(pais) between 2 and 60),
	whatsapp text check (char_length(whatsapp) <= 20),
	categoria text not null check (categoria in ('profesional', 'estudiante', 'miembro_alapcco')),
	idioma text not null default 'es' check (idioma in ('es', 'en', 'pt')),
	-- Lo que sigue lo llena la persona encargada desde el panel, no la web.
	origen text not null default 'web' check (origen in ('web', 'whatsapp')),
	estado text not null default 'preinscrito' check (estado in ('preinscrito', 'pendiente_pago', 'comprobante_recibido', 'confirmado', 'anulado')),
	notas text,
	-- Una persona (correo) se anota una sola vez por evento.
	unique (evento, correo)
);

comment on table public.preinscripciones is 'Preinscripciones a eventos de la ABTCC. Datos personales: solo visibles desde el panel.';

-- Con esto activado, nadie accede a la tabla salvo lo que se permita expresamente abajo.
alter table public.preinscripciones enable row level security;

revoke all on public.preinscripciones from anon, authenticated;

-- La web (rol "anon") solo puede escribir estas columnas; "origen", "estado" y "notas" no.
grant insert (evento, nombre, apellido, correo, pais, whatsapp, categoria, idioma) on public.preinscripciones to anon;

create policy "La web solo agrega preinscripciones" on public.preinscripciones
	for insert to anon
	with check (origen = 'web' and estado = 'preinscrito');

-- Consulta mínima que la web hace cada medianoche para que el plan gratuito no pause el proyecto.
-- No devuelve ningún dato.
create function public.latido() returns integer
	language sql stable
	set search_path = ''
	as 'select 1';

revoke all on function public.latido() from public;
grant execute on function public.latido() to anon;
