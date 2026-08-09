-- ============================================================================
-- 0025 — Costo actual de un producto, para que el margen sea real
--
-- Contexto: al cargar un repuesto en una orden, `ot_item.costo_unitario` se
-- guardaba siempre en 0 porque la pantalla lo manda así. Con costo 0 el margen
-- que reporta `ot_costos()` es igual al precio de venta, o sea que el reporte
-- de rentabilidad miente.
--
-- El costo NO puede leerlo el cliente: 0007 revocó el SELECT de
-- `movimiento_stock.costo_unitario` para `authenticated`, y con razón — el
-- mecánico no tiene por qué ver a cuánto compró el dueño. Y como el Server
-- Action también corre como `authenticated`, tampoco lo puede leer por la
-- tabla.
--
-- Por eso esta función es SECURITY DEFINER: es la única puerta, valida el
-- taller adentro, y devuelve un solo número sin exponer el historial de
-- compras. No lleva guarda de rol a propósito (a diferencia de `ot_costos`):
-- no revela nada al usuario, la usa el servidor para grabar el costo del ítem
-- que se está cargando.
--
-- Se toma el costo de la última ENTRADA (cantidad > 0: compras y ajustes de
-- alta). No un promedio ponderado: en un país con esta inflación, el costo que
-- importa para saber si un trabajo dejó plata es el de reponer lo que se usó,
-- que es el último que se pagó.
-- ============================================================================

create or replace function public.costo_actual_producto(p_producto uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_costo numeric;
begin
  select m.costo_unitario
    into v_costo
  from public.movimiento_stock m
  join public.producto p on p.id = m.producto_id
  where m.producto_id = p_producto
    -- El chequeo de taller va acá adentro: la función saltea RLS, así que sin
    -- esto cualquiera podría preguntar el costo de un producto de otro taller.
    and p.taller_id = public.taller_actual()
    and m.cantidad > 0
    and m.costo_unitario > 0
  order by m.creado_en desc
  limit 1;

  return coalesce(v_costo, 0);
end;
$$;

revoke execute on function public.costo_actual_producto(uuid) from anon, public;
grant execute on function public.costo_actual_producto(uuid) to authenticated;
