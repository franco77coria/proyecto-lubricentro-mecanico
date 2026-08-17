-- ============================================================================
-- 0041_placas_y_pais_taller.sql
-- Internacionalización: Flexibilización de patentes globales y configuración de país
-- ============================================================================

-- 1. Relajar el check constraint de patentes para soportar placas de cualquier país
alter table public.vehiculo
  drop constraint if exists vehiculo_patente_formato;

alter table public.vehiculo
  add constraint vehiculo_patente_formato check (
    formato_especial
    or (length(patente_norm) >= 2 and length(patente_norm) <= 12)
  );

-- 2. Agregar configuración de país, idioma y moneda al taller
alter table public.taller
  add column if not exists pais text not null default 'AR',
  add column if not exists idioma text not null default 'es',
  add column if not exists moneda text not null default 'ARS';

-- 3. Comentarios de documentación
comment on column public.taller.pais is 'Código ISO-2 del país del taller (AR, BR, MX, CL, CO, ES, US, etc.)';
comment on column public.taller.idioma is 'Idioma preferido del taller (es, en, pt)';
comment on column public.taller.moneda is 'Moneda principal de facturación (ARS, USD, EUR, BRL, MXN, etc.)';
