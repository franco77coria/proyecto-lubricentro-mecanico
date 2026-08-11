-- ============================================================================
-- 0035 — Turnero
--
-- Tabla simple para agendar turnos de clientes.
-- ============================================================================

create type public.estado_turno as enum ('pendiente', 'confirmado', 'ingresado', 'cancelado', 'no_asistio');

create table public.turno (
  id           uuid primary key default gen_random_uuid(),
  taller_id    uuid not null references public.taller (id) on delete cascade,
  cliente_id   uuid references public.cliente (id) on delete set null,
  vehiculo_id  uuid references public.vehiculo (id) on delete set null,
  
  -- Fecha y hora del turno
  fecha_hora   timestamptz not null,
  
  -- Qué viene a hacer (resumen corto)
  motivo       text not null,
  notas        text,
  
  estado       public.estado_turno not null default 'pendiente',
  
  creado_por   uuid not null references auth.users (id),
  creado_en    timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index turno_taller_fecha_idx on public.turno (taller_id, fecha_hora);

-- RLS
alter table public.turno enable row level security;

create policy turno_select on public.turno
  for select to authenticated
  using (taller_id = public.taller_actual());

create policy turno_insert on public.turno
  for insert to authenticated
  with check (taller_id = public.taller_actual());

create policy turno_update on public.turno
  for update to authenticated
  using (taller_id = public.taller_actual())
  with check (taller_id = public.taller_actual());

create policy turno_delete on public.turno
  for delete to authenticated
  using (taller_id = public.taller_actual());
