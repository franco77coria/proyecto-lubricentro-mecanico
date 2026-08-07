-- ============================================================================
-- 0004 — Órdenes de trabajo, notas, checklist e ítems
-- ============================================================================

create type public.estado_ot as enum (
  'presupuesto',
  'aprobado',
  'recibido',
  'en_trabajo',
  'esperando_repuesto',  -- responde "¿por qué hace 4 días que está ese auto acá?"
  'listo',               -- terminado pero el cliente no vino a buscarlo
  'entregado',
  'cerrado',
  'anulado'
);

create type public.tipo_ot as enum ('lubricentro', 'mecanica', 'mixto');

create table public.orden_trabajo (
  id           uuid primary key default gen_random_uuid(),
  taller_id    uuid not null references public.taller (id) on delete cascade,
  numero       text not null,
  vehiculo_id  uuid not null references public.vehiculo (id) on delete restrict,
  cliente_id   uuid references public.cliente (id) on delete set null,

  estado       public.estado_ot not null default 'presupuesto',
  tipo         public.tipo_ot not null default 'lubricentro',

  km_ingreso   integer check (km_ingreso is null or km_ingreso >= 0),
  fecha_ingreso  timestamptz not null default now(),
  fecha_entrega  timestamptz,
  asignado_a   uuid references public.perfil (user_id) on delete set null,
  observaciones text,

  -- Totales derivados de ot_item por trigger. La app nunca los escribe:
  -- el precio que se cobra lo calcula siempre la base, nunca el cliente.
  total_mano_obra numeric(12,2) not null default 0,
  total_repuestos numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,

  creado_por   uuid references public.perfil (user_id) on delete set null,
  creado_en    timestamptz not null default now()
);

create unique index ot_numero_key on public.orden_trabajo (taller_id, numero);
create index ot_taller_estado_idx on public.orden_trabajo (taller_id, estado, fecha_ingreso desc);
create index ot_vehiculo_idx on public.orden_trabajo (vehiculo_id, fecha_ingreso desc);
create index ot_cliente_idx on public.orden_trabajo (cliente_id) where cliente_id is not null;
create index ot_asignado_idx on public.orden_trabajo (asignado_a) where asignado_a is not null;

-- El número lo asigna la base, no la app.
create or replace function public.asignar_numero_ot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.numero is null or new.numero = '' then
    new.numero := public.siguiente_numero_ot(new.taller_id);
  end if;
  return new;
end;
$$;

create trigger ot_numero_bi
  before insert on public.orden_trabajo
  for each row execute function public.asignar_numero_ot();

-- ---------------------------------------------------------------------------
-- Log de estados — de acá salen las métricas de tiempo en taller sin trabajo
-- extra: cuánto tarda una OT, cuánto se pasa esperando repuestos, etc.
-- ---------------------------------------------------------------------------

create table public.ot_estado_log (
  id              uuid primary key default gen_random_uuid(),
  taller_id       uuid not null references public.taller (id) on delete cascade,
  ot_id           uuid not null references public.orden_trabajo (id) on delete cascade,
  estado_anterior public.estado_ot,
  estado_nuevo    public.estado_ot not null,
  usuario_id      uuid references public.perfil (user_id) on delete set null,
  creado_en       timestamptz not null default now()
);

create index ot_estado_log_ot_idx on public.ot_estado_log (ot_id, creado_en);

create or replace function public.registrar_cambio_estado_ot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ot_estado_log (taller_id, ot_id, estado_anterior, estado_nuevo, usuario_id)
    values (new.taller_id, new.id, null, new.estado, auth.uid());
  elsif new.estado is distinct from old.estado then
    insert into public.ot_estado_log (taller_id, ot_id, estado_anterior, estado_nuevo, usuario_id)
    values (new.taller_id, new.id, old.estado, new.estado, auth.uid());
  end if;
  return new;
end;
$$;

create trigger ot_estado_log_ai
  after insert or update of estado on public.orden_trabajo
  for each row execute function public.registrar_cambio_estado_ot();

-- ---------------------------------------------------------------------------
-- Notas de la OT
--
-- Tres listas distintas, misma forma:
--   anomalia   — lo que dice el cliente, en sus palabras ("ruido al frenar")
--   descargo   — el diagnóstico del taller, opcionalmente respondiendo a una
--   recomendado— lo detectado pero NO autorizado ahora. Alimenta el
--                seguimiento comercial del mes siguiente.
-- Van como filas y no como un textarea gigante para poder listarlas,
-- tildarlas y arrastrarlas de forma independiente.
-- ---------------------------------------------------------------------------

create type public.tipo_nota_ot as enum ('anomalia', 'descargo', 'recomendado');

create table public.ot_nota (
  id            uuid primary key default gen_random_uuid(),
  taller_id     uuid not null references public.taller (id) on delete cascade,
  ot_id         uuid not null references public.orden_trabajo (id) on delete cascade,
  tipo          public.tipo_nota_ot not null,
  texto         text not null check (length(trim(texto)) > 0),
  orden         smallint not null default 0,
  -- Un descargo puede responder a la anomalía que el cliente reportó.
  responde_a_id uuid references public.ot_nota (id) on delete set null,
  creado_por    uuid references public.perfil (user_id) on delete set null,
  creado_en     timestamptz not null default now()
);

create index ot_nota_ot_idx on public.ot_nota (ot_id, tipo, orden);

