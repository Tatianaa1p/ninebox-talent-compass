-- Drop existing policies that depend on tableros table
DROP POLICY IF EXISTS "CurvaGauss users can view calibrations" ON calibracion_gauss;
DROP POLICY IF EXISTS "CurvaGauss users can insert calibrations" ON calibracion_gauss;
DROP POLICY IF EXISTS "CurvaGauss users can update calibrations" ON calibracion_gauss;
DROP POLICY IF EXISTS "CurvaGauss users can delete calibrations" ON calibracion_gauss;

-- Create new policies that check calibracion_gauss.pais directly
-- SELECT policy: Users can view calibrations from their accessible countries
CREATE POLICY "Gauss users can view calibrations in their countries"
ON calibracion_gauss
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role = ANY (ARRAY['hrbp'::gauss_role, 'manager'::gauss_role, 'hrbp_cl'::gauss_role, 'manager_cl'::gauss_role, 'hrbp_apu'::gauss_role, 'manager_apu'::gauss_role])
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(calibracion_gauss.pais)
      )
  )
);

-- INSERT policy: Users can insert calibrations for their accessible countries
CREATE POLICY "Gauss users can insert calibrations in their countries"
ON calibracion_gauss
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role = ANY (ARRAY['hrbp'::gauss_role, 'manager'::gauss_role, 'hrbp_cl'::gauss_role, 'manager_cl'::gauss_role, 'hrbp_apu'::gauss_role, 'manager_apu'::gauss_role])
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(calibracion_gauss.pais)
      )
  )
);

-- UPDATE policy: Users can update calibrations in their accessible countries
CREATE POLICY "Gauss users can update calibrations in their countries"
ON calibracion_gauss
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role = ANY (ARRAY['hrbp'::gauss_role, 'manager'::gauss_role, 'hrbp_cl'::gauss_role, 'manager_cl'::gauss_role, 'hrbp_apu'::gauss_role, 'manager_apu'::gauss_role])
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(calibracion_gauss.pais)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role = ANY (ARRAY['hrbp'::gauss_role, 'manager'::gauss_role, 'hrbp_cl'::gauss_role, 'manager_cl'::gauss_role, 'hrbp_apu'::gauss_role, 'manager_apu'::gauss_role])
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(calibracion_gauss.pais)
      )
  )
);

-- DELETE policy: Users can delete calibrations from their accessible countries
CREATE POLICY "Gauss users can delete calibrations in their countries"
ON calibracion_gauss
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role = ANY (ARRAY['hrbp'::gauss_role, 'manager'::gauss_role, 'hrbp_cl'::gauss_role, 'manager_cl'::gauss_role, 'hrbp_apu'::gauss_role, 'manager_apu'::gauss_role])
      AND EXISTS (
        SELECT 1
        FROM unnest(gur.paises_acceso) AS pais_permitido
        WHERE lower(pais_permitido) = lower(calibracion_gauss.pais)
      )
  )
);