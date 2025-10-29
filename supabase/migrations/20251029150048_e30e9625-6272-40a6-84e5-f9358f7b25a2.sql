-- PASO 1: BORRA POLÍTICAS ANTERIORES DE TABLEROS (si existen)
DROP POLICY IF EXISTS "tatiana_only_cchh" ON public.tableros;
DROP POLICY IF EXISTS "tatiana_access_cchh" ON public.tableros;
DROP POLICY IF EXISTS "Users can view tableros in allowed empresas" ON public.tableros;
DROP POLICY IF EXISTS "Users with permissions can manage tableros" ON public.tableros;

-- PASO 2: POLÍTICA PARA TATIANA - Acceso TOTAL a Capital Humano
CREATE POLICY "tatiana_full_access_cchh" ON public.tableros
FOR ALL TO authenticated
USING (
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
  AND (nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%')
)
WITH CHECK (
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
);

-- PASO 3: POLÍTICA PARA OTROS HRBP - Ven tableros de empresas_acceso EXCEPTO Capital Humano
CREATE POLICY "hrbp_view_tableros_except_cchh" ON public.tableros
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR 
   (EXISTS (
     SELECT 1 FROM empresas e
     WHERE e.id = tableros.empresa_id 
     AND user_has_empresa_access(auth.uid(), e.nombre)
   )))
  AND NOT (nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%')
);

-- PASO 4: POLÍTICA PARA OTROS HRBP - Editan tableros de empresas_acceso EXCEPTO Capital Humano
CREATE POLICY "hrbp_manage_tableros_except_cchh" ON public.tableros
FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR 
   (user_has_permission(auth.uid(), 'crear_tableros'::text) AND 
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = tableros.empresa_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )))
  AND NOT (nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%')
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR 
   (user_has_permission(auth.uid(), 'crear_tableros'::text) AND 
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = tableros.empresa_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )))
  AND NOT (nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%')
);

-- PASO 5: BORRA POLÍTICAS ANTERIORES DE EVALUACIONES (si existen)
DROP POLICY IF EXISTS "tatiana_only_cchh_evals" ON public.evaluaciones;
DROP POLICY IF EXISTS "tatiana_access_cchh_evals" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users can view evaluaciones in allowed empresas" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users with permissions can manage evaluaciones" ON public.evaluaciones;

-- PASO 6: POLÍTICA PARA TATIANA - Acceso TOTAL a evaluaciones de Capital Humano
CREATE POLICY "tatiana_full_access_cchh_evals" ON public.evaluaciones
FOR ALL TO authenticated
USING (
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
  AND tablero_id IN (
    SELECT id FROM public.tableros 
    WHERE nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%'
  )
)
WITH CHECK (
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
);

-- PASO 7: POLÍTICA PARA OTROS HRBP - Ven evaluaciones de empresas_acceso EXCEPTO Capital Humano
CREATE POLICY "hrbp_view_evals_except_cchh" ON public.evaluaciones
FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR 
   (EXISTS (
     SELECT 1 FROM empresas e
     WHERE e.id = evaluaciones.empresa_id 
     AND user_has_empresa_access(auth.uid(), e.nombre)
   )))
  AND tablero_id NOT IN (
    SELECT id FROM public.tableros 
    WHERE nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%'
  )
);

-- PASO 8: POLÍTICA PARA OTROS HRBP - Editan evaluaciones de empresas_acceso EXCEPTO Capital Humano
CREATE POLICY "hrbp_manage_evals_except_cchh" ON public.evaluaciones
FOR ALL TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR 
   ((user_has_permission(auth.uid(), 'calibrar_tableros'::text) OR 
     user_has_permission(auth.uid(), 'calibrar_ninebox'::text)) AND 
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = evaluaciones.empresa_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )))
  AND tablero_id NOT IN (
    SELECT id FROM public.tableros 
    WHERE nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%'
  )
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR 
   ((user_has_permission(auth.uid(), 'calibrar_tableros'::text) OR 
     user_has_permission(auth.uid(), 'calibrar_ninebox'::text)) AND 
    EXISTS (
      SELECT 1 FROM empresas e
      WHERE e.id = evaluaciones.empresa_id 
      AND user_has_empresa_access(auth.uid(), e.nombre)
    )))
  AND tablero_id NOT IN (
    SELECT id FROM public.tableros 
    WHERE nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%'
  )
);