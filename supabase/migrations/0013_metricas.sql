-- ============================================================================
-- 0013 — Métricas del taller
--
-- Van por función y no por consulta directa porque el margen necesita
-- `costo_unitario`, que está cerrado por privilegios para todos los usuarios
-- de la app. La función corre como owner y valida el rol adentro: es la misma
-- puerta única que usa ot_costos, en vez de abrir la columna.
-- ============================================================================

create or replace function public.metricas_taller(
  p_desde date default (current_date - interval '6 months')::date,
  p_hasta date default current_date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_taller  uuid := public.taller_actual();
  v_resumen jsonb;
  v_meses   jsonb;
  v_top     jsonb;
begin
  if v_taller is null then
    raise exception 'Sin taller activo' using errcode = 'insufficient_privilege';
  end if;

  -- La plata es del dueño. El mostrador cobra pero no ve márgenes, y el
  -- mecánico no ve precios en absoluto.
  if not public.es_dueno() then
    raise exception 'Solo el dueño accede a los reportes'
      using errcode = 'insufficient_privilege';
  end if;

  -- Resumen del período. Solo cuentan las órdenes efectivamente entregadas o
  -- cerradas: un presupuesto sin aprobar no es facturación.
  select jsonb_build_object(
    'ordenes',        count(*),
    'facturado',      coalesce(sum(o.total), 0),
    'mano_obra',      coalesce(sum(o.total_mano_obra), 0),
    'repuestos',      coalesce(sum(o.total_repuestos), 0),
    'ticket_promedio', case when count(*) = 0 then 0
                       else round(coalesce(sum(o.total), 0) / count(*), 2) end
  )
  into v_resumen
  from public.orden_trabajo o
  where o.taller_id = v_taller
    and o.estado in ('entregado', 'cerrado')
    and o.fecha_ingreso >= p_desde
    and o.fecha_ingreso < (p_hasta + 1);

  -- Costo de los repuestos consumidos, para el margen real. Sale de los ítems
  -- y no del precio actual del producto: el costo quedó congelado al cargarlo.
  select v_resumen || jsonb_build_object(
    'costo_repuestos', coalesce(sum(i.costo_unitario * i.cantidad), 0)
  )
  into v_resumen
  from public.ot_item i
  join public.orden_trabajo o on o.id = i.ot_id
  where o.taller_id = v_taller
    and o.estado in ('entregado', 'cerrado')
    and o.fecha_ingreso >= p_desde
    and o.fecha_ingreso < (p_hasta + 1);

  -- Serie por mes, para ver la tendencia.
  select coalesce(jsonb_agg(m order by m->>'mes'), '[]'::jsonb)
  into v_meses
  from (
    select jsonb_build_object(
      'mes',       to_char(date_trunc('month', o.fecha_ingreso), 'YYYY-MM'),
      'facturado', sum(o.total),
      'ordenes',   count(*)
    ) as m
    from public.orden_trabajo o
    where o.taller_id = v_taller
      and o.estado in ('entregado', 'cerrado')
      and o.fecha_ingreso >= p_desde
      and o.fecha_ingreso < (p_hasta + 1)
    group by date_trunc('month', o.fecha_ingreso)
  ) s;

  -- Qué se vende más. Agrupado por descripción porque un mismo trabajo puede
  -- no estar ligado a un producto del catálogo.
  select coalesce(jsonb_agg(t order by (t->>'total')::numeric desc), '[]'::jsonb)
  into v_top
  from (
    select jsonb_build_object(
      'descripcion', i.descripcion,
      'tipo',        i.tipo,
      'veces',       count(*),
      'total',       sum(i.subtotal)
    ) as t
    from public.ot_item i
    join public.orden_trabajo o on o.id = i.ot_id
    where o.taller_id = v_taller
      and o.estado in ('entregado', 'cerrado')
      and o.fecha_ingreso >= p_desde
      and o.fecha_ingreso < (p_hasta + 1)
    group by i.descripcion, i.tipo
    order by sum(i.subtotal) desc
    limit 8
  ) s;

  return jsonb_build_object(
    'resumen', v_resumen,
    'meses',   v_meses,
    'top',     v_top
  );
end;
$$;

revoke execute on function public.metricas_taller(date, date) from public, anon;
grant execute on function public.metricas_taller(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Tiempo que pasa un auto en el taller
--
-- Sale del log de estados, que ya se escribe solo en cada cambio. Se mide
-- desde que se recibe hasta que queda listo: antes es presupuesto y después
-- depende de cuándo pase el cliente a buscarlo, que no es responsabilidad
-- del taller.
-- ---------------------------------------------------------------------------

create or replace function public.tiempo_promedio_taller(
  p_desde date default (current_date - interval '6 months')::date
)
returns numeric
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_taller uuid := public.taller_actual();
  v_horas  numeric;
begin
  if v_taller is null or not public.es_dueno() then
    raise exception 'Solo el dueño accede a los reportes'
      using errcode = 'insufficient_privilege';
  end if;

  select round(avg(extract(epoch from (fin.creado_en - ini.creado_en)) / 3600)::numeric, 1)
  into v_horas
  from public.ot_estado_log ini
  join public.ot_estado_log fin
    on fin.ot_id = ini.ot_id
   and fin.estado_nuevo = 'listo'
  where ini.taller_id = v_taller
    and ini.estado_nuevo = 'recibido'
    and ini.creado_en >= p_desde
    and fin.creado_en > ini.creado_en;

  return coalesce(v_horas, 0);
end;
$$;

revoke execute on function public.tiempo_promedio_taller(date) from public, anon;
grant execute on function public.tiempo_promedio_taller(date) to authenticated;
