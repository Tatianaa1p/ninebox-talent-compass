-- ROLLBACK: Eliminar políticas restrictivas
DROP POLICY IF EXISTS "acceso_evaluaciones_por_equipo" ON public.evaluaciones;
DROP POLICY IF EXISTS "manager_controla_evaluaciones" ON public.evaluaciones;

-- RECREAR políticas que permitan calibración
CREATE POLICY "managers_hrbp_pueden_calibrar" ON public.evaluaciones
FOR ALL TO authenticated
USING (
  -- Pueden VER: Managers, HRBPs con acceso a la empresa del equipo
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('manager', 'hrbp')
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.empresas_usuarios eu
    JOIN public.equipos eq ON eu.empresa_id = eq.empresa_id
    WHERE eu.user_id = auth.uid()
      AND eq.id = public.evaluaciones.equipo_id
  )
)
WITH CHECK (
  -- Pueden CREAR/ACTUALIZAR: Managers o HRBPs con permiso calibrar_ninebox
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'manager'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_permissions up
    WHERE up.user_id = auth.uid()
      AND (up.permisos_globales->>'calibrar_ninebox')::boolean = true
  )
);