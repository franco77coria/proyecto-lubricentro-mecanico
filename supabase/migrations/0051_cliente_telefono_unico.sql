-- ============================================================================
-- 0051 — Un cliente por teléfono
--
-- El alta rápida de cliente (`crearCliente`, desde /clientes) esperaba un
-- error 23505 para avisar "ya existe un cliente con esos datos" — pero nunca
-- podía llegar: el único índice sobre `cliente.telefono` no era `unique`.
-- Resultado: el mismo teléfono se podía cargar dos veces y el historial de
-- vehículos/órdenes quedaba partido entre dos fichas.
--
-- El alta de vehículo (`resolverOCrearCliente`) sí reconcilia por teléfono
-- antes de crear — esta es la misma regla, pero como la base la sostiene,
-- ningún flujo nuevo puede volver a esquivarla sin darse cuenta.
--
-- Se excluye a los archivados: un cliente dado de baja no debería bloquear
-- que alguien cargue de nuevo ese teléfono para un cliente distinto.
-- ============================================================================

drop index if exists public.cliente_telefono_idx;

create unique index cliente_telefono_uniq_idx on public.cliente (taller_id, telefono)
  where telefono is not null and not archivado;
