-- ============================================================================
-- 0023 — Que la resolución de cédula funcione sobre el payload crudo
--
-- Problema encontrado al probar con un PDF417 real: las cédulas Mercosur
-- argentinas usan el formato separado por comas
--
--   AB123CD,VOLKSWAGEN,GOL TREND 1.6,2018,9BWAB45U0JT123456,PEREZ JUAN
--
-- y de ahí `interpretarCedula` solo saca patente, VIN y año — no tiene forma
-- confiable de decir qué campo es la marca, porque el orden cambia entre
-- provincias. Resultado: el escaneo prellenaba la patente pero dejaba marca y
-- modelo vacíos, que es justo la parte tediosa de cargar.
--
-- La solución NO es adivinar posiciones de campo en JavaScript. Es dejar de
-- necesitar saber cuál es cada campo: se le pasa el texto entero y se busca qué
-- marca del catálogo aparece adentro. La estrategia de contención que ya tenía
-- la función sirve igual para un campo suelto que para el payload completo.
--
-- Lo único que faltaba: tratar los separadores como espacios. "GOL TREND" está
-- en ",GOL TREND 1.6," pero pegado a una coma, así que los patrones que buscan
-- la palabra entre espacios no lo encontraban. Se normalizan los dos lados
-- igual (todo lo que no es alfanumérico pasa a espacio), lo que además hace que
-- "T-Cross" matchee "T CROSS" y "F-100" matchee "F 100".
--
-- El matcheo sigue siendo por palabra completa, y eso es lo que lo mantiene
-- seguro: el chasis "9BWAB45U0JT123456" es un token solo, así que no puede
-- matchear el Fiat 147 por contener "147".
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
  -- Rodeado de espacios para que los patrones '% x %' alcancen también a la
  -- primera y a la última palabra del texto.
  v_texto_marca  text := ' ' || regexp_replace(public.normalizar(coalesce(p_marca, '')),
                                               '[^a-z0-9]+', ' ', 'g') || ' ';
  v_texto_modelo text := ' ' || regexp_replace(public.normalizar(coalesce(p_modelo, '')),
                                               '[^a-z0-9]+', ' ', 'g') || ' ';
  v_marca_id  uuid;
  v_modelo_id uuid;
begin
  if length(trim(v_texto_marca)) >= 2 then
    -- 1. El texto ES exactamente el nombre de la marca.
    select m.id into v_marca_id
    from public.marca m
    where m.activa
      and ' ' || regexp_replace(m.nombre_norm, '[^a-z0-9]+', ' ', 'g') || ' ' = v_texto_marca;

    -- 2. Alias declarado en el catálogo ('vw' → Volkswagen).
    if v_marca_id is null then
      select m.id into v_marca_id
      from public.marca m
      where m.activa
        and exists (
          select 1 from unnest(m.alias) a
          where v_texto_marca like '% ' || a || ' %'
        );
    end if;

    -- 3. El nombre de la marca aparece como palabra dentro del texto. Se toma
    --    el más largo: 'land rover' antes que 'rover'.
    if v_marca_id is null then
      select m.id into v_marca_id
      from public.marca m
      where m.activa
        and length(m.nombre_norm) >= 3
        and v_texto_marca like '% ' || regexp_replace(m.nombre_norm, '[^a-z0-9]+', ' ', 'g') || ' %'
      order by length(m.nombre_norm) desc
      limit 1;
    end if;
  end if;

  -- El modelo se busca solo dentro de la marca resuelta: sin eso un "Focus"
  -- podría caer en la marca equivocada.
  if v_marca_id is not null and length(trim(v_texto_modelo)) >= 1 then
    select mo.id into v_modelo_id
    from public.modelo mo
    where mo.marca_id = v_marca_id
      and mo.estado <> 'rechazado'
      and mo.fusionado_en_id is null
      and v_texto_modelo like
          '% ' || regexp_replace(mo.nombre_norm, '[^a-z0-9]+', ' ', 'g') || ' %'
    -- El más largo gana: 'gol trend' antes que 'gol', 'onix plus' antes que
    -- 'onix'. Es lo que evita que un Gol Trend entre como Gol y arrastre la
    -- ficha técnica equivocada.
    order by length(mo.nombre_norm) desc
    limit 1;
  end if;

  return query select v_marca_id, v_modelo_id;
end;
$$;
