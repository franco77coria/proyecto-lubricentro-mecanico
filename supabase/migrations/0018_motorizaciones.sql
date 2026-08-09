-- ============================================================================
-- 0018 — Motorizaciones
--
-- El tercer nivel del catálogo: marca → modelo → motorización.
--
-- Hace falta porque el modelo solo no alcanza para decidir nada en el taller.
-- Una Amarok puede llevar 6,3 litros de 5W30 o 8,5 de 5W40 según si es la 2.0
-- TDI o la V6, y el filtro de aceite es distinto. Sin este nivel, la ficha
-- técnica de la fase siguiente no tiene dónde colgarse: quedaría atada al
-- modelo y sería incorrecta en la mitad de los casos.
--
-- Mismo contrato que marca y modelo: catálogo GLOBAL (sin taller_id), lo lee
-- cualquiera autenticado, lo escribe service_role, y el mostrador puede dar de
-- alta lo que le falte en estado `pendiente` para no quedar trabado. Aprobar
-- es del admin.
-- ============================================================================

create table public.motorizacion (
  id          uuid primary key default gen_random_uuid(),
  modelo_id   uuid not null references public.modelo (id) on delete cascade,

  -- Como lo dice el taller, no como lo dice el fabricante: "1.6 16v MSI",
  -- "2.0 TDI 140cv", "1.4 T-Jet". Es lo que el mecánico reconoce de memoria.
  nombre      text not null check (length(trim(nombre)) > 0),
  nombre_norm text generated always as (public.normalizar(nombre)) stored,

  -- Cilindrada en cc: 1598, 1968, 110. Sirve para ordenar y para buscar
  -- "1.6" sin depender de cómo se escribió el nombre.
  cilindrada_cc integer check (cilindrada_cc is null or cilindrada_cc between 40 and 30000),
  combustible   public.tipo_combustible,

  -- Potencia declarada. Es lo que distingue una 2.0 TDI 140 de una 180, que
  -- comparten cilindrada pero no llevan lo mismo.
  --
  -- El piso es 1 y no 3: un scooter eléctrico de 1200 W son ~1,6 cv, y son
  -- vehículos que entran al taller igual que cualquier otro.
  potencia_cv smallint check (potencia_cv is null or potencia_cv between 1 and 2000),

  anio_desde  smallint check (anio_desde between 1900 and 2100),
  anio_hasta  smallint check (anio_hasta between 1900 and 2100),

  origen      public.origen_catalogo not null default 'manual',
  estado      public.estado_catalogo not null default 'pendiente',

  -- Igual que en modelo: un duplicado se fusiona apuntando al bueno, no se
  -- borra. Los vehículos ya cargados tienen que seguir resolviendo.
  fusionado_en_id uuid references public.motorizacion (id) on delete set null,

  creado_en   timestamptz not null default now(),

  constraint motorizacion_anios_coherentes
    check (anio_hasta is null or anio_desde is null or anio_hasta >= anio_desde)
);

create unique index motorizacion_modelo_nombre_key
  on public.motorizacion (modelo_id, nombre_norm);

create index motorizacion_modelo_idx
  on public.motorizacion (modelo_id) where estado = 'aprobado';

create index motorizacion_pendiente_idx
  on public.motorizacion (creado_en) where estado = 'pendiente';

create index motorizacion_trgm_idx
  on public.motorizacion using gin (nombre_norm extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- El vehículo pasa a apuntar a su motorización
--
-- Nullable a propósito: un auto cargado con la patente y nada más sigue siendo
-- válido. En el mostrador con tres personas esperando, exigir la motorización
-- para poder guardar es exactamente el tipo de fricción que hace que el
-- sistema se abandone y se vuelva al cuaderno.
-- ---------------------------------------------------------------------------

alter table public.vehiculo
  add column motorizacion_id uuid references public.motorizacion (id) on delete set null;

create index vehiculo_motorizacion_idx on public.vehiculo (motorizacion_id)
  where motorizacion_id is not null;

-- ---------------------------------------------------------------------------
-- RLS — calcado de modelo (0007)
-- ---------------------------------------------------------------------------

alter table public.motorizacion enable row level security;

create policy motorizacion_select on public.motorizacion
  for select to authenticated using (true);

-- El mostrador puede proponer la motorización que le falta, solo como
-- pendiente. Aprobarla es del admin.
create policy motorizacion_alta_pendiente on public.motorizacion
  for insert to authenticated
  with check (estado = 'pendiente' and origen = 'manual');

-- El default privileges de `anon` quedó revocado en 0007, pero eso corrige el
-- futuro, no el pasado de esta sesión: se explicita igual para que la tabla
-- nazca cerrada sin depender del orden en que corran las migraciones
-- (lección #37).
revoke all on public.motorizacion from anon;
