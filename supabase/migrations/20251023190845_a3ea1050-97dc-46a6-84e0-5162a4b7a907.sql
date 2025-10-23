-- Update user_permissions for hrbp and manager roles with calibration and report permissions
UPDATE public.user_permissions
SET permisos_globales = permisos_globales || '{"calibrar_ninebox": true, "descargar_reportes": true}'::jsonb
WHERE role IN ('hrbp', 'manager');

-- Enable realtime for calibraciones and evaluaciones tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calibraciones;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluaciones;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- Add replica identity for realtime updates (full row data on updates)
ALTER TABLE public.calibraciones REPLICA IDENTITY FULL;
ALTER TABLE public.empleados REPLICA IDENTITY FULL;
ALTER TABLE public.evaluaciones REPLICA IDENTITY FULL;