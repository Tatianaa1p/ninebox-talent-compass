-- BORRA POLÍTICAS ANTERIORES DE TABLEROS Y EVALUACIONES
DROP POLICY IF EXISTS "bloqueo_cchh_tableros" ON public.tableros;
DROP POLICY IF EXISTS "bloqueo_cchh_evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "acceso_controlado_tableros" ON public.tableros;
DROP POLICY IF EXISTS "acceso_controlado_evaluaciones" ON public.evaluaciones;

-- POLÍTICA: TABLEROS (filtrado por equipo)
CREATE POLICY "acceso_tableros_por_equipo" ON public.tableros
FOR ALL TO authenticated
USING (
  -- 1. Tatiana: ve TODO (incluido Capital Humano)
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
  
  OR
  
  -- 2. Otros HRBP: ven tableros de equipos de su empresa, EXCEPTO "Capital Humano"
  EXISTS (
    SELECT 1 
    FROM public.empresas_usuarios eu
    JOIN public.equipos eq ON eu.empresa_id = eq.empresa_id
    WHERE eu.user_id = auth.uid()
      AND eq.id = public.tableros.equipo_id
      AND eq.nombre NOT ILIKE '%capital humano%'
  )
)
WITH CHECK (
  -- Solo Tatiana puede crear/editar tableros de Capital Humano
  (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
  
  OR
  
  -- HRBP con permisos pueden crear/editar (excepto Capital Humano)
  (
    user_has_permission(auth.uid(), 'crear_tableros')
    AND EXISTS (
      SELECT 1 
      FROM public.empresas_usuarios eu
      JOIN public.equipos eq ON eu.empresa_id = eq.empresa_id
      WHERE eu.user_id = auth.uid()
        AND eq.id = public.tableros.equipo_id
        AND eq.nombre NOT ILIKE '%capital humano%'
    )
  )
);

-- POLÍTICA: EVALUACIONES (filtrado por equipo del tablero)
CREATE POLICY "acceso_evaluaciones_por_equipo" ON public.evaluaciones
FOR ALL TO authenticated
USING (
  -- 1. Tatiana: ve TODO de Capital Humano
  (
    (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
    AND tablero_id IN (
      SELECT t.id FROM public.tableros t
      JOIN public.equipos eq ON t.equipo_id = eq.id
      WHERE eq.nombre ILIKE '%capital humano%'
    )
  )
  
  OR
  
  -- 2. Otros HRBP: ven evaluaciones de equipos de su empresa, EXCEPTO Capital Humano
  EXISTS (
    SELECT 1 
    FROM public.empresas_usuarios eu
    JOIN public.equipos eq ON eu.empresa_id = eq.empresa_id
    JOIN public.tableros t ON t.equipo_id = eq.id
    WHERE eu.user_id = auth.uid()
      AND t.id = public.evaluaciones.tablero_id
      AND eq.nombre NOT ILIKE '%capital humano%'
  )
)
WITH CHECK (
  -- Solo Tatiana puede crear/editar evaluaciones de Capital Humano
  (
    (SELECT email FROM public.profiles WHERE user_id = auth.uid()) = 'tatiana.pina@seidor.com'
    AND tablero_id IN (
      SELECT t.id FROM public.tableros t
      JOIN public.equipos eq ON t.equipo_id = eq.id
      WHERE eq.nombre ILIKE '%capital humano%'
    )
  )
  
  OR
  
  -- HRBP con permisos pueden crear/editar (excepto Capital Humano)
  (
    (user_has_permission(auth.uid(), 'calibrar_tableros') OR user_has_permission(auth.uid(), 'calibrar_ninebox'))
    AND EXISTS (
      SELECT 1 
      FROM public.empresas_usuarios eu
      JOIN public.equipos eq ON eu.empresa_id = eq.empresa_id
      JOIN public.tableros t ON t.equipo_id = eq.id
      WHERE eu.user_id = auth.uid()
        AND t.id = public.evaluaciones.tablero_id
        AND eq.nombre NOT ILIKE '%capital humano%'
    )
  )
);