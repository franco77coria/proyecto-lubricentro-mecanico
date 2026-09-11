-- ============================================================================
-- 0052 — Número de Motor en Vehículo
--
-- Al escanear la cédula verde o recibir un vehículo en recepción, el número
-- de motor (ej: K4MV838R079119) identifica unívocamente la planta motriz física
-- y es requerido para la documentación técnica y peritaje.
-- ============================================================================

alter table public.vehiculo
  add column if not exists motor text;
