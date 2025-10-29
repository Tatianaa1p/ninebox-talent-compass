-- BORRA POLÍTICA ANTERIOR
DROP POLICY IF EXISTS "acceso_tableros_por_equipo" ON public.tableros;

-- NUEVA POLÍTICA: TATIANA PUEDE CREAR, OTROS NO
CREATE POLICY "acceso_tableros_por_equipo" ON public.tableros
FOR ALL TO authenticated
USING (
  -- 1. Tatiana: ve TODO (incluido CCHH)
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
  
  OR
  
  -- 2. HRBP: ve tableros de su empresa, PERO NO CCHH
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
-- PERMITIR CREACIÓN SOLO A TATIANA
WITH CHECK (
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
);