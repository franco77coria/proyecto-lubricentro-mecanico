-- ============================================================================
-- 0007 — RLS multi-tenant, hook de JWT y cierre de las columnas de costo
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Hook: mete taller_id y user_role en el access token
--
-- Sin esto, cada fila evaluada por RLS haría un SELECT a `perfil` para saber
-- a qué taller pertenece el usuario. Con el claim en el token, la política es
-- una comparación y nada más.
--
-- IMPORTANTE: hay que habilitarlo a mano en el dashboard de Supabase
-- (Authentication → Hooks → Customize Access Token). Mientras no esté,
-- taller_actual() cae al fallback contra la tabla y la app funciona igual,
-- más lenta. Es a propósito: sin fallback la app queda muerta hasta que
-- alguien se acuerde de tocar el switch.
-- ---------------------------------------------------------------------------

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_claims jsonb;
  v_taller uuid;
  v_rol    text;
begin
  select p.taller_id, p.rol::text
  into v_taller, v_rol
  from public.perfil p
  where p.user_id = (event ->> 'user_id')::uuid
    and p.activo;

  v_claims := event -> 'claims';

  if v_taller is not null then
    v_claims := jsonb_set(v_claims, '{taller_id}', to_jsonb(v_taller::text));
    v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb(v_rol));
  end if;

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- El hook corre como supabase_auth_admin, que necesita leer perfil.
grant select on public.perfil to supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- 2. RLS habilitada en absolutamente todas las tablas de negocio
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'taller', 'perfil', 'invitacion', 'taller_contador',
    'marca', 'modelo',
    'cliente', 'vehiculo', 'vehiculo_cliente',
    'orden_trabajo', 'ot_estado_log', 'ot_nota',
    'checklist_plantilla', 'checklist_plantilla_item', 'ot_checklist',
    'ot_item', 'servicio',
    'producto', 'producto_equivalencia', 'proveedor',
    'compra', 'compra_item', 'movimiento_stock',
    'ot_recepcion', 'ot_foto',
    'pago', 'cierre_caja', 'recordatorio'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Políticas base: todos los miembros del taller leen y escriben
--
-- Se generan en bucle porque son idénticas y repetirlas 12 veces a mano es
-- una invitación a que una quede mal. Las tablas con reglas especiales NO
-- están en esta lista: se escriben explícitas más abajo.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'cliente', 'vehiculo', 'vehiculo_cliente',
    'orden_trabajo', 'ot_nota', 'ot_checklist', 'ot_item',
    'ot_recepcion', 'ot_foto', 'movimiento_stock', 'recordatorio'
  ]
  loop
    execute format($f$
      create policy %1$I_taller on public.%1$I
        for all to authenticated
        using (taller_id = public.taller_actual())
        with check (taller_id = public.taller_actual())
    $f$, t);
  end loop;
end;
$$;

-- Solo lectura: lo escriben los triggers, no la app.
create policy ot_estado_log_select on public.ot_estado_log
  for select to authenticated
  using (taller_id = public.taller_actual());

-- `taller_contador` queda con RLS habilitada y SIN políticas: nadie lo toca
-- directo. Solo entra por siguiente_numero_ot(), que es SECURITY DEFINER.

