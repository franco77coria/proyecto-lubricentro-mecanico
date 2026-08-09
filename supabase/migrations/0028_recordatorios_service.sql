-- ============================================================================
-- 0028 — Agendar el próximo service al entregar el auto
--
-- `recordatorio` existía desde 0006 con sus índices y no había una sola línea
-- que la escribiera. Un lubricentro vive de que el cliente vuelva: sin esto,
-- que vuelva depende de que se acuerde solo.
--
-- Se agenda al pasar a entregado/cerrado y solo para los trabajos de
-- lubricentro o mixtos. NO se intenta adivinar si "hubo cambio de aceite"
-- mirando las descripciones de los ítems: el mostrador ya declaró el tipo de
-- orden al recibir el auto, y un `ilike '%aceite%'` sobre texto libre falla en
-- los dos sentidos (no encuentra "cambio de lubricante" y sí encuentra "revisar
-- pérdida de aceite", que no es un service).
--
-- El objetivo es por km Y por fecha, lo que llegue primero: un remis hace los
-- 10.000 en dos meses y un auto de fin de semana tarda dos años.
--
-- Los intervalos salen de `taller.config` para que cada taller use su criterio,
-- con default 10.000 km / 6 meses.
-- ============================================================================

create or replace function public.agendar_recordatorio_service()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_config     jsonb;
  v_km_interv  integer;
  v_meses      integer;
  v_km_base    integer;
begin
  if new.tipo not in ('lubricentro', 'mixto') then
    return new;
  end if;

  select config into v_config from public.taller where id = new.taller_id;

  -- `nullif` sobre el texto: una clave presente pero vacía tiene que caer al
  -- default en vez de romper el cast.
  v_km_interv := coalesce(nullif(v_config ->> 'km_service', '')::integer, 10000);
  v_meses     := coalesce(nullif(v_config ->> 'meses_service', '')::integer, 6);

  -- El auto volvió, así que lo que estaba agendado ya se cumplió. Sin esto se
  -- acumulan avisos viejos y la lista de "a contactar" se vuelve inservible.
  update public.recordatorio
     set estado = 'cumplido'
   where vehiculo_id = new.vehiculo_id
     and estado = 'pendiente';

  -- El km de la orden es más confiable que el del vehículo: es el que se leyó
  -- del odómetro al recibirlo.
  v_km_base := coalesce(new.km_ingreso, (select km_actual from public.vehiculo where id = new.vehiculo_id));

  insert into public.recordatorio
    (taller_id, vehiculo_id, ot_origen_id, tipo, km_objetivo, fecha_objetivo)
  values
    (new.taller_id, new.vehiculo_id, new.id, 'aceite',
     case when v_km_base is not null then v_km_base + v_km_interv end,
     (current_date + (v_meses || ' months')::interval)::date);

  return new;
end;
$$;

-- Solo en la transición, no en cada update: sin `when` un cambio de
-- observaciones sobre una orden ya entregada agendaría un recordatorio nuevo.
create trigger orden_trabajo_recordatorio_au
  after update of estado on public.orden_trabajo
  for each row
  when (new.estado in ('entregado', 'cerrado') and old.estado is distinct from new.estado)
  execute function public.agendar_recordatorio_service();

-- ---------------------------------------------------------------------------
-- A quién hay que contactar
--
-- Vive en la base porque el criterio "vencido por km O por fecha" mezcla una
-- comparación entre columnas de tablas distintas (km del vehículo contra km
-- objetivo) que PostgREST no puede expresar — y hacerlo en JS obligaría a
-- traerse todos los recordatorios para filtrar unos pocos (lección #40).
-- ---------------------------------------------------------------------------

create or replace function public.recordatorios_a_contactar(p_dias_antes integer default 15)
returns table (
  id            uuid,
  vehiculo_id   uuid,
  patente       text,
  descripcion   text,
  km_objetivo   integer,
  km_actual     integer,
  fecha_objetivo date,
  vence_por     text,
  cliente_nombre text,
  telefono      text
)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    r.id,
    v.id,
    v.patente,
    coalesce(nullif(trim(concat_ws(' ', ma.nombre, mo.nombre)), ''), 'Sin modelo'),
    r.km_objetivo,
    v.km_actual,
    r.fecha_objetivo,
    case
      when r.km_objetivo is not null and v.km_actual is not null
           and v.km_actual >= r.km_objetivo then 'km'
      else 'fecha'
    end,
    nullif(trim(concat_ws(' ', c.nombre, c.apellido)), ''),
    c.telefono
  from public.recordatorio r
  join public.vehiculo v on v.id = r.vehiculo_id
  left join public.marca ma on ma.id = v.marca_id
  left join public.modelo mo on mo.id = v.modelo_id
  -- El dueño vigente del auto, que es a quien hay que escribirle.
  left join public.vehiculo_cliente vc
         on vc.vehiculo_id = v.id and vc.hasta is null
  left join public.cliente c on c.id = vc.cliente_id
  where r.taller_id = public.taller_actual()
    and r.estado = 'pendiente'
    and (
      -- Ya pasó el km objetivo…
      (r.km_objetivo is not null and v.km_actual is not null and v.km_actual >= r.km_objetivo)
      -- …o la fecha está a la vuelta de la esquina.
      or (r.fecha_objetivo is not null
          and r.fecha_objetivo <= current_date + make_interval(days => p_dias_antes))
    )
  order by r.fecha_objetivo nulls last, v.patente;
$$;

revoke execute on function public.recordatorios_a_contactar(integer) from anon, public;
grant  execute on function public.recordatorios_a_contactar(integer) to authenticated;
