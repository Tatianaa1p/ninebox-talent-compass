-- 1) calibraciones SELECT
DROP POLICY IF EXISTS "consolidated_calibraciones_select_authenticated" ON public.calibraciones;

CREATE POLICY "calibraciones_select"
ON public.calibraciones FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR auth.uid() IN (
    SELECT user_id FROM public.user_permissions
    WHERE role = ANY(ARRAY['hrbp','manager'])
  )
);

-- 2) talent_notas UPDATE + DELETE
DROP POLICY IF EXISTS "talent_notas_update" ON public.talent_notas;
CREATE POLICY "talent_notas_update"
ON public.talent_notas FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.up_is_admin(auth.uid()))
WITH CHECK (created_by = auth.uid() OR public.up_is_admin(auth.uid()));

DROP POLICY IF EXISTS "talent_notas_delete" ON public.talent_notas;
CREATE POLICY "talent_notas_delete"
ON public.talent_notas FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.up_is_admin(auth.uid()));

-- 3) config SELECT (estaba con USING (true))
DROP POLICY IF EXISTS "consolidated_config_select_authenticated" ON public.config;

CREATE POLICY "config_select"
ON public.config FOR SELECT TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR public.up_has_role(auth.uid(), 'hrbp')
  OR public.up_has_role(auth.uid(), 'manager')
);
