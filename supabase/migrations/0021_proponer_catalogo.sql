-- ============================================================================
-- 0021 — Alta de catálogo desde el mostrador (la opción OTROS)
--
-- Tres funciones, una por nivel. Resuelven "¿ya existe esto?" y si no, lo dan
-- de alta como `pendiente`.
--
-- Viven en SQL y no en el server action por una razón concreta: la comparación
-- tiene que usar `public.normalizar()`, la MISMA función que alimenta el índice
-- único. Replicar unaccent+lower en JavaScript es la receta para que
-- "Citroën" y "citroen" entren como dos marcas distintas el día que una de las
-- dos implementaciones cambie.
--
-- DECISIÓN — no hay fuzzy match acá, y es a propósito. Es tentador colapsar lo
-- parecido para evitar duplicados, pero en este dominio los nombres parecidos
-- son casi siempre vehículos DISTINTOS: 208 y 308, C3 y C4, Tiggo 3 y Tiggo 4
-- tienen una similitud altísima por trigramas. Un merge automático mezclaría
-- fichas técnicas de autos diferentes, que es un error mucho más caro que un
-- duplicado visible. Los casi-duplicados los resuelve un humano en la pantalla
-- de aprobación, que para eso existe.
--
-- Son SECURITY INVOKER (el default): la política de RLS
-- `*_alta_pendiente` sigue siendo la que manda, así que ni desde acá se puede
-- insertar algo ya aprobado.
-- ============================================================================

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

  insert into public.marca (nombre, origen, estado)
  values (trim(p_nombre), 'manual', 'pendiente')
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

  insert into public.modelo (marca_id, nombre, origen, estado)
  values (p_marca_id, trim(p_nombre), 'manual', 'pendiente')
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.proponer_motorizacion(
  p_modelo_id uuid,
  p_nombre    text
)
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

  insert into public.motorizacion (modelo_id, nombre, origen, estado)
  values (p_modelo_id, trim(p_nombre), 'manual', 'pendiente')
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.proponer_marca(text)               from anon, public;
revoke execute on function public.proponer_modelo(uuid, text)        from anon, public;
revoke execute on function public.proponer_motorizacion(uuid, text)  from anon, public;

grant execute on function public.proponer_marca(text)               to authenticated;
grant execute on function public.proponer_modelo(uuid, text)        to authenticated;
grant execute on function public.proponer_motorizacion(uuid, text)  to authenticated;
