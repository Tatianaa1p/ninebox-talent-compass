
DROP POLICY IF EXISTS "Ninebox users can view their tableros" ON public.tableros;
DROP POLICY IF EXISTS "Ninebox users can update tableros" ON public.tableros;
DROP POLICY IF EXISTS "Ninebox users can delete tableros" ON public.tableros;

CREATE POLICY "Ninebox users can view their tableros"
ON public.tableros FOR SELECT TO authenticated
USING (
  ((modulo_origen = 'ninebox') OR (modulo_origen IS NULL))
  AND (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.tablero_permisos tp WHERE tp.tablero_id = tableros.id
      )
      THEN EXISTS (
        SELECT 1 FROM public.tablero_permisos tp
        WHERE tp.tablero_id = tableros.id AND tp.user_id = auth.uid()
      )
      ELSE (
        public.up_is_admin(auth.uid())
        OR (
          auth.uid() IN (
            SELECT user_id FROM public.user_permissions
            WHERE role = ANY(ARRAY['hrbp','manager','hrbp_cl','manager_cl'])
          )
          AND EXISTS (
            SELECT 1 FROM public.equipos eq
            JOIN public.empresas e ON e.id = eq.empresa_id
            WHERE eq.id = tableros.equipo_id
              AND public.up_has_empresa(auth.uid(), e.nombre)
          )
        )
      )
    END
  )
);

CREATE POLICY "Ninebox users can update tableros"
ON public.tableros FOR UPDATE TO authenticated
USING (
  ((modulo_origen = 'ninebox') OR (modulo_origen IS NULL))
  AND (
    public.up_is_admin(auth.uid())
    OR (
      auth.uid() IN (
        SELECT user_id FROM public.user_permissions
        WHERE role = ANY(ARRAY['hrbp','manager','hrbp_cl','manager_cl'])
      )
      AND EXISTS (
        SELECT 1 FROM public.equipos eq
        JOIN public.empresas e ON e.id = eq.empresa_id
        WHERE eq.id = tableros.equipo_id
          AND public.up_has_empresa(auth.uid(), e.nombre)
      )
    )
  )
)
WITH CHECK ((modulo_origen = 'ninebox') OR (modulo_origen IS NULL));

CREATE POLICY "Ninebox users can delete tableros"
ON public.tableros FOR DELETE TO authenticated
USING (
  ((modulo_origen = 'ninebox') OR (modulo_origen IS NULL))
  AND (
    public.up_is_admin(auth.uid())
    OR (
      public.up_has_role(auth.uid(), 'hrbp')
      AND EXISTS (
        SELECT 1 FROM public.equipos eq
        JOIN public.empresas e ON e.id = eq.empresa_id
        WHERE eq.id = tableros.equipo_id
          AND public.up_has_empresa(auth.uid(), e.nombre)
      )
    )
  )
);
