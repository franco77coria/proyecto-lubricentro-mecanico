-- ============================================================================
-- 0027 — Que una compra entre al stock, y que su total se calcule solo
--
-- `compra` y `compra_item` existían desde 0005 sin nada que las escribiera y,
-- lo más importante, sin nada que conectara el remito con el inventario:
-- cargar una compra no aumentaba el stock. Faltaba la contraparte de 0014.
--
-- Va como trigger por el mismo motivo que el consumo: así entra al stock por
-- cualquier vía que cargue un ítem de compra (esta app, una importación de
-- remitos, una corrección a mano) y no depende de que cada pantalla se
-- acuerde. Es la misma decisión que ya se tomó para los totales de la orden,
-- el número de OT y el consumo.
--
-- Efecto colateral bueno: con la compra registrando el costo real,
-- `costo_actual_producto` (0025) empieza a devolver algo verdadero y el margen
-- de `ot_costos` deja de ser una estimación.
-- ============================================================================

-- Vínculo preciso, para poder revertir el movimiento de UN ítem sin tocar los
-- demás de la misma compra. Mismo criterio que `ot_item_id` en 0014.
alter table public.movimiento_stock
  add column compra_item_id uuid references public.compra_item (id) on delete cascade;

create index movimiento_compra_item_idx
  on public.movimiento_stock (compra_item_id)
  where compra_item_id is not null;

create or replace function public.sincronizar_ingreso_compra()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.movimiento_stock
      (taller_id, producto_id, tipo, cantidad, costo_unitario, compra_id, compra_item_id, motivo)
    values
      (new.taller_id, new.producto_id, 'compra', new.cantidad, new.costo_unitario,
       new.compra_id, new.id, 'Ingreso por compra');
    return new;
  end if;

  if tg_op = 'DELETE' then
    -- El movimiento se va por la cascada de `compra_item_id` y el trigger del
    -- ledger descuenta el saldo solo.
    return old;
  end if;

  -- UPDATE: si cambió algo que afecta al inventario, se rehace el movimiento.
  if new.producto_id is distinct from old.producto_id
     or new.cantidad is distinct from old.cantidad
     or new.costo_unitario is distinct from old.costo_unitario then

    delete from public.movimiento_stock where compra_item_id = new.id;

    insert into public.movimiento_stock
      (taller_id, producto_id, tipo, cantidad, costo_unitario, compra_id, compra_item_id, motivo)
    values
      (new.taller_id, new.producto_id, 'compra', new.cantidad, new.costo_unitario,
       new.compra_id, new.id, 'Ingreso por compra (corregido)');
  end if;

  return new;
end;
$$;

create trigger compra_item_stock_aiud
  after insert or update or delete on public.compra_item
  for each row execute function public.sincronizar_ingreso_compra();

-- ---------------------------------------------------------------------------
-- Total de la compra
--
-- Se calcula en la base y no en la app, igual que el total de la orden: así el
-- número es el mismo en la pantalla, en el reporte y en cualquier consulta
-- suelta, sin depender de que quien escribió la pantalla se acordara de sumar.
-- ---------------------------------------------------------------------------

create or replace function public.recalcular_total_compra()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_compra uuid := coalesce(new.compra_id, old.compra_id);
begin
  update public.compra c
     set total = coalesce((
           select sum(i.subtotal) from public.compra_item i where i.compra_id = v_compra
         ), 0)
   where c.id = v_compra;
  return null;
end;
$$;

create trigger compra_item_total_aiud
  after insert or update or delete on public.compra_item
  for each row execute function public.recalcular_total_compra();

-- La app no escribe el total: lo mantiene el trigger.
revoke update (total) on public.compra from authenticated;
