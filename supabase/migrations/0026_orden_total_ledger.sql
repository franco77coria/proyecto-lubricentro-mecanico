-- ============================================================================
-- 0026 — Orden total del ledger de stock
--
-- Bug encontrado al verificar `costo_actual_producto` (0025): devolvía el costo
-- de la compra VIEJA en vez de la última.
--
-- La causa: ordenaba por `creado_en desc`, y `creado_en` tiene default `now()`,
-- que en Postgres es el timestamp de la TRANSACCIÓN, no del statement. Dos
-- movimientos insertados en la misma transacción quedan con el mismo valor al
-- microsegundo, el `order by` empata y el desempate es arbitrario. No es un
-- caso raro: una compra con varios ítems inserta todos sus movimientos en una
-- sola transacción.
--
-- Y falla en silencio, que es lo peor: devuelve un número plausible. Un costo
-- viejo en un país con esta inflación no es un detalle — es la diferencia entre
-- creer que un trabajo dejó plata y que no.
--
-- El arreglo correcto para un libro de movimientos es tener un orden total, no
-- un timestamp que puede empatar. `secuencia` es monótona y única por
-- definición, así que "el último movimiento" deja de ser ambiguo.
-- ============================================================================

alter table public.movimiento_stock
  add column secuencia bigint generated always as identity;

-- Único por definición, pero el índice es lo que hace que "el último de este
-- producto" no tenga que ordenar toda la tabla.
create index movimiento_producto_secuencia_idx
  on public.movimiento_stock (producto_id, secuencia desc);

-- La app no la escribe: la asigna Postgres. `generated always` ya lo impide,
-- pero se explicita para que quede en los privilegios y no dependa de eso.
revoke insert (secuencia), update (secuencia) on public.movimiento_stock from authenticated;

-- ---------------------------------------------------------------------------
-- Y ahora sí, el último costo pagado, sin ambigüedad
-- ---------------------------------------------------------------------------

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
    -- El chequeo de taller va adentro: la función saltea RLS, así que sin esto
    -- se podría preguntar el costo de un producto de otro taller.
    and p.taller_id = public.taller_actual()
    and m.cantidad > 0
    and m.costo_unitario > 0
  order by m.secuencia desc
  limit 1;

  return coalesce(v_costo, 0);
end;
$$;