-- ---------------------------------------------------------------------------
-- Checklist configurable por taller
--
-- La plantilla por defecto reproduce la planilla de Excel que el taller usa
-- hoy, pero cada taller puede armar la suya: es producto, no código.
-- ---------------------------------------------------------------------------

create table public.checklist_plantilla (
  id        uuid primary key default gen_random_uuid(),
  taller_id uuid not null references public.taller (id) on delete cascade,
  nombre    text not null default 'General',
  activa    boolean not null default true,
  creado_en timestamptz not null default now()
);

create index checklist_plantilla_taller_idx on public.checklist_plantilla (taller_id) where activa;

create table public.checklist_plantilla_item (
  id           uuid primary key default gen_random_uuid(),
  taller_id    uuid not null references public.taller (id) on delete cascade,
  plantilla_id uuid not null references public.checklist_plantilla (id) on delete cascade,
  etiqueta     text not null check (length(trim(etiqueta)) > 0),
  categoria    text,
  orden        smallint not null default 0,
  requiere_nota boolean not null default false,
  activo       boolean not null default true
);

create index checklist_item_plantilla_idx on public.checklist_plantilla_item (plantilla_id, orden) where activo;

-- Estado explícito por ítem.
--
-- En el Excel el tilde y el texto al lado son dos cosas distintas mezcladas:
-- no se puede distinguir "lo revisé y está bien" de "acá encontré algo".
-- Separarlas es lo que permite después preguntar "¿qué autos tienen frenos
-- en crítico sin resolver?" y que salga una lista.
create type public.estado_checklist as enum ('ok', 'observado', 'critico', 'no_aplica');

create table public.ot_checklist (
  id               uuid primary key default gen_random_uuid(),
  taller_id        uuid not null references public.taller (id) on delete cascade,
  ot_id            uuid not null references public.orden_trabajo (id) on delete cascade,
  item_id          uuid references public.checklist_plantilla_item (id) on delete set null,
  -- Snapshot de la etiqueta: si el dueño edita la plantilla, las OTs viejas
  -- no se reescriben solas.
  etiqueta_snapshot text not null,
  orden            smallint not null default 0,
  estado           public.estado_checklist,
  nota             text,
  actualizado_por  uuid references public.perfil (user_id) on delete set null,
  actualizado_en   timestamptz not null default now()
);

create index ot_checklist_ot_idx on public.ot_checklist (ot_id, orden);
create index ot_checklist_criticos_idx on public.ot_checklist (taller_id, estado)
  where estado in ('critico', 'observado');

-- ---------------------------------------------------------------------------
-- Ítems de la OT
--
-- Los valores se CONGELAN al cargar el ítem: cantidad, costo y precio se
-- copian, no se referencian. Si un filtro se compró a $8.000 en marzo y hoy
-- sale $12.000, la OT de marzo tiene que seguir mostrando margen sobre $8.000.
-- Joinear al precio actual del producto hace mentir todo el histórico.
-- ---------------------------------------------------------------------------

create type public.tipo_item_ot as enum (
  'repuesto',
  'mano_obra',
  'servicio',
  'insumo',
  'tercero'   -- rectificación, tapicería: lo que se manda afuera
);

create table public.ot_item (
  id          uuid primary key default gen_random_uuid(),
  taller_id   uuid not null references public.taller (id) on delete cascade,
  ot_id       uuid not null references public.orden_trabajo (id) on delete cascade,
  tipo        public.tipo_item_ot not null,
  descripcion text not null check (length(trim(descripcion)) > 0),
  producto_id uuid,  -- FK agregada en 0005, cuando existe `producto`

  cantidad        numeric(10,3) not null default 1 check (cantidad > 0),
  costo_unitario  numeric(12,2) not null default 0 check (costo_unitario >= 0),
  precio_unitario numeric(12,2) not null default 0 check (precio_unitario >= 0),

  -- Redondeo a 2 decimales en el paso intermedio, igual que el total.
  -- Si la app hace un preview en JS tiene que replicar este mismo truncado,
  -- o los casos que caen justo en la mitad redondean para el otro lado.
  subtotal numeric(12,2) generated always as (
    round(cantidad * precio_unitario, 2)
  ) stored,

  orden      smallint not null default 0,
  creado_por uuid references public.perfil (user_id) on delete set null,
  creado_en  timestamptz not null default now()
);

create index ot_item_ot_idx on public.ot_item (ot_id, orden);
create index ot_item_producto_idx on public.ot_item (producto_id) where producto_id is not null;

-- ---------------------------------------------------------------------------
-- Totales de la OT, recalculados por la base
-- ---------------------------------------------------------------------------

create or replace function public.recalcular_totales_ot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ot uuid := coalesce(new.ot_id, old.ot_id);
begin
  update public.orden_trabajo o
  set total_mano_obra = coalesce(t.mano_obra, 0),
      total_repuestos = coalesce(t.repuestos, 0),
      total           = coalesce(t.mano_obra, 0) + coalesce(t.repuestos, 0)
  from (
    select
      sum(subtotal) filter (where tipo in ('mano_obra', 'servicio')) as mano_obra,
      sum(subtotal) filter (where tipo in ('repuesto', 'insumo', 'tercero')) as repuestos
    from public.ot_item
    where ot_id = v_ot
  ) t
  where o.id = v_ot;

  return null;
end;
$$;

create trigger ot_item_totales_aiud
  after insert or update or delete on public.ot_item
  for each row execute function public.recalcular_totales_ot();
