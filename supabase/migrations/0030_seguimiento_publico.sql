-- ============================================================================
-- 0030 — Portal público de seguimiento y aprobación del presupuesto
--
-- El cliente entra sin usuario y ve en qué anda su auto. Es la parte más
-- delicada de todo el sistema porque es la ÚNICA superficie sin autenticación,
-- así que conviene dejar el razonamiento escrito.
--
-- POR QUÉ NO ALCANZA "buscar por patente":
-- una patente es adivinable (AB123CD sigue un patrón corto y enumerable). Si
-- con solo la patente se vieran nombre, teléfono y montos, cualquiera recorre
-- el padrón y se lleva la base de clientes del taller. Por eso hay dos puertas
-- con permisos distintos:
--
--   1. Token opaco (el link que se manda por WhatsApp): muestra todo lo que le
--      corresponde al cliente — estado, bitácora, ítems, total— y permite
--      aprobar el presupuesto.
--   2. Patente suelta: muestra SOLO el estado y el modelo. Sin nombre, sin
--      teléfono, sin montos, sin bitácora. Alcanza para "¿está listo?", que es
--      el 90% de las consultas, y no sirve para hacer inteligencia comercial.
--      Además pasa por el rate limit que ya existe (0011).
--
-- POR QUÉ TODO ENTRA POR FUNCIONES:
-- `anon` no tiene ni un privilegio de tabla (0007 se los revocó a todos, y
-- también el default privileges para que las tablas nuevas nazcan cerradas).
-- No se le abre ninguna tabla: cada función SECURITY DEFINER devuelve un
-- conjunto de columnas elegido a mano. Una sola puerta por caso de uso, fácil
-- de auditar. En particular `orden_trabajo.observaciones` NUNCA sale: es el
-- campo interno ("el cliente lo pasa a buscar el viernes").
-- ============================================================================

-- ---------------------------------------------------------------------------
-- El token vive en la orden
-- ---------------------------------------------------------------------------

alter table public.orden_trabajo
  add column token_publico text unique,
  add column token_expira_en timestamptz,
  -- Registro de la aprobación del cliente. Es la constancia de que autorizó el
  -- trabajo, así que va con hora.
  add column aprobado_cliente_en timestamptz;

-- ---------------------------------------------------------------------------
-- Qué notas ve el cliente
--
-- Default `true` porque los tres tipos de nota son cosas que se le cuentan al
-- cliente: lo que dijo, lo que se encontró y lo que queda presupuestado. Lo
-- interno vive en `orden_trabajo.observaciones`, que no se expone nunca.
-- ---------------------------------------------------------------------------

alter table public.ot_nota
  add column visible_cliente boolean not null default true;

grant update (visible_cliente) on public.ot_nota to authenticated;

-- ---------------------------------------------------------------------------
-- Generar / rotar el link
--
-- El token es de 32 bytes al azar en base64url: no es adivinable ni enumerable.
-- Rotarlo invalida el link anterior, que es lo que se necesita si el cliente lo
-- reenvió a quien no debía.
-- ---------------------------------------------------------------------------

create or replace function public.generar_token_seguimiento(
  p_ot   uuid,
  p_dias integer default 90
)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_token text;
begin
  if public.taller_actual() is null then
    raise exception 'Sin sesión' using errcode = 'insufficient_privilege';
  end if;

  v_token := replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '/', '_'), '+', '-');
  v_token := rtrim(v_token, '=');

  update public.orden_trabajo
     set token_publico = v_token,
         token_expira_en = now() + make_interval(days => greatest(1, p_dias))
   where id = p_ot
     and taller_id = public.taller_actual();

  if not found then
    raise exception 'Esa orden no es de este taller' using errcode = 'no_data_found';
  end if;

  return v_token;
end;
$$;

