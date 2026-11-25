-- Área de socios (25/11/2026): tabla de socios y funciones de acceso.
-- Se aplica en el proyecto "abtcc.bo" de Supabase. Este archivo es el registro de lo que existe allá.
--
-- Reglas:
--  - Cada socio es una cuenta de Supabase Auth (correo + contraseña) más una fila en `socios`.
--    Una cuenta sin fila en `socios` no tiene acceso a nada (así, aunque alguien lograra crearse una cuenta, no entra).
--  - `codigo` (ABTCC-0001…) lo pone la base de datos y no cambia nunca.
--  - `usuario` empieza igual al código en minúsculas y el socio lo puede cambiar (una vez cada 30 días).
--  - Nadie lee ni modifica la tabla directamente: todo pasa por funciones que revisan quién pide.

create sequence public.socios_numero start 1;

create table public.socios (
	id uuid primary key references auth.users (id) on delete cascade,
	codigo text not null unique default ('ABTCC-' || lpad(nextval('public.socios_numero')::text, 4, '0')),
	usuario text not null unique,
	nombre text not null check (length(trim(nombre)) between 2 and 120),
	categoria text not null default 'asociado' check (categoria in ('asociado', 'adherente', 'honorario', 'fundador')),
	estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
	usuario_cambiado_en timestamptz,
	creado_en timestamptz not null default now(),
	constraint codigo_formato check (codigo ~ '^ABTCC-[0-9]{4,}$'),
	-- 3 a 30 caracteres: minúsculas, números, punto y guion; sin empezar ni terminar en signo ni repetir signos.
	constraint usuario_formato check (usuario ~ '^[a-z0-9][a-z0-9.-]{1,28}[a-z0-9]$' and usuario !~ '[.-]{2}')
);

comment on table public.socios is 'Socios de la ABTCC con acceso al área privada. Ver docs/area-socios.md.';

-- El usuario inicial es el código en minúsculas (abtcc-0012).
create function public.socios_usuario_inicial() returns trigger
language plpgsql set search_path = '' as $$
begin
	if new.usuario is null then
		new.usuario := lower(new.codigo);
	end if;
	return new;
end $$;

create trigger socios_usuario_inicial before insert on public.socios
for each row execute function public.socios_usuario_inicial();

alter table public.socios enable row level security;

create policy "Cada socio ve solo su fila" on public.socios
for select to authenticated using (id = (select auth.uid()));

revoke all on public.socios from anon;
revoke insert, update, delete, truncate on public.socios from authenticated;

-- ---------- Nombres de usuario ----------

-- Nombres que nadie puede usar, para que nadie se haga pasar por la asociación.
-- Todo lo que empieza con "abtcc" queda reservado, salvo el código propio.
create function public.usuario_reservado(p_usuario text, p_codigo_propio text) returns boolean
language sql immutable set search_path = '' as $$
	select p_usuario = any (array[
		'admin', 'administrador', 'administracion', 'soporte', 'ayuda', 'contacto', 'info', 'sistema', 'root', 'webmaster',
		'moderador', 'secretaria', 'secretario', 'comision', 'comision-directiva', 'directiva', 'presidencia', 'presidente',
		'vicepresidencia', 'tesoreria', 'tesorero', 'socios', 'miembros', 'alapcco', 'sialapcco'
	])
	or (p_usuario like 'abtcc%' and p_usuario is distinct from lower(p_codigo_propio))
$$;

-- Estado de un nombre para el socio que pregunta:
-- disponible · ocupado · reservado · invalido · tuyo · sin-sesion · sin-socio
create function public.estado_de_usuario(p_usuario text) returns text
language sql stable security definer set search_path = '' as $$
	select case
		when (select auth.uid()) is null then 'sin-sesion'
		when not exists (select 1 from public.socios where id = (select auth.uid())) then 'sin-socio'
		when p_usuario is null or p_usuario !~ '^[a-z0-9][a-z0-9.-]{1,28}[a-z0-9]$' or p_usuario ~ '[.-]{2}' then 'invalido'
		when exists (select 1 from public.socios where id = (select auth.uid()) and usuario = p_usuario) then 'tuyo'
		when public.usuario_reservado(p_usuario, (select codigo from public.socios where id = (select auth.uid()))) then 'reservado'
		when exists (select 1 from public.socios where usuario = p_usuario) then 'ocupado'
		else 'disponible'
	end
