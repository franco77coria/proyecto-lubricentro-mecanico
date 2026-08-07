-- ============================================================================
-- 0010 — Cerrar de verdad la escritura sobre producto.stock
--
-- En 0007 quedó como `revoke update (stock) ... from authenticated`, que NO
-- surte efecto: Supabase concede privilegios a nivel TABLA
-- (grant all on all tables in schema public to anon, authenticated) y ese
-- grant cubre todas las columnas. Un revoke por columna no alcanza a
-- perforarlo, y lo peor es que no falla: se aplica en silencio y parece
-- resuelto.
--
-- El orden correcto es al revés: sacar el permiso amplio primero y después
-- devolver solo las columnas permitidas.
-- ============================================================================

revoke update on public.producto from authenticated;

-- Todo lo editable desde la app. Fuera quedan:
--   stock       — lo escribe el trigger del ledger, nunca la app
--   bajo_stock  — columna generada, no admite UPDATE
--   id, taller_id, creado_en — inmutables
grant update (
  sku, nombre, marca, categoria, unidad, ubicacion,
  stock_min, precio_venta, activo
) on public.producto to authenticated;

-- Defensa en profundidad: los grants se pueden volver a abrir por accidente
-- en una migración futura (es exactamente lo que pasó acá). Esto no depende
-- de ellos.
--
-- Se compara current_user y NO current_setting('role'): el trigger del ledger
-- (aplicar_movimiento_stock) es SECURITY DEFINER, así que corre con
-- current_user = owner, pero la variable de sesión `role` sigue valiendo
-- 'authenticated'. Mirando `role` este guard bloquearía al propio ledger.
create or replace function public.bloquear_escritura_de_stock()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.stock is distinct from old.stock
     and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'El stock se mueve con movimiento_stock, no editando el producto'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger producto_stock_bu
  before update on public.producto
  for each row execute function public.bloquear_escritura_de_stock();
