-- ============================================================================
-- 0046 — Índices de Foreign Keys y rendimiento de queries
--
-- Agrega índices B-Tree en las claves foráneas que no contaban con índice
-- en su columna líder. Esto elimina los table scans (SeqScan) en operaciones
-- de eliminación en cascada (ON DELETE CASCADE / SET NULL), búsquedas de
-- relaciones inversas y joins multi-tenant.
-- ============================================================================

-- Compras y proveedores
create index if not exists idx_compra_proveedor on public.compra (proveedor_id) where proveedor_id is not null;
create index if not exists idx_compra_creado_por on public.compra (creado_por) where creado_por is not null;
create index if not exists idx_compra_item_producto on public.compra_item (producto_id);
create index if not exists idx_compra_item_taller on public.compra_item (taller_id);
create index if not exists idx_compra_foto_subido_por on public.compra_foto (subido_por) where subido_por is not null;

-- Movimientos de stock y catálogo
create index if not exists idx_movimiento_stock_compra on public.movimiento_stock (compra_id) where compra_id is not null;
create index if not exists idx_movimiento_stock_usuario on public.movimiento_stock (usuario_id) where usuario_id is not null;
create index if not exists idx_producto_equivalencia_taller on public.producto_equivalencia (taller_id);
create index if not exists idx_filtro_equivalencia_taller on public.filtro_equivalencia (taller_origen_id) where taller_origen_id is not null;
create index if not exists idx_modelo_fusionado on public.modelo (fusionado_en_id) where fusionado_en_id is not null;
create index if not exists idx_motorizacion_fusionado on public.motorizacion (fusionado_en_id) where fusionado_en_id is not null;

-- Órdenes de trabajo y componentes
create index if not exists idx_orden_trabajo_creado_por on public.orden_trabajo (creado_por) where creado_por is not null;
create index if not exists idx_ot_item_taller on public.ot_item (taller_id);
create index if not exists idx_ot_item_creado_por on public.ot_item (creado_por) where creado_por is not null;
create index if not exists idx_ot_checklist_item on public.ot_checklist (item_id) where item_id is not null;
create index if not exists idx_ot_checklist_actualizado_por on public.ot_checklist (actualizado_por) where actualizado_por is not null;
create index if not exists idx_ot_estado_log_taller on public.ot_estado_log (taller_id);
create index if not exists idx_ot_estado_log_usuario on public.ot_estado_log (usuario_id) where usuario_id is not null;
create index if not exists idx_ot_foto_taller on public.ot_foto (taller_id);
create index if not exists idx_ot_foto_subido_por on public.ot_foto (subido_por) where subido_por is not null;
create index if not exists idx_ot_nota_taller on public.ot_nota (taller_id);
create index if not exists idx_ot_nota_creado_por on public.ot_nota (creado_por) where creado_por is not null;
create index if not exists idx_ot_nota_responde_a on public.ot_nota (responde_a_id) where responde_a_id is not null;
create index if not exists idx_ot_recepcion_taller on public.ot_recepcion (taller_id);
create index if not exists idx_ot_recepcion_recibido_por on public.ot_recepcion (recibido_por) where recibido_por is not null;
create index if not exists idx_ot_sugerencia_ia_creado_por on public.ot_sugerencia_ia (creado_por) where creado_por is not null;

-- Checklist plantilla
create index if not exists idx_checklist_plantilla_item_taller on public.checklist_plantilla_item (taller_id);

-- Pagos y caja
create index if not exists idx_pago_usuario on public.pago (usuario_id) where usuario_id is not null;
create index if not exists idx_cierre_caja_usuario on public.cierre_caja (usuario_id) where usuario_id is not null;

-- Recordatorios y turnos
create index if not exists idx_recordatorio_ot_origen on public.recordatorio (ot_origen_id) where ot_origen_id is not null;
create index if not exists idx_turno_cliente on public.turno (cliente_id) where cliente_id is not null;
create index if not exists idx_turno_vehiculo on public.turno (vehiculo_id) where vehiculo_id is not null;

-- Vehículos y vínculos
create index if not exists idx_vehiculo_marca on public.vehiculo (marca_id) where marca_id is not null;
create index if not exists idx_vehiculo_cliente_taller on public.vehiculo_cliente (taller_id);
