-- ============================================================================
-- 0045_fix_sincronizar_consumo_stock.sql
-- Restaura sincronizar_consumo_stock() a los valores válidos del enum tipo_movimiento:
-- ('compra', 'consumo', 'devolucion', 'ajuste', 'inicial').
-- La migración 0040 había introducido por error 'consumo_ot' y 'ajuste_positivo'
-- que rompían cualquier inserción de ítem en OT con producto asociado.
-- ============================================================================

create or replace function public.sincronizar_consumo_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_estado  public.estado_ot;
  v_consume boolean := coalesce(new.tipo, old.tipo) in ('repuesto', 'insumo');
begin
  if tg_op = 'INSERT' then
    select estado into v_estado from public.orden_trabajo where id = new.ot_id;
    
    -- No consumir stock si la orden está en borrador o presupuesto no aprobado
    if v_estado not in ('presupuesto', 'anulado') and new.producto_id is not null and v_consume then
      insert into public.movimiento_stock
        (taller_id, producto_id, tipo, cantidad, costo_unitario, ot_id, ot_item_id, motivo)
      values
        (new.taller_id, new.producto_id, 'consumo', -new.cantidad, coalesce(new.costo_unitario, 0),
         new.ot_id, new.id, 'Consumo en orden de trabajo');
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.producto_id is distinct from old.producto_id
     or new.cantidad is distinct from old.cantidad
     or new.tipo is distinct from old.tipo then

    delete from public.movimiento_stock where ot_item_id = new.id;

    select estado into v_estado from public.orden_trabajo where id = new.ot_id;

    if v_estado not in ('presupuesto', 'anulado') and new.producto_id is not null and new.tipo in ('repuesto', 'insumo') then
      insert into public.movimiento_stock
        (taller_id, producto_id, tipo, cantidad, costo_unitario, ot_id, ot_item_id, motivo)
      values
        (new.taller_id, new.producto_id, 'consumo', -new.cantidad, coalesce(new.costo_unitario, 0),
         new.ot_id, new.id, 'Consumo en orden de trabajo');
    end if;
  end if;

  return new;
end;
$$;
