-- ============================================================================
-- 0015 — Mover stock queda reservado a dueño y mostrador
--
-- La app ya lo impedía desde el Server Action, pero la política de RLS seguía
-- permitiendo a cualquier miembro del taller insertar movimientos. Un Server
-- Action se invoca con un POST directo: "la pantalla no lo muestra" no es un
-- control. El mecánico ve el stock para saber si hay repuesto, pero no lo
-- corrige.
--
-- El consumo automático al cargar un repuesto NO se ve afectado: lo hace un
-- trigger SECURITY DEFINER, que corre como owner.
-- ============================================================================

drop policy if exists movimiento_stock_taller on public.movimiento_stock;

create policy movimiento_stock_select on public.movimiento_stock
  for select to authenticated
  using (taller_id = public.taller_actual());

create policy movimiento_stock_escribe on public.movimiento_stock
  for all to authenticated
  using (
    taller_id = public.taller_actual()
    and public.rol_actual() in ('dueno', 'mostrador')
  )
  with check (
    taller_id = public.taller_actual()
    and public.rol_actual() in ('dueno', 'mostrador')
  );
