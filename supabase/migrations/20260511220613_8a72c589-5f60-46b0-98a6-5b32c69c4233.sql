DROP POLICY IF EXISTS "HRBP y Managers pueden subir reportes" ON storage.objects;

CREATE POLICY "HRBP y Managers pueden subir reportes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reportes'
  AND auth.uid() IS NOT NULL
  AND public.up_has_permission(auth.uid(), 'descargar_reportes')
  AND (
    public.up_has_empresa(auth.uid(), (storage.foldername(name))[1])
    OR public.up_has_empresa(auth.uid(), replace((storage.foldername(name))[1], '_', ' '))
  )
);