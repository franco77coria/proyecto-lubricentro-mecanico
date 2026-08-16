-- ==============================================================================
-- 0039_roles_vistas_y_auditoria_actividad.sql
-- Vistas permitidas por perfil y registro de tiempo de uso activo en fosa/taller
-- ==============================================================================

-- 1. Agregar columna vistas_permitidas en tabla perfil
ALTER TABLE public.perfil
  ADD COLUMN IF NOT EXISTS vistas_permitidas text[] DEFAULT NULL;

-- 2. Tabla para registrar actividad y telemetría de uso activo por usuario
CREATE TABLE IF NOT EXISTS public.registro_actividad_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id uuid NOT NULL REFERENCES public.taller(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  segundos_activos integer NOT NULL DEFAULT 0,
  ultima_actividad timestamptz NOT NULL DEFAULT now(),
  online_hasta timestamptz NOT NULL DEFAULT now(),
  pantallas_visitadas text[] DEFAULT '{}',
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_actividad_taller_user_fecha UNIQUE (taller_id, user_id, fecha)
);

-- Índices de auditoría
CREATE INDEX IF NOT EXISTS idx_actividad_taller_fecha ON public.registro_actividad_usuario(taller_id, fecha);
CREATE INDEX IF NOT EXISTS idx_actividad_user_fecha ON public.registro_actividad_usuario(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_actividad_online ON public.registro_actividad_usuario(online_hasta);

-- Permisos
GRANT ALL ON TABLE public.registro_actividad_usuario TO postgres, authenticated, service_role;

-- RLS
ALTER TABLE public.registro_actividad_usuario ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registro_actividad_usuario' AND policyname = 'actividad_taller_select'
  ) THEN
    CREATE POLICY actividad_taller_select ON public.registro_actividad_usuario
      FOR SELECT TO authenticated
      USING (
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'registro_actividad_usuario' AND policyname = 'actividad_propia_insert_update'
  ) THEN
    CREATE POLICY actividad_propia_insert_update ON public.registro_actividad_usuario
      FOR ALL TO authenticated
      USING (
        user_id = auth.uid() AND
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      )
      WITH CHECK (
        user_id = auth.uid() AND
        taller_id IN (SELECT taller_id FROM public.perfil WHERE user_id = auth.uid())
      );
  END IF;
END $$;
