-- ============================================================================
-- 0009 — Onboarding: alta de taller e invitaciones
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Plantilla de checklist por defecto
--
-- Reproduce la planilla de Excel que el taller usa hoy. Es solo el punto de
-- partida: cada taller la edita desde Configuración. Es producto, no código.
-- ---------------------------------------------------------------------------

create or replace function public.crear_checklist_default(p_taller uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plantilla uuid;
begin
  insert into public.checklist_plantilla (taller_id, nombre)
  values (p_taller, 'General')
  returning id into v_plantilla;

  insert into public.checklist_plantilla_item (taller_id, plantilla_id, etiqueta, categoria, orden)
  select p_taller, v_plantilla, i.etiqueta, i.categoria, i.orden
  from (values
    ('Tren delantero',     'Suspensión y dirección', 1),
    ('Tren trasero',       'Suspensión y dirección', 2),
    ('Neumáticos',         'Suspensión y dirección', 3),
    ('Luces',              'Eléctrico',              4),
    ('Aceite',             'Lubricación',            5),
    ('Filtro de aire',     'Filtros',                6),
    ('Filtro de nafta',    'Filtros',                7),
    ('Filtro de aceite',   'Filtros',                8),
    ('Filtro habitáculo',  'Filtros',                9),
    ('Grasas y aditivos',  'Lubricación',           10),
    ('Otros',              null,                    11)
  ) as i(etiqueta, categoria, orden);

  return v_plantilla;
end;
$$;

-- ---------------------------------------------------------------------------
-- Alta de taller
--
-- El que crea el taller queda como dueño DE ESE taller. No hay escalada
-- posible: no existe un rol global, y el rol solo aplica dentro del tenant
-- recién creado.
-- ---------------------------------------------------------------------------

create or replace function public.crear_taller(
  p_nombre    text,
  p_nombre_usuario text default '',
  p_telefono  text default null,
  p_cuit      text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_taller uuid;
  v_user   uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Sesión requerida' using errcode = 'insufficient_privilege';
  end if;

  if exists (select 1 from public.perfil where user_id = v_user) then
    raise exception 'Este usuario ya pertenece a un taller'
      using errcode = 'unique_violation';
  end if;

  if p_nombre is null or length(trim(p_nombre)) = 0 then
    raise exception 'El nombre del taller es obligatorio';
  end if;

  insert into public.taller (nombre, telefono, cuit)
  values (trim(p_nombre), p_telefono, p_cuit)
  returning id into v_taller;

  insert into public.perfil (user_id, taller_id, rol, nombre)
  values (v_user, v_taller, 'dueno', coalesce(nullif(trim(p_nombre_usuario), ''), ''));

  perform public.crear_checklist_default(v_taller);

  return v_taller;
end;
$$;

revoke execute on function public.crear_taller(text, text, text, text) from anon;
grant execute on function public.crear_taller(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Aceptar una invitación
-- ---------------------------------------------------------------------------

create or replace function public.aceptar_invitacion(p_token text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_inv    public.invitacion;
  v_user   uuid := auth.uid();
  v_email  text;
begin
  if v_user is null then
    raise exception 'Sesión requerida' using errcode = 'insufficient_privilege';
  end if;

  select * into v_inv
  from public.invitacion
  where token = p_token
    and aceptada_en is null
    and expira_en > now();

  -- Mensaje único a propósito: distinguir "no existe" de "venció" le dice a
  -- quien prueba tokens cuáles existieron alguna vez.
  if v_inv.id is null then
    raise exception 'Invitación inválida o vencida';
  end if;

  select email into v_email from auth.users where id = v_user;

  if lower(v_email) <> lower(v_inv.email) then
    raise exception 'Invitación inválida o vencida';
  end if;

  if exists (select 1 from public.perfil where user_id = v_user) then
    raise exception 'Este usuario ya pertenece a un taller'
      using errcode = 'unique_violation';
  end if;

  insert into public.perfil (user_id, taller_id, rol)
  values (v_user, v_inv.taller_id, v_inv.rol);

  update public.invitacion set aceptada_en = now() where id = v_inv.id;

  return v_inv.taller_id;
end;
$$;

revoke execute on function public.aceptar_invitacion(text) from anon;
grant execute on function public.aceptar_invitacion(text) to authenticated;