-- ---------------------------------------------------------------------------
-- 4. Tablas de configuración: lee todo el taller, escribe solo el dueño
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'servicio', 'producto', 'producto_equivalencia', 'proveedor',
    'checklist_plantilla', 'checklist_plantilla_item', 'invitacion'
  ]
  loop
    execute format($f$
      create policy %1$I_select on public.%1$I
        for select to authenticated
        using (taller_id = public.taller_actual())
    $f$, t);

    execute format($f$
      create policy %1$I_escribe_dueno on public.%1$I
        for all to authenticated
        using (taller_id = public.taller_actual() and public.es_dueno())
        with check (taller_id = public.taller_actual() and public.es_dueno())
    $f$, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Plata: lee el taller, escriben dueño y mostrador (el mecánico no)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['pago', 'cierre_caja', 'compra', 'compra_item']
  loop
    execute format($f$
      create policy %1$I_select on public.%1$I
        for select to authenticated
        using (taller_id = public.taller_actual())
    $f$, t);

    execute format($f$
      create policy %1$I_escribe on public.%1$I
        for all to authenticated
        using (
          taller_id = public.taller_actual()
          and public.rol_actual() in ('dueno', 'mostrador')
        )
        with check (
          taller_id = public.taller_actual()
          and public.rol_actual() in ('dueno', 'mostrador')
        )
    $f$, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Tablas con forma propia
-- ---------------------------------------------------------------------------

-- Taller: se ve el propio, lo edita el dueño.
create policy taller_select on public.taller
  for select to authenticated
  using (id = public.taller_actual());

create policy taller_update on public.taller
  for update to authenticated
  using (id = public.taller_actual() and public.es_dueno())
  with check (id = public.taller_actual() and public.es_dueno());

-- Perfil: cada uno ve el suyo siempre (esto rompe la recursión si el JWT
-- todavía no trae el claim), y ve a sus compañeros de taller.
create policy perfil_propio on public.perfil
  for select to authenticated
  using (user_id = auth.uid());

create policy perfil_companeros on public.perfil
  for select to authenticated
  using (taller_id = public.taller_actual());

create policy perfil_admin on public.perfil
  for all to authenticated
  using (taller_id = public.taller_actual() and public.es_dueno())
  with check (taller_id = public.taller_actual() and public.es_dueno());

-- Catálogo de vehículos: global. Lo lee cualquiera autenticado; lo escribe
-- solo service_role (el cron y el admin), así que no lleva política de write.
create policy marca_select on public.marca
  for select to authenticated using (true);

create policy modelo_select on public.modelo
  for select to authenticated using (true);

-- Excepción: cuando el mostrador carga un modelo que no está en el catálogo,
-- necesita poder crearlo. Solo como `pendiente` — aprobarlo es del admin.
create policy marca_alta_pendiente on public.marca
  for insert to authenticated
  with check (estado = 'pendiente' and origen = 'manual');

create policy modelo_alta_pendiente on public.modelo
  for insert to authenticated
  with check (estado = 'pendiente' and origen = 'manual');

-- ---------------------------------------------------------------------------
-- 7. Costos: cerrar las columnas
--
-- OJO — esto NO distingue dueño de mecánico, y no puede: en Supabase todos
-- los usuarios logueados son el MISMO rol de Postgres (`authenticated`), y
-- los privilegios de columna son por rol de Postgres. No hay forma de dar
-- SELECT sobre una columna a unos usuarios y no a otros dentro del mismo rol.
--
-- Por eso el cierre es total: el costo no sale por la tabla para NADIE, ni
-- siquiera para el dueño. Sale por una única puerta, la función del punto 8,
-- que valida el rol adentro. Menos puertas, más fácil de auditar.
--
-- Las tres puertas de la lección #35: el REVOKE por columna solo no alcanza,
-- porque Supabase concede privilegios a nivel TABLA y ese grant cubre todas
-- las columnas. Hay que sacar el permiso amplio primero.
-- ---------------------------------------------------------------------------

-- Puerta 1: sacar el grant amplio.
revoke select on public.ot_item from authenticated;
revoke select on public.movimiento_stock from authenticated;
revoke select on public.compra_item from authenticated;

-- Puerta 2: devolver solo las columnas permitidas.
grant select (
  id, taller_id, ot_id, tipo, descripcion, producto_id,
  cantidad, precio_unitario, subtotal, orden, creado_por, creado_en
) on public.ot_item to authenticated;

grant select (
  id, taller_id, producto_id, tipo, cantidad,
  ot_id, compra_id, motivo, usuario_id, creado_en
) on public.movimiento_stock to authenticated;

grant select (
  id, taller_id, compra_id, producto_id, cantidad
) on public.compra_item to authenticated;

-- Puerta 3: `anon` no tiene nada que hacer acá, y el default privileges hay
-- que corregirlo o cada tabla/vista creada más adelante nace abierta de nuevo
-- (lección #37: el revoke deja de proteger con el tiempo si no se corrige).
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on functions from anon;

-- Defensa en profundidad (lección #36: un permiso mal cerrado no avisa, la
-- escritura devuelve 204 en vez de error). Esto no depende de los grants.
create or replace function public.bloquear_cambio_de_costo()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.costo_unitario is distinct from old.costo_unitario
     and current_setting('role', true) <> 'service_role' then
    raise exception 'El costo no se modifica después de registrado (%.%)',
      tg_table_schema, tg_table_name
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger ot_item_costo_bu
  before update on public.ot_item
  for each row execute function public.bloquear_cambio_de_costo();

create trigger movimiento_stock_costo_bu
  before update on public.movimiento_stock
  for each row execute function public.bloquear_cambio_de_costo();

create trigger compra_item_costo_bu
  before update on public.compra_item
  for each row execute function public.bloquear_cambio_de_costo();

-- El saldo de stock lo escribe únicamente el trigger del ledger.
revoke update (stock) on public.producto from authenticated;

-- ---------------------------------------------------------------------------
-- 8. La única puerta a los costos
-- ---------------------------------------------------------------------------

create or replace function public.ot_costos(p_ot uuid)
returns table (
  item_id uuid,
  descripcion text,
  cantidad numeric,
  costo_unitario numeric,
  precio_unitario numeric,
  margen numeric
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.es_dueno() then
    raise exception 'Solo el dueño accede a los costos'
      using errcode = 'insufficient_privilege';
  end if;

  return query
  select i.id, i.descripcion, i.cantidad, i.costo_unitario, i.precio_unitario,
         round((i.precio_unitario - i.costo_unitario) * i.cantidad, 2)
  from public.ot_item i
  join public.orden_trabajo o on o.id = i.ot_id
  where i.ot_id = p_ot
    and o.taller_id = public.taller_actual();
end;
$$;

revoke execute on function public.ot_costos(uuid) from anon;
grant execute on function public.ot_costos(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Verificación — estas dos consultas tienen que dar 0 filas
-- ---------------------------------------------------------------------------

-- Tablas de public sin RLS habilitada:
--   select tablename from pg_tables t
--   where schemaname = 'public'
--     and not exists (
--       select 1 from pg_class c
--       join pg_namespace n on n.oid = c.relnamespace
--       where n.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity
--     );

-- Columnas de costo todavía legibles por la app:
--   select table_name, column_name, grantee
--   from information_schema.column_privileges
--   where grantee in ('authenticated', 'anon')
--     and column_name = 'costo_unitario'
--     and privilege_type = 'SELECT';
