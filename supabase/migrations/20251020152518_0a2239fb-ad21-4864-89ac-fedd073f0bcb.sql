-- Update RLS policies for calibraciones to allow all authenticated users to insert
DROP POLICY IF EXISTS "HRBP can insert calibraciones" ON public.calibraciones;

-- Allow all authenticated users to insert calibrations
CREATE POLICY "Authenticated users can insert calibraciones"
ON public.calibraciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to view calibrations
DROP POLICY IF EXISTS "HRBP can view all calibraciones" ON public.calibraciones;

CREATE POLICY "Authenticated users can view calibraciones"
ON public.calibraciones
FOR SELECT
TO authenticated
USING (true);