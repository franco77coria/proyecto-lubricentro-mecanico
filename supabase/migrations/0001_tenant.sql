-- ============================================================================
-- 0001 — Multi-tenant: talleres, perfiles, invitaciones y helpers de contexto
-- ============================================================================

-- Supabase aloja las extensiones en el schema `extensions`, no en `public`.
create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Taller (tenant)
-- ---------------------------------------------------------------------------

create type public.rol_usuario as enum ('dueno', 'mostrador', 'mecanico');

create table public.taller (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null check (length(trim(nombre)) > 0),
  cuit                text,
  logo_url            text,
  direccion           text,
  telefono            text,
  -- Reservado para el billing, que no se integra en v1.
  plan                text not null default 'trial',
  estado_suscripcion  text not null default 'activa',
  config              jsonb not null default '{}'::jsonb,
  creado_en           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Perfil: vincula un usuario de auth.users con un taller y un rol
-- ---------------------------------------------------------------------------

create table public.perfil (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  taller_id  uuid not null references public.taller (id) on delete cascade,
  rol        public.rol_usuario not null default 'mecanico',
  nombre     text not null default '',
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

create index perfil_taller_idx on public.perfil (taller_id) where activo;

-- ---------------------------------------------------------------------------
-- Invitaciones
-- ---------------------------------------------------------------------------

create table public.invitacion (
  id          uuid primary key default gen_random_uuid(),
  taller_id   uuid not null references public.taller (id) on delete cascade,
  email       text not null,
  rol         public.rol_usuario not null default 'mecanico',
  token       text not null unique,
  expira_en   timestamptz not null,
  aceptada_en timestamptz,
  creado_en   timestamptz not null default now()
);

create index invitacion_taller_idx on public.invitacion (taller_id);
create index invitacion_email_idx on public.invitacion (lower(email)) where aceptada_en is null;

-- ---------------------------------------------------------------------------
-- Contexto del request
--
-- El taller_id y el rol viajan en el JWT (los inyecta custom_access_token_hook,
-- ver 0007). El fallback a la tabla perfil existe por si el hook todavía no
-- está habilitado en el proyecto de Supabase — sin él, la app queda muerta
-- hasta que alguien active el hook a mano en el dashboard.
--
-- SECURITY DEFINER es necesario: estas funciones se usan dentro de las propias
-- políticas RLS de `perfil`, y sin él la consulta de fallback se evaluaría
-- contra esas mismas políticas y entraría en recursión infinita.
-- El `set search_path` no es opcional: sin fijarlo, un search_path manipulado
-- permite escalar privilegios a través de una función SECURITY DEFINER.
-- ---------------------------------------------------------------------------

create or replace function public.taller_actual()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'taller_id', '')::uuid,
    (select p.taller_id from public.perfil p where p.user_id = auth.uid() and p.activo)
  );
$$;

create or replace function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'user_role', '')::public.rol_usuario,
    (select p.rol from public.perfil p where p.user_id = auth.uid() and p.activo)
  );
$$;

-- Azúcar para las políticas: el dueño ve todo, el resto no.
create or replace function public.es_dueno()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.rol_actual() = 'dueno';
$$;

-- ---------------------------------------------------------------------------
-- Contador de OT por taller
--
-- Nunca count(*) + 1: con dos usuarios creando OTs al mismo tiempo eso repite
-- números. El UPDATE ... RETURNING toma un lock de fila y serializa.
-- ---------------------------------------------------------------------------

create table public.taller_contador (
  taller_id uuid not null references public.taller (id) on delete cascade,
  anio      integer not null,
  ultimo    integer not null default 0,
  primary key (taller_id, anio)
);

create or replace function public.siguiente_numero_ot(p_taller uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_anio     integer := extract(year from now())::integer;
  v_numero   integer;
begin
  insert into public.taller_contador (taller_id, anio, ultimo)
  values (p_taller, v_anio, 1)
  on conflict (taller_id, anio)
    do update set ultimo = public.taller_contador.ultimo + 1
  returning ultimo into v_numero;

  return v_anio || '-' || lpad(v_numero::text, 5, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- Utilidad de normalización de texto, para búsquedas tolerantes
-- ---------------------------------------------------------------------------

-- unaccent() es STABLE (depende del diccionario), así que Postgres no la acepta
-- en índices ni en columnas generadas. Envolverla en una función declarada
-- IMMUTABLE es el patrón estándar para poder indexar: el diccionario no cambia
-- en la práctica, pero si alguien lo modifica hay que reindexar a mano.
create or replace function public.normalizar(t text)
returns text
language sql
immutable
strict
set search_path = public, extensions, pg_temp
as $$
  select lower(extensions.unaccent(trim(t)));
$$;
