-- ============================================================================
-- 0029 — Aprobar lo que el mostrador cargó con OTROS
--
-- Desde 0021 el mostrador puede dar de alta marcas, modelos y motorizaciones
-- que no están, y quedan en `pendiente`. Faltaba el otro lado: no había forma
-- de aprobarlas, así que se acumulaban invisibles para siempre.
--
-- PROBLEMA DE FONDO que hay que resolver antes de la pantalla: el catálogo es
-- GLOBAL, lo comparten todos los talleres. Si cualquier dueño puede aprobar
-- cualquier pendiente, el taller A decide el catálogo que ve el taller B. Y
-- peor: hoy no se puede ni saber quién propuso qué, porque `marca` y `modelo`
-- no guardan de dónde vino la fila.
--
-- Por eso primero se agrega el origen y después las funciones de aprobación
-- solo alcanzan lo que el propio taller propuso. Lo que propuso otro taller
-- queda para un admin de la plataforma con `service_role`, que es quien tiene
-- la vista completa para decidir si "Ford Motor Company" y "Ford" son la misma
-- marca.
-- ============================================================================

alter table public.marca
  add column taller_origen_id uuid references public.taller (id) on delete set null;
alter table public.modelo
  add column taller_origen_id uuid references public.taller (id) on delete set null;
alter table public.motorizacion
  add column taller_origen_id uuid references public.taller (id) on delete set null;

create index marca_pendiente_origen_idx on public.marca (taller_origen_id)
  where estado = 'pendiente';
create index modelo_pendiente_origen_idx on public.modelo (taller_origen_id)
  where estado = 'pendiente';
create index motorizacion_pendiente_origen_idx on public.motorizacion (taller_origen_id)
  where estado = 'pendiente';

-- La app puede escribirlo solo al insertar (las políticas de 0007/0018 ya
-- limitan el insert a estado pendiente). No puede reasignar el origen después.
grant insert (taller_origen_id) on public.marca to authenticated;
grant insert (taller_origen_id) on public.modelo to authenticated;
grant insert (taller_origen_id) on public.motorizacion to authenticated;

-- ---------------------------------------------------------------------------
-- Las funciones de alta ahora dejan la huella del taller
-- ---------------------------------------------------------------------------

create or replace function public.proponer_marca(p_nombre text)
returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_norm text := public.normalizar(p_nombre);
  v_id   uuid;
begin
  if v_norm is null or length(v_norm) < 2 or length(v_norm) > 40 then
    raise exception 'Nombre de marca inválido' using errcode = 'check_violation';
  end if;

  select id into v_id from public.marca where nombre_norm = v_norm;
  if v_id is not null then return v_id; end if;

  insert into public.marca (nombre, origen, estado, taller_origen_id)
  values (trim(p_nombre), 'manual', 'pendiente', public.taller_actual())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.proponer_modelo(p_marca_id uuid, p_nombre text)
returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_norm text := public.normalizar(p_nombre);
  v_id   uuid;
begin
  if v_norm is null or length(v_norm) < 1 or length(v_norm) > 60 then
    raise exception 'Nombre de modelo inválido' using errcode = 'check_violation';
  end if;

  if not exists (select 1 from public.marca where id = p_marca_id) then
    raise exception 'La marca no existe' using errcode = 'foreign_key_violation';
  end if;

  select id into v_id
  from public.modelo
  where marca_id = p_marca_id and nombre_norm = v_norm;
  if v_id is not null then return v_id; end if;

  insert into public.modelo (marca_id, nombre, origen, estado, taller_origen_id)
  values (p_marca_id, trim(p_nombre), 'manual', 'pendiente', public.taller_actual())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.proponer_motorizacion(p_modelo_id uuid, p_nombre text)
returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_norm text := public.normalizar(p_nombre);
  v_id   uuid;
begin
  if v_norm is null or length(v_norm) < 1 or length(v_norm) > 60 then
    raise exception 'Nombre de motorización inválido' using errcode = 'check_violation';
  end if;

  if not exists (select 1 from public.modelo where id = p_modelo_id) then
    raise exception 'El modelo no existe' using errcode = 'foreign_key_violation';
  end if;

  select id into v_id
  from public.motorizacion
  where modelo_id = p_modelo_id and nombre_norm = v_norm;
  if v_id is not null then return v_id; end if;

  insert into public.motorizacion (modelo_id, nombre, origen, estado, taller_origen_id)
  values (p_modelo_id, trim(p_nombre), 'manual', 'pendiente', public.taller_actual())
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lo que el taller tiene para revisar
-- ---------------------------------------------------------------------------

