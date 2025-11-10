-- Fix RLS policies for calibracion_gauss to work through tableros relationship
-- This fixes the 403 Forbidden error when accessing calibration data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Gauss users can view calibrations in their countries" ON calibracion_gauss;
DROP POLICY IF EXISTS "Gauss users can insert calibrations in their countries" ON calibracion_gauss;
DROP POLICY IF EXISTS "Gauss users can update calibrations in their countries" ON calibracion_gauss;
DROP POLICY IF EXISTS "Gauss users can delete calibrations in their countries" ON calibracion_gauss;

-- Create new policies that check access through tableros
CREATE POLICY "CurvaGauss users can view calibrations"
ON calibracion_gauss
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM tableros t
    INNER JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
    WHERE t.id = calibracion_gauss.tablero_id
      AND t.modulo_origen = 'gauss'
      AND t.pais = ANY(gur.paises_acceso)
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
  )
);

CREATE POLICY "CurvaGauss users can insert calibrations"
ON calibracion_gauss
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM tableros t
    INNER JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
    WHERE t.id = calibracion_gauss.tablero_id
      AND t.modulo_origen = 'gauss'
      AND t.pais = ANY(gur.paises_acceso)
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
  )
);

CREATE POLICY "CurvaGauss users can update calibrations"
ON calibracion_gauss
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM tableros t
    INNER JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
    WHERE t.id = calibracion_gauss.tablero_id
      AND t.modulo_origen = 'gauss'
      AND t.pais = ANY(gur.paises_acceso)
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM tableros t
    INNER JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
    WHERE t.id = calibracion_gauss.tablero_id
      AND t.modulo_origen = 'gauss'
      AND t.pais = ANY(gur.paises_acceso)
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
  )
);

CREATE POLICY "CurvaGauss users can delete calibrations"
ON calibracion_gauss
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM tableros t
    INNER JOIN gauss_user_roles gur ON gur.user_id = auth.uid()
    WHERE t.id = calibracion_gauss.tablero_id
      AND t.modulo_origen = 'gauss'
      AND t.pais = ANY(gur.paises_acceso)
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl', 'hrbp_apu', 'manager_apu')
  )
);