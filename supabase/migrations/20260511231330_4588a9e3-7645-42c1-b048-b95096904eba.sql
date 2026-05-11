
-- PASO 1: tabla tablero_permisos
CREATE TABLE IF NOT EXISTS public.tablero_permisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablero_id uuid NOT NULL REFERENCES public.tableros(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tablero_id, user_id)
);

ALTER TABLE public.tablero_permisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tablero_permisos_select"
ON public.tablero_permisos FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.up_is_admin(auth.uid())
);

CREATE POLICY "tablero_permisos_modify"
ON public.tablero_permisos FOR ALL TO authenticated
USING (public.up_is_admin(auth.uid()))
WITH CHECK (public.up_is_admin(auth.uid()));

-- PASO 2: crear equipo y tablero "Cultura y Talento" en Argentina
INSERT INTO public.equipos (nombre, empresa_id)
SELECT 'Cultura y Talento', e.id
FROM public.empresas e
WHERE e.nombre = 'Argentina'
  AND NOT EXISTS (
    SELECT 1 FROM public.equipos eq
    WHERE eq.nombre = 'Cultura y Talento' AND eq.empresa_id = e.id
  );

INSERT INTO public.tableros (nombre, equipo_id, empresa_id, modulo_origen)
SELECT 'Cultura y Talento', eq.id, eq.empresa_id, 'ninebox'
FROM public.equipos eq
WHERE eq.nombre = 'Cultura y Talento'
  AND eq.empresa_id = (SELECT id FROM public.empresas WHERE nombre = 'Argentina')
  AND NOT EXISTS (
    SELECT 1 FROM public.tableros t
    WHERE t.nombre = 'Cultura y Talento' AND t.equipo_id = eq.id
  );

-- PASO 3: permiso exclusivo a tatiana.pina@seidor.com
INSERT INTO public.tablero_permisos (tablero_id, user_id)
SELECT t.id, u.id
FROM public.tableros t
CROSS JOIN auth.users u
WHERE t.nombre = 'Cultura y Talento'
  AND t.equipo_id = (
    SELECT eq.id FROM public.equipos eq
    WHERE eq.nombre = 'Cultura y Talento'
      AND eq.empresa_id = (SELECT id FROM public.empresas WHERE nombre = 'Argentina')
  )
  AND u.email = 'tatiana.pina@seidor.com'
ON CONFLICT (tablero_id, user_id) DO NOTHING;

-- PASO 4: política SELECT de tableros respeta tablero_permisos
DROP POLICY IF EXISTS "Ninebox users can view their tableros" ON public.tableros;

CREATE POLICY "Ninebox users can view their tableros"
ON public.tableros FOR SELECT TO authenticated
USING (
  ((modulo_origen = 'ninebox') OR (modulo_origen IS NULL))
  AND (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.tablero_permisos tp
        WHERE tp.tablero_id = tableros.id
      )
      THEN EXISTS (
        SELECT 1 FROM public.tablero_permisos tp
        WHERE tp.tablero_id = tableros.id
          AND tp.user_id = auth.uid()
      )
      ELSE (
        auth.uid() IN (
          SELECT user_id FROM public.user_permissions
          WHERE role = ANY(ARRAY['hrbp','manager','hrbp_cl','manager_cl'])
        )
        OR EXISTS (
          SELECT 1 FROM public.empresas_usuarios eu
          WHERE eu.user_id = auth.uid()
            AND eu.empresa_id = tableros.empresa_id
        )
        OR EXISTS (
          SELECT 1 FROM public.equipos eq
          JOIN public.empresas_usuarios eu ON eq.empresa_id = eu.empresa_id
          WHERE eu.user_id = auth.uid()
            AND eq.id = tableros.equipo_id
        )
      )
    END
  )
);

-- PASO 5: misma lógica para empleados
DROP POLICY IF EXISTS "empleados_select" ON public.empleados;

CREATE POLICY "empleados_select"
ON public.empleados FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.tablero_permisos tp
        WHERE tp.tablero_id = empleados.tablero_id
      )
      THEN EXISTS (
        SELECT 1 FROM public.tablero_permisos tp
        WHERE tp.tablero_id = empleados.tablero_id
          AND tp.user_id = auth.uid()
      )
      ELSE EXISTS (
        SELECT 1 FROM public.tableros t
        JOIN public.equipos eq ON eq.id = t.equipo_id
        JOIN public.empresas e ON e.id = eq.empresa_id
        WHERE t.id = empleados.tablero_id
          AND public.up_has_empresa(auth.uid(), e.nombre)
      )
    END
  )
);
