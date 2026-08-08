-- ============================================================================
-- 0017 — Anulación de órdenes
--
-- El estado 'anulado' existía desde el principio pero nadie lo usaba, y
-- ponerlo con un UPDATE suelto habría dejado el sistema inconsistente: los
-- repuestos cargados en esa orden quedaban consumidos para siempre y el stock
-- nunca los recuperaba.
--
-- Va como función y no como Server Action para que sea atómico: o se anula la
-- orden Y vuelve el stock, o no pasa nada. A mitad de camino es peor que no
-- haber empezado.
-- ============================================================================

alter table public.orden_trabajo
  add column if not exists motivo_anulacion text,
  add column if not exists anulada_en timestamptz;

create or replace function public.anular_orden(p_ot uuid, p_motivo text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_taller    uuid := public.taller_actual();
  v_ot        public.orden_trabajo;
  v_pagos     numeric;
  v_devueltos integer := 0;
begin
  if v_taller is null then
    raise exception 'Sesión requerida' using errcode = 'insufficient_privilege';
  end if;

  -- El mecánico carga trabajo, no anula órdenes: anular mueve stock y borra
  -- facturación del período.
  if public.rol_actual() not in ('dueno', 'mostrador') then
    raise exception 'No tenés permiso para anular órdenes'
      using errcode = 'insufficient_privilege';
  end if;

  if length(coalesce(trim(p_motivo), '')) < 4 then
    raise exception 'Escribí el motivo de la anulación';
  end if;

  select * into v_ot
  from public.orden_trabajo
  where id = p_ot and taller_id = v_taller;

  if v_ot.id is null then
    raise exception 'La orden no existe';
  end if;

  if v_ot.estado = 'anulado' then
    return jsonb_build_object('ok', true, 'devueltos', 0, 'nota', 'ya estaba anulada');
  end if;

  -- Con plata cobrada, anular dejaría un pago sin orden que lo respalde. Se
  -- frena acá en lugar de arrastrar el descuadre a la caja.
  select coalesce(sum(monto), 0) into v_pagos from public.pago where ot_id = p_ot;
  if v_pagos > 0 then
    raise exception 'La orden tiene % cobrado. Quitá los pagos antes de anularla.',
      to_char(v_pagos, 'FM999G999G999D00');
  end if;

  -- Devolución al depósito: un movimiento nuevo en lugar de borrar el
  -- consumo. El histórico tiene que mostrar que algo entró y volvió a salir,
  -- no que nunca pasó.
  insert into public.movimiento_stock
    (taller_id, producto_id, tipo, cantidad, costo_unitario, ot_id, ot_item_id, motivo)
  select
    m.taller_id, m.producto_id, 'devolucion', -m.cantidad, m.costo_unitario,
    m.ot_id, m.ot_item_id, 'Devolución por anulación de la orden'
  from public.movimiento_stock m
  where m.ot_id = p_ot
    and m.tipo = 'consumo';

  get diagnostics v_devueltos = row_count;

  update public.orden_trabajo
  set estado = 'anulado',
      motivo_anulacion = trim(p_motivo),
      anulada_en = now()
  where id = p_ot;

  return jsonb_build_object('ok', true, 'devueltos', v_devueltos);
end;
$$;

revoke execute on function public.anular_orden(uuid, text) from anon;
grant execute on function public.anular_orden(uuid, text) to authenticated;

-- Una orden anulada no se sigue editando: sus ítems ya no representan trabajo
-- real y tocarlos volvería a mover el stock que se acaba de devolver.
create or replace function public.bloquear_edicion_anulada()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_estado public.estado_ot;
begin
  select estado into v_estado
  from public.orden_trabajo
  where id = coalesce(new.ot_id, old.ot_id);

  if v_estado = 'anulado' then
    raise exception 'La orden está anulada y no admite cambios'
      using errcode = 'insufficient_privilege';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger ot_item_anulada_biud
  before insert or update or delete on public.ot_item
  for each row execute function public.bloquear_edicion_anulada();
