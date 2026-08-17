-- ==============================================================================
-- 0040_compras_fotos_y_peritaje.sql
-- Tabla para comprobantes físicos de compras, campos de peritaje IA en OT
-- y fix para no descontar stock en presupuestos
-- ==============================================================================

-- 1. Tabla compra_foto para remitos y facturas de compras
CREATE TABLE IF NOT EXISTS public.compra_foto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id uuid NOT NULL REFERENCES public.taller(id) ON DELETE CASCADE,
  compra_id uuid NOT NULL REFERENCES public.compra(id) ON DELETE CASCADE,
  path text NOT NULL,
  nota text,
  subido_por uuid REFERENCES public.perfil(user_id) ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compra_foto_compra ON public.compra_foto(compra_id);
CREATE INDEX IF NOT EXISTS idx_compra_foto_taller ON public.compra_foto(taller_id);

GRANT ALL ON TABLE public.compra_foto TO postgres, authenticated, service_role;

ALTER TABLE public.compra_foto ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'compra_foto' AND policyname = 'compra_foto_taller_access'
  ) THEN
    CREATE POLICY compra_foto_taller_access ON public.compra_foto
      FOR ALL TO authenticated
      USING (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      )
      WITH CHECK (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- 2. Campos de peritaje visual de recepción en orden_trabajo
ALTER TABLE public.orden_trabajo
  ADD COLUMN IF NOT EXISTS peritaje_ia jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS inspeccion_recepcion jsonb DEFAULT NULL;

-- 3. Fix en sincronizar_consumo_stock: NO descontar stock si la OT está en estado 'presupuesto'
CREATE OR REPLACE FUNCTION public.sincronizar_consumo_stock()
RETURNS trigger AS $$
DECLARE
  v_estado text;
  v_taller_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT estado, taller_id INTO v_estado, v_taller_id
    FROM public.orden_trabajo WHERE id = OLD.ot_id;
  ELSE
    SELECT estado, taller_id INTO v_estado, v_taller_id
    FROM public.orden_trabajo WHERE id = NEW.ot_id;
  END IF;

  -- Si es un presupuesto, no reservar ni descontar stock del inventario
  IF v_estado = 'presupuesto' THEN
    RETURN coalesce(NEW, OLD);
  END IF;

  -- Si se inserta o modifica un item con producto_id
  IF TG_OP = 'INSERT' AND NEW.producto_id IS NOT NULL THEN
    INSERT INTO public.movimiento_stock (taller_id, producto_id, tipo, cantidad, motivo, ot_id, usuario_id)
    VALUES (v_taller_id, NEW.producto_id, 'consumo_ot', -NEW.cantidad, 'Consumo en OT #' || NEW.ot_id, NEW.ot_id, NEW.creado_por);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.producto_id IS NOT NULL AND NEW.producto_id IS NULL THEN
      -- Se removió el producto: reingresar el stock
      INSERT INTO public.movimiento_stock (taller_id, producto_id, tipo, cantidad, motivo, ot_id, usuario_id)
      VALUES (v_taller_id, OLD.producto_id, 'ajuste_positivo', OLD.cantidad, 'Item removido de OT #' || OLD.ot_id, OLD.ot_id, coalesce(NEW.creado_por, OLD.creado_por));
    ELSIF OLD.producto_id IS NOT NULL AND NEW.producto_id IS NOT NULL AND (OLD.cantidad <> NEW.cantidad) THEN
      -- Ajustar diferencia
      INSERT INTO public.movimiento_stock (taller_id, producto_id, tipo, cantidad, motivo, ot_id, usuario_id)
      VALUES (v_taller_id, NEW.producto_id, 'consumo_ot', -(NEW.cantidad - OLD.cantidad), 'Ajuste de cantidad en OT #' || NEW.ot_id, NEW.ot_id, coalesce(NEW.creado_por, OLD.creado_por));
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.producto_id IS NOT NULL THEN
    -- Se borró el item: reponer
    INSERT INTO public.movimiento_stock (taller_id, producto_id, tipo, cantidad, motivo, ot_id, usuario_id)
    VALUES (v_taller_id, OLD.producto_id, 'ajuste_positivo', OLD.cantidad, 'Cancelación de item en OT #' || OLD.ot_id, OLD.ot_id, OLD.creado_por);
  END IF;

  RETURN coalesce(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
