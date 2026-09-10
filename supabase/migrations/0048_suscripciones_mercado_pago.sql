-- ============================================================================
-- 0048 — Suscripciones SaaS con Mercado Pago y Prueba Gratuita de 7 Días
-- ============================================================================

-- 1. Ampliar tabla taller con columnas de facturación SaaS
alter table public.taller
  add column if not exists trial_fin timestamptz not null default (now() + interval '7 days'),
  add column if not exists suscripcion_fin timestamptz,
  add column if not exists mp_preapproval_id text,
  add column if not exists mp_payer_id text,
  add column if not exists mp_subscription_status text default 'trial';

-- Cambiar el default de estado_suscripcion para que nuevas altas comiencen en 'trial'
alter table public.taller
  alter column estado_suscripcion set default 'trial';

-- Para talleres existentes, asegurar que tengan al menos 7 días de gracia desde ahora si estaban en trial
update public.taller
set trial_fin = now() + interval '7 days'
where trial_fin is null or trial_fin < now();

create index if not exists idx_taller_mp_preapproval
  on public.taller (mp_preapproval_id)
  where mp_preapproval_id is not null;

-- 2. Tabla de auditoría para eventos y webhooks de suscripción
create table if not exists public.taller_suscripcion_evento (
  id           uuid primary key default gen_random_uuid(),
  taller_id    uuid not null references public.taller (id) on delete cascade,
  mp_id        text,
  tipo         text not null, -- 'subscription_preapproval', 'payment', etc.
  estado       text not null, -- 'authorized', 'paused', 'cancelled', etc.
  monto        numeric(12,2),
  payload      jsonb not null default '{}'::jsonb,
  creado_en    timestamptz not null default now()
);

create index if not exists idx_taller_suscripcion_evento_taller
  on public.taller_suscripcion_evento (taller_id, creado_en desc);

-- 3. Habilitar RLS en taller_suscripcion_evento
alter table public.taller_suscripcion_evento enable row level security;

drop policy if exists taller_suscripcion_evento_select on public.taller_suscripcion_evento;
create policy taller_suscripcion_evento_select on public.taller_suscripcion_evento
  for select to authenticated
  using (
    taller_id = (select taller_id from public.perfil where user_id = auth.uid())
  );

-- Las inserciones las realiza el servidor mediante Service Role Key (webhook).

-- 4. Actualizar función crear_taller para inicializar explícitamente el trial
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

  insert into public.taller (
    nombre,
    telefono,
    cuit,
    plan,
    estado_suscripcion,
    trial_fin,
    mp_subscription_status
  )
  values (
    trim(p_nombre),
    p_telefono,
    p_cuit,
    'trial',
    'trial',
    now() + interval '7 days',
    'trial'
  )
  returning id into v_taller;

  insert into public.perfil (user_id, taller_id, rol, nombre)
  values (v_user, v_taller, 'dueno', coalesce(nullif(trim(p_nombre_usuario), ''), ''));

  perform public.crear_checklist_default(v_taller);

  return v_taller;
end;
$$;
