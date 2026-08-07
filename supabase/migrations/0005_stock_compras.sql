-- ============================================================================
-- 0005 — Stock, proveedores y compras
--
-- El stock NO es un campo que se edita: es el saldo de un libro de
-- movimientos. `producto.stock` existe como saldo materializado (lo mantiene
-- un trigger, y la app no tiene privilegio para escribirlo), pero la fuente de
-- verdad es siempre `movimiento_stock`.
--
-- Tres razones por las que vale la pena:
--   - Auditoría: cuando falten 3 filtros, se ve quién los sacó y cuándo.
--   - Costo real: el costo queda congelado en el movimiento, no se recalcula.
--   - Offline (v2): los movimientos son deltas, se pueden aplicar en cualquier
--     orden y el saldo final es correcto. Un campo mutable se pisa entre
--     dispositivos. El ledger es lo que hace viable el offline sin migrar nada.
-- ============================================================================

create table public.proveedor (
  id        uuid primary key default gen_random_uuid(),
  taller_id uuid not null references public.taller (id) on delete cascade,
  nombre    text not null check (length(trim(nombre)) > 0),
  telefono  text,
  email     text,
  notas     text,
  activo    boolean not null default true,
  creado_en timestamptz not null default now()
);

create index proveedor_taller_idx on public.proveedor (taller_id) where activo;

-- ---------------------------------------------------------------------------
-- Producto
-- ---------------------------------------------------------------------------

create table public.producto (
  id           uuid primary key default gen_random_uuid(),
  taller_id    uuid not null references public.taller (id) on delete cascade,
  sku          text,
  nombre       text not null check (length(trim(nombre)) > 0),
  marca        text,
  categoria    text,
  unidad       text not null default 'unidad',
  ubicacion    text,

  -- Saldo materializado. Solo lo escribe el trigger del ledger: la app no
  -- tiene privilegio UPDATE sobre esta columna (ver 0007).
  stock        numeric(12,3) not null default 0,
  stock_min    numeric(12,3) not null default 0 check (stock_min >= 0),

  -- Columna generada para que el filtro de "bajo mínimo" viva en la consulta.
  -- PostgREST no puede comparar dos columnas entre sí, así que sin esto el
  -- filtro termina hecho en JS después de paginar, y el count miente.
  bajo_stock   boolean generated always as (stock <= stock_min) stored,

  precio_venta numeric(12,2) not null default 0 check (precio_venta >= 0),
  activo       boolean not null default true,
  creado_en    timestamptz not null default now()
);

create unique index producto_sku_key on public.producto (taller_id, sku) where sku is not null;
create index producto_taller_idx on public.producto (taller_id) where activo;
create index producto_bajo_stock_idx on public.producto (taller_id) where bajo_stock and activo;
create index producto_busqueda_idx on public.producto
  using gin (public.normalizar(nombre) extensions.gin_trgm_ops);

-- El mismo filtro sirve para 6 modelos distintos.
create table public.producto_equivalencia (
  producto_id uuid not null references public.producto (id) on delete cascade,
  modelo_id   uuid not null references public.modelo (id) on delete cascade,
  taller_id   uuid not null references public.taller (id) on delete cascade,
  primary key (producto_id, modelo_id)
);

create index producto_equivalencia_modelo_idx on public.producto_equivalencia (modelo_id);

