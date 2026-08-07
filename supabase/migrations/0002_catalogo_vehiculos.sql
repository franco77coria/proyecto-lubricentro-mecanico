-- ============================================================================
-- 0002 — Catálogo de marcas y modelos
--
-- Catálogo GLOBAL: sin taller_id. Lo comparten todos los talleres, lo lee
-- cualquiera autenticado y lo escribe solo service_role (el cron y el admin).
--
-- No existe una API pública confiable del mercado argentino, así que el
-- catálogo se arma con un seed curado y se completa por dos vías, ambas
-- pasando por un estado `pendiente` que un humano aprueba:
--   - lo que carga el mostrador cuando su modelo no está
--   - lo que propone el cron mensual contra NHTSA vPIC
-- Insertar automático sin revisión produce "FORD", "Ford" y "Ford Motor
-- Company" como tres marcas distintas en pocos meses.
-- ============================================================================

create type public.origen_catalogo as enum ('seed', 'vpic', 'manual');
create type public.estado_catalogo as enum ('aprobado', 'pendiente', 'rechazado');

-- ---------------------------------------------------------------------------
-- Marca
-- ---------------------------------------------------------------------------

create table public.marca (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(trim(nombre)) > 0),
  nombre_norm text generated always as (public.normalizar(nombre)) stored,
  -- Alias de búsqueda: 'vw' → Volkswagen, 'chevy' → Chevrolet.
  alias       text[] not null default '{}',
  origen      public.origen_catalogo not null default 'manual',
  estado      public.estado_catalogo not null default 'pendiente',
  activa      boolean not null default true,
  creado_en   timestamptz not null default now()
);

create unique index marca_nombre_norm_key on public.marca (nombre_norm);
create index marca_trgm_idx on public.marca using gin (nombre_norm extensions.gin_trgm_ops);
create index marca_alias_idx on public.marca using gin (alias);
create index marca_pendiente_idx on public.marca (creado_en) where estado = 'pendiente';

-- ---------------------------------------------------------------------------
-- Modelo
-- ---------------------------------------------------------------------------

create table public.modelo (
  id          uuid primary key default gen_random_uuid(),
  marca_id    uuid not null references public.marca (id) on delete cascade,
  nombre      text not null check (length(trim(nombre)) > 0),
  nombre_norm text generated always as (public.normalizar(nombre)) stored,
  anio_desde  smallint check (anio_desde between 1900 and 2100),
  anio_hasta  smallint check (anio_hasta between 1900 and 2100),
  origen      public.origen_catalogo not null default 'manual',
  estado      public.estado_catalogo not null default 'pendiente',
  -- Cuando se fusiona un duplicado, apunta al modelo bueno en vez de borrarse:
  -- los vehículos ya cargados siguen resolviendo.
  fusionado_en_id uuid references public.modelo (id) on delete set null,
  creado_en   timestamptz not null default now(),

  constraint modelo_anios_coherentes
    check (anio_hasta is null or anio_desde is null or anio_hasta >= anio_desde)
);

create unique index modelo_marca_nombre_key on public.modelo (marca_id, nombre_norm);
create index modelo_trgm_idx on public.modelo using gin (nombre_norm extensions.gin_trgm_ops);
create index modelo_marca_idx on public.modelo (marca_id) where estado = 'aprobado';
create index modelo_pendiente_idx on public.modelo (creado_en) where estado = 'pendiente';
