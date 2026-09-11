-- ===========================================================================
-- Migración 0053: Estandarización de Códigos de OT y Presupuestos
-- Formato: [PREFIJO]-[AAAAMMDD]-[TENANT]-[CORRELATIVO]
-- Ejemplo: OT-20260911-T01-0042 / PR-20260911-T01-0042
-- ===========================================================================

-- 1. Agregar columna de código de tenant al taller si no existe
alter table public.taller add column if not exists codigo text;

-- Inicializar códigos correlativos amigables para los talleres existentes que no tengan código
with talleres_ordenados as (
  select id, row_number() over (order by creado_en asc) as rnum
  from public.taller
  where codigo is null or trim(codigo) = ''
)
update public.taller t
set codigo = 'T' || lpad(to_hex(rnum)::text, 2, '0')
from talleres_ordenados o
where t.id = o.id;

-- 2. Tabla para llevar correlativos diarios por taller y prefijo de documento
create table if not exists public.taller_contador_documento (
  taller_id uuid not null references public.taller (id) on delete cascade,
  fecha_dia text not null, -- 'YYYYMMDD'
  prefijo text not null,   -- 'OT' o 'PR'
  ultimo integer not null default 0,
  primary key (taller_id, fecha_dia, prefijo)
);

alter table public.taller_contador_documento enable row level security;

-- 3. Función generadora de números de documento estandarizados
create or replace function public.siguiente_numero_documento(p_taller uuid, p_prefijo text default 'OT')
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_prefijo  text := upper(coalesce(nullif(trim(p_prefijo), ''), 'OT'));
  v_fecha    text := to_char(now() at time zone 'America/Argentina/Buenos_Aires', 'YYYYMMDD');
  v_tenant   text;
  v_numero   integer;
begin
  -- Obtener código de taller configurado (ej: 'T01', 'T02') o fallback seguro
  select upper(coalesce(nullif(trim(codigo), ''), 'T' || substring(id::text from 1 for 2)))
  into v_tenant
  from public.taller
  where id = p_taller;

  if v_tenant is null or trim(v_tenant) = '' then
    v_tenant := 'T01';
  end if;

  -- Incrementar contador correlativo diario
  insert into public.taller_contador_documento (taller_id, fecha_dia, prefijo, ultimo)
  values (p_taller, v_fecha, v_prefijo, 1)
  on conflict (taller_id, fecha_dia, prefijo)
    do update set ultimo = public.taller_contador_documento.ultimo + 1
  returning ultimo into v_numero;

  return v_prefijo || '-' || v_fecha || '-' || v_tenant || '-' || lpad(v_numero::text, 4, '0');
end;
$$;

-- Compatibilidad con la función anterior
create or replace function public.siguiente_numero_ot(p_taller uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  return public.siguiente_numero_documento(p_taller, 'OT');
end;
$$;

-- 4. Actualizar trigger para asignar el formato según el estado
create or replace function public.asignar_numero_ot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.numero is null or trim(new.numero) = '' then
    if new.estado = 'presupuesto' then
      new.numero := public.siguiente_numero_documento(new.taller_id, 'PR');
    else
      new.numero := public.siguiente_numero_documento(new.taller_id, 'OT');
    end if;
  end if;
  return new;
end;
$$;
