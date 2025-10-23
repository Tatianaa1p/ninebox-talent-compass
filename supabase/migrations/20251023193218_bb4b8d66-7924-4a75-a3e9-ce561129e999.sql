-- Crear bucket de reportes si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('reportes', 'reportes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket reportes
CREATE POLICY "HRBP y Managers pueden subir reportes"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'reportes' AND
  auth.uid() IS NOT NULL AND
  (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
      AND permisos_globales->>'descargar_reportes' = 'true'
    )
  )
);

CREATE POLICY "HRBP y Managers pueden ver reportes"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'reportes' AND
  auth.uid() IS NOT NULL AND
  (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
      AND permisos_globales->>'descargar_reportes' = 'true'
    )
  )
);