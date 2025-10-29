-- Remove temporary development policies
DROP POLICY IF EXISTS "allow_all_temp" ON public.empleados;
DROP POLICY IF EXISTS "allow_all_temp" ON public.evaluaciones;