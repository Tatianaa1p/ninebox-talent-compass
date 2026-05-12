CREATE POLICY "evaluaciones_delete"
ON public.evaluaciones FOR DELETE TO authenticated
USING (
  public.up_is_admin(auth.uid())
  OR (
    public.up_has_permission(auth.uid(), 'calibrar_tableros')
    AND EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE (
        e.id = evaluaciones.empresa_id
        OR e.id = (
          SELECT eq.empresa_id FROM public.equipos eq
          WHERE eq.id = evaluaciones.equipo_id
        )
      )
      AND public.up_has_empresa(auth.uid(), e.nombre)
    )
  )
);

CREATE POLICY "storage_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'reportes'
  AND public.up_is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'reportes'
  AND public.up_is_admin(auth.uid())
);

CREATE POLICY "storage_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'reportes'
  AND public.up_is_admin(auth.uid())
);