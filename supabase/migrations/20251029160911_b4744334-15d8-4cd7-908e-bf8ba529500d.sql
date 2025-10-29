-- BORRA POLÍTICA ANTERIOR
DROP POLICY IF EXISTS "acceso_tableros_por_equipo" ON public.tableros;
DROP POLICY IF EXISTS "tatiana_crea_tableros" ON public.tableros;

-- NUEVA POLÍTICA: USAR ROL 'manager'
CREATE POLICY "manager_controla_cchh" ON public.tableros
FOR ALL TO authenticated
USING (
  -- 1. Manager: ve TODO (incluido CCHH)
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'manager'
  )
  
  OR
  
  -- 2. HRBP: ve sus equipos, PERO NO CCHH
  (
    EXISTS (
      SELECT 1 FROM public.empresas_usuarios eu
      JOIN public.equipos eq ON eu.empresa_id = eq.empresa_id
      WHERE eu.user_id = auth.uid()
        AND eq.id = public.tableros.equipo_id
        AND eq.nombre NOT ILIKE '%capital humano%'
    )
  )
)
-- CREAR: SOLO manager
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'manager'
  )
);