-- Ahora que existe `producto`, se cierra la FK que quedó pendiente en 0004.
alter table public.ot_item
  add constraint ot_item_producto_fk
  foreign key (producto_id) references public.producto (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Servicios — catálogo de mano de obra propio de cada taller
-- ---------------------------------------------------------------------------

create table public.servicio (
  id                uuid primary key default gen_random_uuid(),
  taller_id         uuid not null references public.taller (id) on delete cascade,
  nombre            text not null check (length(trim(nombre)) > 0),
  precio_mano_obra  numeric(12,2) not null default 0 check (precio_mano_obra >= 0),
  tiempo_estimado   interval,
  activo            boolean not null default true,
  creado_en         timestamptz not null default now()
);

create index servicio_taller_idx on public.servicio (taller_id) where activo;

-- ---------------------------------------------------------------------------
-- Compras
-- ---------------------------------------------------------------------------

create table public.compra (
  id           uuid primary key default gen_random_uuid(),
  taller_id    uuid not null references public.taller (id) on delete cascade,
  proveedor_id uuid references public.proveedor (id) on delete set null,
  comprobante  text,   -- nro de remito o factura
  fecha        date not null default current_date,
  total        numeric(12,2) not null default 0,
  notas        text,
  creado_por   uuid references public.perfil (user_id) on delete set null,
  creado_en    timestamptz not null default now()
);

create index compra_taller_fecha_idx on public.compra (taller_id, fecha desc);

create table public.compra_item (
  id             uuid primary key default gen_random_uuid(),
  taller_id      uuid not null references public.taller (id) on delete cascade,
  compra_id      uuid not null references public.compra (id) on delete cascade,
  producto_id    uuid not null references public.producto (id) on delete restrict,
  cantidad       numeric(12,3) not null check (cantidad > 0),
  costo_unitario numeric(12,2) not null check (costo_unitario >= 0),
  subtotal       numeric(12,2) generated always as (
    round(cantidad * costo_unitario, 2)
  ) stored
);

create index compra_item_compra_idx on public.compra_item (compra_id);

-- ---------------------------------------------------------------------------
-- Movimientos de stock — el libro
-- ---------------------------------------------------------------------------

create type public.tipo_movimiento as enum (
  'compra',
  'consumo',      -- se cargó en una OT
  'devolucion',
  'ajuste',       -- conteo físico, rotura, faltante
  'inicial'
);

create table public.movimiento_stock (
  id             uuid primary key default gen_random_uuid(),
  taller_id      uuid not null references public.taller (id) on delete cascade,
  producto_id    uuid not null references public.producto (id) on delete restrict,
  tipo           public.tipo_movimiento not null,
  -- Con signo: positivo entra, negativo sale. Nunca cero.
  cantidad       numeric(12,3) not null check (cantidad <> 0),
  -- Costo del momento, congelado. No se recalcula nunca.
  costo_unitario numeric(12,2) not null default 0 check (costo_unitario >= 0),
  ot_id          uuid references public.orden_trabajo (id) on delete set null,
  compra_id      uuid references public.compra (id) on delete set null,
  motivo         text,
  usuario_id     uuid references public.perfil (user_id) on delete set null,
  creado_en      timestamptz not null default now()
);

create index movimiento_producto_idx on public.movimiento_stock (producto_id, creado_en desc);
create index movimiento_taller_fecha_idx on public.movimiento_stock (taller_id, creado_en desc);
create index movimiento_ot_idx on public.movimiento_stock (ot_id) where ot_id is not null;

-- ---------------------------------------------------------------------------
-- Mantenimiento del saldo
--
-- Se aplica el delta en lugar de recalcular todo el ledger: recalcular es
-- O(n) por movimiento y con miles de movimientos por producto se nota.
-- La contrapartida es que el saldo podría derivar si algo se rompe, por eso
-- existe verificar_saldos_stock() más abajo.
-- ---------------------------------------------------------------------------

create or replace function public.aplicar_movimiento_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.producto set stock = stock + new.cantidad where id = new.producto_id;
  elsif tg_op = 'DELETE' then
    update public.producto set stock = stock - old.cantidad where id = old.producto_id;
  elsif tg_op = 'UPDATE' then
    if old.producto_id <> new.producto_id then
      update public.producto set stock = stock - old.cantidad where id = old.producto_id;
      update public.producto set stock = stock + new.cantidad where id = new.producto_id;
    elsif old.cantidad <> new.cantidad then
      update public.producto set stock = stock + (new.cantidad - old.cantidad)
      where id = new.producto_id;
    end if;
  end if;
  return null;
end;
$$;

create trigger movimiento_stock_saldo_aiud
  after insert or update or delete on public.movimiento_stock
  for each row execute function public.aplicar_movimiento_stock();

-- Auditoría: devuelve los productos cuyo saldo no coincide con el ledger.
-- En condiciones normales tiene que dar 0 filas. Es la verificación que
-- respalda "saldo del ledger = stock mostrado, siempre".
create or replace function public.verificar_saldos_stock()
returns table (producto_id uuid, nombre text, stock_guardado numeric, stock_ledger numeric)
language sql
stable
set search_path = public, pg_temp
as $$
  select p.id, p.nombre, p.stock, coalesce(sum(m.cantidad), 0)
  from public.producto p
  left join public.movimiento_stock m on m.producto_id = p.id
  group by p.id, p.nombre, p.stock
  having p.stock <> coalesce(sum(m.cantidad), 0);
$$;