$$;

-- Revisa un nombre y, de una lista de candidatos (máx. 20), devuelve hasta 3 que estén libres.
create function public.revisar_usuario(p_usuario text, p_candidatos text[] default '{}') returns jsonb
language sql stable security definer set search_path = '' as $$
	select jsonb_build_object(
		'estado', public.estado_de_usuario(p_usuario),
		'sugerencias', coalesce((
			select jsonb_agg(c order by n)
			from (
				select c, n
				from unnest(p_candidatos) with ordinality as t (c, n)
				where n <= 20 and c is distinct from p_usuario and public.estado_de_usuario(c) = 'disponible'
				order by n
				limit 3
			) libres
		), '[]'::jsonb)
	)
$$;

-- Cambia el nombre de usuario del socio que pide. Devuelve:
-- cambiado · sin-cambios · muy-pronto · ocupado · reservado · invalido · inactivo · sin-sesion · sin-socio
create function public.cambiar_usuario(p_usuario text) returns text
language plpgsql security definer set search_path = '' as $$
declare
	v_estado text;
	v_socio public.socios;
begin
	v_estado := public.estado_de_usuario(p_usuario);
	if v_estado = 'tuyo' then return 'sin-cambios'; end if;
	if v_estado <> 'disponible' then return v_estado; end if;

	select * into v_socio from public.socios where id = (select auth.uid());
	if v_socio.estado <> 'activo' then return 'inactivo'; end if;
	if v_socio.usuario_cambiado_en is not null and v_socio.usuario_cambiado_en + interval '30 days' > now() then
		return 'muy-pronto';
	end if;

	update public.socios set usuario = p_usuario, usuario_cambiado_en = now() where id = v_socio.id;
	return 'cambiado';
exception
	-- Dos personas eligieron el mismo nombre en el mismo instante.
	when unique_violation then return 'ocupado';
end $$;

-- ---------- Datos del socio con sesión abierta ----------

create function public.mi_socio() returns table (
	codigo text,
	usuario text,
	nombre text,
	categoria text,
	estado text,
	correo text,
	usuario_cambiable_desde timestamptz
)
language sql stable security definer set search_path = '' as $$
	select
		s.codigo, s.usuario, s.nombre, s.categoria, s.estado, u.email::text,
		case when s.usuario_cambiado_en is null then null else s.usuario_cambiado_en + interval '30 days' end
	from public.socios s
	join auth.users u on u.id = s.id
	where s.id = (select auth.uid())
$$;

-- ---------- Ingreso (solo el servidor de la web) ----------

-- Traduce usuario, código o correo al correo de la cuenta. Solo la llama el Worker con la clave secreta,
-- para que desde afuera no se pueda averiguar el correo de nadie.
create function public.correo_de_ingreso(p_identificador text) returns text
language sql stable security definer set search_path = '' as $$
	select u.email::text
	from public.socios s
	join auth.users u on u.id = s.id
	where s.usuario = lower(trim(p_identificador))
		or lower(s.codigo) = lower(trim(p_identificador))
		or lower(u.email) = lower(trim(p_identificador))
	limit 1
$$;

-- ---------- Permisos de las funciones ----------

revoke execute on function public.socios_usuario_inicial() from public, anon, authenticated;
revoke execute on function public.usuario_reservado(text, text) from public, anon, authenticated;
revoke execute on function public.estado_de_usuario(text) from public, anon, authenticated;
revoke execute on function public.revisar_usuario(text, text[]) from public, anon;
revoke execute on function public.cambiar_usuario(text) from public, anon;
revoke execute on function public.mi_socio() from public, anon;
revoke execute on function public.correo_de_ingreso(text) from public, anon, authenticated;

grant execute on function public.revisar_usuario(text, text[]) to authenticated;
grant execute on function public.cambiar_usuario(text) to authenticated;
grant execute on function public.mi_socio() to authenticated;
grant execute on function public.correo_de_ingreso(text) to service_role;
