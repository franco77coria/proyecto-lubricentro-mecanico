-- ============================================================================
-- 0037 — Live Tracker para Seguimiento Público y Correcciones de Stock
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Actualizar seguimiento_por_token para incluir fotos y telemetría
-- ---------------------------------------------------------------------------

create or replace function public.seguimiento_por_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_ot     record;
  v_result jsonb;
begin
  if p_token is null or length(p_token) < 20 then
    return null;
  end if;

  select o.id, o.numero, o.estado, o.fecha_ingreso, o.fecha_entrega,
         o.total, o.total_mano_obra, o.total_repuestos,
         o.aprobado_cliente_en, o.token_expira_en,
         v.patente, ma.nombre as marca, mo.nombre as modelo,
         t.nombre as taller, t.telefono as taller_telefono, t.direccion as taller_direccion,
         r.km as recepcion_km, r.combustible as recepcion_combustible
    into v_ot
  from public.orden_trabajo o
  join public.vehiculo v on v.id = o.vehiculo_id
  join public.taller t   on t.id = o.taller_id
  left join public.ot_recepcion r on r.ot_id = o.id
  left join public.marca ma on ma.id = v.marca_id
  left join public.modelo mo on mo.id = v.modelo_id
  where o.token_publico = p_token
    and (o.token_expira_en is null or o.token_expira_en > now());

  if v_ot.id is null then
    return null;
  end if;

  select jsonb_build_object(
    'numero', v_ot.numero,
    'estado', v_ot.estado,
    'fecha_ingreso', v_ot.fecha_ingreso,
    'fecha_entrega', v_ot.fecha_entrega,
    'patente', v_ot.patente,
    'vehiculo', nullif(trim(concat_ws(' ', v_ot.marca, v_ot.modelo)), ''),
    'total', v_ot.total,
    'total_mano_obra', v_ot.total_mano_obra,
    'total_repuestos', v_ot.total_repuestos,
    'aprobado_en', v_ot.aprobado_cliente_en,
    'taller', jsonb_build_object(
      'nombre', v_ot.taller,
      'telefono', v_ot.taller_telefono,
      'direccion', v_ot.taller_direccion
    ),
    'telemetria', jsonb_build_object(
      'km', v_ot.recepcion_km,
      'combustible', v_ot.recepcion_combustible
    ),
    'notas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'tipo', n.tipo, 'texto', n.texto,
               'precio', n.precio_estimado, 'fecha', n.creado_en
             ) order by n.creado_en)
      from public.ot_nota n
      where n.ot_id = v_ot.id and n.visible_cliente
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'descripcion', i.descripcion, 'tipo', i.tipo,
               'cantidad', i.cantidad, 'subtotal', i.subtotal
             ) order by i.orden, i.creado_en)
      from public.ot_item i
      where i.ot_id = v_ot.id
    ), '[]'::jsonb),
    'fotos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', f.id,
               'tipo', f.tipo,
               'path', f.path,
               'nota', f.nota,
               'creado_en', f.creado_en
             ) order by f.orden, f.creado_en)
      from public.ot_foto f
      where f.ot_id = v_ot.id and f.tipo in ('estado_ingreso', 'dano', 'comprobante')
    ), '[]'::jsonb),
    'historial', coalesce((
      select jsonb_agg(jsonb_build_object(
               'estado', l.estado_nuevo, 'fecha', l.creado_en
             ) order by l.creado_en)
      from public.ot_estado_log l
      where l.ot_id = v_ot.id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.seguimiento_por_token(text) from public;
grant  execute on function public.seguimiento_por_token(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Corrección del consumo de stock en presupuestos preliminares
-- ---------------------------------------------------------------------------

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
        (new.taller_id, new.producto_id, 'consumo', -new.cantidad, new.costo_unitario,
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
        (new.taller_id, new.producto_id, 'consumo', -new.cantidad, new.costo_unitario,
         new.ot_id, new.id, 'Consumo en orden de trabajo');
    end if;
  end if;

  return new;
end;
$$;

-- Trigger para consumir stock cuando una orden pasa de presupuesto a aprobado/trabajo
create or replace function public.procesar_cambio_estado_ot_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item record;
begin
  -- Si pasa de presupuesto a un estado activo, consumir ítems
  if old.estado = 'presupuesto' and new.estado not in ('presupuesto', 'anulado') then
    for v_item in select * from public.ot_item where ot_id = new.id and producto_id is not null and tipo in ('repuesto', 'insumo') loop
      -- Evitar duplicar si ya existiera
      if not exists (select 1 from public.movimiento_stock where ot_item_id = v_item.id) then
        insert into public.movimiento_stock
          (taller_id, producto_id, tipo, cantidad, costo_unitario, ot_id, ot_item_id, motivo)
        values
          (v_item.taller_id, v_item.producto_id, 'consumo', -v_item.cantidad, v_item.costo_unitario,
           new.id, v_item.id, 'Consumo al aprobar orden de trabajo');
      end if;
    end loop;
  end if;

  -- Si se anula, limpiar movimientos de stock de esa orden
  if new.estado = 'anulado' and old.estado <> 'anulado' then
    delete from public.movimiento_stock where ot_id = new.id and tipo = 'consumo';
  end if;

  return new;
end;
$$;

drop trigger if exists ot_cambio_estado_stock on public.orden_trabajo;
create trigger ot_cambio_estado_stock
  after update of estado on public.orden_trabajo
  for each row execute function public.procesar_cambio_estado_ot_stock();