revoke execute on function public.generar_token_seguimiento(uuid, integer) from anon, public;
grant  execute on function public.generar_token_seguimiento(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Vista del cliente por token
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
  -- Longitud mínima antes de tocar la tabla: descarta el ruido de un escaneo
  -- automático sin gastar una consulta.
  if p_token is null or length(p_token) < 20 then
    return null;
  end if;

  select o.id, o.numero, o.estado, o.fecha_ingreso, o.fecha_entrega,
         o.total, o.total_mano_obra, o.total_repuestos,
         o.aprobado_cliente_en, o.token_expira_en,
         v.patente, ma.nombre as marca, mo.nombre as modelo,
         t.nombre as taller, t.telefono as taller_telefono, t.direccion as taller_direccion
    into v_ot
  from public.orden_trabajo o
  join public.vehiculo v on v.id = o.vehiculo_id
  join public.taller t   on t.id = o.taller_id
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
    -- La bitácora: qué dijo el cliente, qué encontró el taller, qué queda
    -- presupuestado. Solo lo marcado como visible.
    'notas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'tipo', n.tipo, 'texto', n.texto,
               'precio', n.precio_estimado, 'fecha', n.creado_en
             ) order by n.creado_en)
      from public.ot_nota n
      where n.ot_id = v_ot.id and n.visible_cliente
    ), '[]'::jsonb),
    -- Los ítems SIN costo: el precio de venta sí, lo que pagó el taller no.
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'descripcion', i.descripcion, 'tipo', i.tipo,
               'cantidad', i.cantidad, 'subtotal', i.subtotal
             ) order by i.orden, i.creado_en)
      from public.ot_item i
      where i.ot_id = v_ot.id
    ), '[]'::jsonb),
    -- La línea de tiempo sale del log, que se escribe solo desde 0004.
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
-- Consulta por patente: SOLO el estado
--
-- Nada de nombre, teléfono, montos ni bitácora. Es deliberado: alcanza para
-- "¿está listo?" y no sirve para llevarse la cartera de clientes.
-- ---------------------------------------------------------------------------

create or replace function public.seguimiento_por_patente(p_patente text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_norm  text;
  v_limit jsonb;
  v_ot    record;
begin
  v_norm := upper(regexp_replace(coalesce(p_patente, ''), '[^A-Za-z0-9]', '', 'g'));
  if length(v_norm) < 6 then
    return jsonb_build_object('encontrado', false);
  end if;

  -- Rate limit por patente consultada: 10 en 15 minutos. Frena la enumeración
  -- sin molestar al cliente que refresca para ver si ya está.
  v_limit := public.chequear_rate_limit('seguimiento:' || v_norm, 10, interval '15 minutes');
  if not (v_limit ->> 'permitido')::boolean then
    return jsonb_build_object(
      'encontrado', false,
      'demasiadas_consultas', true,
      'espera_segundos', (v_limit ->> 'espera_segundos')::integer
    );
  end if;

  select o.estado, o.numero, v.patente, ma.nombre as marca, mo.nombre as modelo,
         t.nombre as taller
    into v_ot
  from public.orden_trabajo o
  join public.vehiculo v on v.id = o.vehiculo_id
  join public.taller t   on t.id = o.taller_id
  left join public.marca ma on ma.id = v.marca_id
  left join public.modelo mo on mo.id = v.modelo_id
  where v.patente_norm = v_norm
    and o.estado <> 'anulado'
  order by o.fecha_ingreso desc
  limit 1;

  if v_ot.estado is null then
    return jsonb_build_object('encontrado', false);
  end if;

  return jsonb_build_object(
    'encontrado', true,
    'estado', v_ot.estado,
    'patente', v_ot.patente,
    'vehiculo', nullif(trim(concat_ws(' ', v_ot.marca, v_ot.modelo)), ''),
    'taller', v_ot.taller
  );
end;
$$;

revoke execute on function public.seguimiento_por_patente(text) from public;
grant  execute on function public.seguimiento_por_patente(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Aprobación digital del presupuesto
--
-- Solo con token, solo si está en `presupuesto`, y es idempotente: el cliente
-- que toca dos veces no rompe nada ni ve un error.
-- ---------------------------------------------------------------------------

create or replace function public.aprobar_presupuesto_publico(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_ot record;
begin
  if p_token is null or length(p_token) < 20 then
    return jsonb_build_object('ok', false, 'motivo', 'token_invalido');
  end if;

  select o.id, o.estado, o.aprobado_cliente_en
    into v_ot
  from public.orden_trabajo o
  where o.token_publico = p_token
    and (o.token_expira_en is null or o.token_expira_en > now());

  if v_ot.id is null then
    return jsonb_build_object('ok', false, 'motivo', 'token_invalido');
  end if;

  -- Ya estaba aprobado: se responde bien igual. Un cliente que toca dos veces
  -- no tiene por qué ver un error.
  if v_ot.aprobado_cliente_en is not null then
    return jsonb_build_object('ok', true, 'ya_estaba', true);
  end if;

  if v_ot.estado <> 'presupuesto' then
    return jsonb_build_object('ok', false, 'motivo', 'estado_no_permite');
  end if;

  update public.orden_trabajo
     set estado = 'aprobado',
         aprobado_cliente_en = now()
   where id = v_ot.id;

  return jsonb_build_object('ok', true, 'ya_estaba', false);
end;
$$;

revoke execute on function public.aprobar_presupuesto_publico(text) from public;
grant  execute on function public.aprobar_presupuesto_publico(text) to anon, authenticated;

-- El token no lo escribe la app directo: pasa por `generar_token_seguimiento`.
revoke update (token_publico, token_expira_en, aprobado_cliente_en)
  on public.orden_trabajo from authenticated;
