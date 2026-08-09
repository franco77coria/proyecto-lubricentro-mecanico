-- ============================================================================
-- 0022 — Enganchar el texto de la cédula con el catálogo
--
-- El código de la cédula no dice "modelo_id": dice "GOL TREND 1.6 POWER" o
-- "VOLKSWAGEN S.A. DE AHORRO P/F DETERMINADOS". Hay que llevar ese texto a una
-- fila del catálogo, y el matcheo exacto no alcanza casi nunca.
--
-- ESTRATEGIA, distinta por nivel a propósito:
--
--   Marca: exacto normalizado → alias → contención de palabra. Los nombres de
--     marca son distintivos ("volkswagen" está contenido en cualquier razón
--     social que la mencione) así que buscar la marca contenida en el texto es
--     seguro y resuelve las razones sociales largas.
--
--   Modelo: se elige el nombre de catálogo MÁS LARGO que esté contenido en el
--     texto de la cédula. "GOL TREND 1.6" contiene "gol" y "gol trend"; el más
--     largo es el correcto. Esto es lo que evita que un Gol Trend entre como
--     Gol, que es el error que después ensucia la ficha técnica.
--
-- Sigue sin haber similitud por trigramas: acá se busca un modelo que YA existe
-- dentro de un texto, no se adivina cuál se parece. "208" nunca va a estar
-- contenido en "307".
--
-- Devuelve nulls sin quejarse: si no reconoce nada, el mostrador elige a mano.
-- Es un acelerador, no un requisito.
-- ============================================================================

create or replace function public.resolver_vehiculo_cedula(
  p_marca  text default null,
  p_modelo text default null
)
returns table (marca_id uuid, modelo_id uuid)
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_marca_norm  text := public.normalizar(coalesce(p_marca, ''));
  v_modelo_norm text := public.normalizar(coalesce(p_modelo, ''));
  v_marca_id    uuid;
  v_modelo_id   uuid;
begin
  if length(v_marca_norm) >= 2 then
    -- 1. Exacto.
    select m.id into v_marca_id
    from public.marca m
    where m.nombre_norm = v_marca_norm and m.activa;

    -- 2. Alias declarado en el catálogo ('vw' → Volkswagen).
    if v_marca_id is null then
      select m.id into v_marca_id
      from public.marca m
      where m.activa and v_marca_norm = any(m.alias);
    end if;

    -- 3. La marca del catálogo aparece dentro del texto de la cédula, o al
    --    revés. Se toma la más larga: 'land rover' antes que 'rover'.
    if v_marca_id is null then
      select m.id into v_marca_id
      from public.marca m
      where m.activa
        and length(m.nombre_norm) >= 3
        and (v_marca_norm like '%' || m.nombre_norm || '%'
             or m.nombre_norm like '%' || v_marca_norm || '%')
      order by length(m.nombre_norm) desc
      limit 1;
    end if;
  end if;

  -- El modelo solo se busca dentro de la marca resuelta: sin eso, un "Focus"
  -- podría caer en la marca equivocada.
  if v_marca_id is not null and length(v_modelo_norm) >= 1 then
    select mo.id into v_modelo_id
    from public.modelo mo
    where mo.marca_id = v_marca_id
      and mo.estado <> 'rechazado'
      and mo.fusionado_en_id is null
      and (v_modelo_norm = mo.nombre_norm
           or v_modelo_norm like mo.nombre_norm || ' %'
           or v_modelo_norm like '% ' || mo.nombre_norm || ' %'
           or v_modelo_norm like '% ' || mo.nombre_norm)
    order by length(mo.nombre_norm) desc
    limit 1;
  end if;

  return query select v_marca_id, v_modelo_id;
end;
$$;

revoke execute on function public.resolver_vehiculo_cedula(text, text) from anon, public;
grant  execute on function public.resolver_vehiculo_cedula(text, text) to authenticated;
