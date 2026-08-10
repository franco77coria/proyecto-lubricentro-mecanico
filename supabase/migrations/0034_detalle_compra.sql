-- ============================================================================
-- 0034 — Abrir un remito ya cargado para revisarlo línea por línea
--
-- Faltaba: se podía cargar una compra y ver su total, pero no volver a abrirla.
-- Un remito de doce renglones cargado a las apuradas no se podía chequear, y un
-- costo mal tipeado quedaba enterrado en el total sin forma de encontrarlo.
--
-- No se puede resolver con una consulta normal: `compra_item.costo_unitario` y
-- `subtotal` tienen el SELECT revocado para `authenticated` (0007, punto 7), y
-- el Server Action corre con ese mismo rol. Por la tabla no lo lee ni él.
--
-- Así que va por la misma puerta que los costos de una orden: SECURITY DEFINER
-- con la guarda adentro, calcada de `ot_costos`.
--
-- QUIÉN LO VE — y por qué no es solo el dueño, a diferencia de `ot_costos`:
-- el mostrador es quien TIPEA estos costos al cargar el remito, así que ya los
-- vio. Esconderlos cuando quiere verificar lo que acaba de escribir no protege
-- nada y le impide encontrar su propio error de tipeo. La guarda replica
-- exactamente quién puede escribir compras según la política de 0007
-- (`dueno` o `mostrador`), y deja afuera al mecánico, igual que la pantalla.
-- ============================================================================

create or replace function public.compra_detalle(p_compra uuid)
returns table (
  item_id        uuid,
  producto_id    uuid,
  producto       text,
  unidad         text,
  cantidad       numeric,
  costo_unitario numeric,
  subtotal       numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  -- `coalesce` sobre el rol y no `not in` pelado: sin sesión `rol_actual()` es
  -- null, `null not in (...)` también es null, y un `if null` no entra al
  -- branch — la función seguiría de largo y devolvería cero filas en vez de
  -- fallar. Con el coalesce, no tener sesión levanta excepción y se ve.
  if coalesce(public.rol_actual()::text, '') not in ('dueno', 'mostrador') then
    raise exception 'Solo el dueño y el mostrador ven los costos de un remito'
      using errcode = 'insufficient_privilege';
  end if;

  return query
  select i.id, i.producto_id, p.nombre, p.unidad, i.cantidad, i.costo_unitario, i.subtotal
  from public.compra_item i
  join public.compra c   on c.id = i.compra_id
  join public.producto p on p.id = i.producto_id
  -- El chequeo de taller va acá adentro: la función saltea RLS, así que sin
  -- esto se podría pedir el detalle de un remito de otro taller.
  where i.compra_id = p_compra
    and c.taller_id = public.taller_actual()
  order by p.nombre;
end;
$$;

revoke execute on function public.compra_detalle(uuid) from anon, public;
grant  execute on function public.compra_detalle(uuid) to authenticated;
