-- Update function without 'admin' and 'calibrador' which don't exist in the enum
CREATE OR REPLACE FUNCTION public.has_any_gauss_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.gauss_user_roles
    WHERE user_id = _user_id
      AND role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
  )
$$;

-- Update calibracion_gauss policies
DROP POLICY IF EXISTS "Gauss users can view calibrations" ON public.calibracion_gauss;
DROP POLICY IF EXISTS "Gauss users can insert calibrations" ON public.calibracion_gauss;
DROP POLICY IF EXISTS "Gauss users can update calibrations" ON public.calibracion_gauss;
DROP POLICY IF EXISTS "Gauss users can delete calibrations" ON public.calibracion_gauss;

CREATE POLICY "HRBP and Managers can view all calibrations"
ON public.calibracion_gauss
FOR SELECT
TO authenticated
USING (has_any_gauss_role(auth.uid()));

CREATE POLICY "HRBP and Managers can insert calibrations"
ON public.calibracion_gauss
FOR INSERT
TO authenticated
WITH CHECK (has_any_gauss_role(auth.uid()));

CREATE POLICY "HRBP and Managers can update calibrations"
ON public.calibracion_gauss
FOR UPDATE
TO authenticated
USING (has_any_gauss_role(auth.uid()))
WITH CHECK (has_any_gauss_role(auth.uid()));

CREATE POLICY "HRBP and Managers can delete calibrations"
ON public.calibracion_gauss
FOR DELETE
TO authenticated
USING (has_any_gauss_role(auth.uid()));

-- Update tableros policies
DROP POLICY IF EXISTS "tableros_select_members" ON public.tableros;
DROP POLICY IF EXISTS "tableros_insert_authenticated" ON public.tableros;
DROP POLICY IF EXISTS "tableros_update_members" ON public.tableros;
DROP POLICY IF EXISTS "tableros_delete_members" ON public.tableros;

CREATE POLICY "HRBP and Managers can view tableros"
ON public.tableros
FOR SELECT
TO authenticated
USING (has_any_gauss_role(auth.uid()));

CREATE POLICY "HRBP and Managers can create tableros"
ON public.tableros
FOR INSERT
TO authenticated
WITH CHECK (has_any_gauss_role(auth.uid()));

CREATE POLICY "HRBP and Managers can update tableros"
ON public.tableros
FOR UPDATE
TO authenticated
USING (has_any_gauss_role(auth.uid()))
WITH CHECK (has_any_gauss_role(auth.uid()));

CREATE POLICY "HRBP and Managers can delete tableros"
ON public.tableros
FOR DELETE
TO authenticated
USING (has_any_gauss_role(auth.uid()));