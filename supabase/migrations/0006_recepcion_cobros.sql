-- ============================================================================
-- 0006 — Recepción del vehículo, fotos, cobros y recordatorios de service
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Recepción — lo que se completa parado al lado del auto
-- ---------------------------------------------------------------------------

create table public.ot_recepcion (
  ot_id       uuid primary key references public.orden_trabajo (id) on delete cascade,
  taller_id   uuid not null references public.taller (id) on delete cascade,
  km          integer check (km is null or km >= 0),
  -- 0 = reserva, 100 = tanque lleno.
  combustible smallint check (combustible between 0 and 100),
  objetos_valor text,
  observaciones text,
  firma_recepcion_url text,
  firma_entrega_url   text,
  -- Qué se leyó del código de la cédula, crudo. Sirve para depurar formatos
  -- distintos sin volver a pedirle el documento al cliente.
  cedula_payload text,
  recibido_por  uuid references public.perfil (user_id) on delete set null,
  creado_en     timestamptz not null default now()
);

create type public.tipo_foto_ot as enum (
  'cedula',
  'estado_ingreso',
  'dano',        -- daños preexistentes: evita la discusión "esto no lo tenía"
  'comprobante'
);

create table public.ot_foto (
  id        uuid primary key default gen_random_uuid(),
  taller_id uuid not null references public.taller (id) on delete cascade,
  ot_id     uuid not null references public.orden_trabajo (id) on delete cascade,
  tipo      public.tipo_foto_ot not null default 'estado_ingreso',
  -- Path dentro del bucket privado: {taller_id}/{ot_id}/{uuid}.webp
  path      text not null,
  nota      text,
  orden     smallint not null default 0,
  subido_por uuid references public.perfil (user_id) on delete set null,
  creado_en timestamptz not null default now()
);

create index ot_foto_ot_idx on public.ot_foto (ot_id, tipo, orden);

-- ---------------------------------------------------------------------------
-- Cobros
-- ---------------------------------------------------------------------------

create type public.metodo_pago as enum (
  'efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'mercado_pago', 'otro'
);

create table public.pago (
  id         uuid primary key default gen_random_uuid(),
  taller_id  uuid not null references public.taller (id) on delete cascade,
  ot_id      uuid not null references public.orden_trabajo (id) on delete cascade,
  metodo     public.metodo_pago not null default 'efectivo',
  monto      numeric(12,2) not null check (monto > 0),
  fecha      timestamptz not null default now(),
  notas      text,
  usuario_id uuid references public.perfil (user_id) on delete set null
);

create index pago_ot_idx on public.pago (ot_id);
create index pago_taller_fecha_idx on public.pago (taller_id, fecha desc);

create table public.cierre_caja (
  id         uuid primary key default gen_random_uuid(),
  taller_id  uuid not null references public.taller (id) on delete cascade,
  fecha      date not null,
  totales    jsonb not null default '{}'::jsonb,  -- { "efectivo": 120000, ... }
  total      numeric(12,2) not null default 0,
  notas      text,
  usuario_id uuid references public.perfil (user_id) on delete set null,
  creado_en  timestamptz not null default now()
);

create unique index cierre_caja_fecha_key on public.cierre_caja (taller_id, fecha);

-- ---------------------------------------------------------------------------
-- Recordatorio de service
--
-- Un lubricentro vive de que el cliente vuelva. Al cargar un cambio de aceite
-- se agenda el próximo por km o por fecha, lo que llegue primero, y un cron
-- diario arma la lista de a quién contactar esta semana.
-- ---------------------------------------------------------------------------

create type public.estado_recordatorio as enum ('pendiente', 'contactado', 'cumplido', 'descartado');

create table public.recordatorio (
  id            uuid primary key default gen_random_uuid(),
  taller_id     uuid not null references public.taller (id) on delete cascade,
  vehiculo_id   uuid not null references public.vehiculo (id) on delete cascade,
  ot_origen_id  uuid references public.orden_trabajo (id) on delete set null,
  tipo          text not null default 'aceite',
  km_objetivo   integer check (km_objetivo is null or km_objetivo >= 0),
  fecha_objetivo date,
  estado        public.estado_recordatorio not null default 'pendiente',
  contactado_en timestamptz,
  creado_en     timestamptz not null default now(),

  constraint recordatorio_tiene_objetivo
    check (km_objetivo is not null or fecha_objetivo is not null)
);

create index recordatorio_pendientes_idx on public.recordatorio (taller_id, fecha_objetivo)
  where estado = 'pendiente';
create index recordatorio_vehiculo_idx on public.recordatorio (vehiculo_id, creado_en desc);