create or replace function public.catalogo_pendiente()
returns table (
  nivel     text,
  id        uuid,
  nombre    text,
  contexto  text,
  creado_en timestamptz
)
language sql
stable
set search_path = public, pg_temp
as $$
  select 'marca', m.id, m.nombre, null::text, m.creado_en
  from public.marca m
  where m.estado = 'pendiente' and m.taller_origen_id = public.taller_actual()
  union all
  select 'modelo', mo.id, mo.nombre, ma.nombre, mo.creado_en
  from public.modelo mo
  join public.marca ma on ma.id = mo.marca_id
  where mo.estado = 'pendiente' and mo.taller_origen_id = public.taller_actual()
  union all
  select 'motorizacion', mt.id, mt.nombre,
         trim(concat_ws(' ', ma.nombre, mo.nombre)), mt.creado_en
  from public.motorizacion mt
  join public.modelo mo on mo.id = mt.modelo_id
  join public.marca ma on ma.id = mo.marca_id
  where mt.estado = 'pendiente' and mt.taller_origen_id = public.taller_actual()
  order by 5 desc;
$$;

-- ---------------------------------------------------------------------------
-- Aprobar / rechazar
--
-- SECURITY DEFINER porque la escritura del catálogo está reservada a
-- service_role. La guarda de rol y de origen va adentro: sin el chequeo de
-- `taller_origen_id`, un dueño estaría decidiendo el catálogo de los demás.
-- ---------------------------------------------------------------------------

create or replace function public.resolver_catalogo(
  p_nivel   text,
  p_id      uuid,
  p_estado  public.estado_catalogo,
  -- Solo para 'rechazado' en modelo/motorización: a qué fila buena apunta el
  -- duplicado. Los vehículos ya cargados siguen resolviendo por ahí.
  p_fusionar_en uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_taller uuid := public.taller_actual();
  v_filas  integer;
begin
  if not public.es_dueno() then
    raise exception 'Solo el dueño aprueba el catálogo'
      using errcode = 'insufficient_privilege';
  end if;

  if p_estado not in ('aprobado', 'rechazado') then
    raise exception 'Estado inválido para resolver' using errcode = 'check_violation';
  end if;

  if p_nivel = 'marca' then
    update public.marca
       set estado = p_estado
     where id = p_id and estado = 'pendiente' and taller_origen_id = v_taller;

  elsif p_nivel = 'modelo' then
    update public.modelo
       set estado = p_estado,
           fusionado_en_id = case when p_estado = 'rechazado' then p_fusionar_en end
     where id = p_id and estado = 'pendiente' and taller_origen_id = v_taller;

  elsif p_nivel = 'motorizacion' then
    update public.motorizacion
       set estado = p_estado,
           fusionado_en_id = case when p_estado = 'rechazado' then p_fusionar_en end
     where id = p_id and estado = 'pendiente' and taller_origen_id = v_taller;

  else
    raise exception 'Nivel de catálogo desconocido: %', p_nivel
      using errcode = 'check_violation';
  end if;

  get diagnostics v_filas = row_count;
  -- Con RLS de por medio un UPDATE que no matchea devuelve éxito silencioso
  -- (lección #36). Si no tocó nada, es que no era de este taller o ya estaba
  -- resuelto, y el usuario tiene que enterarse.
  if v_filas = 0 then
    raise exception 'Ese ítem no está pendiente o no lo cargó este taller'
      using errcode = 'no_data_found';
  end if;
end;
$$;

revoke execute on function public.catalogo_pendiente() from anon, public;
grant  execute on function public.catalogo_pendiente() to authenticated;

revoke execute on function public.resolver_catalogo(text, uuid, public.estado_catalogo, uuid)
  from anon, public;
grant  execute on function public.resolver_catalogo(text, uuid, public.estado_catalogo, uuid)
  to authenticated;
