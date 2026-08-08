-- ============================================================================
-- 0016 — Precio en los trabajos recomendados
--
-- `ot_nota` de tipo 'recomendado' guarda lo que el taller detectó pero el
-- cliente no autorizó ahora. Sin un precio al lado es solo una anotación
-- interna; con precio se convierte en un presupuesto que el cliente se lleva
-- y puede aprobar después.
--
-- Es la mejor herramienta de venta que tiene el taller: "quedó pendiente
-- cambiar los amortiguadores, son $X".
-- ============================================================================

alter table public.ot_nota
  add column if not exists precio_estimado numeric(12,2)
    check (precio_estimado is null or precio_estimado >= 0);

comment on column public.ot_nota.precio_estimado is
  'Solo para tipo=recomendado: presupuesto del trabajo no autorizado.';

-- ---------------------------------------------------------------------------
-- Presupuesto de lo recomendado
--
-- Se calcula en la base y no en la app para que el PDF, la pantalla y
-- cualquier reporte muestren siempre el mismo número.
-- ---------------------------------------------------------------------------

create or replace function public.total_recomendado(p_ot uuid)
returns numeric
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(sum(precio_estimado), 0)
  from public.ot_nota
  where ot_id = p_ot
    and tipo = 'recomendado'
    and precio_estimado is not null;
$$;

grant execute on function public.total_recomendado(uuid) to authenticated;
