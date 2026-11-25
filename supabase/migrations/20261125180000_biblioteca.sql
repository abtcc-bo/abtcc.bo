-- Biblioteca del área de socios (25/11/2026).
--  - Los archivos y su catálogo (catalogo.json) están en el depósito privado de Cloudflare R2 "abtcc-biblioteca";
--    la web los entrega solo a socios con sesión abierta.
--  - Aquí: quién es administrador (puede borrar materiales desde la web) y el registro de descargas con tope diario.

alter table public.socios add column es_admin boolean not null default false;
comment on column public.socios.es_admin is 'Puede borrar materiales de la biblioteca desde la web. Se cambia solo desde Supabase.';

-- mi_socio() ahora también dice si es administrador (hay que borrarla y crearla: cambia lo que devuelve).
drop function public.mi_socio();
create function public.mi_socio() returns table (
	codigo text,
	usuario text,
	nombre text,
	categoria text,
	estado text,
	correo text,
	usuario_cambiable_desde timestamptz,
	es_admin boolean
)
language sql stable security definer set search_path = '' as $$
	select
		s.codigo, s.usuario, s.nombre, s.categoria, s.estado, u.email::text,
		case when s.usuario_cambiado_en is null then null else s.usuario_cambiado_en + interval '30 days' end,
		s.es_admin
	from public.socios s
	join auth.users u on u.id = s.id
	where s.id = (select auth.uid())
$$;
revoke execute on function public.mi_socio() from public, anon;
grant execute on function public.mi_socio() to authenticated;

-- Registro de descargas: quién bajó qué y cuándo (para notar abusos, p. ej. una cuenta prestada).
create table public.descargas (
	id bigint generated always as identity primary key,
	socio_id uuid not null references public.socios (id) on delete cascade,
	material text not null check (length(material) between 1 and 64),
	creado_en timestamptz not null default now()
);
create index descargas_socio_fecha on public.descargas (socio_id, creado_en desc);
alter table public.descargas enable row level security;
create policy "Cada socio ve sus descargas" on public.descargas for select to authenticated using (socio_id = (select auth.uid()));
revoke all on public.descargas from anon;
revoke insert, update, delete, truncate on public.descargas from authenticated;

-- Anota una descarga del socio que pide. Devuelve:
-- ok · tope (más de 30 en las últimas 24 horas) · inactivo · sin-socio
create function public.registrar_descarga(p_material text) returns text
language plpgsql security definer set search_path = '' as $$
declare
	v_socio public.socios;
begin
	select * into v_socio from public.socios where id = (select auth.uid());
	if v_socio.id is null then return 'sin-socio'; end if;
	if v_socio.estado <> 'activo' then return 'inactivo'; end if;
	if (select count(*) from public.descargas where socio_id = v_socio.id and creado_en > now() - interval '24 hours') >= 30 then
		return 'tope';
	end if;
	insert into public.descargas (socio_id, material) values (v_socio.id, left(p_material, 64));
	return 'ok';
end $$;
revoke execute on function public.registrar_descarga(text) from public, anon;
grant execute on function public.registrar_descarga(text) to authenticated;
