-- ============================================================================
-- 0014 — Descontar stock al cargar un repuesto en una orden
--
-- Faltaba por completo: `ot_item` guardaba el producto_id pero nunca se creaba
-- el movimiento, así que el stock no bajaba nunca. El inventario mostraba
-- siempre las cantidades de la última compra, el aviso de "bajo mínimo" no se
-- disparaba jamás y el control de stock no servía para nada.
--
-- Va como trigger y no en el Server Action a propósito: así el descuento
-- ocurre por cualquier vía que cargue un ítem (la app de hoy, una importación,
-- una corrección a mano) y no depende de que cada pantalla se acuerde. Es la
-- misma decisión que ya se tomó para los totales y para el número de orden.
-- ============================================================================

-- Vínculo con el ítem que lo originó, para poder revertirlo con precisión.
-- Con solo ot_id no se podría distinguir el movimiento de un ítem del de otro
-- dentro de la misma orden.
alter table public.movimiento_stock
  add column if not exists ot_item_id uuid references public.ot_item (id) on delete cascade;

create index if not exists movimiento_ot_item_idx
  on public.movimiento_stock (ot_item_id)
  where ot_item_id is not null;

create or replace function public.sincronizar_consumo_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Solo lo que sale del depósito. La mano de obra, los servicios y lo que se
  -- manda a un tercero no tienen existencias que mover.
  v_consume boolean := coalesce(new.tipo, old.tipo) in ('repuesto', 'insumo');
begin
  if tg_op = 'INSERT' then
    if new.producto_id is not null and v_consume then
      insert into public.movimiento_stock
        (taller_id, producto_id, tipo, cantidad, costo_unitario, ot_id, ot_item_id, motivo)
      values
        (new.taller_id, new.producto_id, 'consumo', -new.cantidad, new.costo_unitario,
         new.ot_id, new.id, 'Consumo en orden de trabajo');
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    -- El movimiento cae por la cascada de ot_item_id, y el trigger del ledger
    -- devuelve el saldo solo. No hace falta hacer nada acá.
    return old;
  end if;

  -- UPDATE: si cambió el producto o la cantidad, se rehace el movimiento.
  if new.producto_id is distinct from old.producto_id
     or new.cantidad is distinct from old.cantidad
     or new.tipo is distinct from old.tipo then

    delete from public.movimiento_stock where ot_item_id = new.id;

    if new.producto_id is not null and new.tipo in ('repuesto', 'insumo') then
      insert into public.movimiento_stock
        (taller_id, producto_id, tipo, cantidad, costo_unitario, ot_id, ot_item_id, motivo)
      values
        (new.taller_id, new.producto_id, 'consumo', -new.cantidad, new.costo_unitario,
         new.ot_id, new.id, 'Consumo en orden de trabajo');
    end if;
  end if;

  return new;
end;
$$;

create trigger ot_item_consumo_stock
  after insert or update or delete on public.ot_item
  for each row execute function public.sincronizar_consumo_stock();

-- ---------------------------------------------------------------------------
-- Precio y costo sugeridos al elegir un producto
--
-- Sin esto el mostrador tiene que acordarse del precio de cada repuesto y
-- tipearlo a mano en cada orden, que es la vía más rápida a cobrar de menos.
-- El costo se toma de la última compra: es el que corresponde para el margen.
-- ---------------------------------------------------------------------------

create or replace function public.precio_sugerido_producto(p_producto uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'precio_venta', p.precio_venta,
    'costo', coalesce(
      (select m.costo_unitario
       from public.movimiento_stock m
       where m.producto_id = p.id and m.cantidad > 0 and m.costo_unitario > 0
       order by m.creado_en desc
       limit 1),
      0
    ),
    'stock', p.stock,
    'unidad', p.unidad
  )
  from public.producto p
  where p.id = p_producto
    and p.taller_id = public.taller_actual();
$$;

revoke execute on function public.precio_sugerido_producto(uuid) from anon;
grant execute on function public.precio_sugerido_producto(uuid) to authenticated;
