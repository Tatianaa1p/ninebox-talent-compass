-- 1. evaluaciones SELECT
DROP POLICY IF EXISTS "evaluaciones_select" ON public.evaluaciones;
DROP POLICY IF EXISTS "consolidated_evaluaciones_select_authenticated" ON public.evaluaciones;

CREATE POLICY "evaluaciones_select"
ON public.evaluaciones FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE (
      e.id = evaluaciones.empresa_id
      OR e.id = (
        SELECT eq.empresa_id FROM public.equipos eq
        WHERE eq.id = evaluaciones.equipo_id
      )
    )
    AND public.up_has_empresa(auth.uid(), e.nombre)
  )
);

-- 2. Realtime hardening
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calibracion_gauss ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.evaluaciones;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.calibracion_gauss;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 3. user_roles lockdown
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_modify" ON public.user_roles;
DROP POLICY IF EXISTS "consolidated_user_roles_insert_authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "consolidated_user_roles_update_authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "consolidated_user_roles_select_authenticated" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

CREATE POLICY "user_roles_select"
ON public.user_roles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.up_is_admin(auth.uid())
);

CREATE POLICY "user_roles_modify"
ON public.user_roles FOR ALL TO authenticated
USING (public.up_is_admin(auth.uid()))
WITH CHECK (public.up_is_admin(auth.uid()));