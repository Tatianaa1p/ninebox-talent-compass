DROP POLICY IF EXISTS "equipos_modify" ON public.equipos;
DROP POLICY IF EXISTS "equipos_select" ON public.equipos;
DROP POLICY IF EXISTS "equipos_insert_update" ON public.equipos;
DROP POLICY IF EXISTS "equipos_delete" ON public.equipos;

CREATE POLICY "equipos_select"
ON public.equipos FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = equipos.empresa_id
      AND public.up_has_empresa(auth.uid(), e.nombre)
  )
);

CREATE POLICY "equipos_insert"
ON public.equipos FOR INSERT TO authenticated
WITH CHECK (
  public.up_is_admin(auth.uid())
  OR (
    public.up_has_role(auth.uid(), 'hrbp')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = equipos.empresa_id
        AND public.up_has_empresa(auth.uid(), e.nombre)
    )
  )
);

CREATE POLICY "equipos_update"
ON public.equipos FOR UPDATE TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR (
    public.up_has_role(auth.uid(), 'hrbp')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = equipos.empresa_id
        AND public.up_has_empresa(auth.uid(), e.nombre)
    )
  )
)
WITH CHECK (
  public.up_is_admin(auth.uid())
  OR (
    public.up_has_role(auth.uid(), 'hrbp')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = equipos.empresa_id
        AND public.up_has_empresa(auth.uid(), e.nombre)
    )
  )
);

CREATE POLICY "equipos_delete"
ON public.equipos FOR DELETE TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR (
    (public.up_has_role(auth.uid(), 'hrbp') OR public.up_has_role(auth.uid(), 'manager'))
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.id = equipos.empresa_id
        AND public.up_has_empresa(auth.uid(), e.nombre)
    )
  )
);