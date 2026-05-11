-- Parte A: drops idempotentes (no existen función ni triggers)
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Parte B: política UPDATE de evaluaciones con validación de empresa
DROP POLICY IF EXISTS "consolidated_evaluaciones_update_authenticated" ON public.evaluaciones;
DROP POLICY IF EXISTS "evaluaciones_update" ON public.evaluaciones;

CREATE POLICY "evaluaciones_update"
ON public.evaluaciones FOR UPDATE TO authenticated
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
    AND public.up_has_permission(auth.uid(), 'calibrar_tableros')
  )
)
WITH CHECK (
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
    AND public.up_has_permission(auth.uid(), 'calibrar_tableros')
  )
);