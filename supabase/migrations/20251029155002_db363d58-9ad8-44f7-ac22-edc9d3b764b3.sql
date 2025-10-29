-- ELIMINAR TODAS LAS POLÍTICAS ANTERIORES DE TABLEROS
DROP POLICY IF EXISTS "allow_all_temp" ON public.tableros;
DROP POLICY IF EXISTS "tatiana_only_cchh" ON public.tableros;
DROP POLICY IF EXISTS "tatiana_access_cchh" ON public.tableros;
DROP POLICY IF EXISTS "hrbp_view_tableros_except_cchh" ON public.tableros;
DROP POLICY IF EXISTS "hrbp_manage_tableros_except_cchh" ON public.tableros;
DROP POLICY IF EXISTS "tatiana_full_access_cchh" ON public.tableros;
DROP POLICY IF EXISTS "Autenticados editan tableros" ON public.tableros;
DROP POLICY IF EXISTS "Autenticados insertan tableros" ON public.tableros;
DROP POLICY IF EXISTS "Users can view tableros in allowed empresas" ON public.tableros;
DROP POLICY IF EXISTS "Users with permissions can manage tableros" ON public.tableros;

-- ELIMINAR TODAS LAS POLÍTICAS ANTERIORES DE EVALUACIONES
DROP POLICY IF EXISTS "tatiana_access_cchh_evals" ON public.evaluaciones;
DROP POLICY IF EXISTS "hrbp_view_evals_except_cchh" ON public.evaluaciones;
DROP POLICY IF EXISTS "hrbp_manage_evals_except_cchh" ON public.evaluaciones;
DROP POLICY IF EXISTS "tatiana_full_access_cchh_evals" ON public.evaluaciones;
DROP POLICY IF EXISTS "Autenticados editan evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Autenticados insertan evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users can view evaluaciones in allowed empresas" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users with permissions can manage evaluaciones" ON public.evaluaciones;

-- POLÍTICA ÚNICA PARA TABLEROS: Tatiana ve todo, HRBP ven solo sus tableros sin CCHH
CREATE POLICY "acceso_controlado_tableros" ON public.tableros
FOR ALL TO authenticated
USING (
  -- 1. Tatiana ve TODO (incluido CCHH)
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
  
  OR
  
  -- 2. HRBP ve SOLO sus tableros (por empresas_acceso) PERO NO CCHH
  (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = public.tableros.empresa_id
        AND user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND public.tableros.nombre NOT ILIKE '%capital humano%'
    AND public.tableros.nombre NOT ILIKE '%capital%humano%'
  )
)
WITH CHECK (
  -- Solo Tatiana puede crear/editar CCHH
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
  
  OR
  
  -- HRBP con permisos pueden crear/editar tableros (excepto CCHH)
  (
    user_has_permission(auth.uid(), 'crear_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = public.tableros.empresa_id
        AND user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND public.tableros.nombre NOT ILIKE '%capital humano%'
    AND public.tableros.nombre NOT ILIKE '%capital%humano%'
  )
);

-- POLÍTICA ÚNICA PARA EVALUACIONES: Tatiana ve todo CCHH, HRBP ven solo sus evaluaciones sin CCHH
CREATE POLICY "acceso_controlado_evaluaciones" ON public.evaluaciones
FOR ALL TO authenticated
USING (
  -- 1. Tatiana ve TODO de CCHH
  (
    (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
    AND tablero_id IN (
      SELECT id FROM public.tableros 
      WHERE nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%'
    )
  )
  
  OR
  
  -- 2. HRBP ven SOLO sus evaluaciones (excepto CCHH)
  (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = public.evaluaciones.empresa_id
        AND user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND tablero_id NOT IN (
      SELECT id FROM public.tableros 
      WHERE nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%'
    )
  )
)
WITH CHECK (
  -- Solo Tatiana puede crear/editar evaluaciones CCHH
  (
    (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
    AND tablero_id IN (
      SELECT id FROM public.tableros 
      WHERE nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%'
    )
  )
  
  OR
  
  -- HRBP con permisos pueden crear/editar evaluaciones (excepto CCHH)
  (
    (user_has_permission(auth.uid(), 'calibrar_tableros') OR user_has_permission(auth.uid(), 'calibrar_ninebox'))
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = public.evaluaciones.empresa_id
        AND user_has_empresa_access(auth.uid(), e.nombre)
    )
    AND tablero_id NOT IN (
      SELECT id FROM public.tableros 
      WHERE nombre ILIKE '%capital humano%' OR nombre ILIKE '%capital%humano%'
    )
  )
);