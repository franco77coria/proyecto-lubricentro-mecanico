-- ============================================================================
-- 0049 — Solicitudes Legales: Botón de Baja, Arrepentimiento y Derechos ARCO
-- Ley 24.240 (Defensa del Consumidor), Res. 271/2020, Res. 424/2020 y Ley 25.326
-- ============================================================================

create table if not exists public.solicitud_legal (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('baja', 'arrepentimiento', 'derecho_arco')),
  codigo_tramite text not null unique,
  taller_id      uuid references public.taller (id) on delete set null,
  email          text not null,
  nombre         text not null,
  telefono       text,
  motivo         text,
  estado         text not null default 'registrada' check (estado in ('registrada', 'procesada', 'rechazada')),
  metadata       jsonb not null default '{}'::jsonb,
  ip_hash        text,
  creado_en      timestamptz not null default now()
);

-- Índices para búsqueda rápida de trámites y auditoría
create index if not exists idx_solicitud_legal_codigo
  on public.solicitud_legal (codigo_tramite);

create index if not exists idx_solicitud_legal_email
  on public.solicitud_legal (email, creado_en desc);

create index if not exists idx_solicitud_legal_tipo
  on public.solicitud_legal (tipo, creado_en desc);

-- RLS: Por seguridad y confidencialidad, las solicitudes legales
-- son gestionadas en backend mediante Service Role.
alter table public.solicitud_legal enable row level security;

-- Los usuarios autenticados pueden ver las solicitudes correspondientes a su taller
drop policy if exists solicitud_legal_select_taller on public.solicitud_legal;
create policy solicitud_legal_select_taller on public.solicitud_legal
  for select to authenticated
  using (
    taller_id is not null and
    taller_id = (select taller_id from public.perfil where user_id = auth.uid())
  );
