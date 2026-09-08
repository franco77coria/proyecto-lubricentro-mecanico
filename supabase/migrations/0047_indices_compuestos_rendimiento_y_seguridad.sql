-- ============================================================================
-- 0047 — Índices compuestos para rendimiento multi-tenant y seguridad
--
-- Agrega índices B-Tree compuestos para optimizar queries de alto tráfico
-- que filtran por taller_id y claves de relación (vehículo, OT, estado),
-- reduciendo table scans y acelerando el aislamiento multi-tenant.
-- ============================================================================

-- Órdenes de trabajo por vehículo dentro de un taller específico
create index if not exists idx_orden_trabajo_taller_vehiculo
  on public.orden_trabajo (taller_id, vehiculo_id, fecha_ingreso desc);

-- Dueño vigente de un vehículo dentro del taller
create index if not exists idx_vehiculo_cliente_taller_vigente
  on public.vehiculo_cliente (taller_id, vehiculo_id)
  where hasta is null;

-- Notas de una OT dentro de un taller ordenadas cronológicamente
create index if not exists idx_ot_nota_taller_ot
  on public.ot_nota (taller_id, ot_id, orden);

-- Checklist de una OT dentro de un taller
create index if not exists idx_ot_checklist_taller_ot
  on public.ot_checklist (taller_id, ot_id, orden);

-- Pagos de una OT dentro de un taller
create index if not exists idx_pago_taller_ot
  on public.pago (taller_id, ot_id);
