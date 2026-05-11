-- 1. users: lectura solo propio o admin
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "consolidated_users_select_authenticated" ON public.users;

CREATE POLICY "users_select"
ON public.users FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.up_is_admin(auth.uid())
);

-- 2. evaluaciones: lectura con scope de empresa
DROP POLICY IF EXISTS "consolidated_evaluaciones_select_authenticated" ON public.evaluaciones;

CREATE POLICY "evaluaciones_select"
ON public.evaluaciones FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR public.up_has_empresa(auth.uid(),
       (SELECT e.nombre FROM public.empresas e WHERE e.id = evaluaciones.empresa_id))
  OR EXISTS (
    SELECT 1 FROM public.equipos eq
    WHERE eq.id = evaluaciones.equipo_id
      AND public.up_has_empresa(auth.uid(),
            (SELECT e.nombre FROM public.empresas e WHERE e.id = eq.empresa_id))
  )
);

-- 3. calibraciones: lectura con scope de empresa via empleado->tablero->equipo->empresa
DROP POLICY IF EXISTS "calibraciones_select" ON public.calibraciones;
DROP POLICY IF EXISTS "consolidated_calibraciones_select_authenticated" ON public.calibraciones;

CREATE POLICY "calibraciones_select"
ON public.calibraciones FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR (
    (public.up_has_role(auth.uid(), 'hrbp') OR public.up_has_role(auth.uid(), 'manager'))
    AND EXISTS (
      SELECT 1
      FROM public.empleados emp
      JOIN public.tableros t ON t.id = emp.tablero_id
      JOIN public.equipos eq ON eq.id = t.equipo_id
      JOIN public.empresas e ON e.id = eq.empresa_id
      WHERE emp.id = calibraciones.empleado_id
        AND public.up_has_empresa(auth.uid(), e.nombre)
    )
  )
);

-- 4. Realtime: quitar evaluaciones de la publicación
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'evaluaciones'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.evaluaciones';
  END IF;
END $$;