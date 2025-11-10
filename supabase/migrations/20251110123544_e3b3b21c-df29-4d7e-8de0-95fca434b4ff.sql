-- Fix RLS policies for Curva de Gauss module
-- Ensures users with valid gauss roles can access tableros and calibrations based on their paises_acceso
-- DOES NOT modify any NineBox policies

-- ============================================
-- FIX CALIBRACION_GAUSS POLICIES
-- ============================================

-- Drop and recreate INSERT policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "CurvaGauss users can insert calibrations" ON calibracion_gauss;

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
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
  )
);

-- ============================================
-- FIX TABLEROS POLICIES FOR GAUSS MODULE
-- ============================================

-- Recreate INSERT policy for creating tableros (was missing WITH CHECK)
DROP POLICY IF EXISTS "Gauss users can create tableros for their countries" ON tableros;

CREATE POLICY "Gauss users can create tableros for their countries"
ON tableros
FOR INSERT
TO authenticated
WITH CHECK (
  modulo_origen = 'gauss' 
  AND pais IN (
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
  AND has_any_gauss_role(auth.uid())
);

-- Verify SELECT policy is correct (allow viewing tableros for accessible countries)
DROP POLICY IF EXISTS "Gauss users can view their tableros by country" ON tableros;

CREATE POLICY "Gauss users can view their tableros by country"
ON tableros
FOR SELECT
TO authenticated
USING (
  modulo_origen = 'gauss'
  AND EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
      AND tableros.pais = ANY(gur.paises_acceso)
  )
);

-- Update UPDATE policy to be more explicit about roles
DROP POLICY IF EXISTS "Gauss users can update tableros in their countries" ON tableros;

CREATE POLICY "Gauss users can update tableros in their countries"
ON tableros
FOR UPDATE
TO authenticated
USING (
  modulo_origen = 'gauss'
  AND EXISTS (
    SELECT 1
    FROM gauss_user_roles gur
    WHERE gur.user_id = auth.uid()
      AND gur.role IN ('hrbp', 'manager', 'hrbp_cl', 'manager_cl')
      AND tableros.pais = ANY(gur.paises_acceso)
  )
)
WITH CHECK (
  modulo_origen = 'gauss'
  AND pais IN (
    SELECT unnest(paises_acceso)
    FROM gauss_user_roles
    WHERE user_id = auth.uid()
  )
);

-- Note: Keeping DELETE policy as is (uses has_any_gauss_role function)
-- No changes to NineBox policies