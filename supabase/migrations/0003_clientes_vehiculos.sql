-- ============================================================================
-- 0003 — Clientes, vehículos y la relación con historia entre ambos
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Cliente
-- ---------------------------------------------------------------------------

create table public.cliente (
  id         uuid primary key default gen_random_uuid(),
  taller_id  uuid not null references public.taller (id) on delete cascade,
  nombre     text not null check (length(trim(nombre)) > 0),
  apellido   text not null default '',
  -- Normalizado a E.164 en la app antes de guardar: sin esto el link de
  -- WhatsApp no arma y los duplicados no se detectan.
  telefono   text check (telefono is null or telefono ~ '^\+[1-9][0-9]{7,14}$'),
  email      text check (email is null or position('@' in email) > 1),
  documento  text,
  notas      text,
  creado_en  timestamptz not null default now(),
  archivado  boolean not null default false
);

create index cliente_taller_idx on public.cliente (taller_id) where not archivado;
create index cliente_telefono_idx on public.cliente (taller_id, telefono) where telefono is not null;
create index cliente_busqueda_idx on public.cliente
  using gin (public.normalizar(nombre || ' ' || apellido) extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Vehículo
--
-- La patente se normaliza en Postgres, no en el input. El input ayuda
-- (mayúsculas, bloquea espacios), pero la garantía tiene que estar acá: los
-- Server Actions se pueden invocar con un POST directo y "la pantalla no lo
-- permite" no es un control.
-- ---------------------------------------------------------------------------

create type public.tipo_combustible as enum ('nafta', 'diesel', 'gnc', 'hibrido', 'electrico');

create table public.vehiculo (
  id           uuid primary key default gen_random_uuid(),
  taller_id    uuid not null references public.taller (id) on delete cascade,
  marca_id     uuid references public.marca (id) on delete set null,
  modelo_id    uuid references public.modelo (id) on delete set null,

  patente      text not null,
  patente_norm text generated always as (
    upper(regexp_replace(patente, '[^A-Za-z0-9]', '', 'g'))
  ) stored,
  -- Importados, clásicos y chapas atípicas: se saltean la validación de
  -- formato. El sistema nunca puede frenar el trabajo por una chapa rara.
  formato_especial boolean not null default false,

  anio         smallint check (anio between 1900 and 2100),
  color        text,
  combustible  public.tipo_combustible,
  vin          text,
  km_actual    integer check (km_actual is null or km_actual >= 0),
  km_actualizado_en timestamptz,
  notas        text,
  creado_en    timestamptz not null default now(),

  -- Los cuatro formatos vivos en Argentina. La expresión se repite en lugar de
  -- referenciar patente_norm: un CHECK sobre una columna generada es frágil.
  constraint vehiculo_patente_formato check (
    formato_especial
    or upper(regexp_replace(patente, '[^A-Za-z0-9]', '', 'g')) ~ (
      '^('
      || '[A-Z]{3}[0-9]{3}'          -- auto viejo:     RTF421
      || '|[A-Z]{2}[0-9]{3}[A-Z]{2}' -- auto Mercosur:  AB123CD
      || '|[0-9]{3}[A-Z]{3}'         -- moto vieja:     123ABC
      || '|[A-Z][0-9]{3}[A-Z]{3}'    -- moto Mercosur:  A123BCD
      || ')$'
    )
  )
);

-- Un auto no puede estar dos veces en el mismo taller. `ab 123 cd`,
-- `AB-123-CD` y `AB123CD` colapsan todos en la misma fila.
create unique index vehiculo_patente_key on public.vehiculo (taller_id, patente_norm);
create index vehiculo_taller_idx on public.vehiculo (taller_id);
create index vehiculo_modelo_idx on public.vehiculo (modelo_id) where modelo_id is not null;

-- ---------------------------------------------------------------------------
-- Vehículo ↔ Cliente, con historia
--
-- El historial de mantenimiento pertenece al AUTO, no al dueño: los autos se
-- venden y lo que se le hizo sigue siendo del auto. Por eso la relación tiene
-- desde/hasta en vez de un cliente_id colgado del vehículo.
-- ---------------------------------------------------------------------------

create table public.vehiculo_cliente (
  id          uuid primary key default gen_random_uuid(),
  taller_id   uuid not null references public.taller (id) on delete cascade,
  vehiculo_id uuid not null references public.vehiculo (id) on delete cascade,
  cliente_id  uuid not null references public.cliente (id) on delete cascade,
  desde       date not null default current_date,
  hasta       date,
  creado_en   timestamptz not null default now(),

  constraint vehiculo_cliente_rango check (hasta is null or hasta >= desde)
);

create index vehiculo_cliente_vehiculo_idx on public.vehiculo_cliente (vehiculo_id, desde desc);
create index vehiculo_cliente_cliente_idx on public.vehiculo_cliente (cliente_id, desde desc);

-- Un auto tiene un solo dueño vigente a la vez.
create unique index vehiculo_cliente_vigente_key
  on public.vehiculo_cliente (vehiculo_id)
  where hasta is null;
