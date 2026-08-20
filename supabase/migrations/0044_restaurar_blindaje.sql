-- ============================================================================
-- 0044 — Restaurar el blindaje que 0038 desarmó en silencio
--
-- CONTEXTO. `0038_grant_table_permissions_and_rls.sql` hizo
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES ...
-- y con eso devolvió de un saque todos los privilegios que 0007, 0010, 0027 y
-- 0030 habían sacado columna por columna. Nada falló y nada quedó registrado:
-- los permisos se reabrieron sin ruido. Es la lección #37 del CLAUDE.md, pero
-- al revés — ahí el default dejaba las tablas nuevas abiertas para `anon`, acá
-- las deja abiertas para `authenticated`.
--
-- Verificado contra producción antes de escribir esto:
--   · costo_unitario legible por authenticated en las 3 tablas
--   · token_publico / token_expira_en / aprobado_cliente_en escribibles
--   · producto.stock y compra.total escribibles
--   · custom_access_token_hook ejecutable por authenticated
--
-- Esta migración repone las tres puertas de la lección #35 (sacar el permiso
-- amplio primero, después devolver solo lo permitido), corrige el default, y
-- de paso cierra cuatro cosas más que la auditoría encontró alrededor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. El default vuelve a ser cerrado
--
-- Sin esto, cada tabla que se cree de acá en adelante nace con ALL para
-- `authenticated` y el trabajo de abajo se deshace solo con el tiempo.
-- Se conceden los cuatro verbos de DML y nada más: el control de qué fila se
-- toca es RLS, el de qué columna se toca son los grants de abajo.
-- ---------------------------------------------------------------------------

alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- `anon` no tiene nada que hacer en public: todo lo público entra por las
-- funciones SECURITY DEFINER de 0030. Se repite el revoke de 0007 porque
-- 0038 volvió a tocar los defaults del schema.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- 2. Los costos no salen por la tabla, para nadie
--
-- El razonamiento entero está en 0007 §7 y sigue valiendo: en Supabase todos
-- los usuarios logueados son el MISMO rol de Postgres, así que no se puede
-- dar SELECT de una columna a unos y no a otros. El cierre es total y la
-- única puerta es ot_costos(), que valida es_dueno() adentro.
--
-- Las listas de abajo salen del esquema real de hoy, no de la copia de 0007:
-- movimiento_stock ganó ot_item_id, secuencia y compra_item_id en migraciones
-- posteriores. Una columna olvidada acá no da error — la escritura devuelve
-- 204 y la lectura devuelve null (lecciones #36 y #58).
--
-- compra_item.subtotal queda afuera a propósito: es cantidad × costo_unitario,
-- así que exponerlo es exponer el costo con un paso más.
-- ---------------------------------------------------------------------------

revoke select on public.ot_item          from authenticated;
revoke select on public.movimiento_stock from authenticated;
revoke select on public.compra_item      from authenticated;

grant select (
  id, taller_id, ot_id, tipo, descripcion, producto_id,
  cantidad, precio_unitario, subtotal, orden, creado_por, creado_en
) on public.ot_item to authenticated;

grant select (
  id, taller_id, producto_id, tipo, cantidad,
  ot_id, compra_id, motivo, usuario_id, creado_en,
  ot_item_id, secuencia, compra_item_id
) on public.movimiento_stock to authenticated;

grant select (
  id, taller_id, compra_id, producto_id, cantidad
) on public.compra_item to authenticated;

-- ---------------------------------------------------------------------------
-- 3. El token del portal público y la constancia de aprobación
--
-- `token_publico` y `token_expira_en` los escribe SOLO
-- generar_token_seguimiento() (SECURITY DEFINER), que además genera 32 bytes
-- al azar. Con UPDATE libre se puede fijar un token predecible o estirar el
-- vencimiento de uno que ya se rotó.
--
-- `aprobado_cliente_en` es más serio: es la constancia de que el cliente
-- autorizó el trabajo. Si la app la puede escribir, deja de ser constancia de
-- nada. La escribe únicamente aprobar_presupuesto_publico(), que exige token.
--
-- Los totales tampoco: los recalcula el trigger recalcular_totales_ot() a
-- partir de los ítems. El número de OT lo asigna asignar_numero_ot().
-- La anulación entra por anular_orden(), que es atómica con la devolución de
-- stock.
-- ---------------------------------------------------------------------------

revoke update on public.orden_trabajo from authenticated;

grant update (
  estado, tipo, vehiculo_id, cliente_id, km_ingreso, observaciones,
  fecha_entrega, asignado_a, peritaje_ia, inspeccion_recepcion
) on public.orden_trabajo to authenticated;

-- ---------------------------------------------------------------------------
-- 4. El saldo de stock lo escribe el ledger, no la app
--
-- 0010 ya había corregido el `revoke update (stock)` de 0007 por el revoke a
-- nivel tabla (lección #35). 0038 lo deshizo. Con UPDATE libre sobre `stock`
-- se puede fijar cualquier saldo sin dejar un movimiento que lo explique, y
-- el inventario deja de ser auditable.
--
-- `bajo_stock` no se lista: es una columna generada (lección #40).
-- ---------------------------------------------------------------------------

revoke update on public.producto from authenticated;

grant update (
  nombre, marca, categoria, sku, codigo_barras,
  unidad, ubicacion, precio_venta, stock_min, activo
) on public.producto to authenticated;

-- El total de la compra lo recalcula el trigger de 0027 desde los renglones.
--
-- OJO con la forma: 0027 escribió `revoke update (total) ... from authenticated`
-- y eso NO hace nada mientras exista el grant de UPDATE a nivel tabla, que es
-- justo lo que 0038 repuso. Es la lección #35 otra vez. Hay que sacar el
-- permiso amplio primero y después devolver las columnas permitidas.
revoke update on public.compra from authenticated;

grant update (
  proveedor_id, comprobante, fecha, notas
) on public.compra to authenticated;

-- ---------------------------------------------------------------------------
-- 5. El hook del token de acceso
--
-- 0007 se lo revocó explícitamente a los tres roles de la app; el
-- GRANT ALL ON ALL ROUTINES de 0038 se lo devolvió. Es SECURITY INVOKER, así
-- que RLS lo sigue conteniendo y el impacto directo es bajo, pero es una
-- función del circuito de autenticación expuesta sin ninguna razón.
-- ---------------------------------------------------------------------------

revoke execute on function public.custom_access_token_hook(jsonb)
  from authenticated, anon, public;
grant execute on function public.custom_access_token_hook(jsonb)
  to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- 6. search_path en las tres SECURITY DEFINER que quedaron sin él
--
-- Es exactamente lo que el comentario de 0001 advierte: sin fijar el
-- search_path, una función SECURITY DEFINER es una vía de escalada, porque el
-- llamador elige a qué esquema resuelven los nombres de adentro.
--
-- Pesa más de lo que parece en sincronizar_consumo_stock(): es la que escribe
-- el ledger de movimiento_stock en cada alta de ítem.
--
-- Se usa ALTER FUNCTION y no CREATE OR REPLACE para no reescribir el cuerpo:
-- así esta migración no puede pisar por accidente la versión vigente.
-- ---------------------------------------------------------------------------

alter function public.sincronizar_consumo_stock()    set search_path = public, pg_temp;
alter function public.set_actualizado_en()           set search_path = public, pg_temp;
alter function public.verificar_jerarquia_vehiculo() set search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- 7. Un usuario suspendido no puede seguir escribiendo
--
-- 0038, 0039 y 0040 crearon políticas que filtran con
--   taller_id IN (SELECT taller_id FROM perfil WHERE user_id = auth.uid())
-- SIN exigir `activo`. Como las políticas permisivas se suman con OR, alcanza
-- una de estas para dar acceso aunque taller_actual() —que sí exige activo—
-- devuelva null.
--
-- En ot_item, ot_nota y ot_checklist la política de 0007 ya cubre el caso bien,
-- así que la duplicada se borra y listo. compra_foto y
-- registro_actividad_usuario no tienen equivalente: se rehacen con
-- taller_actual().
--
-- OJO: esto empareja las políticas, no cierra la ventana del JWT. El claim
-- taller_id sobrevive en el token hasta el próximo refresh. Lo que corta el
-- acceso en el momento es el signOut global que ahora hace cambiarRolMiembro().
-- ---------------------------------------------------------------------------

drop policy if exists ot_item_taller_access      on public.ot_item;
drop policy if exists ot_nota_taller_access      on public.ot_nota;
drop policy if exists ot_checklist_taller_access on public.ot_checklist;

drop policy if exists compra_foto_taller_access on public.compra_foto;
create policy compra_foto_taller_access on public.compra_foto
  for all to authenticated
  using (taller_id = public.taller_actual())
  with check (taller_id = public.taller_actual());

drop policy if exists actividad_taller_select        on public.registro_actividad_usuario;
drop policy if exists actividad_propia_insert_update on public.registro_actividad_usuario;

-- Lectura: todo el taller (el panel de auditoría lo filtra por rol arriba).
create policy actividad_taller_select on public.registro_actividad_usuario
  for select to authenticated
  using (taller_id = public.taller_actual());

-- Escritura: cada uno la suya y nada más. Sin esto un empleado podría inflar
-- las horas de otro, que es justo lo que el panel del dueño mira.
create policy actividad_propia_escribe on public.registro_actividad_usuario
  for all to authenticated
  using (user_id = auth.uid() and taller_id = public.taller_actual())
  with check (user_id = auth.uid() and taller_id = public.taller_actual());

-- ---------------------------------------------------------------------------
-- 8. El costo de un ítem se puede corregir solo si cambió el repuesto
--
-- El trigger de 0007 bloquea cualquier cambio de costo_unitario. Pero
-- actualizarItemOT() recalcula el costo en cada edición, así que hoy editar un
-- ítem cuyo producto cambió de precio falla con "No se pudo actualizar el
-- ítem" y nadie entiende por qué. Es un bug vivo, anterior a esta migración.
--
-- La intención del trigger era "el costo de lo ya registrado no se retoca".
-- Cambiar el repuesto del renglón es otra cosa: el ítem pasó a ser otra cosa y
-- su costo tiene que acompañar. Se permite ese caso y solo ese; el resto sigue
-- bloqueado. Del lado de la app, actualizarItemOT() ahora manda costo_unitario
-- únicamente cuando producto_id cambió.
-- ---------------------------------------------------------------------------

create or replace function public.bloquear_cambio_de_costo()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.costo_unitario is distinct from old.costo_unitario
     and new.producto_id is not distinct from old.producto_id
     and current_setting('role', true) <> 'service_role' then
    raise exception 'El costo no se modifica después de registrado (%.%)',
      tg_table_schema, tg_table_name
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Rate limit en el seguimiento por token
--
-- Es la única superficie sin autenticar del sistema. seguimiento_por_patente()
-- ya tiene freno desde 0030; esta no tenía ninguno, y el LivePoller del portal
-- la llamaba cada 6 segundos mientras la pestaña estuviera abierta.
--
-- 60 consultas cada 15 minutos: con el polling ahora en 30 s son 30, así que
-- sobra margen para el cliente que además refresca a mano, y no alcanza para
-- sostener carga con un token filtrado.
--
-- La función pasa de STABLE a VOLATILE porque chequear_rate_limit() escribe.
-- Devolver null en vez de un error es a propósito: la página muestra "no
-- encontrado" y no le confirma a un scanner que el token existe.
-- ---------------------------------------------------------------------------

create or replace function public.seguimiento_por_token(p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_ot     record;
  v_result jsonb;
  v_limit  jsonb;
begin
  if p_token is null or length(p_token) < 20 then
    return null;
  end if;

  v_limit := public.chequear_rate_limit('seguimiento:tok:' || p_token, 60, interval '15 minutes');
  if not (v_limit ->> 'permitido')::boolean then
    return null;
  end if;

  select o.id, o.numero, o.estado, o.fecha_ingreso, o.fecha_entrega,
         o.total, o.total_mano_obra, o.total_repuestos,
         o.aprobado_cliente_en, o.token_expira_en,
         v.patente, ma.nombre as marca, mo.nombre as modelo,
         t.nombre as taller, t.telefono as taller_telefono, t.direccion as taller_direccion,
         t.idioma as taller_idioma, t.moneda as taller_moneda,
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
      'direccion', v_ot.taller_direccion,
      -- El portal lo ve el cliente final: tiene que hablarle en el idioma y
      -- la moneda del taller, no en los de Argentina por defecto.
      'idioma', coalesce(v_ot.taller_idioma, 'es'),
      'moneda', coalesce(v_ot.taller_moneda, 'ARS')
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
-- 10. Cuota para el alta de catálogo
--
-- marca, modelo y motorizacion son globales por diseño: no llevan taller_id y
-- se leen con USING (true) desde todos los talleres. Eso está bien — un modelo
-- nuevo le sirve a todos. Lo que falta es un techo: hoy un solo tenant puede
-- insertar altas pendientes sin límite y ensuciarle el selector a todos.
--
-- El freno va por taller y no por usuario: si no, alcanza con crear empleados
-- para multiplicar la cuota. 40 altas nuevas por hora es holgado para el
-- mostrador que carga una flota, y corto para un script.
--
-- Solo cuenta cuando REALMENTE se da de alta algo. Resolver un nombre que ya
-- existe es una lectura y no gasta cuota, que es el 95% de las llamadas.
-- ---------------------------------------------------------------------------

create or replace function public.chequear_cuota_catalogo()
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_taller uuid := public.taller_actual();
  v_limit  jsonb;
begin
  if v_taller is null then
    raise exception 'Sin sesión' using errcode = 'insufficient_privilege';
  end if;

  v_limit := public.chequear_rate_limit('catalogo:alta:' || v_taller::text, 40, interval '1 hour');

  if not (v_limit ->> 'permitido')::boolean then
    raise exception 'Diste de alta demasiados modelos nuevos seguidos. Probá de nuevo en un rato.'
      using errcode = 'check_violation';
  end if;
end;
$$;

revoke execute on function public.chequear_cuota_catalogo() from anon, public;
grant  execute on function public.chequear_cuota_catalogo() to authenticated;

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

  perform public.chequear_cuota_catalogo();

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

  perform public.chequear_cuota_catalogo();

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

  perform public.chequear_cuota_catalogo();

  insert into public.motorizacion (modelo_id, nombre, origen, estado)
  values (p_modelo_id, trim(p_nombre), 'manual', 'pendiente')
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Verificación — las cuatro consultas tienen que dar 0 filas
--
-- Están en scripts/verificar-db.mjs, que corre con `npm run verify:db`. Se
-- dejan acá también porque el día que alguien escriba otro GRANT ALL, este
-- comentario es lo que va a leer.
-- ---------------------------------------------------------------------------

-- (a) costos legibles por la app:
--   select table_name, column_name from information_schema.column_privileges
--   where grantee in ('authenticated','anon')
--     and column_name = 'costo_unitario' and privilege_type = 'SELECT';

-- (b) columnas que solo escriben las funciones:
--   select table_name, column_name from information_schema.column_privileges
--   where grantee = 'authenticated' and privilege_type = 'UPDATE'
--     and (table_name, column_name) in
--       (('orden_trabajo','token_publico'), ('orden_trabajo','token_expira_en'),
--        ('orden_trabajo','aprobado_cliente_en'), ('producto','stock'),
--        ('compra','total'));

-- (c) SECURITY DEFINER sin search_path:
--   select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.prosecdef
--     and (p.proconfig is null or not exists (
--       select 1 from unnest(p.proconfig) c where c like 'search_path=%'));

-- (d) políticas que no exigen perfil activo:
--   select tablename, policyname from pg_policies
--   where schemaname = 'public' and coalesce(qual,'') ilike '%from perfil%'
--     and coalesce(qual,'') not ilike '%activo%';
