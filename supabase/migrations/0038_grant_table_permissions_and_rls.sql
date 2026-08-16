-- ==============================================================================
-- 0038_grant_table_permissions_and_rls.sql
-- Garantiza permisos completos a los roles autenticados en todas las tablas del taller
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, authenticated, service_role;

-- RLS policies para ot_item, ot_checklist, ot_nota
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ot_item' AND policyname = 'ot_item_taller_access'
  ) THEN
    ALTER TABLE public.ot_item ENABLE ROW LEVEL SECURITY;
    CREATE POLICY ot_item_taller_access ON public.ot_item
      FOR ALL TO authenticated
      USING (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      )
      WITH CHECK (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ot_nota' AND policyname = 'ot_nota_taller_access'
  ) THEN
    ALTER TABLE public.ot_nota ENABLE ROW LEVEL SECURITY;
    CREATE POLICY ot_nota_taller_access ON public.ot_nota
      FOR ALL TO authenticated
      USING (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      )
      WITH CHECK (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ot_checklist' AND policyname = 'ot_checklist_taller_access'
  ) THEN
    ALTER TABLE public.ot_checklist ENABLE ROW LEVEL SECURITY;
    CREATE POLICY ot_checklist_taller_access ON public.ot_checklist
      FOR ALL TO authenticated
      USING (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      )
      WITH CHECK (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      );
  END IF;
END $$;
